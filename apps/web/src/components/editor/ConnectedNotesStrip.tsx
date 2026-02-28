import { useRef, useState, useEffect } from "react";
import { Link2 } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useRelatedNotes } from "../../hooks/useNotes";

const VISIBLE_CHIP_COUNT = 4;

type ConnectedNote = {
  id: string;
  noteId: string;
  noteTitle: string;
};

function NoteChip({ title, onClick }: { title: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center px-2 py-0.5 rounded-md border border-border/60 bg-muted/40 text-xs text-foreground/80 hover:bg-accent hover:text-foreground hover:border-border transition-colors whitespace-nowrap max-w-[160px] truncate"
      title={title}
    >
      {title}
    </button>
  );
}

function OverflowPopover({
  notes,
  onNavigate,
  onClose,
}: {
  notes: ConnectedNote[];
  onNavigate: (noteId: string) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute top-full left-0 mt-1.5 z-30 min-w-[200px] max-w-[280px] max-h-60 overflow-y-auto rounded-lg border border-border bg-popover shadow-md py-1"
    >
      {notes.map((note) => (
        <button
          key={note.id}
          type="button"
          onClick={() => {
            onNavigate(note.noteId);
            onClose();
          }}
          className="w-full text-left px-3 py-1.5 text-xs text-popover-foreground hover:bg-accent hover:text-foreground transition-colors truncate"
          title={note.noteTitle}
        >
          {note.noteTitle}
        </button>
      ))}
    </div>
  );
}

export function ConnectedNotesStrip({ noteId }: { noteId: string }) {
  const navigate = useNavigate();
  const { data: connections } = useRelatedNotes(noteId);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const popoverTriggerRef = useRef<HTMLDivElement>(null);

  if (!connections || connections.length === 0) return null;

  const visible = connections.slice(0, VISIBLE_CHIP_COUNT);
  const overflow = connections.slice(VISIBLE_CHIP_COUNT);

  function goToNote(targetNoteId: string) {
    navigate({ to: "/app/notes/$noteId", params: { noteId: targetNoteId } });
  }

  return (
    <div className="flex items-center gap-1.5 px-2 py-1.5 flex-wrap">
      <Link2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      {visible.map((conn) => (
        <NoteChip key={conn.id} title={conn.noteTitle} onClick={() => goToNote(conn.noteId)} />
      ))}
      {overflow.length > 0 && (
        <div ref={popoverTriggerRef} className="relative">
          <button
            type="button"
            onClick={() => setPopoverOpen((o) => !o)}
            className="inline-flex items-center px-2 py-0.5 rounded-md border border-border/60 bg-muted/40 text-xs font-medium text-primary/80 hover:bg-accent hover:text-primary hover:border-border transition-colors"
          >
            +{overflow.length}
          </button>
          {popoverOpen && (
            <OverflowPopover
              notes={overflow}
              onNavigate={goToNote}
              onClose={() => setPopoverOpen(false)}
            />
          )}
        </div>
      )}
    </div>
  );
}
