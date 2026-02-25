import { useState, useMemo } from "react";
import {
  Search,
  Trash2,
  Merge,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  X,
} from "lucide-react";
import { useEntities, useMergeEntities, useDeleteEntity } from "../hooks/useEntities";

const PAGE_SIZE = 50;

export function EntityManager() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [mergeTarget, setMergeTarget] = useState<string>("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const offset = page * PAGE_SIZE;
  const query = useMemo(
    () => ({
      ...(debouncedSearch ? { q: debouncedSearch } : {}),
      limit: String(PAGE_SIZE),
      offset: String(offset),
    }),
    [debouncedSearch, offset],
  );

  const { data, isLoading, isError, error } = useEntities(query);
  const mergeMutation = useMergeEntities();
  const deleteMutation = useDeleteEntity();

  const entities = data?.entities ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  // Debounce search input
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (debounceTimer) clearTimeout(debounceTimer);
    setDebounceTimer(
      setTimeout(() => {
        setDebouncedSearch(value);
        setPage(0);
      }, 300),
    );
  };

  const toggleSelect = (entity: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(entity)) {
        next.delete(entity);
        if (mergeTarget === entity) setMergeTarget("");
      } else {
        next.add(entity);
        if (next.size === 1) setMergeTarget(entity);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === entities.length) {
      setSelected(new Set());
      setMergeTarget("");
    } else {
      setSelected(new Set(entities));
      if (!mergeTarget || !entities.includes(mergeTarget)) {
        setMergeTarget(entities[0] ?? "");
      }
    }
  };

  const handleMerge = () => {
    if (selected.size < 2 || !mergeTarget) return;
    const entitiesToChange = [...selected].filter((e) => e !== mergeTarget);
    mergeMutation.mutate(
      { entitiesToChange, entityToChangeInto: mergeTarget },
      {
        onSuccess: () => {
          setSelected(new Set());
          setMergeTarget("");
        },
      },
    );
  };

  const handleDelete = (entity: string) => {
    deleteMutation.mutate(entity, {
      onSuccess: () => {
        setConfirmDelete(null);
        setSelected((prev) => {
          const next = new Set(prev);
          next.delete(entity);
          return next;
        });
      },
    });
  };

  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Entities</h1>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search entities..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-border/50 bg-card/95 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Content */}
        <div className="p-5 rounded-2xl border border-border/50 bg-card/95 backdrop-blur-xl shadow-lg">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <AlertCircle className="h-6 w-6 text-destructive" />
              <p className="text-sm text-destructive">
                {error?.message ?? "Failed to load entities"}
              </p>
            </div>
          ) : entities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-xs text-muted-foreground">
                {debouncedSearch ? "No entities match your search" : "No entities found"}
              </p>
            </div>
          ) : (
            <>
              {/* Select all */}
              <div className="flex items-center gap-2 pb-3 mb-1 border-b border-border/50">
                <input
                  type="checkbox"
                  checked={selected.size === entities.length && entities.length > 0}
                  onChange={toggleSelectAll}
                  className="h-3.5 w-3.5 rounded border-border accent-primary cursor-pointer"
                />
                <span className="text-xs text-muted-foreground">
                  {selected.size > 0 ? `${selected.size} selected` : "Select all"}
                </span>
              </div>

              {/* Entity list */}
              <div className="divide-y divide-border/30">
                {entities.map((entity) => (
                  <div key={entity} className="flex items-center gap-3 py-2.5 group">
                    <input
                      type="checkbox"
                      checked={selected.has(entity)}
                      onChange={() => toggleSelect(entity)}
                      className="h-3.5 w-3.5 rounded border-border accent-primary cursor-pointer shrink-0"
                    />
                    <span className="text-sm text-foreground flex-1 truncate">{entity}</span>
                    {confirmDelete === entity ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleDelete(entity)}
                          disabled={deleteMutation.isPending}
                          className="px-2 py-0.5 text-xs font-medium text-destructive border border-destructive/30 rounded hover:bg-destructive/10 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {deleteMutation.isPending ? "..." : "Confirm"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(null)}
                          className="p-0.5 text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(entity)}
                        className="p-1 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-border/50 hover:bg-card/80 transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Previous
              </button>
              <span className="text-xs text-muted-foreground">
                Page {page + 1} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-border/50 hover:bg-card/80 transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Merge bar */}
        {selected.size >= 2 && (
          <div className="sticky bottom-4 p-4 rounded-2xl border border-primary/20 bg-card/98 backdrop-blur-xl shadow-xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <Merge className="h-4 w-4 text-primary shrink-0" />
              <span className="text-sm text-foreground">Merge {selected.size} entities into:</span>
              <select
                value={mergeTarget}
                onChange={(e) => setMergeTarget(e.target.value)}
                className="text-sm rounded-lg border border-border/50 bg-background px-2 py-1 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 max-w-[200px] truncate"
              >
                {Array.from(selected).map((e: string) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelected(new Set());
                  setMergeTarget("");
                }}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border/50 hover:bg-card/80 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleMerge}
                disabled={mergeMutation.isPending || !mergeTarget}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50"
              >
                {mergeMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Merge className="h-3.5 w-3.5" />
                )}
                Merge
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
