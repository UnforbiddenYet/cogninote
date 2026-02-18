import { create } from "zustand";

interface EditorState {
  content: string;
  initialContent: string;
  hasUnsavedChanges: boolean;
  lastSaved: Date | null;
  isInitialized: boolean;
  initialize: (content: string) => void;
  updateContent: (content: string) => void;
  saveSuccess: () => void;
  reset: () => void;
}

const initialState = {
  content: "",
  initialContent: "",
  hasUnsavedChanges: false,
  lastSaved: null as Date | null,
  isInitialized: false,
};

export const useEditorStore = create<EditorState>((set) => ({
  ...initialState,
  initialize: (content) =>
    set({
      content,
      initialContent: content,
      isInitialized: true,
      hasUnsavedChanges: false,
    }),
  updateContent: (content) => set({ content, hasUnsavedChanges: true }),
  saveSuccess: () => set({ hasUnsavedChanges: false, lastSaved: new Date() }),
  reset: () => set({ ...initialState }),
}));
