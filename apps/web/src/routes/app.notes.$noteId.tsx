import { createFileRoute } from "@tanstack/react-router";
import { NoteDetail } from "../components/note-detail";

export const Route = createFileRoute("/app/notes/$noteId")({
  component: Note,
});

function Note() {
  const { noteId } = Route.useParams()
  return <NoteDetail noteId={noteId} />
}