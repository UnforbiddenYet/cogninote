import { useRef, useEffect } from "react";
import { Plus, Sparkles, Network, X, FolderOpen, Home } from "lucide-react";
import { useNavigate, useMatchRoute } from "@tanstack/react-router";
import { useIslandStore } from "../../stores/island";

export function MagicIsland() {
  const navigate = useNavigate();
  const matchRoute = useMatchRoute();
  const { query, setQuery, submitQuery, reset, isAIExpanded, setIsAIExpanded } = useIslandStore();
  const inputRef = useRef<HTMLInputElement>(null);

  const isEditor = !!matchRoute({ to: "/app/new-note" });
  const isGraph = !!matchRoute({ to: "/app/graph" });
  const isNotes = !!matchRoute({ to: "/app/notes" });
  const isSearch = !!matchRoute({ to: "/app/search" });
  const isHome = !!matchRoute({ to: "/app", fuzzy: false });

  useEffect(() => {
    if (isAIExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAIExpanded]);

  const handleLeftAction = () => {
    if (isEditor) {
      navigate({ to: "/" });
    } else {
      navigate({ to: "/app/new-note" });
    }
  };

  const handleHomeAction = () => {
    navigate({ to: "/" });
  };

  const handleCenterClick = () => {
    if (isSearch) {
      setIsAIExpanded(true);
    } else {
      setIsAIExpanded(true);
      navigate({ to: "/app/search" });
    }
  };

  const handleCloseAI = () => {
    setIsAIExpanded(false);
    reset();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      submitQuery();
      navigate({ to: "/app/search" });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      handleCloseAI();
    }
  };

  const handleNotesAction = () => {
    if (isNotes) {
      navigate({ to: "/" });
    } else {
      navigate({ to: "/app/notes" });
    }
  };

  const handleRightAction = () => {
    if (isGraph) {
      navigate({ to: "/" });
    } else {
      navigate({ to: "/app/graph" });
    }
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-1 px-2 py-2 rounded-full border border-border/50 bg-card/95 backdrop-blur-xl shadow-2xl">
        {isAIExpanded ? (
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-full min-w-75"
          >
            <Sparkles className="h-5 w-5 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything..."
              className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-primary-foreground/60"
            />
            <button
              type="button"
              onClick={handleCloseAI}
              className="hover:bg-primary-foreground/20 rounded-full p-1 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </form>
        ) : (
          <>
            {/* Home Button */}
            <button
              type="button"
              onClick={handleHomeAction}
              className={`flex items-center gap-2 px-4 py-3 rounded-full transition-all ${
                isHome
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Home className="h-5 w-5" />
              {isHome && <span className="text-sm font-medium">Home</span>}
            </button>

            {/* Left Button - New Note */}
            <button
              type="button"
              onClick={handleLeftAction}
              className={`flex items-center gap-2 px-4 py-3 rounded-full transition-all ${
                isEditor
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Plus className="h-5 w-5" />
              {isEditor && <span className="text-sm font-medium">Note</span>}
            </button>

            {/* Center - AI Search */}
            <button
              type="button"
              onClick={handleCenterClick}
              className="flex items-center gap-2 px-4 py-3 rounded-full transition-all hover:bg-accent text-muted-foreground hover:text-foreground"
            >
              <Sparkles className="h-5 w-5" />
            </button>

            {/* Notes Button */}
            <button
              type="button"
              onClick={handleNotesAction}
              className={`flex items-center gap-2 px-4 py-3 rounded-full transition-all ${
                isNotes
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent text-muted-foreground hover:text-foreground"
              }`}
            >
              <FolderOpen className="h-5 w-5" />
              {isNotes && <span className="text-sm font-medium">Notes</span>}
            </button>

            {/* Right Button - Knowledge Graph disabled for now */}
            <button
              type="button"
              disabled
              onClick={handleRightAction}
              className={`flex items-center gap-2 px-4 py-3 rounded-full transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                isGraph
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Network className="h-5 w-5" />
              {isGraph && <span className="text-sm font-medium">Graph</span>}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
