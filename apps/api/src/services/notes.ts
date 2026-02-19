import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { Marked } from "marked";
import { db } from "../db";
import { notes } from "../db/schema";
import {
  indexNote as indexNoteInLightRAG,
  deleteNote as deleteNoteFromLightRAG,
  reindexNote as reindexNoteInLightRAG,
  searchEntities,
  getSubgraph,
} from "./lightrag";

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

export function extractTitle(content: string): string {
  const match = content.match(/^#\s+(.+)/);
  return match ? match[1].trim() : "Untitled";
}

const plainMarked = new Marked({
  renderer: {
    heading({ tokens }) {
      return `${this.parser.parseInline(tokens)}\n`;
    },
    paragraph({ tokens }) {
      return `${this.parser.parseInline(tokens)}\n`;
    },
    listitem({ tokens }) {
      return `${this.parser.parseInline(tokens)}\n`;
    },
    link: ({ text }) => text,
    image: () => "",
    code: () => "",
    codespan: ({ text }) => text,
    blockquote: ({ text }) => text,
    hr: () => "\n",
    br: () => "\n",
    html: () => "",
    strong: ({ text }) => text,
    em: ({ text }) => text,
    del: ({ text }) => text,
  },
});

export function toPreview(content: string, maxLength = 150): string {
  const withoutTitle = content.replace(/^#\s+.+\n?/, "");
  const plain = (plainMarked.parse(withoutTitle) as string)
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return plain.substring(0, maxLength);
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
    indexNoteInLightRAG(userId, note.id, note.title, note.content).catch((err) => {
      console.error(`Failed to index note ${note.id} in LightRAG:`, err);
    });
  }

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

export async function listNotes(
  userId: string,
  limit = 20,
  offset = 0,
): Promise<{ notes: Note[]; total: number }> {
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(notes)
    .where(and(eq(notes.userId, userId), eq(notes.isArchived, false)));

  const total = countResult[0]?.count || 0;

  const result = await db
    .select()
    .from(notes)
    .where(and(eq(notes.userId, userId), eq(notes.isArchived, false)))
    .orderBy(desc(notes.updatedAt))
    .limit(limit)
    .offset(offset);

  const notesList = result.map((note) => ({
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

  // Re-index in LightRAG if content changed
  if (input.content !== undefined) {
    const updatedNote = await getNoteById(userId, noteId);
    if (updatedNote) {
      reindexNoteInLightRAG(userId, updatedNote.id, updatedNote.title, updatedNote.content).catch(
        (err) => console.error(`Failed to reindex note ${noteId} in LightRAG:`, err),
      );

      // TODO: After reindex, validate existing connections for this note.
      // Entities may have changed — connections based on old shared entities
      // could now be stale. Steps:
      // 1. Get updated entities for this note from LightRAG
      // 2. For each ai_suggested connection, check if the bridging entities
      //    (stored in connection description) still exist in both notes
      // 3. Remove or flag connections whose shared entities no longer overlap
      // 4. Deduplicate: check if any pending suggestions duplicate rejected ones
    }
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

  // Remove from LightRAG index
  deleteNoteFromLightRAG(userId, noteId).catch((err) => {
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
  const entities = await searchEntities(userId, note.title, 10);
  if (entities.length === 0) return [];

  // For the top entity, get its immediate subgraph
  const topEntity = entities[0];
  const subgraph = await getSubgraph(userId, topEntity.label, 1, 20);

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
