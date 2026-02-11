import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { NoteEditor } from "../components/editor/NoteEditor";
import { useCreateNote } from "../hooks/useNotes";

export const Route = createFileRoute("/app/new-note")({
  component: NewNote,
});

function NewNote() {
  const navigate = useNavigate();
  const createNote = useCreateNote();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [hasAttemptedCreation, setHasAttemptedCreation] = useState(false);
  const creationInProgress = useRef(false);

  const attemptCreateNote = async () => {
    if (
      !title.trim() ||
      !content.trim() ||
      hasAttemptedCreation ||
      creationInProgress.current
    ) {
      return;
    }

    creationInProgress.current = true;
    setHasAttemptedCreation(true);

    try {
      const note = await createNote.mutateAsync({
        title: title.trim() || "Untitled",
        content,
      });

      navigate({
        to: `/app/notes/${note.id}`,
        search: {
          initialTitle: title,
          initialContent: content,
        },
      });
    } catch (error) {
      console.error("Failed to create note:", error);
      setHasAttemptedCreation(false);
      creationInProgress.current = false;
    }
  };

  useEffect(() => {
    attemptCreateNote();
  }, [title, content]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="rounded-2xl border border-border/50 bg-card/95 backdrop-blur-xl shadow-2xl overflow-hidden">
          <NoteEditor
            title={title}
            content={content}
            onTitleChange={setTitle}
            onContentChange={setContent}
            saving={createNote.isPending}
            lastSaved={null}
            hasUnsavedChanges={title.length > 0 || content.length > 0}
          />
        </div>
      </div>
    </div>
  );
}
