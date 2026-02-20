# Cogninote

AI-Powered Personal Knowledge Base

## Quick Start

```bash
cp .env.example .env # Run for the first time
docker compose up -d # Start the services
open http://localhost:3001
```

## Tech Stack

- **Frontend**: React + TanStack Router + Hono RPC client + zustand + tiptap editor + Tailwind CSS
- **Backend**: Hono + Drizzle ORM + PostgreSQL
- **Database**: PostgreSQL 15
- **AI RAG**: lightRAG
- **Runtime**: Bun
- **Linting**: Biome

