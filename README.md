<h1 align="center">Cogninote</h1>

<p align="center">
  <strong>AI-First Personal Knowledge Base</strong><br>
  <sub>Take notes. Ask questions in plain language. Let the AI discover connections and insights.</sub>
</p>

<p align="center">
  <sub>Self-hosted via Docker. Bring Your Own Key — works with Claude, Gemini, Mistral, llama.cpp, LM Studio, and more.</sub>
</p>

## Features

**Rich text editor** — markdown based powered by Tiptap.

![Editor](images/editor.png)

**Ask questions, get grounded answers** — natural language queries answered by your own notes via LightRAG (hybrid knowledge graph with vector retrieval).

![AI Query](images/query.png)

**AI-suggested connections** — it automatically find notes that share concepts, then suggests links you can accept or dismiss with one click.

**Dashboard** — stats, recent notes, top entities from your knowledge graph, and pending suggestions at a glance.

![Dashboard](images/dashboard.png)

## Architecture

```mermaid
graph LR
    Browser["Browser (React SPA)"] -->|Hono RPC| Hono["Hono Server (Bun)"]
    Hono -->|Drizzle ORM| PG[(PostgreSQL)]
    Hono -->|REST| LightRAG["LightRAG (Graph + Vector)"]
    Hono -->|Static files| Browser
```

Cogninote is a **monorepo** (`apps/api` + `apps/web`) where a single Hono process serves both the REST API and the built React SPA.

**RAG pipeline:** When a note is saved it gets indexed into LightRAG as a markdown document. On query, LightRAG performs a hybrid retrieval (knowledge graph traversal + vector similarity) to providing more accurate and contextually relevant responses.

**End-to-end type safety:** The API exports its Hono route types directly. The frontend gets fully typed API calls via `hc` (Hono RPC) — no OpenAPI spec, no codegen, no drift.

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Runtime | **Bun** | Fast startup, native TypeScript, built-in workspace support |
| Backend | **Hono** | Lightweight, runs anywhere, serves both API and SPA from one process |
| Frontend | **React + TanStack Router + TanStack Query** | File-based type-safe routing, declarative server state with caching |
| Client state | **Zustand** | Minimal boilerplate for editor save state and UI toggles |
| Editor | **Tiptap** | Extensible rich text with bidirectional markdown serialization |
| ORM | **Drizzle** | Type-safe SQL, schema-as-code, zero codegen |
| Database | **PostgreSQL 15** | Reliable, JSONB for flexible suggestion data |
| Auth | **Better Auth** | Session-based auth with Drizzle adapter, no external service |
| Validation | **Valibot** | Lightweight schema validation integrated with Hono middleware |
| RAG | **LightRAG** | Hybrid graph + vector retrieval — better contextual answers than pure vector search |
| Styling | **Tailwind CSS** | Utility-first, custom CSS variables for theming |
| Linting | **Biome** | Single tool for formatting + linting, fast |

## Quick Start

```bash
cp .env.example .env
cp .env.lightrag.example .env.lightrag
docker compose up -d
open http://localhost:3001
```

Configure your LLM provider in `.env.lightrag` (defaults to Gemini API) as LightRAG requires the utilization of LLM and Embedding models to accomplish document indexing and querying tasks.
See [LightRAG Server docs for details](https://github.com/HKUDS/LightRAG/blob/main/lightrag/api/README.md#before-starting-lightrag-server)

### LightRAG Server Web UI

Access LightRAG's Web UI at [http://localhost:8020](http://localhost:8020) to observe document indexing status, ability to document bulk import and knowledge graph exploration.

## Development

```bash
# Prerequisites: Bun, Docker

bun install                             # Install dependencies
docker compose up -d db lightrag        # Start PostgreSQL + LightRAG
cp apps/api/.env.example apps/api/.env  # Configure Backend environment
cp apps/web/.env.example apps/web/.env  # Configure Frontend environment

bun run dev  # Starts both dev servers Web on :3000 and API on :3001
```

## Project Structure

```
cogninote/
├── apps/
│   ├── api/                  # Hono backend
│   │   ├── src/
│   │   │   ├── routes/       # HTTP handlers + validation
│   │   │   ├── services/     # Business logic + LightRAG integration
│   │   │   ├── db/           # Drizzle schema + connection
│   │   │   └── lib/          # Auth config, middleware
│   │   └── package.json
│   └── web/                  # React SPA
│       ├── src/
│       │   ├── routes/       # TanStack file-based routes
│       │   ├── components/   # UI components
│       │   ├── hooks/        # useAutosave, etc.
│       │   ├── stores/       # Zustand stores
│       │   └── lib/          # API client, utilities
│       └── package.json
├── docker-compose.yml
├── Dockerfile                # Multi-stage (build + runtime)
└── biome.json                # Shared linter config
```
