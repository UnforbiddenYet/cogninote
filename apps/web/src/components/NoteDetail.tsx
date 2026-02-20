import { useNavigate } from "@tanstack/react-router";
import { lazy, Suspense, useEffect } from "react";
import { useNote } from "../hooks/useNotes";
import { useAutosave } from "../hooks/useAutosave";
import { useEditorStore } from "../stores/editor";

const NoteEditor = lazy(() => import('./editor/NoteEditor'));

export function NoteDetail({ noteId }: { noteId: string }) {
  const navigate = useNavigate();
  const { data: note, isLoading, isError } = useNote(noteId);
  const {
    initialContent,
    hasUnsavedChanges,
    lastSaved,
    isInitialized,
    updateContent,
  } = useEditorStore();
  const { scheduleSave, saving } = useAutosave(noteId);

  // Initialize state from loaded note
  useEffect(() => {
    const { initialize, isInitialized } = useEditorStore.getState();
    if (note && !isInitialized) {
      initialize(note.content);
    }
  }, [note]);

  // Handle navigation on error
  useEffect(() => {
    if (isError) {
      navigate({ to: "/app/notes" });
    }
  }, [isError, navigate]);

  const handleContentChange = (newContent: string) => {
    updateContent(newContent);
    scheduleSave();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center">
        <p className="text-muted">Loading note...</p>
      </div>
    );
  }

  if (!note || !isInitialized) {
    return (
      <div className="flex items-center justify-center">
        <p className="text-muted">{isLoading ? "Loading note..." : "Note not found"}</p>
      </div>
    );
  }

  return (
    <Suspense fallback={null}>
      <NoteEditor
        content={initialContent}
        onContentChange={handleContentChange}
        saving={saving}
        lastSaved={lastSaved}
        hasUnsavedChanges={hasUnsavedChanges}
      />
    </Suspense>
  );
}
