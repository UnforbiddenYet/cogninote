'use client'

import { FileText, Link2, Clock, Tag, Network } from 'lucide-react'
import { mockNotes } from '../lib/mock-data'
import { useState } from 'react'

// Mock data for LightRAG-detected communities (clusters)
const communities = [
  {
    id: 'all',
    name: 'All Notes',
    noteCount: 9,
    color: 'hsl(220, 70%, 56%)',
  },
  {
    id: 'ai-ml-cluster',
    name: 'AI & ML',
    noteCount: 3,
    color: 'hsl(220, 90%, 56%)',
    description: 'Auto-detected cluster',
  },
  {
    id: 'pkm-cluster',
    name: 'Knowledge Management',
    noteCount: 4,
    color: 'hsl(142, 71%, 45%)',
    description: 'Auto-detected cluster',
  },
  {
    id: 'productivity-cluster',
    name: 'Productivity',
    noteCount: 2,
    color: 'hsl(280, 65%, 60%)',
    description: 'Auto-detected cluster',
  },
]

// Mock entity extraction per note (what LightRAG provides)
const noteEntities: Record<string, string[]> = {
  '1': ['AI', 'Machine Learning', 'Fundamentals'],
  '2': ['Knowledge Graphs', 'Ontology', 'Relationships'],
  '3': ['PKM', 'Second Brain', 'Zettelkasten'],
  '4': ['Note-taking', 'Learning', 'Retention'],
  '5': ['Bidirectional Links', 'PKM', 'Connections'],
  '6': ['Machine Learning', 'Algorithms', 'Neural Networks'],
  '7': ['Neural Networks', 'Deep Learning', 'AI'],
  '8': ['Time Management', 'Productivity', 'Planning'],
  '9': ['Deep Work', 'Focus', 'Productivity'],
}

export function NotesLibrary() {
  const [selectedCluster, setSelectedCluster] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'recent' | 'connections'>('connections')

  const filteredNotes =
    selectedCluster === 'all'
      ? mockNotes
      : mockNotes.filter((note) => {
        // Simulate cluster membership based on folderId
        if (selectedCluster === 'ai-ml-cluster') return note.folderId === 'ai-ml'
        if (selectedCluster === 'pkm-cluster') return note.folderId === 'pkm'
        if (selectedCluster === 'productivity-cluster') return note.folderId === 'productivity'
        return true
      })

  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (sortBy === 'connections') {
      return (b.connections || 0) - (a.connections || 0)
    }
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-6xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Knowledge Base</h1>
            <p className="text-xs text-muted-foreground mt-1">
              {mockNotes.length} notes organized by AI into {communities.length - 1} clusters
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSortBy('connections')}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${sortBy === 'connections'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card/50 text-muted-foreground hover:text-foreground'
                }`}
            >
              By Connections
            </button>
            <button
              onClick={() => setSortBy('recent')}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${sortBy === 'recent'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card/50 text-muted-foreground hover:text-foreground'
                }`}
            >
              Recent
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
          {/* Sidebar - Clusters */}
          <div className="lg:col-span-1">
            <div className="p-4 rounded-2xl border border-border/50 bg-card/95 backdrop-blur-xl shadow-lg">
              <div className="flex items-center gap-2 mb-3">
                <Network className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground">Communities</h2>
              </div>
              <div className="space-y-1.5">
                {communities.map((cluster) => (
                  <button
                    key={cluster.id}
                    onClick={() => setSelectedCluster(cluster.id)}
                    className={`w-full p-2.5 rounded-lg text-left transition-all ${selectedCluster === cluster.id
                        ? 'bg-primary/10 border border-primary/20'
                        : 'hover:bg-card/50'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: cluster.color }}
                        />
                        <span className="text-xs font-medium text-foreground">{cluster.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{cluster.noteCount}</span>
                    </div>
                    {cluster.description && (
                      <p className="text-xs text-muted-foreground mt-1 ml-4">
                        {cluster.description}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main - Notes List */}
          <div className="lg:col-span-3">
            <div className="p-5 rounded-2xl border border-border/50 bg-card/95 backdrop-blur-xl shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-foreground">
                  {communities.find((c) => c.id === selectedCluster)?.name || 'Notes'}
                </h2>
                <span className="text-xs text-muted-foreground">
                  {sortedNotes.length} {sortedNotes.length === 1 ? 'note' : 'notes'}
                </span>
              </div>

              {sortedNotes.length > 0 ? (
                <div className="space-y-2.5 max-h-[600px] overflow-y-auto">
                  {sortedNotes.map((note) => (
                    <div
                      key={note.id}
                      className="p-4 rounded-lg border border-border/50 bg-card/30 hover:bg-card/60 hover:border-border transition-all cursor-pointer group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-1.5 rounded-lg bg-primary/10 group-hover:bg-primary/15 transition-colors flex-shrink-0 mt-0.5">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                            {note.title}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-1 mb-2 line-clamp-1">
                            {note.preview}
                          </p>

                          {/* Entity Tags */}
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {noteEntities[note.id]?.slice(0, 3).map((entity, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/5 text-xs text-primary border border-primary/10"
                              >
                                <Tag className="h-2.5 w-2.5" />
                                {entity}
                              </span>
                            ))}
                          </div>

                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Link2 className="h-3 w-3 opacity-60" />
                              <span className="font-medium">{note.connections || 0}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 opacity-60" />
                              <span>{formatDate(note.updatedAt)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="p-3 rounded-full bg-primary/5 mb-2">
                    <FileText className="h-6 w-6 text-primary/60" />
                  </div>
                  <p className="text-xs text-muted-foreground">No notes in this cluster</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
