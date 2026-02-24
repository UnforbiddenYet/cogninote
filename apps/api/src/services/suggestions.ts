import { eq, and, or, sql, inArray } from "drizzle-orm";
import { db } from "../db";
import { aiSuggestions, notes } from "../db/schema";
import { getEntityLabels, getSubgraph } from "./lightrag";
import { connectionExists, createConnection } from "./connections";

/**
 * Extract note UUIDs from a LightRAG file_path property.
 * file_path can contain multiple sources separated by <SEP>.
 */
function extractNoteIds(filePath: string): string[] {
  if (!filePath) return [];

  return filePath
    .split("<SEP>")
    .map((fp) => {
      const match = fp.trim().match(/^note_([0-9a-fA-F-]{36})\.md$/);
      return match ? match[1] : null;
    })
    .filter(Boolean) as string[];
}

const SUBGRAPH_CONCURRENCY = 10;

async function withConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += limit) {
    const batch = items.slice(i, i + limit);
    const batchResults = await Promise.all(batch.map(fn));
    results.push(...batchResults);
  }
  return results;
}

export async function generateConnectionSuggestions(
  userId: string,
  limit: number = 10,
): Promise<number> {
  // Get all entity labels — 1 LightRAG call
  const allLabels = await getEntityLabels();
  if (allLabels.length === 0) return 0;

  // Fetch all subgraphs in parallel with concurrency limit
  const subgraphs = await withConcurrency(allLabels, SUBGRAPH_CONCURRENCY, (label) =>
    getSubgraph(label, 2, 50),
  );

  // Track note pairs and the entities that bridge them
  const pairMap = new Map<
    string,
    { sourceNoteId: string; targetNoteId: string; bridgeEntities: string[]; score: number }
  >();

  for (let idx = 0; idx < allLabels.length; idx++) {
    const label = allLabels[idx]!;
    const subgraph = subgraphs[idx];
    if (!subgraph || subgraph.nodes.length === 0) continue;

    // Collect all note UUIDs referenced by nodes in this subgraph
    const noteIds = new Set<string>();
    for (const node of subgraph.nodes) {
      const fp = node.properties?.file_path || "";
      for (const id of extractNoteIds(fp)) {
        noteIds.add(id);
      }
    }

    // If subgraph spans multiple notes, every pair is a candidate
    const noteIdList = Array.from(noteIds);
    if (noteIdList.length < 2) continue;

    for (let i = 0; i < noteIdList.length; i++) {
      for (let j = i + 1; j < noteIdList.length; j++) {
        const key = [noteIdList[i], noteIdList[j]].sort().join("|||");
        const existing = pairMap.get(key);
        if (existing) {
          if (!existing.bridgeEntities.includes(label)) {
            existing.bridgeEntities.push(label);
            existing.score = existing.bridgeEntities.length;
          }
        } else {
          pairMap.set(key, {
            sourceNoteId: noteIdList[i]!,
            targetNoteId: noteIdList[j]!,
            bridgeEntities: [label],
            score: 1,
          });
        }
      }
    }
  }

  if (pairMap.size === 0) return 0;

  // Sort by score (number of bridging entities) and take top candidates
  const candidates = Array.from(pairMap.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  // Fetch note metadata for all referenced note IDs
  const allNoteIds = new Set<string>();
  for (const c of candidates) {
    allNoteIds.add(c.sourceNoteId);
    allNoteIds.add(c.targetNoteId);
  }

  const notesResult = await db
    .select({ id: notes.id, title: notes.title })
    .from(notes)
    .where(
      and(
        eq(notes.userId, userId),
        eq(notes.isArchived, false),
        inArray(notes.id, Array.from(allNoteIds)),
      ),
    );

  const notesById = new Map(notesResult.map((n) => [n.id, n]));

  let created = 0;

  for (const candidate of candidates) {
    const sourceNote = notesById.get(candidate.sourceNoteId);
    const targetNote = notesById.get(candidate.targetNoteId);

    if (!sourceNote || !targetNote) continue;

    // Skip if connection already exists
    const exists = await connectionExists(userId, sourceNote.id, targetNote.id);
    if (exists) continue;

    // Skip if this pair was already suggested (pending or rejected) in either direction
    const existingSuggestion = await db
      .select({ id: aiSuggestions.id })
      .from(aiSuggestions)
      .where(
        and(
          eq(aiSuggestions.userId, userId),
          eq(aiSuggestions.suggestionType, "link"),
          or(
            and(
              sql`${aiSuggestions.suggestionData}->>'sourceNoteId' = ${sourceNote.id}`,
              sql`${aiSuggestions.suggestionData}->>'targetNoteId' = ${targetNote.id}`,
            ),
            and(
              sql`${aiSuggestions.suggestionData}->>'sourceNoteId' = ${targetNote.id}`,
              sql`${aiSuggestions.suggestionData}->>'targetNoteId' = ${sourceNote.id}`,
            ),
          ),
        ),
      )
      .limit(1);
    if (existingSuggestion.length > 0) continue;

    // Store as AI suggestion
    await db.insert(aiSuggestions).values({
      userId,
      noteId: sourceNote.id,
      suggestionType: "link",
      suggestionData: {
        sourceNoteId: sourceNote.id,
        sourceTitle: sourceNote.title,
        targetNoteId: targetNote.id,
        targetTitle: targetNote.title,
        sharedEntities: candidate.bridgeEntities,
        score: candidate.score,
      },
      status: "pending",
    });

    created++;
  }

  return created;
}

export async function getConnectionSuggestions(userId: string, limit: number = 5) {
  return db
    .select()
    .from(aiSuggestions)
    .where(
      and(
        eq(aiSuggestions.userId, userId),
        eq(aiSuggestions.suggestionType, "link"),
        eq(aiSuggestions.status, "pending"),
      ),
    )
    .limit(limit);
}

export async function acceptSuggestion(userId: string, suggestionId: string) {
  const [suggestion] = await db
    .select()
    .from(aiSuggestions)
    .where(and(eq(aiSuggestions.id, suggestionId), eq(aiSuggestions.userId, userId)))
    .limit(1);

  if (!suggestion) return null;

  const data = suggestion.suggestionData as any;

  // Create the connection
  const connection = await createConnection(
    userId,
    data.sourceNoteId,
    data.targetNoteId,
    "ai_suggested",
    `Shared entities: ${(data.sharedEntities || []).join(", ")}`,
  );

  // Mark suggestion as accepted
  await db
    .update(aiSuggestions)
    .set({ status: "accepted" })
    .where(eq(aiSuggestions.id, suggestionId));

  return connection;
}

export async function dismissSuggestion(userId: string, suggestionId: string) {
  const result = await db
    .update(aiSuggestions)
    .set({ status: "rejected" })
    .where(and(eq(aiSuggestions.id, suggestionId), eq(aiSuggestions.userId, userId)))
    .returning();

  return result.length > 0;
}
