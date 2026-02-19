import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { NoteEditor } from "./editor/NoteEditor";
import { useNote } from "../hooks/useNotes";
import { useAutosave } from "../hooks/useAutosave";
import { useEditorStore } from "../stores/editor";

export function NoteDetail({ noteId }: { noteId: string }) {
  const navigate = useNavigate();
  const { data: note, isLoading, isError } = useNote(noteId);
  const {
    initialContent,
    hasUnsavedChanges,
    lastSaved,
    isInitialized,
    initialize,
    updateContent,
    reset,
  } = useEditorStore();
  const { scheduleSave, saving } = useAutosave(noteId);

  useEffect(() => {
    return () => reset();
  }, [reset]);

  // Initialize state from loaded note
  useEffect(() => {
    if (note && !isInitialized) {
      initialize(note.content);
    }
  }, [note, isInitialized, initialize]);

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
    <NoteEditor
      content={initialContent}
      onContentChange={handleContentChange}
      saving={saving}
      lastSaved={lastSaved}
      hasUnsavedChanges={hasUnsavedChanges}
    />
  );
}
