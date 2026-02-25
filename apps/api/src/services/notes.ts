import { eq, ne, gte, and, desc, lt, sql, inArray, or } from "drizzle-orm";
import removeMd from "remove-markdown";
import { db } from "../db";
import { notes, connections, aiSuggestions } from "../db/schema";
import { getConnectionCount } from "./connections";
import {
  indexNote as indexNoteInLightRAG,
  deleteNote as deleteNoteFromLightRAG,
  reindexNote as reindexNoteInLightRAG,
  getIndexedNoteIds,
  searchEntities,
  getSubgraph,
} from "./lightrag";
import { createDebouncer } from "../lib/debounce";
import { MINUTE_MS } from "../lib/time";

type Note = {
  id: string;
  userId: string;
  title: string;
  content: string;
  preview: string;
  color?: string;
  isArchived: boolean;
  summary?: string;
  createdAt: Date;
  updatedAt: Date;
};

const debounceReindex = createDebouncer(MINUTE_MS);

export function extractTitle(content: string): string {
  const match = content.match(/^#\s+(.+)/);
  return match ? removeMd(match[1].trim()) : "Untitled";
}

export function toPreview(content: string, maxLength = 150): string {
  const withoutTitle = content.replace(/^#\s+.+\n?/, "");
  const plain = removeMd(withoutTitle).replace(/\s+/g, " ").trim();
  return plain.substring(0, maxLength);
}

export async function findOrCreateEmptyNote(userId: string): Promise<Note> {
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
  const existing = await db
    .select()
    .from(notes)
    .where(
      and(
        eq(notes.userId, userId),
        eq(notes.isArchived, false),
        eq(notes.content, ""),
        gte(notes.createdAt, fiveMinAgo),
      ),
    )
    .orderBy(desc(notes.createdAt))
    .limit(1);

  if (existing.length > 0) {
    const note = existing[0];
    return {
      id: note.id,
      userId: note.userId,
      title: note.title,
      content: note.content,
      preview: "",
      color: note.color || undefined,
      isArchived: note.isArchived,
      summary: note.summary || undefined,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
    };
  }

  return createNote(userId, { content: "" });
}

export async function createNote(
  userId: string,
  input: {
    content: string;
    color?: string;
  },
): Promise<Note> {
  const title = extractTitle(input.content);

  const result = await db
    .insert(notes)
    .values({
      userId,
      title,
      content: input.content,
      color: input.color,
    })
    .returning();

  const note = result[0];
  const previewContent = toPreview(note.content);

  if (previewContent.length) {
    indexNoteInLightRAG(note.id, note.content).catch((err) => {
      console.error(`Failed to index note ${note.id} in LightRAG:`, err);
    });
  }

  return {
    id: note.id,
    userId: note.userId,
    title: note.title,
    content: note.content,
    preview: previewContent,
    color: note.color || undefined,
    isArchived: note.isArchived,
    summary: note.summary || undefined,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
  };
}

export async function getNoteById(userId: string, noteId: string): Promise<Note | null> {
  const result = await db
    .select()
    .from(notes)
    .where(and(eq(notes.id, noteId), eq(notes.userId, userId)))
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  const note = result[0];

  return {
    id: note.id,
    userId: note.userId,
    title: note.title,
    content: note.content,
    preview: toPreview(note.content),
    color: note.color || undefined,
    isArchived: note.isArchived,
    summary: note.summary || undefined,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
  };
}

export async function getNotesByIds(userId: string, noteIds: string[]): Promise<Note[]> {
  if (noteIds.length === 0) {
    return [];
  }

  const result = await db
    .select()
    .from(notes)
    .where(and(eq(notes.userId, userId), eq(notes.isArchived, false), inArray(notes.id, noteIds)));

  return result.map((note) => ({
    id: note.id,
    userId: note.userId,
    title: note.title,
    content: note.content,
    preview: toPreview(note.content),
    color: note.color || undefined,
    isArchived: note.isArchived,
    summary: note.summary || undefined,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
  }));
}

export async function purgeStaleEmptyNotes() {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const result = await db
    .delete(notes)
    .where(and(eq(notes.content, ""), lt(notes.createdAt, cutoff)))
    .returning({ id: notes.id });

  if (result.length > 0) {
    console.log(`Purged ${result.length} stale empty notes`);
  }
}

export async function listNotes(
  userId: string,
  limit = 20,
  offset = 0,
): Promise<{ notes: Note[]; total: number }> {
  const countResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(notes)
    .where(and(eq(notes.userId, userId), eq(notes.isArchived, false), ne(notes.content, "")));

  const total = countResult[0]?.count || 0;

  const result = await db
    .select()
    .from(notes)
    .where(and(eq(notes.userId, userId), eq(notes.isArchived, false), ne(notes.content, "")))
    .orderBy(desc(notes.updatedAt))
    .limit(limit)
    .offset(offset);

  const notesList = await Promise.all(
    result.map(async (note) => ({
      id: note.id,
      userId: note.userId,
      title: note.title,
      content: note.content,
      preview: toPreview(note.content),
      color: note.color || undefined,
      isArchived: note.isArchived,
      summary: note.summary || undefined,
      connectionCount: await getConnectionCount(userId, note.id),
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
    })),
  );

  return { notes: notesList, total };
}

export async function updateNote(
  userId: string,
  noteId: string,
  input: {
    content?: string;
    color?: string;
    isArchived?: boolean;
    summary?: string;
  },
): Promise<Note | null> {
  const existing = await getNoteById(userId, noteId);
  if (!existing) {
    return null;
  }

  const updateData: any = {
    updatedAt: new Date(),
  };

  if (input.content !== undefined) {
    updateData.content = input.content;
    updateData.title = extractTitle(input.content);
  }
  if (input.color !== undefined) updateData.color = input.color;
  if (input.isArchived !== undefined) updateData.isArchived = input.isArchived;
  if (input.summary) updateData.summary = input.summary;

  await db.update(notes).set(updateData).where(eq(notes.id, noteId));

  if (input.content !== undefined) {
    debounceReindex(noteId, () =>
      reindexNoteInLightRAG(noteId, input.content!).catch((err) =>
        console.error(`Failed to reindex note ${noteId} in LightRAG:`, err),
      ),
    );
  }

  return await getNoteById(userId, noteId);
}

export async function deleteNote(userId: string, noteId: string): Promise<boolean> {
  const existing = await getNoteById(userId, noteId);
  if (!existing) {
    return false;
  }

  // Soft delete
  await db.update(notes).set({ isArchived: true }).where(eq(notes.id, noteId));

  // Delete connections involving this note
  await db
    .delete(connections)
    .where(
      and(
        eq(connections.userId, userId),
        or(eq(connections.sourceNoteId, noteId), eq(connections.targetNoteId, noteId)),
      ),
    );

  // Reject pending suggestions referencing this note as source or target
  await db
    .update(aiSuggestions)
    .set({ status: "rejected" })
    .where(
      and(
        eq(aiSuggestions.userId, userId),
        eq(aiSuggestions.status, "pending"),
        or(
          eq(aiSuggestions.noteId, noteId),
          sql`${aiSuggestions.suggestionData}->>'targetNoteId' = ${noteId}`,
        ),
      ),
    );

  // Remove from LightRAG index
  deleteNoteFromLightRAG(noteId).catch((err) => {
    console.error(`Failed to delete note ${noteId} from LightRAG:`, err);
  });

  return true;
}

export async function buildSemanticResults(
  userId: string,
  semanticResults: Array<{ noteId: string; score: number; snippet?: string }>,
) {
  const noteIds = semanticResults.map((result) => result.noteId);
  const notes = await getNotesByIds(userId, noteIds);
  const notesById = new Map(notes.map((note) => [note.id, note]));

  return semanticResults.flatMap((result) => {
    const note = notesById.get(result.noteId);
    if (!note) return [];

    return [
      {
        id: note.id,
        title: note.title,
        content: note.content,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
        score: result.score,
        snippet: result.snippet || "",
      },
    ];
  });
}

export async function getNoteEntities(
  userId: string,
  noteId: string,
): Promise<Array<{ label: string; count: number; related?: Array<{ label: string }> }>> {
  const note = await getNoteById(userId, noteId);
  if (!note) return [];

  // Search entities matching the note title
  const entities = await searchEntities(note.title, 10);
  if (entities.length === 0) return [];

  // For the top entity, get its immediate subgraph
  const topEntity = entities[0];
  const subgraph = await getSubgraph(topEntity.label, 1, 20);

  return entities.map((entity) => ({
    label: entity.label,
    count: entity.count,
    related: subgraph
      ? subgraph.nodes
          .filter((n) => n.label !== entity.label)
          .slice(0, 5)
          .map((n) => ({ label: n.label }))
      : undefined,
  }));
}

/**
 * Index notes that have content but are missing from LightRAG.
 * Covers cases where indexing failed.
 */
export async function reconcileLightRAGIndex() {
  const indexedIds = await getIndexedNoteIds();
  if (indexedIds.size === 0) {
    console.log("[reconcile] LightRAG returned 0 docs, skipping to avoid re-indexing everything");
    return;
  }

  const allNotes = await db
    .select({ id: notes.id, content: notes.content })
    .from(notes)
    .where(and(eq(notes.isArchived, false), ne(notes.content, "")));

  const missing = allNotes.filter((n) => !indexedIds.has(n.id));
  if (missing.length === 0) return;

  console.log(`[reconcile] Found ${missing.length} notes missing from LightRAG, indexing...`);

  for (const note of missing) {
    try {
      await indexNoteInLightRAG(note.id, note.content);
    } catch (err) {
      console.error(`[reconcile] Failed to index note ${note.id}:`, err);
    }
  }
}
