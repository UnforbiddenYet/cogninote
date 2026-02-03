import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { NoteEditor } from "../../../components/editor/NoteEditor";

export const Route = createFileRoute("/app/notes/new")({
  component: NewNote,
});

function NewNote() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [noteId, setNoteId] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const saveTimer = useRef<NodeJS.Timeout>();
  const creationAttempted = useRef(false);

  const createNote = async (noteTitle: string, noteContent: string) => {
    console.log("Creating note with:", { noteTitle, noteContent });
    setSaving(true);
    const token = localStorage.getItem("accessToken");

    try {
      const apiUrl = (typeof window !== "undefined" && (window as any).__API_URL__) || "http://localhost:3001";
      console.log("API URL:", apiUrl);
      const response = await fetch(`${apiUrl}/api/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: noteTitle || "Untitled",
          content: noteContent,
        }),
      });

      console.log("Response status:", response.status);
      if (!response.ok) {
        console.error("Failed to create note:", response.status, response.statusText);
        return null;
      }

      const data = await response.json();
      console.log("Note created - full response:", data);
      const id = data.data?.note?.id;
      console.log("Extracted ID:", id);
      if (!id) {
        console.error("No ID in response:", data);
      }
      return id;
    } catch (error) {
      console.error("Failed to create note - catch error:", error);
      return null;
    } finally {
      setSaving(false);
    }
  };

  const attemptNoteCreation = async (currentTitle: string, currentContent: string) => {
    // Only create if both title and content are present and we haven't tried yet
    if (!noteId && currentTitle.trim() && currentContent.trim() && !creationAttempted.current) {
      console.log("Attempting to create note with both title and content");
      creationAttempted.current = true;
      const newNoteId = await createNote(currentTitle, currentContent);
      console.log("Got newNoteId:", newNoteId);
      if (newNoteId) {
        console.log("Navigating to note:", newNoteId);
        setNoteId(newNoteId);
        setLastSaved(new Date());
        setHasUnsavedChanges(false);
        // Navigate and preserve editor state via search params
        navigate({
          to: `/app/notes/${newNoteId}`,
          search: {
            initialTitle: currentTitle,
            initialContent: currentContent,
          },
        });
      } else {
        console.error("newNoteId is falsy:", newNoteId);
        creationAttempted.current = false; // Reset so they can try again
      }
    }
  };

  const handleTitleChange = (newTitle: string) => {
    console.log("handleTitleChange called with:", newTitle);
    setTitle(newTitle);
    setHasUnsavedChanges(true);

    // Create note only if we have both title and content
    attemptNoteCreation(newTitle, content);
  };

  const handleContentChange = (newContent: string) => {
    console.log("handleContentChange called");
    setContent(newContent);
    setHasUnsavedChanges(true);

    // Create note only if we have both title and content
    attemptNoteCreation(title, newContent);

    // Debounce save if note already exists
    if (noteId) {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
      }
      saveTimer.current = setTimeout(async () => {
        const token = localStorage.getItem("accessToken");
        try {
          const apiUrl = (typeof window !== "undefined" && (window as any).__API_URL__) || "http://localhost:3001";
          await fetch(`${apiUrl}/api/notes/${noteId}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              title,
              content: newContent,
            }),
          });
          setLastSaved(new Date());
          setHasUnsavedChanges(false);
        } catch (error) {
          console.error("Failed to save note:", error);
        }
        setSaving(false);
      }, 2000);
    }
  };

  useEffect(() => {
    return () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
      }
    };
  }, []);

  return (
    <div className="space-y-4">
      <NoteEditor
        title={title}
        content={content}
        onTitleChange={handleTitleChange}
        onContentChange={handleContentChange}
        saving={saving}
        lastSaved={lastSaved}
        hasUnsavedChanges={hasUnsavedChanges}
      />
    </div>
  );
}
