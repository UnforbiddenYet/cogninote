---
name: lightrag-api
description: Use when interacting with the LightRAG Server API to upload documents, index text, query/stream responses, manage graph entities/relations, or check pipeline and health endpoints.
---

# LightRAG API

## Overview
Use this skill when you need to call the LightRAG Server API for ingestion, querying (including NDJSON streaming), graph operations, and pipeline/health management. Keep this file lean and reference the full OpenAPI spec in `references/openapi.json` for exact schemas.

## Typed Client
All LightRAG interactions go through the `openapi-fetch` client in `apps/api/src/services/lightrag.ts`:
```ts
import createClient from "openapi-fetch";
import type { paths, components } from "./lightrag-types";
const client = createClient<paths>({ baseUrl: LIGHTRAG_API_URL });
```
- Types are generated from the live server: `bun run generate:lightrag-types` (fetches `http://localhost:8020/openapi.json`).
- Generated types live in `apps/api/src/services/lightrag-types.d.ts` — do not hand-edit.
- 6 endpoints have full OpenAPI schemas and real type-safety (documents, query, pipeline_status).
- 7 graph endpoints return `unknown` — use TypeScript type assertions (e.g., `data as string[]`, `data as GraphsResponse`).

## Setup
- Base URL: use `LIGHTRAG_API_URL` (default `http://localhost:8020`).
- Timeouts: honor caller-configured timeouts; LightRAG can take longer for LLM-backed operations.
- Content types:
  - JSON for most endpoints.
  - `multipart/form-data` for file uploads.
  - `application/x-www-form-urlencoded` for login.

## Auth
- Check auth status: `GET /auth-status`.
- Login (OAuth2 password flow): `POST /login` with form fields `username`, `password` (optionally `grant_type`, `scope`, `client_id`, `client_secret`).
- If enabled, send `Authorization: Bearer <token>` on protected routes.

## Ingestion
- Upload a file: `POST /documents/upload` (multipart form field `file`).
- Insert raw text:
  - Single: `POST /documents/text` with `text` and optional `file_source`.
  - Batch: `POST /documents/texts` with `texts[]` and optional `file_sources[]`.
- Scan input directory: `POST /documents/scan`.
- Typical response includes a `track_id`; use it for status tracking.

## Tracking and Pipeline
- Track ingest progress: `GET /documents/track_status/{track_id}`.
- Pipeline status: `GET /documents/pipeline_status`.
- Status counts: `GET /documents/status_counts`.
- Reprocess failed docs: `POST /documents/reprocess_failed`.
- Cancel pipeline: `POST /documents/cancel_pipeline`.
- List documents:
  - `GET /documents` (grouped by status).
  - `POST /documents/paginated` with `DocumentsRequest` for paging/sorting.

## Querying
- Standard query: `POST /query` with `QueryRequest`.
- Structured data: `POST /query/data` to get entities, relationships, chunks, references.
- Streaming: `POST /query/stream` returns `application/x-ndjson`.
  - Parse line-by-line JSON objects; each line is a complete JSON object.

Key `QueryRequest` fields to consider:
- `query` (required)
- `mode` (`local`, `global`, `hybrid`, `naive`, `mix`, `bypass`)
- `include_references` and `include_chunk_content`
- `top_k`, `chunk_top_k`
- `response_type`, `user_prompt`
- `only_need_context`, `only_need_prompt`
- `enable_rerank`
- `hl_keywords`, `ll_keywords`
- `conversation_history`

Query Modes:
- local: Entity-focused retrieval with direct relationships
- global: Pattern analysis across the knowledge graph
- hybrid: Combined local and global strategies
- naive: Vector similarity search only
- mix: Integrated knowledge graph + vector retrieval (recommended)
- bypass: Direct LLM query without knowledge retrieval

## Graph Operations
- Entities:
  - Create: `POST /graph/entity/create`
  - Update: `POST /graph/entity/edit`
  - Exists: `GET /graph/entity/exists`
  - Merge: `POST /graph/entities/merge`
- Relations:
  - Create: `POST /graph/relation/create`
  - Update: `POST /graph/relation/edit`
- Labels:
  - List: `GET /graph/label/list`
  - Search: `GET /graph/label/search`
  - Popular: `GET /graph/label/popular`
- Full graph: `GET /graphs`

## Admin and Health
- Health: `GET /health`
- Version: `GET /api/version`
- Tags: `GET /api/tags`
- Running models: `GET /api/ps`
- Optional chat/generate:
  - `POST /api/chat`
  - `POST /api/generate`

## Reference
- For full schema details, open `references/openapi.json` and search for the endpoint or schema name (e.g., `QueryRequest`, `InsertResponse`, `DocumentsRequest`).
- For TypeScript types, check `apps/api/src/services/lightrag-types.d.ts` (generated) and manual type annotations in `lightrag.ts` (`GraphsResponse`, `EntityExistsResponse`).
- To regenerate types after LightRAG API changes: `cd apps/api && bun run generate:lightrag-types`.
