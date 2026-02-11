import { Link } from "@tanstack/react-router";

type Note = {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  color?: string;
};

export function NoteCard({ note }: { note: Note }) {
  const preview = note.content
    .replace(/[#*_`[\]]/g, "")
    .substring(0, 100)
    .trim() + "...";

  const date = new Date(note.updatedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <Link
      to="/app/notes/$noteId"
      params={{ noteId: note.id }}
      className="card block transition-colors hover:bg-secondary"
      style={note.color ? { borderLeftColor: note.color, borderLeftWidth: "4px" } : {}}
    >
      <h3 className="mb-2 font-semibold text-foreground line-clamp-2">
        {note.title}
      </h3>
      <p className="mb-3 text-sm text-muted line-clamp-2">{preview}</p>
      <p className="text-xs text-muted">{date}</p>
    </Link>
  );
}
