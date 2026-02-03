import { NoteCard } from "./NoteCard";

type Note = {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  color?: string;
};

export function NoteList({ notes, loading }: { notes: Note[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="card h-32 animate-pulse bg-muted" />
        ))}
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="card text-center">
        <p className="text-muted">No notes yet. Create one to get started!</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {notes.map((note) => (
        <NoteCard key={note.id} note={note} />
      ))}
    </div>
  );
}
