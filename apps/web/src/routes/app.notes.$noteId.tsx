import { createFileRoute } from "@tanstack/react-router";
import { NoteDetail } from "../components/NoteDetail";

export const Route = createFileRoute("/app/notes/$noteId")({
  component: Note,
});

function Note() {
  const { noteId } = Route.useParams();
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="rounded-2xl border border-border/50 bg-card/95 backdrop-blur-xl shadow-2xl overflow-hidden">
          <NoteDetail key={noteId} noteId={noteId} />
        </div>
      </div>
    </div>
  );
}
