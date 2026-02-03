import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { NoteList } from "../../components/notes/NoteList";

export const Route = createFileRoute("/app/search")({
  component: SearchPage,
});

type Note = {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
};

function SearchPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    const token = localStorage.getItem("accessToken");

    try {
      const apiUrl = (typeof window !== "undefined" && (window as any).__API_URL__) || "http://localhost:3001";
      const response = await fetch(
        `${apiUrl}/api/search?q=${encodeURIComponent(query)}&limit=50`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        return;
      }

      const data = await response.json();
      setResults(data.data.results);
      setSearched(true);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-4 text-3xl font-bold text-foreground">Search Notes</h1>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notes..."
            className="flex-1 rounded border border-border bg-background px-4 py-2 text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </form>
      </div>

      {searched && (
        <div>
          <p className="mb-4 text-sm text-muted">
            Found {results.length} result{results.length !== 1 ? "s" : ""} for "
            {query}"
          </p>
          <NoteList notes={results} loading={false} />
        </div>
      )}

      {!searched && (
        <div className="card text-center text-muted">
          Enter a search query to find notes
        </div>
      )}
    </div>
  );
}
