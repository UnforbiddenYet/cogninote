import { queryRAG, type QueryMode } from "./lightrag";
import { getNotesByIds } from "./notes";

export interface QueryResult {
  answer: string;
  sources: Array<{
    noteId: string;
    title: string;
    summary: string;
  }>;
  metadata: {
    processingTimeMs: number;
    mode: string;
  };
}

export async function executeQuery(
  userId: string,
  query: string,
  mode: QueryMode,
  maxSources: number = 10,
): Promise<QueryResult | null> {
  const startTime = Date.now();

  const response = await queryRAG(userId, query, mode, maxSources);
  if (!response) return null;

  // Enrich sources with note metadata
  const sourceNotes = await getNotesByIds(userId, response.sources);
  const notesById = new Map(sourceNotes.map((n) => [n.id, n]));

  const sources = response.sources
    .map((id, idx) => {
      const note = notesById.get(id);
      if (!note) return null;
      return {
        noteId: note.id,
        title: note.title,
        summary: note.summary,
      };
    })
    .filter(Boolean) as QueryResult["sources"];

  return {
    answer: response.answer,
    sources,
    metadata: {
      processingTimeMs: Date.now() - startTime,
      mode,
    },
  };
}
