# MindGraph - AI-Powered Personal Knowledge Graph

## Project Specification v1.0

---

## Executive Summary

**MindGraph** is a modern personal knowledge management system that helps users capture, organize, and discover connections between their ideas. Built with a focus on beautiful UI/UX and intelligent AI features, it demonstrates production-ready fullstack engineering with emphasis on frontend excellence.

**Target Audience**: Knowledge workers, researchers, students, developers  
**Tech Stack**: Remix + React Router, Hono, Drizzle ORM, PostgreSQL, Bun, Tailwind, Biome  
**Deployment**: Docker + Fly.io/Render + GitHub Actions

---

## Product Vision

### Core Value Proposition
Turn scattered notes into an interconnected knowledge system where AI helps you discover patterns, connections, and insights you didn't know existed.

### Key Differentiators
1. **Beautiful, thoughtful UI** - Not another generic CRUD app
2. **Interactive graph visualization** - See your knowledge evolve
3. **AI that actually helps** - Smart tagging, connection discovery, summaries
4. **Fast & responsive** - Optimistic UI, real-time updates
5. **Privacy-first** - Self-hostable, data stays yours

---

## Technical Architecture

### System Overview

```
┌─────────────┐
│   Browser   │
│  (Remix)    │
└──────┬──────┘
       │ HTTP/WS
┌──────▼──────┐
│  Hono API   │
│   (Bun)     │
├─────────────┤
│  Drizzle    │
│   ORM       │
└──────┬──────┘
       │
┌──────▼──────┐      ┌──────────┐
│ PostgreSQL  │◄─────┤ pgvector │
│  Database   │      │ extension│
└─────────────┘      └──────────┘

       │
┌──────▼──────┐
│  AI Service │
│ (Anthropic) │
└─────────────┘
```

### Tech Stack Details

#### Frontend
- **Framework**: Remix (with React Router v7)
- **Styling**: Tailwind CSS + CSS variables for theming
- **State Management**: 
  - Remix loaders/actions for server state
  - React Context for client-side UI state
  - Optimistic UI patterns
- **Key Libraries**:
  - `react-force-graph-2d` or `@xyflow/react` - Graph visualization
  - `@monaco-editor/react` or `@tiptap/react` - Rich text editing
  - `cmdk` - Command palette
  - `framer-motion` - Animations
  - `zustand` - Lightweight client state
  - `lucide-react` - Icons

#### Backend
- **Runtime**: Bun (v1.1+)
- **Framework**: Hono (v4+)
- **ORM**: Drizzle ORM
- **Database**: PostgreSQL 15+ with pgvector extension
- **Authentication**: Custom JWT implementation with refresh tokens
- **File Upload**: Bun's native file handling
- **Validation**: Zod schemas

#### AI/ML
- **Provider**: Anthropic Claude API (Claude 4.5 Sonnet)
- **Embeddings**: Voyage AI or OpenAI embeddings
- **Use Cases**:
  - Auto-tagging notes
  - Finding semantically similar notes
  - Generating summaries
  - Extracting key concepts
  - Suggesting connections

#### DevOps
- **Package Manager**: Bun
- **Linting/Formatting**: Biome
- **Testing**: Bun test + Playwright
- **CI/CD**: GitHub Actions
- **Containerization**: Docker + docker-compose
- **Deployment**: Fly.io primary, Render alternative
- **Database Hosting**: Fly.io Postgres or Supabase

---

## Database Schema

### Core Tables

```typescript
// users table
{
  id: uuid (pk)
  email: string (unique)
  password_hash: string
  name: string
  created_at: timestamp
  updated_at: timestamp
  settings: jsonb // theme, preferences, etc.
}

// notes table
{
  id: uuid (pk)
  user_id: uuid (fk -> users)
  title: string
  content: text (markdown)
  content_plain: text (for search)
  embedding: vector(1536) // for semantic search
  created_at: timestamp
  updated_at: timestamp
  is_archived: boolean
  color: string (optional note color)
}

// tags table
{
  id: uuid (pk)
  user_id: uuid (fk -> users)
  name: string
  color: string
  created_at: timestamp
}

// note_tags table (junction)
{
  note_id: uuid (fk -> notes)
  tag_id: uuid (fk -> tags)
  created_at: timestamp
  primary key (note_id, tag_id)
}

// links table (note-to-note relationships)
{
  id: uuid (pk)
  user_id: uuid (fk -> users)
  source_note_id: uuid (fk -> notes)
  target_note_id: uuid (fk -> notes)
  link_type: enum ('manual', 'ai_suggested', 'bidirectional')
  strength: float (0-1, for AI-suggested links)
  created_at: timestamp
}

// ai_suggestions table
{
  id: uuid (pk)
  user_id: uuid (fk -> users)
  note_id: uuid (fk -> notes)
  suggestion_type: enum ('tag', 'link', 'summary')
  suggestion_data: jsonb
  status: enum ('pending', 'accepted', 'rejected')
  created_at: timestamp
}

// sessions table
{
  id: uuid (pk)
  user_id: uuid (fk -> users)
  token_hash: string
  expires_at: timestamp
  created_at: timestamp
}
```

### Indexes

```sql
-- Performance indexes
CREATE INDEX idx_notes_user_id ON notes(user_id);
CREATE INDEX idx_notes_updated_at ON notes(updated_at DESC);
CREATE INDEX idx_links_source ON links(source_note_id);
CREATE INDEX idx_links_target ON links(target_note_id);
CREATE INDEX idx_note_tags_note ON note_tags(note_id);
CREATE INDEX idx_note_tags_tag ON note_tags(tag_id);

-- Full-text search
CREATE INDEX idx_notes_content_search ON notes USING GIN(to_tsvector('english', content_plain));

-- Vector similarity search (pgvector)
CREATE INDEX idx_notes_embedding ON notes USING ivfflat (embedding vector_cosine_ops);
```

---

## API Design

### REST Endpoints

#### Authentication
```
POST   /api/auth/register          - Create account
POST   /api/auth/login             - Login
POST   /api/auth/logout            - Logout
POST   /api/auth/refresh           - Refresh access token
GET    /api/auth/me                - Get current user
```

#### Notes
```
GET    /api/notes                  - List all notes (paginated, filtered)
GET    /api/notes/:id              - Get single note
POST   /api/notes                  - Create note
PATCH  /api/notes/:id              - Update note
DELETE /api/notes/:id              - Delete note (soft delete)
GET    /api/notes/:id/related      - Get related notes (via links & AI)
POST   /api/notes/:id/ai-analyze   - Trigger AI analysis for note
```

#### Links
```
GET    /api/links                  - Get all links for user
POST   /api/links                  - Create link between notes
DELETE /api/links/:id              - Delete link
PATCH  /api/links/:id              - Update link (accept/reject AI suggestion)
```

#### Tags
```
GET    /api/tags                   - List all tags
POST   /api/tags                   - Create tag
PATCH  /api/tags/:id               - Update tag
DELETE /api/tags/:id               - Delete tag
GET    /api/tags/:id/notes         - Get notes with tag
```

#### Search
```
GET    /api/search?q=query         - Full-text search across notes
POST   /api/search/semantic        - Semantic search using embeddings
```

#### Graph
```
GET    /api/graph                  - Get graph data (nodes & edges)
GET    /api/graph/stats            - Get graph statistics
```

#### AI
```
POST   /api/ai/suggest-tags        - Suggest tags for note
POST   /api/ai/suggest-links       - Suggest related notes
POST   /api/ai/summarize           - Generate note summary
GET    /api/ai/suggestions         - Get pending AI suggestions
```

### Request/Response Examples

```typescript
// POST /api/notes
Request:
{
  "title": "Understanding React Server Components",
  "content": "# React Server Components\n\nRSC allows..."
}

Response:
{
  "id": "uuid",
  "title": "Understanding React Server Components",
  "content": "# React Server Components\n\nRSC allows...",
  "created_at": "2026-02-03T10:30:00Z",
  "updated_at": "2026-02-03T10:30:00Z",
  "tags": [],
  "links": []
}

// GET /api/graph
Response:
{
  "nodes": [
    {
      "id": "uuid1",
      "title": "React Server Components",
      "noteCount": 1,
      "tags": ["react", "web"],
      "lastUpdated": "2026-02-03T10:30:00Z"
    }
  ],
  "edges": [
    {
      "source": "uuid1",
      "target": "uuid2",
      "type": "manual",
      "strength": 1.0
    }
  ],
  "stats": {
    "totalNotes": 42,
    "totalLinks": 67,
    "avgConnections": 3.2
  }
}
```

---

## Frontend Architecture

### Route Structure (Remix)

```
app/
├── routes/
│   ├── _auth.tsx                    # Auth layout
│   ├── _auth.login.tsx              # Login page
│   ├── _auth.register.tsx           # Register page
│   ├── _app.tsx                     # Main app layout (with sidebar)
│   ├── _app._index.tsx              # Dashboard/Home
│   ├── _app.notes._index.tsx        # Notes list
│   ├── _app.notes.$noteId.tsx       # Note detail/editor
│   ├── _app.notes.new.tsx           # New note
│   ├── _app.graph.tsx               # Graph visualization
│   ├── _app.search.tsx              # Search page
│   ├── _app.tags._index.tsx         # Tags management
│   ├── _app.tags.$tagId.tsx         # Notes by tag
│   └── _app.settings.tsx            # User settings
├── components/
│   ├── ui/                          # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── CommandPalette.tsx
│   │   └── ...
│   ├── editor/
│   │   ├── NoteEditor.tsx           # Rich markdown editor
│   │   ├── EditorToolbar.tsx
│   │   └── LinkSuggestion.tsx
│   ├── graph/
│   │   ├── GraphCanvas.tsx          # Main graph visualization
│   │   ├── GraphControls.tsx
│   │   ├── NodeDetail.tsx
│   │   └── GraphLegend.tsx
│   ├── notes/
│   │   ├── NoteCard.tsx
│   │   ├── NoteList.tsx
│   │   ├── NoteSidebar.tsx
│   │   └── NoteHeader.tsx
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── CommandMenu.tsx
│   └── ai/
│       ├── AISuggestions.tsx
│       ├── TagSuggester.tsx
│       └── LinkSuggester.tsx
├── lib/
│   ├── api.ts                       # API client
│   ├── auth.ts                      # Auth utilities
│   ├── hooks/                       # Custom React hooks
│   └── utils/                       # Helper functions
└── styles/
    └── tailwind.css
```

### Key Frontend Features

#### 1. Note Editor
- Rich markdown editing with live preview
- Auto-save (debounced)
- Syntax highlighting for code blocks
- Bidirectional linking (wiki-style `[[Note Title]]`)
- Slash commands for quick actions
- Image paste/upload support

#### 2. Graph Visualization
- Force-directed graph layout
- Zoom/pan controls
- Node filtering by tags, date, connections
- Click node → preview note
- Double-click → navigate to note
- Highlight connected nodes on hover
- Color coding by tags or creation date
- Different node sizes based on connection count

#### 3. Command Palette
- Global keyboard shortcut (Cmd/Ctrl + K)
- Quick navigation to notes
- Quick actions (new note, search, etc.)
- Recent notes
- Fuzzy search

#### 4. Search
- Full-text search with highlighting
- Semantic search toggle
- Filter by tags, date range
- Search results with context snippets

#### 5. AI Features UI
- Inline tag suggestions while writing
- Related notes sidebar
- "Generate summary" button
- Accept/reject AI suggestions
- AI processing indicators

---

## User Experience Flows

### 1. First-Time User Onboarding
```
1. Register account → Email verification (optional)
2. Welcome modal with quick tutorial
3. Create first note with guided prompts
4. See AI auto-tag the note
5. Create second note, see AI suggest connection
6. View graph with initial nodes
```

### 2. Daily Usage Flow
```
1. Open app → Command palette (Cmd+K)
2. Type "new note" → Create note
3. Write content → AI suggests tags
4. Accept tags → See related notes sidebar
5. Click related note → Create manual link
6. View graph → See new connections
```

### 3. Research/Discovery Flow
```
1. Search for topic
2. Open note from results
3. View "Related Notes" → AI-suggested connections
4. Navigate through linked notes
5. Add to graph view to visualize cluster
6. Create new note connecting concepts
```

---

## AI Features Deep Dive

### 1. Auto-Tagging
**Trigger**: On note save (debounced)  
**Process**:
1. Send note content to Claude API
2. Extract 3-5 relevant tags
3. Match against existing user tags
4. Suggest new tags or existing ones
5. User can accept/reject/modify

**Prompt Template**:
```
Analyze this note and suggest 3-5 relevant tags.
Return only tag names, comma-separated.

Note Title: {title}
Note Content: {content}

Existing tags: {userTags}

Tags:
```

### 2. Semantic Similarity
**Trigger**: On note view, manual refresh  
**Process**:
1. Get note's embedding vector
2. Query pgvector for similar notes (cosine similarity > 0.7)
3. Rank by similarity score
4. Display top 5 related notes

**Implementation**:
```sql
SELECT id, title, 1 - (embedding <=> $1) as similarity
FROM notes
WHERE user_id = $2
  AND id != $3
  AND 1 - (embedding <=> $1) > 0.7
ORDER BY similarity DESC
LIMIT 5;
```

### 3. Note Summarization
**Trigger**: Manual button click  
**Process**:
1. Send note content to Claude
2. Generate concise 2-3 sentence summary
3. Display in note metadata
4. Store in database for quick access

### 4. Connection Discovery
**Trigger**: Weekly batch job or manual  
**Process**:
1. For each note, get embedding
2. Find top 10 similar notes
3. Use Claude to verify conceptual connection
4. Suggest as potential links with confidence score
5. User reviews and accepts/rejects

---

## Visual Design System

### Design Philosophy
**Aesthetic Direction**: **Refined Editorial Minimalism**

- Clean, magazine-like layouts with generous whitespace
- Typography-first design with distinctive font choices
- Subtle, purposeful animations
- Muted, sophisticated color palette
- Focus on content, not chrome

### Typography
- **Display**: `'Fraunces'` (variable font) - for headings
- **Body**: `'Inter Variable'` - for UI and reading
- **Mono**: `'JetBrains Mono'` - for code

### Color Palette

**Light Theme**:
```css
--background: 0 0% 98%;        /* Warm off-white */
--foreground: 220 15% 20%;     /* Dark slate */
--primary: 260 60% 55%;        /* Refined purple */
--secondary: 200 15% 85%;      /* Cool gray */
--accent: 35 100% 50%;         /* Warm amber */
--muted: 220 10% 95%;          /* Light gray */
--border: 220 15% 88%;         /* Subtle borders */
```

**Dark Theme**:
```css
--background: 220 20% 10%;     /* Deep charcoal */
--foreground: 220 10% 90%;     /* Warm white */
--primary: 260 70% 65%;        /* Brighter purple */
--secondary: 220 15% 25%;      /* Dark slate */
--accent: 35 95% 55%;          /* Warm gold */
--muted: 220 15% 18%;          /* Dark gray */
--border: 220 15% 22%;         /* Subtle borders */
```

### Spacing Scale
```css
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;   /* 8px */
--space-3: 0.75rem;  /* 12px */
--space-4: 1rem;     /* 16px */
--space-6: 1.5rem;   /* 24px */
--space-8: 2rem;     /* 32px */
--space-12: 3rem;    /* 48px */
--space-16: 4rem;    /* 64px */
```

### Animation Principles
- **Duration**: 150ms for micro-interactions, 300ms for transitions
- **Easing**: Custom cubic-bezier(0.4, 0, 0.2, 1)
- **Stagger**: 50ms delay between list items
- **Hover states**: Subtle scale (1.02) or opacity (0.8) changes

### Component Patterns

**Card Component**:
- Subtle border instead of heavy shadows
- Hover state: gentle lift + border color change
- Click state: subtle scale down

**Graph Nodes**:
- Circular shapes with soft gradients
- Size based on connection count (12px - 48px)
- Color from tag or creation date
- Glow effect on hover
- Label appears on zoom > 1.5x

**Editor**:
- Full-bleed writing area
- Floating toolbar on text selection
- Distraction-free mode (hide sidebar)
- Word count in footer

---

## Performance Optimization

### Frontend Performance
1. **Code Splitting**: Route-based automatic splitting via Remix
2. **Image Optimization**: WebP format, lazy loading
3. **Graph Rendering**: Canvas-based rendering, virtualization for 1000+ nodes
4. **Debouncing**: Search (300ms), auto-save (1000ms)
5. **Optimistic UI**: Immediate feedback on actions
6. **Caching**: React Query for server state

### Backend Performance
1. **Database Indexing**: All foreign keys, search fields
2. **Query Optimization**: 
   - Eager loading for note + tags + links
   - Pagination with cursor-based approach
   - Limit embedding queries to user's notes only
3. **Connection Pooling**: Drizzle connection pool (max 20)
4. **Rate Limiting**: 100 requests/min per user
5. **Caching**: Redis for session tokens, frequently accessed notes

### AI Performance
1. **Batch Processing**: Group multiple notes for embedding generation
2. **Caching**: Cache embeddings, don't regenerate unless content changes
3. **Async Jobs**: Background workers for non-critical AI tasks
4. **Cost Optimization**: 
   - Only generate embeddings for notes > 100 chars
   - Limit AI suggestions to 5 per note
   - Cache AI responses for 24 hours

---

## Security Considerations

### Authentication & Authorization
- Bcrypt password hashing (12 rounds)
- JWT access tokens (15min expiry)
- Refresh tokens (7 days, stored hashed)
- CSRF protection on state-changing operations
- Rate limiting on auth endpoints

### Data Security
- All user data scoped by user_id
- Row-level security checks in all queries
- SQL injection protection via Drizzle parameterized queries
- XSS protection: Content sanitization on render
- File upload validation: Type, size limits

### API Security
- CORS configuration for production domain only
- API key validation for AI services
- Input validation with Zod schemas
- Helmet.js security headers
- HTTPS only in production

---

## Testing Strategy

### Unit Tests
- Utility functions
- API route handlers
- Database queries (with test database)
- AI prompt generation

### Integration Tests
- API endpoints (supertest-style)
- Authentication flow
- Note CRUD operations
- Graph data generation

### E2E Tests (Playwright)
- User registration and login
- Create and edit notes
- Create links between notes
- View and interact with graph
- Search functionality
- AI suggestion acceptance

### Performance Tests
- Load testing with k6
- Graph rendering with 1000+ nodes
- Database query performance
- AI API response times

---

## Deployment Architecture

### Docker Setup

```dockerfile
# Dockerfile
FROM oven/bun:1 as base
WORKDIR /app

# Install dependencies
FROM base as install
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

# Build frontend
FROM base as build
COPY --from=install /app/node_modules ./node_modules
COPY . .
RUN bun run build

# Production
FROM base as release
COPY --from=install /app/node_modules ./node_modules
COPY --from=build /app/build ./build
COPY --from=build /app/public ./public
COPY . .

EXPOSE 3000
CMD ["bun", "run", "start"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://postgres:postgres@db:5432/mindgraph
      NODE_ENV: production
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: pgvector/pgvector:pg15
    environment:
      POSTGRES_DB: mindgraph
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped

volumes:
  postgres_data:
```

### Fly.io Configuration

```toml
# fly.toml
app = "mindgraph"
primary_region = "sjc"

[build]
  dockerfile = "Dockerfile"

[env]
  PORT = "3000"
  NODE_ENV = "production"

[http_service]
  internal_port = 3000
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 1

[[vm]]
  memory = '1gb'
  cpu_kind = 'shared'
  cpus = 1
```

### GitHub Actions CI/CD

```yaml
# .github/workflows/deploy.yml
name: Deploy to Fly.io

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run lint
      - run: bun test
      - run: bun run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: superfly/flyctl-actions/setup-flyctl@master
      - run: flyctl deploy --remote-only
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
```

---

## Environment Variables

```bash
# .env.example

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/mindgraph

# Auth
JWT_SECRET=your-super-secret-key-change-this
JWT_REFRESH_SECRET=your-refresh-secret-key

# AI Services
ANTHROPIC_API_KEY=sk-ant-xxxxx
VOYAGE_API_KEY=pa-xxxxx  # For embeddings

# App Config
NODE_ENV=development
PORT=3000
BASE_URL=http://localhost:3000

# Feature Flags
ENABLE_AI_FEATURES=true
ENABLE_EMBEDDINGS=true

# Rate Limiting
RATE_LIMIT_WINDOW=60000
RATE_LIMIT_MAX=100
```

---

## Development Workflow

### Initial Setup
```bash
# Clone repo
git clone <repo-url>
cd mindgraph

# Install dependencies
bun install

# Setup database
docker-compose up -d db
bun run db:push

# Start dev server
bun run dev
```

### Available Scripts
```json
{
  "scripts": {
    "dev": "remix vite:dev",
    "build": "remix vite:build",
    "start": "remix-serve ./build/server/index.js",
    "typecheck": "tsc",
    "lint": "biome check .",
    "format": "biome format --write .",
    "db:generate": "drizzle-kit generate",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio",
    "db:seed": "bun run scripts/seed.ts",
    "test": "bun test",
    "test:e2e": "playwright test"
  }
}
```

### Git Workflow
```
main (production)
  ├─ develop (staging)
      ├─ feature/note-editor
      ├─ feature/graph-viz
      └─ feature/ai-suggestions
```

---

## Success Metrics (for showcasing)

### Technical Metrics
- ✅ TypeScript strict mode, 100% type coverage
- ✅ Biome linting with 0 errors
- ✅ 80%+ test coverage
- ✅ Lighthouse score > 90
- ✅ First Contentful Paint < 1.5s
- ✅ Time to Interactive < 3s

### Feature Completeness
- ✅ Full auth system with refresh tokens
- ✅ Complete CRUD for notes, tags, links
- ✅ Working graph visualization
- ✅ Full-text and semantic search
- ✅ At least 2 AI features (tagging + similarity)
- ✅ Mobile-responsive design
- ✅ Dark mode support

### Documentation
- ✅ Comprehensive README with screenshots
- ✅ API documentation
- ✅ Setup instructions
- ✅ Architecture diagrams
- ✅ Demo video/GIF

---

## Future Enhancements (Post-MVP)

### Phase 2 Features
- [ ] Collaborative notes (share with other users)
- [ ] Export to markdown/PDF
- [ ] Import from Notion, Obsidian
- [ ] Mobile apps (React Native)
- [ ] Browser extension for web clipping
- [ ] Daily notes / journal mode
- [ ] Spaced repetition for learning

### Advanced AI Features
- [ ] Chat with your notes (RAG-powered)
- [ ] Automatic knowledge consolidation
- [ ] Smart reminders based on note content
- [ ] Concept extraction and ontology building
- [ ] Multi-language support

---

## Timeline Estimate

### Week 1: Foundation
- Project setup (Remix, Hono, Drizzle)
- Database schema & migrations
- Authentication system
- Basic CRUD for notes

### Week 2: Core Features
- Note editor with markdown support
- Tags system
- Manual linking between notes
- Search functionality

### Week 3: Visualization
- Graph data generation
- Graph visualization component
- Node interactions
- Graph filters and controls

### Week 4: AI Integration
- Embeddings generation
- Semantic search
- Auto-tagging
- Related notes suggestions

### Week 5: Polish & Testing
- UI refinements and animations
- Mobile responsiveness
- E2E tests
- Performance optimization

### Week 6: Deployment & Documentation
- Docker setup
- CI/CD pipeline
- README and documentation
- Demo video
- Deploy to production

**Total: 6 weeks part-time or 3 weeks full-time**

---

## Differentiators for Job Applications

### What Makes This Project Stand Out

1. **Modern Stack Mastery**
   - Cutting-edge tools (Bun, Remix, Drizzle)
   - Not just following tutorials
   - Production-ready patterns

2. **AI Integration**
   - Real ML features, not just API calls
   - Vector embeddings, semantic search
   - Practical AI application

3. **Frontend Excellence**
   - Custom graph visualization
   - Rich text editing
   - Thoughtful UX with animations
   - Beautiful, distinctive design

4. **System Design Skills**
   - Database optimization (indexes, pgvector)
   - Performance considerations
   - Security best practices
   - Scalable architecture

5. **Professional DevOps**
   - Docker containerization
   - CI/CD pipeline
   - Production deployment
   - Monitoring and logging

### Talking Points for Interviews

- "I chose pgvector because..." (explain semantic search)
- "The graph visualization was challenging because..." (performance with large datasets)
- "I optimized the editor by..." (debouncing, optimistic UI)
- "The AI feature I'm most proud of is..." (connection discovery algorithm)
- "I learned [X] while building this..." (specific technical insight)

---

## References & Resources

### Documentation
- [Remix Docs](https://remix.run/docs)
- [Hono Documentation](https://hono.dev)
- [Drizzle ORM](https://orm.drizzle.team)
- [pgvector](https://github.com/pgvector/pgvector)
- [Anthropic API](https://docs.anthropic.com)

### Inspiration
- Obsidian - Local-first knowledge management
- Notion - Beautiful UI and UX
- Roam Research - Bidirectional linking
- Mem.ai - AI-powered notes

### Design References
- Linear - Clean, fast UI
- Height - Beautiful task management
- Arc Browser - Thoughtful interactions

---

## License
MIT

---

**End of Specification**

This specification provides a complete blueprint for building MindGraph. Follow it section by section, and you'll have a portfolio project that demonstrates real engineering skill and modern best practices.

Good luck with your job hunt! 🚀
