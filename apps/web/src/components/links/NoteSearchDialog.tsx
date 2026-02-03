import { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";

type NoteSearchResult = {
  id: string;
  title: string;
  content?: string;
};

type NoteSearchDialogProps = {
  onSelect: (note: NoteSearchResult) => void;
  excludeNoteIds?: string[];
  placeholder?: string;
};

export function NoteSearchDialog({
  onSelect,
  excludeNoteIds = [],
  placeholder = "Search notes to link...",
}: NoteSearchDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<NoteSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim() || !isOpen) {
      setResults([]);
      return;
    }

    const searchNotes = async () => {
      setLoading(true);
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      try {
        const apiUrl =
          (typeof window !== "undefined" && (window as any).__API_URL__) ||
          "http://localhost:3001";
        const response = await fetch(
          `${apiUrl}/api/search?q=${encodeURIComponent(searchQuery)}&limit=10`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          const filtered = (data.data.notes || []).filter(
            (note: NoteSearchResult) => !excludeNoteIds.includes(note.id)
          );
          setResults(filtered);
        }
      } catch (error) {
        console.error("Failed to search notes:", error);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchNotes, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, isOpen, excludeNoteIds]);

  const handleSelect = (note: NoteSearchResult) => {
    onSelect(note);
    setSearchQuery("");
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-2 border border-border rounded-lg bg-background text-foreground hover:bg-muted transition-colors flex items-center gap-2"
      >
        <Search size={16} />
        Link Note
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-96 border border-border rounded-lg bg-background shadow-lg z-10">
          <div className="p-3 border-b border-border">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={placeholder}
              autoFocus
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="max-h-64 overflow-y-auto">
            {loading ? (
              <div className="px-3 py-4 text-sm text-muted text-center">
                Searching...
              </div>
            ) : results.length > 0 ? (
              results.map((note) => (
                <button
                  key={note.id}
                  onClick={() => handleSelect(note)}
                  className="w-full text-left px-3 py-2 hover:bg-muted transition-colors border-b border-border last:border-b-0"
                >
                  <div className="font-medium text-foreground">{note.title}</div>
                  {note.content && (
                    <div className="text-xs text-muted line-clamp-1">
                      {note.content.replace(/<[^>]*>/g, "")}
                    </div>
                  )}
                </button>
              ))
            ) : searchQuery.trim() ? (
              <div className="px-3 py-4 text-sm text-muted text-center">
                No notes found
              </div>
            ) : (
              <div className="px-3 py-4 text-sm text-muted text-center">
                Start typing to search
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
