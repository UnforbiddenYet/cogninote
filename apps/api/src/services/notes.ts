import { eq, and, desc, sql, isNull, inArray } from "drizzle-orm";
import { db } from "../db";
import { notes, noteTags, tags } from "../db/schema";
import {
  indexNote as indexNoteInLightRAG,
  deleteNote as deleteNoteFromLightRAG,
  reindexNote as reindexNoteInLightRAG,
  LIGHTRAG_ENABLED,
} from "./lightrag";

type CreateNoteInput = {
  title: string;
  content: string;
  color?: string;
  folderId?: string;
};

type UpdateNoteInput = {
  title?: string;
  content?: string;
  color?: string;
  isArchived?: boolean;
  folderId?: string | null;
  summary?: string;
};

type Note = {
  id: string;
  userId: string;
  title: string;
  content: string;
  color?: string;
  isArchived: boolean;
  summary?: string;
  createdAt: Date;
  updatedAt: Date;
  tags?: Array<{ id: string; name: string; color?: string }>;
};

export async function createNote(
  userId: string,
  input: CreateNoteInput,
): Promise<Note> {
  const contentPlain = input.content
    .replace(/[#*_`[\]]/g, "")
    .substring(0, 1000);

  const result = await db
    .insert(notes)
    .values({
      userId,
      folderId: input.folderId || null,
      title: input.title,
      content: input.content,
      contentPlain,
      color: input.color,
    })
    .returning();

  const note = result[0];

  // Index in LightRAG (fire-and-forget)
  if (LIGHTRAG_ENABLED) {
    indexNoteInLightRAG(userId, note.id, note.title, note.content).catch(
      (err) => {
        console.error(`Failed to index note ${note.id} in LightRAG:`, err);
      },
    );
  }

  return {
    id: note.id,
    userId: note.userId,
    title: note.title,
    content: note.content,
    color: note.color || undefined,
    isArchived: note.isArchived,
    summary: note.summary || undefined,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
  };
}

export async function getNoteById(
  userId: string,
  noteId: string,
): Promise<Note | null> {
  const result = await db
    .select()
    .from(notes)
    .where(and(eq(notes.id, noteId), eq(notes.userId, userId)))
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  const note = result[0];
  const noteTags_ = await db
    .select({
      id: tags.id,
      name: tags.name,
      color: tags.color,
    })
    .from(noteTags)
    .innerJoin(tags, eq(noteTags.tagId, tags.id))
    .where(eq(noteTags.noteId, noteId));

  return {
    id: note.id,
    userId: note.userId,
    title: note.title,
    content: note.content,
    color: note.color || undefined,
    isArchived: note.isArchived,
    summary: note.summary || undefined,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
    tags: noteTags_.map((t) => ({
      id: t.id,
      name: t.name,
      color: t.color || undefined,
    })),
  };
}

export async function getNotesByIds(
  userId: string,
  noteIds: string[],
): Promise<Note[]> {
  if (noteIds.length === 0) {
    return [];
  }

  const result = await db
    .select()
    .from(notes)
    .where(
      and(
        eq(notes.userId, userId),
        eq(notes.isArchived, false),
        inArray(notes.id, noteIds),
      ),
    );

  return result.map((note) => ({
    id: note.id,
    userId: note.userId,
    title: note.title,
    content: note.content,
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

  const notesList = await Promise.all(
    result.map(async (note) => {
      const noteTags_ = await db
        .select({
          id: tags.id,
          name: tags.name,
          color: tags.color,
        })
        .from(noteTags)
        .innerJoin(tags, eq(noteTags.tagId, tags.id))
        .where(eq(noteTags.noteId, note.id));

      return {
        id: note.id,
        userId: note.userId,
        title: note.title,
        content: note.content,
        color: note.color || undefined,
        isArchived: note.isArchived,
        summary: note.summary || undefined,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
        tags: noteTags_.map((t) => ({
          id: t.id,
          name: t.name,
          color: t.color || undefined,
        })),
      };
    }),
  );

  return { notes: notesList, total };
}

export async function updateNote(
  userId: string,
  noteId: string,
  input: UpdateNoteInput,
): Promise<Note | null> {
  const existing = await getNoteById(userId, noteId);
  if (!existing) {
    return null;
  }

  const updateData: any = {
    updatedAt: new Date(),
  };

  if (input.title !== undefined) updateData.title = input.title;
  if (input.content !== undefined) {
    updateData.content = input.content;
    updateData.contentPlain = input.content
      .replace(/[#*_`[\]]/g, "")
      .substring(0, 1000);
  }
  if (input.color !== undefined) updateData.color = input.color;
  if (input.isArchived !== undefined) updateData.isArchived = input.isArchived;
  if (input.folderId !== undefined)
    updateData.folderId = input.folderId || null;
  if (input.summary) updateData.summary = input.summary;

  await db.update(notes).set(updateData).where(eq(notes.id, noteId));

  // Re-index in LightRAG if title or content changed
  if (
    LIGHTRAG_ENABLED &&
    (input.title !== undefined || input.content !== undefined)
  ) {
    const updatedNote = await getNoteById(userId, noteId);
    if (updatedNote) {
      reindexNoteInLightRAG(
        userId,
        updatedNote.id,
        updatedNote.title,
        updatedNote.content,
      ).catch((err) =>
        console.error(`Failed to reindex note ${noteId} in LightRAG:`, err),
      );
    }
  }

  return await getNoteById(userId, noteId);
}

export async function deleteNote(
  userId: string,
  noteId: string,
): Promise<boolean> {
  const existing = await getNoteById(userId, noteId);
  if (!existing) {
    return false;
  }

  // Soft delete
  await db.update(notes).set({ isArchived: true }).where(eq(notes.id, noteId));

  // Remove from LightRAG index
  if (LIGHTRAG_ENABLED) {
    deleteNoteFromLightRAG(userId, noteId).catch((err) => {
      console.error(`Failed to delete note ${noteId} from LightRAG:`, err);
    });
  }

  return true;
}

export async function getUncategorizedNotes(
  userId: string,
  limit = 20,
  offset = 0,
): Promise<{ notes: Note[]; total: number }> {
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(notes)
    .where(
      and(
        eq(notes.userId, userId),
        eq(notes.isArchived, false),
        isNull(notes.folderId),
      ),
    );

  const total = countResult[0]?.count || 0;

  const result = await db
    .select()
    .from(notes)
    .where(
      and(
        eq(notes.userId, userId),
        eq(notes.isArchived, false),
        isNull(notes.folderId),
      ),
    )
    .orderBy(desc(notes.updatedAt))
    .limit(limit)
    .offset(offset);

  const notesList = await Promise.all(
    result.map(async (note) => {
      const noteTags_ = await db
        .select({
          id: tags.id,
          name: tags.name,
          color: tags.color,
        })
        .from(noteTags)
        .innerJoin(tags, eq(noteTags.tagId, tags.id))
        .where(eq(noteTags.noteId, note.id));

      return {
        id: note.id,
        userId: note.userId,
        title: note.title,
        content: note.content,
        color: note.color || undefined,
        isArchived: note.isArchived,
        summary: note.summary || undefined,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
        tags: noteTags_.map((t) => ({
          id: t.id,
          name: t.name,
          color: t.color || undefined,
        })),
      };
    }),
  );

  return { notes: notesList, total };
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
