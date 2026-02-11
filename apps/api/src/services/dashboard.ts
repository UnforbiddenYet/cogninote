import { eq, and, sql, gte, desc } from "drizzle-orm";
import { db } from "../db";
import { notes, connections } from "../db/schema";
import { getPopularEntities, LIGHTRAG_ENABLED } from "./lightrag";
import { getConnectionSuggestions, generateConnectionSuggestions } from "./suggestions";
import { getConnectionCount } from "./connections";

type TimeRange = "1d" | "7d" | "30d";

function getStartDate(range: TimeRange): Date {
  const now = new Date();
  switch (range) {
    case "1d":
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case "7d":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "30d":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
}

export async function getDashboardData(userId: string, timeRange: TimeRange = "7d") {
  const startDate = getStartDate(timeRange);

  // Run all DB queries in parallel
  const [
    totalNotesResult,
    totalConnectionsResult,
    notesCreatedResult,
    connectionsCreatedResult,
    recentNotesResult,
    mostConnectedResult,
  ] = await Promise.all([
    // Total notes
    db
      .select({ count: sql<number>`count(*)` })
      .from(notes)
      .where(and(eq(notes.userId, userId), eq(notes.isArchived, false))),

    // Total connections
    db
      .select({ count: sql<number>`count(*)` })
      .from(connections)
      .where(eq(connections.userId, userId)),

    // Notes created in period
    db
      .select({ count: sql<number>`count(*)` })
      .from(notes)
      .where(
        and(
          eq(notes.userId, userId),
          eq(notes.isArchived, false),
          gte(notes.createdAt, startDate),
        ),
      ),

    // Connections created in period
    db
      .select({ count: sql<number>`count(*)` })
      .from(connections)
      .where(
        and(
          eq(connections.userId, userId),
          gte(connections.createdAt, startDate),
        ),
      ),

    // Recent notes
    db
      .select({
        id: notes.id,
        title: notes.title,
        content: notes.content,
        updatedAt: notes.updatedAt,
      })
      .from(notes)
      .where(and(eq(notes.userId, userId), eq(notes.isArchived, false)))
      .orderBy(desc(notes.updatedAt))
      .limit(5),

    // Most connected note (by connection count)
    db
      .select({
        noteId: sql<string>`note_id`,
        connectionCount: sql<number>`count`,
      })
      .from(
        sql`(
          SELECT source_note_id as note_id, count(*) as count FROM connections WHERE user_id = ${userId} GROUP BY source_note_id
          UNION ALL
          SELECT target_note_id as note_id, count(*) as count FROM connections WHERE user_id = ${userId} GROUP BY target_note_id
        ) as connection_counts`,
      )
      .orderBy(sql`count DESC`)
      .limit(1),
  ]);

  // Enrich recent notes with connection counts
  const recentNotes = await Promise.all(
    recentNotesResult.map(async (note) => ({
      id: note.id,
      title: note.title,
      preview:
        note.content.substring(0, 150) +
        (note.content.length > 150 ? "..." : ""),
      updatedAt: note.updatedAt,
      connectionCount: await getConnectionCount(userId, note.id),
    })),
  );

  // Get most connected note details
  let mostConnectedNote = null;
  if (mostConnectedResult.length > 0) {
    const mcNote = mostConnectedResult[0];
    const [noteDetail] = await db
      .select({ id: notes.id, title: notes.title })
      .from(notes)
      .where(eq(notes.id, mcNote.noteId))
      .limit(1);

    if (noteDetail) {
      mostConnectedNote = {
        id: noteDetail.id,
        title: noteDetail.title,
        connectionCount: mcNote.connectionCount,
      };
    }
  }

  // LightRAG data (graceful degradation)
  let topEntities: Array<{ label: string; count: number }> = [];
  let suggestedConnections: any[] = [];

  if (LIGHTRAG_ENABLED) {
    try {
      topEntities = await getPopularEntities(userId, 10);
    } catch {
      // LightRAG unavailable, continue with empty
    }
  }

  try {
    suggestedConnections = await getConnectionSuggestions(userId, 3);

    // Auto-generate suggestions if none exist and LightRAG is available
    if (suggestedConnections.length === 0 && LIGHTRAG_ENABLED) {
      generateConnectionSuggestions(userId, 5).catch((err) =>
        console.error("Failed to auto-generate suggestions:", err),
      );
    }
  } catch {
    // Suggestions unavailable
  }

  return {
    stats: {
      totalNotes: totalNotesResult[0]?.count || 0,
      totalConnections: totalConnectionsResult[0]?.count || 0,
      notesCreatedInPeriod: notesCreatedResult[0]?.count || 0,
      connectionsCreatedInPeriod: connectionsCreatedResult[0]?.count || 0,
    },
    recentNotes,
    topEntities,
    suggestedConnections,
    mostConnectedNote,
  };
}
