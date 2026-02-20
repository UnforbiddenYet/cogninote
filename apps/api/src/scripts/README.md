# Database Seeding Scripts

Scripts for seeding and managing test data in the knowledge base.

## Quick Start

```bash
# 1. Create seed user
bun run src/scripts/seed-user.ts
```
**Credentials:**
- Email: `seed@example.com`
- Password: `password123`

```bash
# 2. Seed notes from markdown files
bun run src/scripts/seed-notes.ts

# 3. Interactive CLI for selecting and indexing notes in LightRAG.
bun run src/scripts/index-notes-cli.ts

# OR

# 3. Bulk re-indexes all notes for RAG
bun run src/scripts/reindex-notes.ts
```

## Environment Variables

Make sure these are set in the `.env`:

```env
LIGHTRAG_API_URL=http://localhost:8020
DATABASE_URL=postgresql://...
API_URL=http://localhost:3001
```

## Troubleshooting

**"No seed user found"**
- Run `seed-user.ts` first to create the user

**Notes not appearing in search**
- Run `index-notes-cli.ts` to manually index notes
- Check LightRAG logs: `docker logs cogninote_lightrag`
