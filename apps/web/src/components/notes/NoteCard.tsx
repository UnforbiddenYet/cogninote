import { Link } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";

import { features } from "../../lib/features";
import { ConnectedNotesMenu } from "./ConnectedNotesMenu";

type Note = {
  id: string;
  title: string;
  preview: string;
  updatedAt: string;
  connectionCount?: number;
};

export function NoteCard({ note, onDelete }: { note: Note; onDelete?: () => void }) {
  return (
    <Link
      to="/app/notes/$noteId"
      params={{ noteId: note.id }}
      className="group block p-3 rounded-lg border border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card/80 hover:border-border transition-all cursor-pointer"
    >
      <div className="flex items-center justify-between mb-0.5">
        <div className="text-sm font-medium text-foreground">{note.title}</div>
        <div className="flex items-center gap-2">
          {onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete();
              }}
              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 hover:text-destructive transition-all cursor-pointer"
              aria-label="Delete note"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
          {features.connections && !!note.connectionCount && (
            <ConnectedNotesMenu noteId={note.id} readOnly />
          )}
          <span className="text-xs text-muted-foreground">
            {new Date(note.updatedAt).toLocaleDateString()}
          </span>
        </div>
      </div>
      <div className="text-xs text-muted-foreground line-clamp-1">{note.preview}</div>
    </Link>
  );
}
