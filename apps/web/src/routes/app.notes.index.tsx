import { createFileRoute } from "@tanstack/react-router";
import { NotesLibrary } from "../components/NotesLibrary";

export const Route = createFileRoute("/app/notes/")({
  component: NotesPage,
});

function NotesPage() {
  return <NotesLibrary />
}
