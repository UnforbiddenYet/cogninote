import { eq, and, sql, ilike, or } from "drizzle-orm";
import { db } from "../db";
import { notes } from "../db/schema";

type SearchResult = {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
};

export async function searchNotes(
  userId: string,
  query: string,
  limit = 20,
  offset = 0
): Promise<{ results: SearchResult[]; total: number }> {
  const searchTerm = `%${query}%`;

  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(notes)
    .where(
      and(
        eq(notes.userId, userId),
        eq(notes.isArchived, false),
        or(
          ilike(notes.title, searchTerm),
          ilike(notes.contentPlain, searchTerm)
        )
      )
    );

  const total = countResult[0]?.count || 0;

  const result = await db
    .select({
      id: notes.id,
      title: notes.title,
      content: notes.content,
      createdAt: notes.createdAt,
      updatedAt: notes.updatedAt,
    })
    .from(notes)
    .where(
      and(
        eq(notes.userId, userId),
        eq(notes.isArchived, false),
        or(
          ilike(notes.title, searchTerm),
          ilike(notes.contentPlain, searchTerm)
        )
      )
    )
    .limit(limit)
    .offset(offset);

  return {
    results: result,
    total,
  };
}
