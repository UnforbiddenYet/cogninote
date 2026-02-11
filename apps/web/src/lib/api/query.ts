import { apiRequest } from "./apiClient";

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

export async function executeSearchQuery(
  query: string,
  maxSources: number = 10,
): Promise<QueryResult> {
  const result = await apiRequest<{
    success: boolean;
    data: QueryResult;
  }>("/api/query", {
    method: "POST",
    body: JSON.stringify({ query, maxSources }),
  });
  return result.data;
}
