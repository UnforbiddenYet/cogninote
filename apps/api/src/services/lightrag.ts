/**
 * LightRAG Client Service
 *
 * Handles all interactions with the LightRAG API for semantic search,
 * Q&A, and document indexing
 */

// Configuration
const LIGHTRAG_API_URL = process.env.LIGHTRAG_API_URL || "http://localhost:8020";
const LIGHTRAG_TIMEOUT_MS = parseInt(process.env.LIGHTRAG_TIMEOUT_MS || "30000", 10);
const LIGHTRAG_LLM_TIMEOUT_MS = parseInt(process.env.LIGHTRAG_LLM_TIMEOUT_MS || "120000", 10);
const LIGHTRAG_MAX_RETRIES = parseInt(process.env.LIGHTRAG_MAX_RETRIES || "2", 10);

/**
 * Query Modes
 * - local: Entity-focused retrieval with direct relationships
 * - global: Pattern analysis across the knowledge graph
 * - hybrid: Combined local and global strategies
 * - naive: Vector similarity search only
 * - mix: Integrated knowledge graph + vector retrieval (recommended)
 * - bypass: Direct LLM query without knowledge retrieval
 */
export type QueryMode = "local" | "global" | "hybrid" | "naive" | "mix" | "bypass";

interface SemanticMatch {
  noteId: string;
  snippet?: string;
  score: number;
}

export interface KnowledgeGraphNode {
  id: string;
  label: string;
  properties?: Record<string, any>;
}

export interface KnowledgeGraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  properties?: Record<string, any>;
}

export interface KnowledgeGraph {
  nodes: KnowledgeGraphNode[];
  edges: KnowledgeGraphEdge[];
}

export interface PopularEntity {
  label: string;
  count: number;
}

export interface QueryResponse {
  answer: string;
  sources: string[];
}

export interface FullQueryResponse {
  answer: string;
  sources: string[];
  entities: Array<{ name: string; description?: string }>;
  relationships: Array<{ from: string; relationship: string; to: string }>;
}

// Error handling
class LightRAGError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly isRetryable: boolean = false,
  ) {
    super(message);
    this.name = "LightRAGError";
  }
}

/**
 * Make HTTP request to LightRAG API with timeout and error handling
 */
async function makeRequest<T>(
  endpoint: string,
  method: string,
  body?: any,
  timeoutMs: number = LIGHTRAG_TIMEOUT_MS,
): Promise<T | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const requestBody = body ? { ...body } : undefined;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    const response = await fetch(`${LIGHTRAG_API_URL}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(requestBody) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new LightRAGError(
        `LightRAG API error: ${response.status} - ${errorText}`,
        response.status,
        response.status >= 500 || response.status === 429,
      );
    }

    return (await response.json()) as T;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof LightRAGError) {
      throw error;
    }

    if (error instanceof Error) {
      if (error.name === "AbortError") {
        console.error("LightRAG request timeout:", endpoint);
        throw new LightRAGError("Request timeout", undefined, true);
      }
      console.error("LightRAG request failed:", error.message);
      throw new LightRAGError(error.message, undefined, false);
    }

    throw new LightRAGError("Unknown error", undefined, false);
  }
}

/**
 * Retry function with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  attempts: number = LIGHTRAG_MAX_RETRIES,
): Promise<T | null> {
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      const isLastAttempt = i === attempts - 1;

      if (error instanceof LightRAGError && !error.isRetryable) {
        console.error("Non-retryable error:", error.message);
        return null;
      }

      if (isLastAttempt) {
        console.error("Max retry attempts reached");
        return null;
      }

      // Exponential backoff: 1s, 2s, 4s
      const delay = 2 ** i * 1000;
      console.log(`Retrying in ${delay}ms... (attempt ${i + 1}/${attempts})`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  return null;
}

/**
 * Build a stable file source name for LightRAG documents
 */
function getNoteFileSource(noteId: string): string {
  return `note_${noteId}.md`;
}

/**
 * Extract note ID from LightRAG file path metadata
 */
function getNoteIdFromFilePath(filePath?: string | null): string | null {
  if (!filePath) return null;

  const normalized = filePath.replace(/\\/g, "/");
  const fileName = normalized.split("/").pop() || normalized;
  const match = fileName.match(/^note_([0-9a-fA-F-]{36})\.md$/);

  return match ? match[1] : null;
}

/**
 * Normalize LightRAG documents response
 */
function normalizeDocuments(result: any): any[] {
  if (!result) return [];
  if (Array.isArray(result)) return result;
  if (result.statuses && typeof result.statuses === "object") {
    return Object.values(result.statuses).flat();
  }
  if (Array.isArray(result.documents)) return result.documents;
  if (Array.isArray(result.data)) return result.data;
  if (Array.isArray(result.items)) return result.items;
  if (Array.isArray(result.docs)) return result.docs;
  return [];
}

/**
 * Index a note in LightRAG
 */
export async function indexNote(noteId: string, content: string): Promise<boolean> {
  const fileSource = getNoteFileSource(noteId);

  try {
    const result = await retryWithBackoff(() =>
      makeRequest("/documents/text", "POST", {
        text: content,
        file_source: fileSource,
      }),
    );

    if (result) {
      console.log(`Successfully indexed note ${noteId}`);
      return true;
    }

    console.error(`Failed to index note ${noteId}`);
    return false;
  } catch (error) {
    console.error(`Error indexing note ${noteId}:`, error);
    return false;
  }
}

/**
 * Delete a note from LightRAG index
 */
export async function deleteNote(noteId: string): Promise<boolean> {
  try {
    const fileSource = getNoteFileSource(noteId);
    const docIds = await retryWithBackoff(async () => {
      const docsResult = await makeRequest<any>("/documents", "GET", undefined);
      const docs = normalizeDocuments(docsResult);

      return docs
        .filter((doc) => {
          const filePath = doc.file_path || doc.filePath || doc.file_source || doc.fileSource || "";
          return filePath === fileSource || filePath.endsWith(`/${fileSource}`);
        })
        .map((doc) => doc.id || doc.doc_id || doc.docId)
        .filter(Boolean);
    });

    if (!docIds || docIds.length === 0) {
      console.log(`No LightRAG documents found for note ${noteId}`);
      return false;
    }

    const result = await retryWithBackoff(() =>
      makeRequest("/documents/delete_document", "DELETE", {
        doc_ids: docIds,
      }),
    );

    if (result) {
      console.log(`Successfully deleted note ${noteId}`, result);
      return true;
    }

    console.error(`Failed to delete note ${noteId}`);
    return false;
  } catch (error) {
    console.error(`Error deleting note ${noteId}:`, error);
    return false;
  }
}

/**
 * Search notes semantically using LightRAG
 */
export async function searchSemantic(
  query: string,
  mode: QueryMode = "hybrid",
  limit: number = 20,
): Promise<SemanticMatch[]> {
  try {
    const result = await retryWithBackoff(() =>
      makeRequest<any>(
        "/query/data",
        "POST",
        {
          query,
          mode,
          top_k: limit,
          chunk_top_k: limit,
          include_references: true,
          only_need_context: true,
        },
        LIGHTRAG_LLM_TIMEOUT_MS,
      ),
    );

    const references = Array.isArray(result?.references)
      ? result.references
      : Array.isArray(result?.reference)
        ? result.reference
        : [];

    if (!references || references.length === 0) {
      return [];
    }

    const matches = new Map<string, SemanticMatch>();

    for (const ref of references) {
      const filePath = ref.file_path || ref.filePath || ref.file_source || ref.fileSource;
      const noteId = getNoteIdFromFilePath(filePath);
      if (!noteId) continue;

      const snippet = ref.content || ref.text || ref.chunk || "";
      const score =
        typeof ref.score === "number"
          ? ref.score
          : typeof ref.similarity === "number"
            ? ref.similarity
            : 0;

      const existing = matches.get(noteId);
      if (!existing || score > existing.score) {
        matches.set(noteId, { noteId, snippet, score });
      } else if (!existing.snippet && snippet) {
        existing.snippet = snippet;
      }
    }

    return Array.from(matches.values()).sort((a, b) => b.score - a.score);
  } catch (error) {
    console.error("Semantic search failed:", error);
    return [];
  }
}

/**
 * Generate a summary for content using LightRAG
 */
export async function generateSummary(content: string): Promise<string | null> {
  try {
    const result = await retryWithBackoff(() =>
      makeRequest<any>(
        "/query",
        "POST",
        {
          query: `Please provide a concise summary (2-3 sentences) of the following content:\n\n${content}`,
          mode: "naive",
        },
        LIGHTRAG_LLM_TIMEOUT_MS,
      ),
    );

    const answer = result?.response || result?.answer;
    if (!answer) {
      return null;
    }

    return answer;
  } catch (error) {
    console.error("Summary generation failed:", error);
    return null;
  }
}

/**
 * Re-index a note by deleting existing document(s) then inserting updated content
 */
export async function reindexNote(noteId: string, content: string): Promise<boolean> {
  await deleteNote(noteId);
  return indexNote(noteId, content);
}

/**
 * Check if LightRAG service is healthy
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${LIGHTRAG_API_URL}/health`, {
      method: "GET",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.error("LightRAG health check failed:", error);
    return false;
  }
}

// --- Graph Exploration Functions ---

/**
 * Get a subgraph from LightRAG centered on a given entity label
 */
export async function getSubgraph(
  label: string,
  maxDepth: number = 2,
  maxNodes: number = 50,
): Promise<KnowledgeGraph | null> {
  try {
    const params = new URLSearchParams({
      label,
      max_depth: String(maxDepth),
      max_nodes: String(maxNodes),
    });

    const result = await retryWithBackoff(() =>
      makeRequest<any>(`/graphs?${params}`, "GET", undefined),
    );

    if (!result) return null;

    const nodes: KnowledgeGraphNode[] = (result.nodes || []).map((n: any) => ({
      id: n.id || (Array.isArray(n.labels) ? n.labels[0] : n.label) || n.name,
      label: (Array.isArray(n.labels) ? n.labels[0] : n.label) || n.name || n.id,
      properties: n.properties || n.metadata || {},
    }));

    const edges: KnowledgeGraphEdge[] = (result.edges || result.links || []).map((e: any) => ({
      id: e.id || `${e.source}-${e.target}`,
      source: e.source || e.from,
      target: e.target || e.to,
      label: e.properties?.description || e.properties?.keywords || e.label || e.relationship || "",
      properties: e.properties || e.metadata || {},
    }));

    return { nodes, edges };
  } catch (error) {
    console.error("getSubgraph failed:", error);
    return null;
  }
}

/**
 * Get all entity labels from LightRAG
 */
export async function getEntityLabels(): Promise<string[]> {
  try {
    const result = await retryWithBackoff(() =>
      makeRequest<any>("/graph/label/list", "GET", undefined),
    );

    if (!result) return [];
    return Array.isArray(result) ? result : result.labels || result.data || [];
  } catch (error) {
    console.error("getEntityLabels failed:", error);
    return [];
  }
}

/**
 * Get popular entities from LightRAG, enriched with edge counts from subgraphs
 */
export async function getPopularEntities(limit: number = 20): Promise<PopularEntity[]> {
  try {
    const params = new URLSearchParams({ limit: String(limit) });
    const result = await retryWithBackoff(() =>
      makeRequest<any>(`/graph/label/popular?${params}`, "GET", undefined),
    );

    if (!result) return [];

    // LightRAG returns plain string[] for popular labels
    const items: string[] = Array.isArray(result)
      ? result.map((item: any) => (typeof item === "string" ? item : item.label || item.name || ""))
      : result.data || result.labels || [];

    // Fetch shallow subgraphs in parallel to get edge counts
    const entities = await Promise.all(
      items.slice(0, limit).map(async (label) => {
        const subgraph = await getSubgraph(label, 1, 30);
        return {
          label,
          count: subgraph?.edges?.length || 0,
        };
      }),
    );

    return entities;
  } catch (error) {
    console.error("getPopularEntities failed:", error);
    return [];
  }
}

/**
 * Search entities in LightRAG
 */
export async function searchEntities(query: string, limit: number = 10): Promise<PopularEntity[]> {
  try {
    const params = new URLSearchParams({ q: query, limit: String(limit) });
    const result = await retryWithBackoff(() =>
      makeRequest<any>(`/graph/label/search?${params}`, "GET", undefined),
    );

    if (!result) return [];

    // LightRAG returns plain string[] for search results
    const items: string[] = Array.isArray(result)
      ? result.map((item: any) => (typeof item === "string" ? item : item.label || item.name || ""))
      : result.data || result.labels || [];

    return items.slice(0, limit).map((label) => ({
      label,
      count: 0, // Count not available from search endpoint
    }));
  } catch (error) {
    console.error("searchEntities failed:", error);
    return [];
  }
}

/**
 * Check if a specific entity exists in LightRAG
 */
export async function entityExists(name: string): Promise<boolean> {
  try {
    const params = new URLSearchParams({ name });
    const result = await retryWithBackoff(() =>
      makeRequest<any>(`/graph/entity/exists?${params}`, "GET", undefined),
    );

    return result?.exists === true;
  } catch (error) {
    console.error("entityExists failed:", error);
    return false;
  }
}

/**
 * Get LightRAG pipeline status
 */
export async function getPipelineStatus(): Promise<any | null> {
  try {
    return await retryWithBackoff(() =>
      makeRequest<any>("/documents/pipeline_status", "GET", undefined),
    );
  } catch (error) {
    console.error("getPipelineStatus failed:", error);
    return null;
  }
}

/**
 * Extract cited reference IDs from LightRAG responses.
 * Handles multiple citation formats the LLM may use:
 *   - Inline markers: 【1†note_xxx.md】
 *   - Markdown references section: - [1] note_xxx.md
 */
function extractCitedReferenceIds(text: string): Set<string> {
  const ids = new Set<string>();

  // Inline 【1†...】 markers
  for (const m of text.matchAll(/【(\d+)†[^】]*】/g)) {
    ids.add(m[1]);
  }

  // ### References section: lines like "- [1] note_xxx.md"
  const refSection = text.match(/###?\s*References[\s\S]*$/i);
  if (refSection) {
    for (const m of refSection[0].matchAll(/\[(\d+)\]/g)) {
      ids.add(m[1]);
    }
  }

  return ids;
}

/**
 * Strip the trailing ### References section and inline citation markers from the answer
 */
function cleanAnswerText(text: string): string {
  return text
    .replace(/\n+###?\s*References[\s\S]*$/i, "")
    .replace(/【\d+†[^】]*】/g, "")
    .trim();
}

type LightRAGQueryResponse = {
  response: string;
  references: {
    reference_id: string;
    file_path: string;
    content: null;
  }[];
};

function getQueryCleanResponse(r: LightRAGQueryResponse) {
  const { response: rawAnswer, references: allRefs } = r;
  const answer = cleanAnswerText(rawAnswer);
  const citedIds = extractCitedReferenceIds(rawAnswer);
  const citedRefs = citedIds.size > 0 ? allRefs.filter((r) => citedIds.has(r.reference_id)) : [];
  const sources = citedRefs
    .map((r) => getNoteIdFromFilePath(r.file_path))
    .filter(Boolean) as string[];

  return {
    answer,
    sources,
  };
}

export async function queryRAG(
  query: string,
  mode: QueryMode,
  topK: number = 10,
): Promise<QueryResponse | null> {
  try {
    const answerResult = await retryWithBackoff<LightRAGQueryResponse>(() =>
      makeRequest<any>(
        "/query",
        "POST",
        {
          query,
          mode,
          top_k: topK,
          include_references: true,
          user_prompt: "Do not include source references (【1】【2】etc) in the answer main body",
        },
        LIGHTRAG_LLM_TIMEOUT_MS,
      ),
    );

    if (!answerResult) {
      return null;
    }

    return getQueryCleanResponse(answerResult);
  } catch (error) {
    console.error("query failed:", error);
    return null;
  }
}
