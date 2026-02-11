AI-first Personal Knowledge Base

## Architecture
- **Stack**: Full-stack Hono + React app with LightRAG knowledge base retrieval
- **Backend Stack**: Hono + Drizzle ORM + PostgreSQL + Zod + Bun runtime + Docker
- **Pattern**: `routes/` (HTTP + validation) → `services/` (business logic) → `db/` (schema + connection)
- **Auth**: `requireAuth()` middleware → `c.get("userId")`. Handlers typed `c: any`.
- **LightRAG**: `requireLightRAG()` returns 503 when disabled. Fire-and-forget indexing.
- **Typecheck**: `bun run typecheck` from `apps/api/`
- **DB push**: `bun run db:push` from `apps/api/` (no migration files)

## REST Endpoints
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh
GET    /api/auth/me

GET    /api/notes                          - List (paginated)
POST   /api/notes                          - Create
GET    /api/notes/:id                      - Get single
PATCH  /api/notes/:id                      - Update
DELETE /api/notes/:id                      - Soft delete
GET    /api/notes/:id/related              - Connections for note
GET    /api/notes/:id/entities             - LightRAG entities for note

GET    /api/connections                    - List all for user
GET    /api/connections/note/:noteId       - For specific note
POST   /api/connections                    - Create {sourceNoteId, targetNoteId, connectionType?, description?}
DELETE /api/connections/:id                - Delete

POST   /api/query                          - Full query → answer + sources + entities + relationships
GET    /api/query/history                  - Paginated query log

POST   /api/ai/summarize                   - Generate note summary

GET    /api/suggestions/connections         - Pending connection suggestions
POST   /api/suggestions/connections/generate - Trigger generation (LightRAG required)
POST   /api/suggestions/:id/accept         - Accept → creates connection
POST   /api/suggestions/:id/dismiss        - Mark rejected

GET    /api/dashboard?timeRange=7d         - Stats, recent notes, top entities, suggestions

GET    /api/graph/entities/search?q=...    - Entity search
GET    /api/graph/entities/popular?limit=  - Popular entities
GET    /api/graph/subgraph?label=...       - Subgraph for entity
GET    /api/graph/stats                    - Note/connection/entity counts
```

## DB Schema
Tables: `notes`, `connections`, `aiSuggestions`, `queryLogs`
Enums: `connectionTypeEnum` (manual, ai_suggested), `suggestionTypeEnum` (link, summary), `suggestionStatusEnum` (pending, accepted, rejected)

## Testing
- Typecheck passes (`tsc --noEmit`). No unit/integration tests exist yet.
- Endpoints need manual or automated testing against running server + LightRAG.

## Guidelines
Be pragmatic, research ready-made industry standard solutions first before jumping into creating stuff.
Use feature dev workflow. Frequently commit with conventional commit message format. Be brief in commit messages. Squash merge.
Analyze, ask questions and propose short overview of upcoming work before jumping into an execution. Provide briefs after task is done.

## LightRAG Server API (OpenAPI) (use only when necessary)
http://localhost:8020/openapi.json