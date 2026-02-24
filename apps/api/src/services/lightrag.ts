/**
 * LightRAG Client Service
 *
 * Handles all interactions with the LightRAG API for semantic search,
 * Q&A, and document indexing. Uses openapi-fetch for typed API calls.
 */

import createClient from "openapi-fetch";
import type { paths, components } from "./lightrag-types";
import { withCache, FIVE_MINUTES } from "../cache";

// Configuration
const LIGHTRAG_API_URL = process.env.LIGHTRAG_API_URL || "http://localhost:8020";
const LIGHTRAG_LLM_TIMEOUT_MS = parseInt(process.env.LIGHTRAG_LLM_TIMEOUT_MS || "120000", 10);
const LIGHTRAG_MAX_RETRIES = parseInt(process.env.LIGHTRAG_MAX_RETRIES || "2", 10);

const client = createClient<paths>({ baseUrl: LIGHTRAG_API_URL });

export type QueryMode = components["schemas"]["QueryRequest"]["mode"];

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

// --- Response types for untyped graph endpoints ---

interface GraphsResponse {
  nodes: Array<{
    id: string;
    labels: string[];
    properties: Record<string, any>;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    properties: Record<string, any>;
  }>;
}

interface EntityExistsResponse {
  exists: boolean;
}

// --- Retry helper ---

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  attempts: number = LIGHTRAG_MAX_RETRIES,
): Promise<T> {
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      const isLastAttempt = i === attempts - 1;
      if (isLastAttempt) throw error;

      const delay = 2 ** i * 1000;
      console.log(`Retrying in ${delay}ms... (attempt ${i + 1}/${attempts})`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error("Unreachable");
}

// --- Domain helpers (unchanged) ---

function getNoteFileSource(noteId: string): string {
  return `note_${noteId}.md`;
}

function getNoteIdFromFilePath(filePath?: string | null): string | null {
  if (!filePath) return null;

  const normalized = filePath.replace(/\\/g, "/");
  const fileName = normalized.split("/").pop() || normalized;
  const match = fileName.match(/^note_([0-9a-fA-F-]{36})\.md$/);

  return match ? match[1] : null;
}

function extractCitedReferenceIds(text: string): Set<string> {
  const ids = new Set<string>();

  for (const m of text.matchAll(/【(\d+)†[^】]*】/g)) {
    ids.add(m[1]);
  }

  const refSection = text.match(/###?\s*References[\s\S]*$/i);
  if (refSection) {
    for (const m of refSection[0].matchAll(/\[(\d+)\]/g)) {
      ids.add(m[1]);
    }
  }

  return ids;
}

function cleanAnswerText(text: string): string {
  return text
    .replace(/\n+###?\s*References[\s\S]*$/i, "")
    .replace(/【\d+†[^】]*】/g, "")
    .trim();
}

type LightRAGQueryResponse = components["schemas"]["QueryResponse"];

function getQueryCleanResponse(r: LightRAGQueryResponse) {
  const { response: rawAnswer, references: allRefs = [] } = r;
  const answer = cleanAnswerText(rawAnswer);
  const citedIds = extractCitedReferenceIds(rawAnswer);
  const citedRefs =
    citedIds.size > 0 ? (allRefs ?? []).filter((r) => citedIds.has(r.reference_id)) : [];
  const sources = citedRefs
    .map((r) => getNoteIdFromFilePath(r.file_path))
    .filter(Boolean) as string[];

  return { answer, sources };
}

// --- API functions ---

export async function getIndexedNoteIds(): Promise<Set<string>> {
  try {
    const { data } = await retryWithBackoff(() => client.GET("/documents"));

    const docs = data?.statuses ? Object.values(data.statuses).flat() : [];
    const ids = new Set<string>();

    for (const doc of docs) {
      const noteId = getNoteIdFromFilePath(doc.file_path);
      if (noteId) ids.add(noteId);
    }

    return ids;
  } catch (error) {
    console.error("getIndexedNoteIds failed:", error);
    return new Set();
  }
}

export async function indexNote(noteId: string, content: string): Promise<boolean> {
  const fileSource = getNoteFileSource(noteId);

  try {
    const { data } = await retryWithBackoff(() =>
      client.POST("/documents/text", {
        body: { text: content, file_source: fileSource },
      }),
    );

    if (data) {
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

export async function deleteNote(noteId: string): Promise<boolean> {
  try {
    const fileSource = getNoteFileSource(noteId);

    const { data: docsData } = await retryWithBackoff(() => client.GET("/documents"));

    const docs = docsData?.statuses ? Object.values(docsData.statuses).flat() : [];

    const docIds = docs
      .filter((doc) => {
        return doc.file_path === fileSource || doc.file_path.endsWith(`/${fileSource}`);
      })
      .map((doc) => doc.id);

    if (docIds.length === 0) {
      console.log(`No LightRAG documents found for note ${noteId}`);
      return false;
    }

    const { data } = await retryWithBackoff(() =>
      client.DELETE("/documents/delete_document", {
        body: { doc_ids: docIds, delete_file: false, delete_llm_cache: false },
      }),
    );

    if (data) {
      console.log(`Successfully deleted note ${noteId}`, data);
      return true;
    }

    console.error(`Failed to delete note ${noteId}`);
    return false;
  } catch (error) {
    console.error(`Error deleting note ${noteId}:`, error);
    return false;
  }
}

export async function searchSemantic(
  query: string,
  mode: QueryMode = "hybrid",
  limit: number = 20,
): Promise<SemanticMatch[]> {
  try {
    const { data } = await retryWithBackoff(() =>
      client.POST("/query/data", {
        body: {
          query,
          mode,
          top_k: limit,
          chunk_top_k: limit,
          include_references: true,
          include_chunk_content: false,
          stream: false,
          only_need_context: true,
        },
        signal: AbortSignal.timeout(LIGHTRAG_LLM_TIMEOUT_MS),
      }),
    );

    const references = (data?.data as { references?: components["schemas"]["ReferenceItem"][] })
      ?.references;
    if (!references || references.length === 0) return [];

    const matches = new Map<string, SemanticMatch>();

    for (const ref of references) {
      const noteId = getNoteIdFromFilePath(ref.file_path);
      if (!noteId) continue;

      const snippet = ref.content?.[0] || "";
      const score = 0;

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

export async function generateSummary(content: string): Promise<string | null> {
  try {
    const { data } = await retryWithBackoff(() =>
      client.POST("/query", {
        body: {
          query: `Please provide a concise summary (2-3 sentences) of the following content:\n\n${content}`,
          mode: "naive",
          include_references: false,
          include_chunk_content: false,
          stream: false,
        },
        signal: AbortSignal.timeout(LIGHTRAG_LLM_TIMEOUT_MS),
      }),
    );

    return data?.response ?? null;
  } catch (error) {
    console.error("Summary generation failed:", error);
    return null;
  }
}

export async function reindexNote(noteId: string, content: string): Promise<boolean> {
  await deleteNote(noteId);
  return indexNote(noteId, content);
}

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

export async function getSubgraph(
  label: string,
  maxDepth: number = 2,
  maxNodes: number = 50,
): Promise<KnowledgeGraph | null> {
  try {
    const { data: raw } = await retryWithBackoff(() =>
      client.GET("/graphs", {
        params: { query: { label, max_depth: maxDepth, max_nodes: maxNodes } },
      }),
    );

    if (!raw) return null;
    const result = raw as GraphsResponse;

    const nodes: KnowledgeGraphNode[] = result.nodes.map((n) => ({
      id: n.id || n.labels[0],
      label: n.labels[0] || n.id,
      properties: n.properties || {},
    }));

    const edges: KnowledgeGraphEdge[] = result.edges.map((e) => ({
      id: e.id || `${e.source}-${e.target}`,
      source: e.source,
      target: e.target,
      label: e.properties?.description || e.properties?.keywords || "",
      properties: e.properties || {},
    }));

    return { nodes, edges };
  } catch (error) {
    console.error("getSubgraph failed:", error);
    return null;
  }
}

export async function getEntityLabels(): Promise<string[]> {
  try {
    const { data } = await retryWithBackoff(() => client.GET("/graph/label/list"));

    if (!data) return [];
    return data as string[];
  } catch (error) {
    console.error("getEntityLabels failed:", error);
    return [];
  }
}

export async function getPopularEntities(limit: number = 20): Promise<PopularEntity[]> {
  return withCache(`popular_entities:${limit}`, FIVE_MINUTES, async () => {
    try {
      const { data } = await retryWithBackoff(() =>
        client.GET("/graph/label/popular", {
          params: { query: { limit } },
        }),
      );

      if (!data) return [];
      const items = data as string[];

      return items.slice(0, limit).map((label) => ({ label, count: 0 }));
    } catch (error) {
      console.error("getPopularEntities failed:", error);
      return [];
    }
  });
}

export async function searchEntities(query: string, limit: number = 10): Promise<PopularEntity[]> {
  try {
    const { data } = await retryWithBackoff(() =>
      client.GET("/graph/label/search", {
        params: { query: { q: query, limit } },
      }),
    );

    if (!data) return [];
    const items = data as string[];

    return items.slice(0, limit).map((label) => ({ label, count: 0 }));
  } catch (error) {
    console.error("searchEntities failed:", error);
    return [];
  }
}

export async function entityExists(name: string): Promise<boolean> {
  try {
    const { data } = await retryWithBackoff(() =>
      client.GET("/graph/entity/exists", {
        params: { query: { name } },
      }),
    );

    return (data as EntityExistsResponse)?.exists === true;
  } catch (error) {
    console.error("entityExists failed:", error);
    return false;
  }
}

export async function getPipelineStatus() {
  try {
    const { data } = await retryWithBackoff(() => client.GET("/documents/pipeline_status"));
    return data ?? null;
  } catch (error) {
    console.error("getPipelineStatus failed:", error);
    return null;
  }
}

export async function queryRAG(
  query: string,
  mode: QueryMode,
  topK: number = 10,
): Promise<QueryResponse | null> {
  try {
    const { data } = await retryWithBackoff(() =>
      client.POST("/query", {
        body: {
          query,
          mode,
          top_k: topK,
          include_references: true,
          include_chunk_content: false,
          stream: false,
          user_prompt: "Do not include source references (【1】【2】etc) in the answer main body",
        },
        signal: AbortSignal.timeout(LIGHTRAG_LLM_TIMEOUT_MS),
      }),
    );

    if (!data) return null;
    return getQueryCleanResponse(data);
  } catch (error) {
    console.error("query failed:", error);
    return null;
  }
}
