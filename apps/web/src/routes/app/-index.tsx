import { createFileRoute, Link, useRouteContext } from "@tanstack/react-router";
// import { FileText, Network, Search, Plus, ArrowRight } from "lucide-react";

import { Sparkles, TrendingUp, Link2, Clock, Zap } from 'lucide-react'
import { mockNotes } from '../../lib/mock-data'

export const Route = createFileRoute("/app/")({
  component: Dashboard,
});

function Dashboard() {
  // Mock data for AI insights
  const recentNotes = mockNotes.slice(0, 4)
  const suggestedConnections = [
    { from: 'Getting Started with AI', to: 'Machine Learning Basics', reason: 'Both discuss foundational ML concepts' },
    { from: 'Knowledge Graphs Explained', to: 'Linking Your Thoughts', reason: 'Complementary approaches to connecting ideas' },
    { from: 'Second Brain Methodology', to: 'Note-taking Best Practices', reason: 'Related PKM strategies' },
  ]

  const insights = [
    { label: 'Most Connected', value: 'Second Brain Methodology', connections: 15 },
    { label: 'Knowledge Gap', value: 'Productivity workflows', hint: 'Consider expanding this area' },
    { label: 'Active Cluster', value: 'AI & ML', noteCount: 3 },
  ]

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Welcome Back</h1>
          <p className="text-sm text-muted-foreground">Here's what's happening in your knowledge base</p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Recent Activity + AI Connections */}
          <div className="lg:col-span-2 space-y-6">
            {/* Weekly Summary Card */}
            <div className="p-6 rounded-2xl border border-border/50 bg-card/95 backdrop-blur-xl shadow-lg">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">This Week</h2>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-2xl font-bold text-foreground">3</div>
                  <div className="text-xs text-muted-foreground">Notes Created</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">12</div>
                  <div className="text-xs text-muted-foreground">Connections Made</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">8</div>
                  <div className="text-xs text-muted-foreground">AI Searches</div>
                </div>
              </div>
            </div>

            {/* AI Suggested Connections */}
            <div className="p-6 rounded-2xl border border-border/50 bg-card/95 backdrop-blur-xl shadow-lg">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">AI Suggested Connections</h2>
              </div>
              <div className="space-y-3">
                {suggestedConnections.map((connection, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-lg border border-border/50 bg-card/30 hover:bg-card/60 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start gap-2 mb-1.5">
                      <Link2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="text-xs font-medium text-foreground">
                          {connection.from} → {connection.to}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground pl-6">
                      {connection.reason}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="p-6 rounded-2xl border border-border/50 bg-card/95 backdrop-blur-xl shadow-lg">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Clock className="h-4 w-4 text-blue-500" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">Recent Notes</h2>
              </div>
              <div className="space-y-2">
                {recentNotes.map((note) => (
                  <div
                    key={note.id}
                    className="p-3 rounded-lg border border-border/50 bg-card/30 hover:bg-card/60 transition-colors cursor-pointer"
                  >
                    <div className="text-sm font-medium text-foreground mb-0.5">{note.title}</div>
                    <div className="text-xs text-muted-foreground line-clamp-1">{note.preview}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Insights */}
          <div className="space-y-6">
            {/* Knowledge Insights */}
            <div className="p-6 rounded-2xl border border-border/50 bg-card/95 backdrop-blur-xl shadow-lg">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <Zap className="h-4 w-4 text-orange-500" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">Insights</h2>
              </div>
              <div className="space-y-4">
                {insights.map((insight, index) => (
                  <div key={index}>
                    <div className="text-xs font-medium text-muted-foreground mb-1">
                      {insight.label}
                    </div>
                    <div className="text-sm font-semibold text-foreground mb-1">
                      {insight.value}
                    </div>
                    {insight.connections && (
                      <div className="text-xs text-muted-foreground">
                        {insight.connections} connections
                      </div>
                    )}
                    {insight.hint && (
                      <div className="text-xs text-muted-foreground italic">
                        {insight.hint}
                      </div>
                    )}
                    {insight.noteCount && (
                      <div className="text-xs text-muted-foreground">
                        {insight.noteCount} notes
                      </div>
                    )}
                    {index < insights.length - 1 && (
                      <div className="h-px bg-border/50 mt-3" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="p-6 rounded-2xl border border-border/50 bg-card/95 backdrop-blur-xl shadow-lg">
              <h2 className="text-lg font-semibold text-foreground mb-4">Knowledge Base</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Notes</span>
                  <span className="text-sm font-semibold text-foreground">{mockNotes.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Collections</span>
                  <span className="text-sm font-semibold text-foreground">3</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Connections</span>
                  <span className="text-sm font-semibold text-foreground">56</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// function Dashboard() {
//   // Get session from parent route context (set by requireAuth)
//   const { session } = useRouteContext({ from: "/app" });

//   // Handle case where session might not be available
//   if (!session?.user) {
//     return (
//       <div className="flex items-center justify-center h-96">
//         <div className="text-center">
//           <div className="animate-pulse">
//             <p className="text-muted text-sm">Loading...</p>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   const user = session.user;

//   return (
//     <div className="space-y-8">
//       {/* Welcome Section */}
//       <div>
//         <h1 className="text-4xl font-bold text-foreground mb-2">
//           Welcome back, {user?.name}
//         </h1>
//         <p className="text-base text-muted">
//           Build your personal knowledge graph by connecting ideas and insights.
//         </p>
//       </div>

//       {/* Quick Actions */}
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//         {/* Create Note Card */}
//         <Link
//           to="/app/notes/new"
//           className="group relative overflow-hidden rounded-xl border border-border bg-background/50 p-6 hover:border-primary/50 hover:bg-primary/5 transition-all duration-200"
//         >
//           <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
//           <div className="relative space-y-4">
//             <div className="flex items-center justify-between">
//               <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
//                 <FileText className="w-6 h-6 text-primary" />
//               </div>
//               <ArrowRight className="w-5 h-5 text-muted group-hover:text-primary transition-colors" />
//             </div>
//             <div>
//               <h3 className="text-lg font-semibold text-foreground">Create Note</h3>
//               <p className="text-sm text-muted mt-1">Start documenting your ideas</p>
//             </div>
//           </div>
//         </Link>

//         {/* Graph Card */}
//         <Link
//           to="/app/graph"
//           className="group relative overflow-hidden rounded-xl border border-border bg-background/50 p-6 hover:border-primary/50 hover:bg-primary/5 transition-all duration-200"
//         >
//           <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
//           <div className="relative space-y-4">
//             <div className="flex items-center justify-between">
//               <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
//                 <Network className="w-6 h-6 text-primary" />
//               </div>
//               <ArrowRight className="w-5 h-5 text-muted group-hover:text-primary transition-colors" />
//             </div>
//             <div>
//               <h3 className="text-lg font-semibold text-foreground">Explore Graph</h3>
//               <p className="text-sm text-muted mt-1">Visualize your knowledge network</p>
//             </div>
//           </div>
//         </Link>

//         {/* Search Card */}
//         <Link
//           to="/app/search"
//           className="group relative overflow-hidden rounded-xl border border-border bg-background/50 p-6 hover:border-primary/50 hover:bg-primary/5 transition-all duration-200"
//         >
//           <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
//           <div className="relative space-y-4">
//             <div className="flex items-center justify-between">
//               <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
//                 <Search className="w-6 h-6 text-primary" />
//               </div>
//               <ArrowRight className="w-5 h-5 text-muted group-hover:text-primary transition-colors" />
//             </div>
//             <div>
//               <h3 className="text-lg font-semibold text-foreground">Search</h3>
//               <p className="text-sm text-muted mt-1">Find notes and connections</p>
//             </div>
//           </div>
//         </Link>
//       </div>

//       {/* Info Section */}
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//         {/* Account Info */}
//         <div className="rounded-xl border border-border bg-background/50 p-6">
//           <h3 className="text-sm font-semibold text-muted uppercase tracking-wide mb-4">Account</h3>
//           <div className="space-y-3">
//             <div>
//               <p className="text-xs text-muted uppercase tracking-wide">Email</p>
//               <p className="text-foreground font-mono text-sm">{user?.email}</p>
//             </div>
//             <div>
//               <p className="text-xs text-muted uppercase tracking-wide">User ID</p>
//               <p className="text-foreground font-mono text-xs break-all">{user?.id}</p>
//             </div>
//           </div>
//         </div>

//         {/* Getting Started */}
//         <div className="rounded-xl border border-border bg-background/50 p-6">
//           <h3 className="text-sm font-semibold text-muted uppercase tracking-wide mb-4">Getting Started</h3>
//           <ul className="space-y-2 text-sm text-foreground">
//             <li className="flex items-center gap-2">
//               <span className="text-primary">→</span> Create your first note
//             </li>
//             <li className="flex items-center gap-2">
//               <span className="text-primary">→</span> Link related ideas together
//             </li>
//             <li className="flex items-center gap-2">
//               <span className="text-primary">→</span> Explore your knowledge graph
//             </li>
//           </ul>
//         </div>
//       </div>
//     </div>
//   );
// }
