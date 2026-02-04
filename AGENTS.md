### REST Endpoints
```
POST   /api/auth/register          - Create account
POST   /api/auth/login             - Login
POST   /api/auth/logout            - Logout
POST   /api/auth/refresh           - Refresh access token
GET    /api/auth/me                - Get current user
GET    /api/notes                  - List all notes (paginated, filtered)
GET    /api/notes/:id              - Get single note
POST   /api/notes                  - Create note
PATCH  /api/notes/:id              - Update note
DELETE /api/notes/:id              - Delete note (soft delete)
GET    /api/notes/:id/related      - Get related notes (via links & AI)
POST   /api/notes/:id/ai-analyze   - Trigger AI analysis for note
GET    /api/links                  - Get all links for user
POST   /api/links                  - Create link between notes
DELETE /api/links/:id              - Delete link
PATCH  /api/links/:id              - Update link (accept/reject AI suggestion)
GET    /api/tags                   - List all tags
POST   /api/tags                   - Create tag
PATCH  /api/tags/:id               - Update tag
DELETE /api/tags/:id               - Delete tag
GET    /api/tags/:id/notes         - Get notes with tag
GET    /api/search?q=query         - Full-text search across notes
POST   /api/search/semantic        - Semantic search using embeddings
GET    /api/graph                  - Get graph data (nodes & edges)
GET    /api/graph/stats            - Get graph statistics
POST   /api/ai/suggest-tags        - Suggest tags for note
POST   /api/ai/suggest-links       - Suggest related notes
POST   /api/ai/summarize           - Generate note summary
GET    /api/ai/suggestions         - Get pending AI suggestions
```

Be pragmatic, research ready-made industry standard solutions first before jumping into creating own stuff.

Use feature dev workflow. Frequently commit and Use conventional commit message format. Be brief in commit messages. Squash merge.

Analyze, ask questions and propose short overview of upcoming work before jumping into an execution