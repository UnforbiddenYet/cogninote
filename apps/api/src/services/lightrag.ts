/**
 * LightRAG Client Service
 *
 * Handles all interactions with the LightRAG API for semantic search,
 * Q&A, and document indexing with multi-tenant workspace support.
 */

// Configuration
const LIGHTRAG_API_URL =
  process.env.LIGHTRAG_API_URL || "http://localhost:8020";
const LIGHTRAG_ENABLED = process.env.LIGHTRAG_ENABLED === "true";
const LIGHTRAG_TIMEOUT_MS = parseInt(
  process.env.LIGHTRAG_TIMEOUT_MS || "30000",
);
const LIGHTRAG_MAX_RETRIES = parseInt(process.env.LIGHTRAG_MAX_RETRIES || "3");
const LIGHTRAG_WORKSPACE_HEADER = "LIGHTRAG-WORKSPACE";

// Types
type QueryMode = "local" | "global" | "hybrid" | "naive" | "mix";

interface SemanticMatch {
  noteId: string;
  snippet?: string;
  score: number;
}

interface QueryResponse {
  answer: string;
  context: string[];
  sources: string[];
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
  workspace?: string,
): Promise<T | null> {
  if (!LIGHTRAG_ENABLED) {
    console.log("LightRAG is disabled");
    return null;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), LIGHTRAG_TIMEOUT_MS);

  try {
    const requestBody = body ? { ...body } : undefined;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (workspace) {
      headers[LIGHTRAG_WORKSPACE_HEADER] = workspace;
    }

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

    return await response.json();
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
      const delay = Math.pow(2, i) * 1000;
      console.log(`Retrying in ${delay}ms... (attempt ${i + 1}/${attempts})`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  return null;
}

/**
 * Get workspace identifier for a user
 */
function getUserWorkspace(userId: string): string {
  return `user_${userId}`;
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
  if (Array.isArray(result.documents)) return result.documents;
  if (Array.isArray(result.data)) return result.data;
  if (Array.isArray(result.items)) return result.items;
  if (Array.isArray(result.docs)) return result.docs;
  return [];
}

/**
 * Index a note in LightRAG
 */
export async function indexNote(
  userId: string,
  noteId: string,
  title: string,
  content: string,
): Promise<boolean> {
  const workspace = getUserWorkspace(userId);
  const fileSource = getNoteFileSource(noteId);

  // Combine title and content for better context
  const documentContent = `# ${title}\n\n${content}`;

  try {
    const result = await retryWithBackoff(() =>
      makeRequest(
        "/documents/text",
        "POST",
        {
          text: documentContent,
          file_source: fileSource,
        },
        workspace,
      ),
    );

    if (result) {
      console.log(`Successfully indexed note ${noteId} for user ${userId}`);
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
export async function deleteNote(
  userId: string,
  noteId: string,
): Promise<boolean> {
  const workspace = getUserWorkspace(userId);

  try {
    const fileSource = getNoteFileSource(noteId);
    const docIds = await retryWithBackoff(async () => {
      const docsResult = await makeRequest<any>(
        "/documents",
        "GET",
        undefined,
        workspace,
      );
      const docs = normalizeDocuments(docsResult);

      return docs
        .filter((doc) => {
          const filePath =
            doc.file_path ||
            doc.filePath ||
            doc.file_source ||
            doc.fileSource ||
            "";
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
      makeRequest(
        "/documents/delete",
        "POST",
        {
          doc_ids: docIds,
        },
        workspace,
      ),
    );

    if (result) {
      console.log(`Successfully deleted note ${noteId} for user ${userId}`);
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
  userId: string,
  query: string,
  mode: QueryMode = "hybrid",
  limit: number = 20,
): Promise<SemanticMatch[]> {
  const workspace = getUserWorkspace(userId);

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
        workspace,
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
      const filePath =
        ref.file_path || ref.filePath || ref.file_source || ref.fileSource;
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
 * Ask a question and get an AI-generated answer with sources
 */
export async function askQuestion(
  userId: string,
  question: string,
  mode: QueryMode = "hybrid",
): Promise<QueryResponse | null> {
  const workspace = getUserWorkspace(userId);

  try {
    const result = await retryWithBackoff(() =>
      makeRequest<any>(
        "/query/data",
        "POST",
        {
          query: question,
          mode,
          include_references: true,
        },
        workspace,
      ),
    );

    if (!result) {
      return null;
    }

    // Extract sources (note IDs) from the response
    const sources: string[] = [];
    const references = Array.isArray(result.references)
      ? result.references
      : Array.isArray(result.sources)
        ? result.sources
        : [];

    for (const ref of references) {
      if (typeof ref === "string") {
        const noteId = getNoteIdFromFilePath(ref) || ref.replace(/^note_/, "");
        if (noteId) sources.push(noteId);
        continue;
      }

      const filePath =
        ref.file_path || ref.filePath || ref.file_source || ref.fileSource;
      const noteId = getNoteIdFromFilePath(filePath);
      if (noteId) sources.push(noteId);
    }

    return {
      answer: result.response || result.answer || "",
      context: result.context || [],
      sources: Array.from(new Set(sources)),
    };
  } catch (error) {
    console.error("Q&A failed:", error);
    return null;
  }
}

/**
 * Generate a summary for content using LightRAG
 */
export async function generateSummary(content: string): Promise<string | null> {
  if (!LIGHTRAG_ENABLED) {
    return null;
  }

  try {
    // Use a temporary workspace for summary generation
    const result = await retryWithBackoff(() =>
      makeRequest<any>(
        "/query",
        "POST",
        {
          query: `Please provide a concise summary (2-3 sentences) of the following content:\n\n${content}`,
          mode: "naive",
        },
        "temp_summary",
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
export async function reindexNote(
  userId: string,
  noteId: string,
  title: string,
  content: string,
): Promise<boolean> {
  await deleteNote(userId, noteId);
  return indexNote(userId, noteId, title, content);
}

/**
 * Check if LightRAG service is healthy
 */
export async function healthCheck(): Promise<boolean> {
  if (!LIGHTRAG_ENABLED) {
    return false;
  }

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

// Export configuration for use in other modules
export { LIGHTRAG_ENABLED, LIGHTRAG_API_URL };
