import { Link2, Check, X, Loader2 } from "lucide-react";
import { useAcceptSuggestion, useDismissSuggestion } from "../../hooks/useSuggestions";

type Suggestion = {
  id: string;
  suggestionData: {
    sourceTitle: string;
    targetTitle: string;
    sharedEntities: string[];
  };
};

export function SuggestionCard({ suggestion }: { suggestion: Suggestion }) {
  const accept = useAcceptSuggestion();
  const dismiss = useDismissSuggestion();
  const isAccepting = accept.isPending && accept.variables === suggestion.id;
  const isDismissing = dismiss.isPending && dismiss.variables === suggestion.id;
  const isBusy = isAccepting || isDismissing;

  return (
    <div className="p-3 rounded-lg border border-border/50 bg-card/30 transition-colors">
      <div className="flex items-start gap-2 mb-1.5">
        <Link2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <div className="flex-1 text-xs font-medium text-foreground">
          {suggestion.suggestionData.sourceTitle} &rarr; {suggestion.suggestionData.targetTitle}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            title="Accept"
            disabled={isBusy}
            onClick={() => accept.mutate(suggestion.id)}
            className="p-1 rounded hover:bg-green-500/20 text-muted-foreground hover:text-green-500 transition-colors disabled:opacity-40"
          >
            {isAccepting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            title="Dismiss"
            disabled={isBusy}
            onClick={() => dismiss.mutate(suggestion.id)}
            className="p-1 rounded hover:bg-red-500/20 text-muted-foreground hover:text-red-500 transition-colors disabled:opacity-40"
          >
            {isDismissing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>
      <div className="text-xs text-muted-foreground pl-6">
        Shared entities: {suggestion.suggestionData.sharedEntities.join(", ")}
      </div>
    </div>
  );
}
