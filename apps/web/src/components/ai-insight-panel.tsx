'use client'

import { Sparkles, Network, Tag, TrendingUp } from 'lucide-react'
import { useIslandStore } from '../lib/store'
import { BacklinkCard } from './backlink-card'
import { useEffect } from 'react'
import { searchNotes } from '../lib/mock-data'

export function AIInsightPanel() {
  const { query, searchResults, setSearchResults } = useIslandStore()

  // Mock extracted entities and query mode based on LightRAG capabilities
  const extractedEntities = query ? ['AI', 'knowledge management', 'note-taking'] : []
  const queryMode = 'hybrid' // Could be: local, global, hybrid, mix

  useEffect(() => {
    if (query) {
      // Simulate AI search with a slight delay
      const timer = setTimeout(() => {
        const results = searchNotes(query)
        setSearchResults(results)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [query, setSearchResults])

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {query && (
        <>
          {/* Query Analysis Header */}
          <div className="flex items-center gap-3 px-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Mode:</span>
              <span className="px-2 py-1 rounded-md bg-primary/10 text-xs font-semibold text-primary">
                {queryMode}
              </span>
            </div>
            {extractedEntities.length > 0 && (
              <div className="flex items-center gap-2">
                <Tag className="h-3 w-3 text-muted-foreground" />
                <div className="flex gap-1.5">
                  {extractedEntities.slice(0, 3).map((entity, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 rounded-md bg-card/50 text-xs text-foreground border border-border/50"
                    >
                      {entity}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Main Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Left Column - AI Answer */}
            <div className="lg:col-span-2 space-y-5">
              {/* AI Synthesized Answer */}
              <div className="p-6 rounded-2xl border border-border/50 bg-card/95 backdrop-blur-xl shadow-lg">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                  <h2 className="text-base font-semibold text-foreground">Answer</h2>
                </div>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="text-sm text-foreground/90 leading-relaxed">
                    Based on your knowledge graph, here's what I found about "{query}".
                    This answer synthesizes information from {searchResults.length} connected notes,
                    combining both entity-specific details and broader thematic insights to give you
                    a comprehensive understanding.
                  </p>
                </div>
              </div>

              {/* Source Documents */}
              <div className="p-6 rounded-2xl border border-border/50 bg-card/95 backdrop-blur-xl shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-foreground">
                    Source Documents ({searchResults.length})
                  </h3>
                  <span className="text-xs text-muted-foreground">Ranked by relevance</span>
                </div>
                {searchResults.length > 0 ? (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {searchResults.map((note, index) => (
                      <BacklinkCard key={note.id} note={note} index={index} />
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                    <Sparkles className="h-4 w-4 mr-2 animate-pulse" />
                    Searching your knowledge base...
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Graph Insights */}
            <div className="space-y-5">
              {/* Entity Relationships */}
              <div className="p-5 rounded-2xl border border-border/50 bg-card/95 backdrop-blur-xl shadow-lg">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <Network className="h-4 w-4 text-purple-500" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">Key Entities</h3>
                </div>
                <div className="space-y-2">
                  <div className="p-3 rounded-lg bg-card/50 border border-border/50">
                    <div className="text-xs font-semibold text-foreground mb-1">Machine Learning</div>
                    <div className="text-xs text-muted-foreground">Connected to 3 notes</div>
                  </div>
                  <div className="p-3 rounded-lg bg-card/50 border border-border/50">
                    <div className="text-xs font-semibold text-foreground mb-1">Knowledge Graphs</div>
                    <div className="text-xs text-muted-foreground">Connected to 2 notes</div>
                  </div>
                  <div className="p-3 rounded-lg bg-card/50 border border-border/50">
                    <div className="text-xs font-semibold text-foreground mb-1">PKM Systems</div>
                    <div className="text-xs text-muted-foreground">Connected to 4 notes</div>
                  </div>
                </div>
              </div>

              {/* Relationship Paths */}
              <div className="p-5 rounded-2xl border border-border/50 bg-card/95 backdrop-blur-xl shadow-lg">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 rounded-lg bg-orange-500/10">
                    <TrendingUp className="h-4 w-4 text-orange-500" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">Paths</h3>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="p-2 rounded-lg bg-card/30">
                    <div className="text-foreground/80">
                      AI → <span className="text-primary">enables</span> → Knowledge Graphs
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-card/30">
                    <div className="text-foreground/80">
                      Note-taking → <span className="text-primary">improves</span> → Learning
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {!query && (
        <div className="p-12 rounded-2xl border border-border/50 bg-card/95 backdrop-blur-xl shadow-lg">
          <div className="text-center">
            <div className="inline-flex p-4 rounded-full bg-primary/10 mb-4">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Ask Your Second Brain
            </h3>
            <p className="text-sm text-muted-foreground">
              Use the AI search above to query your knowledge base
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
