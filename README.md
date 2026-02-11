# MindGraph

AI-Powered Personal Knowledge Graph

## Quick Start

### Prerequisites

- [Bun](https://bun.sh) (v1.0+)
- [Docker](https://www.docker.com/) and Docker Compose
- PostgreSQL 15+ (via Docker)

### Setup

1. **Install dependencies**:
   ```bash
   bun install
   ```

2. **Start PostgreSQL**:
   ```bash
   docker-compose up -d db
   ```

3. **Setup environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

4. **Run migrations**:
   ```bash
   bun run db:push
   ```

5. **Start development servers**:
   ```bash
   bun run dev
   ```

   This starts:
   - Frontend: http://localhost:3000 (TanStack Start)
   - Backend: http://localhost:3001 (Hono)

## Project Structure

```
mindgraph/
├── apps/
│   ├── api/              # Hono backend
│   │   ├── src/
│   │   │   ├── index.ts  # Entry point
│   │   │   ├── routes/   # API endpoints
│   │   │   ├── services/ # Business logic
│   │   │   ├── db/       # Database schema
│   │   │   └── lib/      # Utilities
│   │   └── drizzle.config.ts
│   │
│   └── web/              # TanStack Start frontend
│       ├── app/
│       │   ├── routes/   # File-based routes
│       │   ├── components/
│       │   ├── lib/
│       │   └── styles/
│       └── app.config.ts
│
└── packages/
    └── shared/           # Shared types & schemas
```

## Tech Stack

- **Frontend**: TanStack Start + React Router + Tailwind CSS
- **Backend**: Hono + Drizzle ORM + PostgreSQL
- **Database**: PostgreSQL 15+ with pgvector
- **AI**: OpenAI (embeddings) + Anthropic Claude (features)
- **Runtime**: Bun
- **Linting**: Biome

## Development

### Available Scripts

```bash
# Development
bun run dev              # Start both frontend and backend

# Building
bun run build           # Build all apps
bun run type-check      # Run TypeScript type checking
bun run lint            # Lint all code

# Database
bun run db:push         # Push schema changes
bun run db:generate     # Generate migrations
bun run db:studio       # Open Drizzle Studio

# Testing
bun test                # Run tests
```

### Project Phases

This project is being built in 6 phases:

1. **Phase 0**: Project Setup & Infrastructure ✓ (In Progress)
2. **Phase 1**: Foundation (Database, Auth, Core API)
3. **Phase 2**: Core Features (Notes, Search)
4. **Phase 3**: Graph Visualization
5. **Phase 4**: AI Integration
6. **Phase 5**: Polish, Testing & Optimization
7. **Phase 6**: Deployment & Documentation

See `/knowledge-graph-spec.md` for full specification.

## Contributing

Follow the implementation plan in `/claude/plans/lively-churning-chipmunk.md`.

## License

MIT
