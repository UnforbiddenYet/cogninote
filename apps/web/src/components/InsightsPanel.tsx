import { Sparkles, AlertCircle } from "lucide-react";
import { useIslandStore } from "../stores/island";
import { useSearchQuery } from "../hooks/useSearch";
import { NoteCard } from "./notes/NoteCard";
import { MarkdownEditor } from "./editor/MarkdownEditor";
import { SearchHistory } from "./search/SearchHistory";

export function InsightsPanel() {
  const submittedQuery = useIslandStore((state) => state.submittedQuery);
  const { data, isLoading, error } = useSearchQuery({ query: submittedQuery });

  if (!submittedQuery) return <SearchHistory />;

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Error State */}
      {error && (
        <div className="p-6 rounded-2xl border border-destructive/30 bg-destructive/5">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm font-medium">
              {error instanceof Error ? error.message : "Failed to process query"}
            </span>
          </div>
        </div>
      )}

      {/* AI Synthesized Answer */}
      <div className="p-6 rounded-2xl border border-border/50 bg-card/95 backdrop-blur-xl shadow-lg">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <h2 className="text-base font-semibold text-foreground">Answer</h2>
        </div>
        <div className="prose prose-sm dark:prose-invert max-w-none">
          {isLoading ? (
            <div className="space-y-2">
              <div className="h-4 bg-muted/50 rounded animate-pulse w-full" />
              <div className="h-4 bg-muted/50 rounded animate-pulse w-5/6" />
              <div className="h-4 bg-muted/50 rounded animate-pulse w-4/6" />
            </div>
          ) : data?.answer ? (
            <MarkdownEditor content={data.answer} editable={false} />
          ) : !error ? (
            <p className="text-sm text-muted-foreground">Processing your query...</p>
          ) : null}
        </div>
      </div>

      {/* Source Documents */}
      {data?.sources && data.sources.length > 0 ? (
        <div className="p-6 rounded-2xl border border-border/50 bg-card/95 backdrop-blur-xl shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">
              Source Documents ({data?.sources.length ?? 0})
            </h3>
          </div>
          <div className="space-y-2 max-h-100 overflow-y-auto">
            {data.sources.map((source) => (
              <NoteCard key={source.id} note={source} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
