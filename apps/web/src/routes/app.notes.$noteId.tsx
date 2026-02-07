import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useReducer, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { NoteEditor } from "../components/editor/NoteEditor";
import { TagsManager } from "../components/tags/TagsManager";
import { LinksManager } from "../components/links/LinksManager";
import { useNote, useRelatedNotes, useUpdateNote } from "../hooks/useNotes";
import { folderKeys } from "../hooks/useFolders";

export const Route = createFileRoute("/app/notes/$noteId")({
  component: NoteDetail,
});

type EditorState = {
  title: string;
  content: string;
  hasUnsavedChanges: boolean;
  lastSaved: Date | null;
  isInitialized: boolean;
};

type EditorAction =
  | { type: "INITIALIZE"; title: string; content: string }
  | { type: "UPDATE_TITLE"; title: string }
  | { type: "UPDATE_CONTENT"; content: string }
  | { type: "SAVE_SUCCESS" }
  | { type: "MARK_DIRTY" }
  | { type: "RESET" };

function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case "INITIALIZE":
      return {
        ...state,
        title: action.title,
        content: action.content,
        isInitialized: true,
        hasUnsavedChanges: false,
      };
    case "UPDATE_TITLE":
      return {
        ...state,
        title: action.title,
        hasUnsavedChanges: true,
      };
    case "UPDATE_CONTENT":
      return {
        ...state,
        content: action.content,
        hasUnsavedChanges: true,
      };
    case "SAVE_SUCCESS":
      return {
        ...state,
        hasUnsavedChanges: false,
        lastSaved: new Date(),
      };
    case "MARK_DIRTY":
      return {
        ...state,
        hasUnsavedChanges: true,
      };
    case "RESET":
      return {
        title: "",
        content: "",
        hasUnsavedChanges: false,
        lastSaved: null,
        isInitialized: false,
      };
    default:
      return state;
  }
}

const AUTOSAVE_DEBOUNCE_MS = 2000;
const PERIODIC_SAVE_MS = 30000;

function NoteDetail() {
  const { noteId } = Route.useParams();
  const search = Route.useSearch() as any;
  const initialTitle = search?.initialTitle || "";
  const initialContent = search?.initialContent || "";
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: note, isLoading, isError } = useNote(noteId);
  const { data: relatedNotes = [] } = useRelatedNotes(noteId);
  const updateNoteMutation = useUpdateNote();

  const [state, dispatch] = useReducer(editorReducer, {
    title: initialTitle,
    content: initialContent,
    hasUnsavedChanges: false,
    lastSaved: null,
    isInitialized: false,
  });

  const debounceTimerRef = useRef<NodeJS.Timeout>();
  const periodicTimerRef = useRef<NodeJS.Timeout>();
  const isSavingRef = useRef(false);
  const stateRef = useRef(state);
  const currentNoteIdRef = useRef(noteId);

  // Keep state ref in sync
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Reset state when navigating to a different note
  useEffect(() => {
    if (currentNoteIdRef.current !== noteId) {
      currentNoteIdRef.current = noteId;
      dispatch({ type: "RESET" });

      // Re-initialize with search params if provided
      if (initialTitle || initialContent) {
        dispatch({
          type: "INITIALIZE",
          title: initialTitle,
          content: initialContent,
        });
      }
    }
  }, [noteId, initialTitle, initialContent]);

  // Save function - stable, doesn't change on every render
  const saveNote = async (title: string, content: string) => {
    if (!note || !title.trim() || isSavingRef.current) return;

    isSavingRef.current = true;
    try {
      await updateNoteMutation.mutateAsync({
        noteId,
        updates: { title, content },
      });
      dispatch({ type: "SAVE_SUCCESS" });
      queryClient.invalidateQueries({ queryKey: folderKeys.all });
    } catch (error) {
      console.error("Failed to save note:", error);
    } finally {
      isSavingRef.current = false;
    }
  };

  // Initialize state from loaded note
  useEffect(() => {
    if (note && !state.isInitialized && !initialTitle && !initialContent) {
      dispatch({
        type: "INITIALIZE",
        title: note.title,
        content: note.content,
      });
    }
  }, [note, state.isInitialized, initialTitle, initialContent]);

  // Handle navigation
  useEffect(() => {
    if (isError) {
      navigate({ to: "/app/notes" });
      return;
    }

    if (note && (initialTitle || initialContent)) {
      navigate({ to: `/app/notes/${noteId}`, replace: true });
    }
  }, [isError, note, initialTitle, initialContent, noteId, navigate]);

  // Set up periodic auto-save timer (only once when note loads)
  useEffect(() => {
    if (!note) return;

    periodicTimerRef.current = setInterval(() => {
      const currentState = stateRef.current;
      if (currentState.hasUnsavedChanges && currentState.title.trim()) {
        saveNote(currentState.title, currentState.content);
      }
    }, PERIODIC_SAVE_MS);

    return () => {
      if (periodicTimerRef.current) {
        clearInterval(periodicTimerRef.current);
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
      const currentState = stateRef.current;
      saveNote(currentState.title, currentState.content);
    }, AUTOSAVE_DEBOUNCE_MS);
  };

  const handleTitleChange = (newTitle: string) => {
    dispatch({ type: "UPDATE_TITLE", title: newTitle });
    scheduleDebouncedSave();
  };

  const handleContentChange = (newContent: string) => {
    dispatch({ type: "UPDATE_CONTENT", content: newContent });
    scheduleDebouncedSave();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center">
        <p className="text-muted">Loading note...</p>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="flex items-center justify-center">
        <p className="text-muted">Note not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <NoteEditor
        title={state.title}
        content={state.content}
        onTitleChange={handleTitleChange}
        onContentChange={handleContentChange}
        saving={updateNoteMutation.isPending}
        lastSaved={state.lastSaved}
        hasUnsavedChanges={state.hasUnsavedChanges}
      />

      <TagsManager
        noteId={noteId}
        noteTags={note.tags || []}
        loading={updateNoteMutation.isPending}
      />

      <LinksManager
        noteId={noteId}
        linkedNotes={relatedNotes}
        onLinksChange={() => { }}
        loading={updateNoteMutation.isPending}
      />
    </div>
  );
}
