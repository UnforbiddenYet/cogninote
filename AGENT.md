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