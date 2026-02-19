import { queryRAG, type QueryMode } from "./lightrag";
import { getNotesByIds, toPreview } from "./notes";

export async function executeQuery(
  userId: string,
  query: string,
  mode: QueryMode,
  maxSources: number = 10,
) {
  const startTime = Date.now();

  const response = await queryRAG(userId, query, mode, maxSources);
  if (!response) return null;

  // Enrich sources with note metadata
  const sourceNotes = await getNotesByIds(userId, response.sources);
  const notesById = new Map(sourceNotes.map((n) => [n.id, n]));

  const sources = response.sources.map((id) => {
    const note = notesById.get(id);
    if (!note) return null;
    return {
      id: note.id,
      title: note.title,
      preview: toPreview(note.content),
      updatedAt: note.updatedAt,
    };
  });

  const filteredSources = sources.filter((s): s is NonNullable<typeof s> => s !== null);

  return {
    answer: response.answer,
    sources: filteredSources,
    metadata: {
      processingTimeMs: Date.now() - startTime,
      mode,
    },
  };
}
