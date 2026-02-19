import { Sparkles, History } from "lucide-react";
import { useIslandStore } from "../../stores/island";
import { useQueryHistory } from "../../hooks/useSearch";

export function SearchHistory() {
  const { data: history, isLoading: historyLoading } = useQueryHistory();
  const submitQueryDirect = useIslandStore((state) => state.submitQueryDirect);

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="p-12 rounded-2xl border border-border/50 bg-card/95 backdrop-blur-xl shadow-lg">
        <div className="text-center">
          <div className="inline-flex p-4 rounded-full bg-primary/10 mb-4">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Ask Your Second Brain</h3>
          <p className="text-sm text-muted-foreground">
            Use the AI search above to query your knowledge base
          </p>
        </div>
      </div>

      {historyLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static loading skeletons
            <div key={i} className="h-16 bg-muted/50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : history && history.queries.length > 0 ? (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <History className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-muted-foreground">Recent Searches</h3>
          </div>
          <div className="space-y-2">
            {history.queries.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => submitQueryDirect(entry.queryText)}
                className="w-full text-left p-4 rounded-xl border border-border/50 bg-card/95 backdrop-blur-xl shadow-sm hover:border-primary/30 hover:shadow-md transition-all cursor-pointer"
              >
                <p className="text-sm font-medium text-foreground truncate">{entry.queryText}</p>
                {entry.answerPreview && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {entry.answerPreview}
                  </p>
                )}
                <p className="text-xs text-muted-foreground/60 mt-1">
                  {new Date(entry.createdAt).toLocaleDateString()}
                </p>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
