import { useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { NoteEditor } from "./editor/NoteEditor";
import { useNote, useUpdateNote } from "../hooks/useNotes";
import { useEditorStore } from "../stores/editor";

const AUTOSAVE_DEBOUNCE_MS = 2000;
const PERIODIC_SAVE_MS = 30000;

export function NoteDetail({ noteId }: { noteId: string }) {
  const navigate = useNavigate();

  const { data: note, isLoading, isError } = useNote(noteId);
  const { initialContent, hasUnsavedChanges, lastSaved, isInitialized, initialize, updateContent, saveSuccess, reset } = useEditorStore();
  const updateNoteMutation = useUpdateNote();

  const debounceTimerRef = useRef<NodeJS.Timeout>();
  const periodicTimerRef = useRef<NodeJS.Timeout>();
  const currentNoteIdRef = useRef(noteId);

  // Reset state when navigating to a different note
  useEffect(() => {
    if (currentNoteIdRef.current !== noteId) {
      currentNoteIdRef.current = noteId;
      reset();
    }
  }, [noteId]);

  // Initialize state from loaded note
  useEffect(() => {
    if (note && !isInitialized) {
      initialize(note.content);
    }
  }, [note, isInitialized]);

  // Handle navigation
  useEffect(() => {
    if (isError) {
      navigate({ to: "/app/notes" });
    }
  }, [isError, navigate]);

  // Save function - stable, doesn't change on every render
  const saveNote = async (content: string) => {
    if (!note || !content.trim() || updateNoteMutation.isPending) return;

    try {
      await updateNoteMutation.mutateAsync({
        noteId,
        updates: { content },
      });
      saveSuccess();
    } catch (error) {
      console.error("Failed to save note:", error);
    }
  };

  // Set up periodic auto-save timer (only once when note loads)
  useEffect(() => {
    if (!note) return;

    periodicTimerRef.current = setInterval(() => {
      const { hasUnsavedChanges, content } = useEditorStore.getState();
      if (hasUnsavedChanges && content.trim()) {
        saveNote(content);
      }
    }, PERIODIC_SAVE_MS);

    return () => {
      if (periodicTimerRef.current) {
        clearInterval(periodicTimerRef.current);
      }

      // Save any unsaved changes
      const { content } = useEditorStore.getState();
      if (note?.content.trim() !== content.trim()) {
        saveNote(content);
      }
    };
  }, [note]); // Only re-run when note changes

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const scheduleDebouncedSave = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      const { content } = useEditorStore.getState();
      saveNote(content);
    }, AUTOSAVE_DEBOUNCE_MS);
  };

  const handleContentChange = (newContent: string) => {
    updateContent(newContent);
    scheduleDebouncedSave();
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
      saving={updateNoteMutation.isPending}
      lastSaved={lastSaved}
      hasUnsavedChanges={hasUnsavedChanges}
    />
  );
}
