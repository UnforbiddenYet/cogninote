import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, TrendingUp, Clock, Zap, Loader2, AlertCircle } from "lucide-react";
import { useDashboard } from "../hooks/useDashboard";
import { SuggestionCard } from "../components/suggestions/SuggestionCard";
import { features } from "../lib/features";
import { NoteCard } from "../components/notes/NoteCard";

type TimeRangeQuery = Parameters<typeof useDashboard>[0]["timeRange"];

export function Dashboard() {
  const [timeRange, setTimeRange] = useState<TimeRangeQuery>("7d");
  const { data, isLoading, error } = useDashboard({ timeRange });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-6xl flex items-center justify-center h-96">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-6xl flex items-center justify-center h-96">
        <div className="text-center space-y-2">
          <AlertCircle className="h-6 w-6 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">Failed to load dashboard</p>
        </div>
      </div>
    );
  }

  const { stats, recentNotes, topEntities, suggestedConnections, mostConnectedNotes } = data;

  const timeRangeLabel =
    timeRange === "1d" ? "Today" : timeRange === "7d" ? "This Week" : "This Month";

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Welcome Back</h1>
            <p className="text-sm text-muted-foreground">
              Here's what's happening in your knowledge base
            </p>
          </div>
          <div className="flex gap-1 rounded-lg border border-border/50 p-1 bg-card/50">
            {(["1d", "7d", "30d"] as const).map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${
                  timeRange === range
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {range === "1d" ? "1D" : range === "7d" ? "7D" : "30D"}
              </button>
            ))}
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Period Summary Card */}
            <div className="p-6 rounded-2xl border border-border/50 bg-card/95 backdrop-blur-xl shadow-lg">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">{timeRangeLabel}</h2>
              </div>
              <div className={`grid ${features.connections ? "grid-cols-3" : "grid-cols-2"} gap-4`}>
                <div>
                  <div className="text-2xl font-bold text-foreground">
                    {stats.notesCreatedInPeriod}
                  </div>
                  <div className="text-xs text-muted-foreground">Notes Created</div>
                </div>
                {features.connections && (
                  <div>
                    <div className="text-2xl font-bold text-foreground">
                      {stats.connectionsCreatedInPeriod}
                    </div>
                    <div className="text-xs text-muted-foreground">Connections Made</div>
                  </div>
                )}
              </div>
            </div>

            {/* AI Suggested Connections */}
            {features.connections && suggestedConnections.length > 0 && (
              <div className="p-6 rounded-2xl border border-border/50 bg-card/95 backdrop-blur-xl shadow-lg">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <Sparkles className="h-4 w-4 text-purple-500" />
                  </div>
                  <h2 className="text-lg font-semibold text-foreground">
                    AI Suggested Connections
                  </h2>
                </div>
                <div className="space-y-3">
                  {suggestedConnections.map((suggestion) => (
                    <SuggestionCard key={suggestion.id} suggestion={suggestion} />
                  ))}
                </div>
              </div>
            )}

            {/* Recent Notes */}
            <div className="p-6 rounded-2xl border border-border/50 bg-card/95 backdrop-blur-xl shadow-lg">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Clock className="h-4 w-4 text-blue-500" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">Recent Notes</h2>
              </div>
              <div className="space-y-2">
                {recentNotes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No notes yet. Create your first note to get started.
                  </p>
                ) : (
                  recentNotes.map((note) => <NoteCard key={note.id} note={note} />)
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Insights */}
          <div className="space-y-6">
            {/* Top Entities */}
            {topEntities.length > 0 && (
              <div className="p-6 rounded-2xl border border-border/50 bg-card/95 backdrop-blur-xl shadow-lg">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 rounded-lg bg-orange-500/10">
                    <Zap className="h-4 w-4 text-orange-500" />
                  </div>
                  <h2 className="text-lg font-semibold text-foreground">Key Topics</h2>
                </div>
                <div className="space-y-3">
                  {topEntities.map((entity, index) => (
                    <div key={entity.label}>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-foreground">{entity.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {entity.count} mentions
                        </span>
                      </div>
                      {index < topEntities.length - 1 && <div className="h-px bg-border/50 mt-3" />}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Most Connected Notes */}
            {features.connections && mostConnectedNotes.length > 0 && (
              <div className="p-6 rounded-2xl border border-border/50 bg-card/95 backdrop-blur-xl shadow-lg">
                <h2 className="text-sm font-medium text-muted-foreground mb-3">Most Connected</h2>
                <div className="space-y-3">
                  {mostConnectedNotes.map((note, index) => (
                    <div key={note.id}>
                      <Link
                        to="/app/notes/$noteId"
                        params={{ noteId: note.id }}
                        className="text-sm font-semibold text-foreground hover:text-primary transition-colors"
                      >
                        {note.title}
                      </Link>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {note.connectionCount} connections
                      </div>
                      {index < mostConnectedNotes.length - 1 && (
                        <div className="h-px bg-border/50 mt-3" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Knowledge Base Stats */}
            <div className="p-6 rounded-2xl border border-border/50 bg-card/95 backdrop-blur-xl shadow-lg">
              <h2 className="text-lg font-semibold text-foreground mb-4">Knowledge Base</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Notes</span>
                  <span className="text-sm font-semibold text-foreground">{stats.totalNotes}</span>
                </div>
                {features.connections && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Connections</span>
                    <span className="text-sm font-semibold text-foreground">
                      {stats.totalConnections}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
