import { eq, and, or, sql } from "drizzle-orm";
import { db } from "../db";
import { connections, notes } from "../db/schema";

type ConnectionType = "manual" | "ai_suggested";

export async function createConnection(
  userId: string,
  sourceNoteId: string,
  targetNoteId: string,
  connectionType: ConnectionType = "manual",
  description?: string,
) {
  if (sourceNoteId === targetNoteId) {
    throw new Error("Cannot create a connection between a note and itself");
  }

  // Verify both notes exist and belong to user
  const [sourceNote, targetNote] = await Promise.all([
    db
      .select({ id: notes.id })
      .from(notes)
      .where(and(eq(notes.id, sourceNoteId), eq(notes.userId, userId)))
      .limit(1),
    db
      .select({ id: notes.id })
      .from(notes)
      .where(and(eq(notes.id, targetNoteId), eq(notes.userId, userId)))
      .limit(1),
  ]);

  if (sourceNote.length === 0 || targetNote.length === 0) {
    throw new Error("One or both notes not found");
  }

  // Check for duplicate
  const exists = await connectionExists(userId, sourceNoteId, targetNoteId);
  if (exists) {
    throw new Error("Connection already exists between these notes");
  }

  const result = await db
    .insert(connections)
    .values({
      userId,
      sourceNoteId,
      targetNoteId,
      connectionType,
      description: description || null,
    })
    .returning();

  return result[0];
}

export async function listConnections(userId: string) {
  return db
    .select({
      id: connections.id,
      userId: connections.userId,
      sourceNoteId: connections.sourceNoteId,
      targetNoteId: connections.targetNoteId,
      connectionType: connections.connectionType,
      description: connections.description,
      createdAt: connections.createdAt,
    })
    .from(connections)
    .where(eq(connections.userId, userId));
}

export async function getConnectionsForNote(userId: string, noteId: string) {
  return db
    .select({
      id: connections.id,
      userId: connections.userId,
      sourceNoteId: connections.sourceNoteId,
      targetNoteId: connections.targetNoteId,
      connectionType: connections.connectionType,
      description: connections.description,
      createdAt: connections.createdAt,
    })
    .from(connections)
    .where(
      and(
        eq(connections.userId, userId),
        or(eq(connections.sourceNoteId, noteId), eq(connections.targetNoteId, noteId)),
      ),
    );
}

export async function getConnectionCount(userId: string, noteId: string) {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(connections)
    .where(
      and(
        eq(connections.userId, userId),
        or(eq(connections.sourceNoteId, noteId), eq(connections.targetNoteId, noteId)),
      ),
    );

  return result[0]?.count || 0;
}

export async function deleteConnection(userId: string, connectionId: string) {
  const result = await db
    .delete(connections)
    .where(and(eq(connections.id, connectionId), eq(connections.userId, userId)))
    .returning();

  return result.length > 0;
}

export async function connectionExists(
  userId: string,
  sourceNoteId: string,
  targetNoteId: string,
): Promise<boolean> {
  const result = await db
    .select({ id: connections.id })
    .from(connections)
    .where(
      and(
        eq(connections.userId, userId),
        or(
          and(
            eq(connections.sourceNoteId, sourceNoteId),
            eq(connections.targetNoteId, targetNoteId),
          ),
          and(
            eq(connections.sourceNoteId, targetNoteId),
            eq(connections.targetNoteId, sourceNoteId),
          ),
        ),
      ),
    )
    .limit(1);

  return result.length > 0;
}
