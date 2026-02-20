import { createFileRoute, redirect } from "@tanstack/react-router";
import { createNote } from "../lib/api/notes";

export const Route = createFileRoute("/app/new-note")({
  beforeLoad: async () => {
    const note = await createNote({ content: "" });
    throw redirect({
      to: "/app/notes/$noteId",
      params: { noteId: note.id },
      replace: true,
    });
  },
  component: () => (
    <div className="flex items-center justify-center min-h-64">
      <span className="text-muted-foreground">Creating note…</span>
    </div>
  ),
});
