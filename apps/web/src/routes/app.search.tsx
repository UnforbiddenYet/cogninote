import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { NoteList } from "../components/notes/NoteList";
import { apiRequest } from "../lib/api/apiClient";
import { AIInsightPanel } from "../components/ai-insight-panel";

export const Route = createFileRoute("/app/search")({
  component: SearchPage,
});

export function SearchPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <AIInsightPanel />
    </div>
  )
}

// type Note = {
//   id: string;
//   title: string;
//   content: string;
//   createdAt: Date;
//   updatedAt: Date;
// };

// function SearchPage() {
//   const [query, setQuery] = useState("");
//   const [results, setResults] = useState<Note[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [searched, setSearched] = useState(false);

//   const handleSearch = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!query.trim()) return;

//     setLoading(true);

//     try {
//       const data = await apiRequest<{ data: { results: Note[] } }>(
//         `/api/search?q=${encodeURIComponent(query)}&limit=50`
//       );
//       setResults(data.data.results);
//       setSearched(true);
//     } catch (error) {
//       console.error("Search failed:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="space-y-8">
//       <div>
//         <h1 className="text-4xl font-bold text-foreground mb-2">Search</h1>
//         <p className="text-muted mb-6">Find notes across your knowledge base</p>

//         <form onSubmit={handleSearch} className="flex gap-2">
//           <input
//             type="text"
//             value={query}
//             onChange={(e) => setQuery(e.target.value)}
//             placeholder="Search by title or content..."
//             className="flex-1 rounded-lg border border-border bg-background px-4 py-2 text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
//           />
//           <button
//             type="submit"
//             disabled={loading}
//             className="px-6 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
//           >
//             {loading ? "Searching..." : "Search"}
//           </button>
//         </form>
//       </div>

//       {searched && results.length > 0 && (
//         <div>
//           <div className="mb-6">
//             <p className="text-sm text-muted">
//               Found <span className="text-foreground font-semibold">{results.length}</span> result{results.length !== 1 ? "s" : ""} for <span className="text-primary font-semibold">"{query}"</span>
//             </p>
//           </div>
//           <NoteList notes={results} loading={false} />
//         </div>
//       )}

//       {searched && results.length === 0 && (
//         <div className="rounded-xl border border-border bg-background/50 p-12 text-center">
//           <p className="text-muted">No notes found for "<span className="text-foreground font-semibold">{query}</span>"</p>
//           <p className="text-sm text-muted mt-2">Try different keywords or browse your notes</p>
//         </div>
//       )}

//       {!searched && (
//         <div className="rounded-xl border border-dashed border-border bg-background/50 p-12 text-center">
//           <p className="text-muted">Enter a search query above to find notes</p>
//           <p className="text-sm text-muted mt-2">Search by title, content, tags, or any text</p>
//         </div>
//       )}
//     </div>
//   );
// }
