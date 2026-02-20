import { useCallback, useEffect, useRef } from "react";
import { useBlocker } from "@tanstack/react-router";
import { useEditorStore } from "../stores/editor";
import { useUpdateNote } from "./useNotes";

const DEBOUNCE_MS = 2000;
const PERIODIC_MS = 30000;

/**
 * Autosave hook that debounces on change and periodically flushes.
 * Uses useBlocker for navigation-away cleanup.
 */
export function useAutosave(noteId: string) {
  const updateNote = useUpdateNote();
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>();
  const periodicTimer = useRef<ReturnType<typeof setInterval>>();
  const isSaving = useRef(false);

  const save = useCallback(async () => {
    const { hasUnsavedChanges, content, saveSuccess } = useEditorStore.getState();
    if (!hasUnsavedChanges || isSaving.current) return;

    isSaving.current = true;
    try {
      await updateNote.mutateAsync({ noteId, updates: { content } });
      saveSuccess();
    } catch (e) {
      console.error("Autosave failed:", e);
    } finally {
      isSaving.current = false;
    }
  }, [noteId, updateNote.mutateAsync]);

  const scheduleSave = () => {
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(save, DEBOUNCE_MS);
  };

  // In-app navigation: save unsaved + reset store
  useBlocker({
    shouldBlockFn: async () => {
      clearInterval(periodicTimer.current);
      clearTimeout(debounceTimer.current);
      const { hasUnsavedChanges, reset } = useEditorStore.getState();
      if (hasUnsavedChanges) {
        await save();
      }
      reset();
      return false;
    },
    enableBeforeUnload: false,
  });

  useEffect(() => {
    periodicTimer.current = setInterval(save, PERIODIC_MS);
    return () => {
      clearInterval(periodicTimer.current);
    };
  }, [save]);

  return { scheduleSave, saving: updateNote.isPending };
}
