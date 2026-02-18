import { useEffect, useRef } from "react";
import { useEditorStore } from "../stores/editor";
import { useUpdateNote } from "./useNotes";

const DEBOUNCE_MS = 2000;
const PERIODIC_MS = 30000;

/**
 * Autosave hook that debounces on change and periodically flushes.
 * Reads from the zustand store directly. Also, flushes unsaved changes on unmount.
 */
export function useAutosave(noteId: string) {
  const updateNote = useUpdateNote();
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>();
  const periodicTimer = useRef<ReturnType<typeof setInterval>>();
  const isSaving = useRef(false);

  const save = async () => {
    const { hasUnsavedChanges, content, saveSuccess } =
      useEditorStore.getState();
    if (!hasUnsavedChanges || !content.trim() || isSaving.current) return;

    isSaving.current = true;
    try {
      await updateNote.mutateAsync({ noteId, updates: { content } });
      saveSuccess();
    } catch (e) {
      console.error("Autosave failed:", e);
    } finally {
      isSaving.current = false;
    }
  };

  const scheduleSave = () => {
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(save, DEBOUNCE_MS);
  };

  useEffect(() => {
    periodicTimer.current = setInterval(save, PERIODIC_MS);
    return () => {
      clearInterval(periodicTimer.current);
      clearTimeout(debounceTimer.current);
      // Flush on unmount (fire-and-forget)
      save();
    };
  }, [noteId]);

  return { scheduleSave, saving: updateNote.isPending };
}
