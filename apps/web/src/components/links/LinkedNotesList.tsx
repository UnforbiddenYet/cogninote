import { Link as LinkIcon, Trash2 } from "lucide-react";

type LinkedNote = {
  id: string;
  linkId: string;
  title: string;
  linkType: "manual" | "ai_suggested" | "bidirectional";
};

type LinkedNotesListProps = {
  linkedNotes: LinkedNote[];
  onRemoveLink: (linkId: string) => void;
  loading?: boolean;
};

export function LinkedNotesList({
  linkedNotes,
  onRemoveLink,
  loading = false,
}: LinkedNotesListProps) {
  const getLinkTypeLabel = (linkType: string) => {
    switch (linkType) {
      case "ai_suggested":
        return "AI Suggested";
      case "bidirectional":
        return "Bidirectional";
      default:
        return "Manual";
    }
  };

  const getLinkTypeColor = (linkType: string) => {
    switch (linkType) {
      case "ai_suggested":
        return "bg-purple/10 text-purple border-l-purple";
      case "bidirectional":
        return "bg-blue/10 text-blue border-l-blue";
      default:
        return "bg-green/10 text-green border-l-green";
    }
  };

  if (linkedNotes.length === 0) {
    return (
      <div className="text-sm text-muted text-center py-4">
        No linked notes yet
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {linkedNotes.map((linkedNote) => (
        <div
          key={linkedNote.linkId}
          className={`flex items-start justify-between p-3 rounded-lg border-l-4 ${getLinkTypeColor(
            linkedNote.linkType
          )}`}
        >
          <div className="flex items-start gap-2 flex-1 min-w-0">
            <LinkIcon size={16} className="mt-0.5 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="font-medium text-foreground truncate">
                {linkedNote.title}
              </div>
              <div className="text-xs text-muted">
                {getLinkTypeLabel(linkedNote.linkType)}
              </div>
            </div>
          </div>
          <button
            onClick={() => onRemoveLink(linkedNote.linkId)}
            disabled={loading}
            className="ml-2 p-1.5 hover:bg-red/10 text-red rounded transition-colors disabled:opacity-50"
            aria-label={`Remove link to ${linkedNote.title}`}
          >
            <Trash2 size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
