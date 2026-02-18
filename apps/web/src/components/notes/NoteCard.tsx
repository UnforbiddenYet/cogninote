import { Link } from "@tanstack/react-router";
import { Link2 } from "lucide-react";

import { features } from "../../lib/features";

type Note = {
  id: string;
  title: string;
  preview: string;
  updatedAt: string;
  connectionCount?: number;
};

export function NoteCard({ note }: { note: Note }) {
  return (
    <Link
      to="/app/notes/$noteId"
      params={{ noteId: note.id }}
      className="block p-3 rounded-lg border border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card/80 hover:border-border transition-all cursor-pointer"
    >
      <div className="flex items-center justify-between mb-0.5">
        <div className="text-sm font-medium text-foreground">
          {note.title}
        </div>
        <div className="flex items-center gap-2">
          {features.connections && note.connectionCount && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Link2 className="h-3 w-3" />
              <span>{note.connectionCount}</span>
            </div>
          )}
          <span className="text-xs text-muted-foreground">
            {new Date(note.updatedAt).toLocaleDateString()}
          </span>
        </div>
      </div>
      <div className="text-xs text-muted-foreground line-clamp-1">
        {note.preview}
      </div>
    </Link>
  );
}
