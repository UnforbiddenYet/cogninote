import { eq, desc, sql } from "drizzle-orm";
import { db } from "../db";
import { queryLogs } from "../db/schema";

export async function logQuery(
  userId: string,
  queryText: string,
  mode: string,
  answerPreview: string,
  sourceCount: number,
  processingTimeMs: number,
) {
  await db.insert(queryLogs).values({
    userId,
    queryText,
    mode,
    answerPreview,
    sourceCount,
    processingTimeMs,
  });
}

export async function getQueryHistory(userId: string, limit: number = 10, offset: number = 0) {
  const countResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(queryLogs)
    .where(eq(queryLogs.userId, userId));

  const total = countResult[0]?.count || 0;

  const results = await db
    .select()
    .from(queryLogs)
    .where(eq(queryLogs.userId, userId))
    .orderBy(desc(queryLogs.createdAt))
    .limit(limit)
    .offset(offset);

  return { queries: results, total, limit, offset };
}
