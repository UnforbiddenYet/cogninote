import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { NoteEditor } from "../../../components/editor/NoteEditor";
import { TagsManager } from "../../../components/tags/TagsManager";
import { LinksManager } from "../../../components/links/LinksManager";

export const Route = createFileRoute("/app/notes/$noteId")({
  component: NoteDetail,
});

type Tag = {
  id: string;
  name: string;
  color?: string;
};

type LinkedNote = {
  id: string;
  linkId: string;
  title: string;
  linkType: "manual" | "ai_suggested" | "bidirectional";
};

type Note = {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  tags?: Tag[];
};

function NoteDetail() {
  const { noteId } = Route.useParams();
  const search = Route.useSearch() as any;
  const initialTitle = search?.initialTitle || "";
  const initialContent = search?.initialContent || "";
  const navigate = useNavigate();
  const [note, setNote] = useState<Note | null>(null);
  const [title, setTitle] = useState(initialTitle || "");
  const [content, setContent] = useState(initialContent || "");
  const [linkedNotes, setLinkedNotes] = useState<LinkedNote[]>([]);
  const [loading, setLoading] = useState(!initialTitle && !initialContent);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const saveTimer = useRef<NodeJS.Timeout>();
  const periodicSaveTimer = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const fetchNote = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        navigate({ to: "/auth/login" });
        return;
      }

      try {
        const apiUrl = (typeof window !== "undefined" && (window as any).__API_URL__) || "http://localhost:3001";
        const response = await fetch(`${apiUrl}/api/notes/${noteId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 404) {
            navigate({ to: "/app/notes" });
          }
          return;
        }

        const data = await response.json();
        setNote(data.data.note);

        // Only update if we don't have initial content (preserve editor state from creation)
        if (!initialTitle && !initialContent) {
          setTitle(data.data.note.title);
          setContent(data.data.note.content);
        }

        // Fetch linked notes
        const relatedResponse = await fetch(`${apiUrl}/api/notes/${noteId}/related`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (relatedResponse.ok) {
          const relatedData = await relatedResponse.json();
          const links = (relatedData.data.relatedNotes || []).map((note: any) => ({
            id: note.id,
            linkId: note.id, // Note: API should return linkId
            title: note.title,
            linkType: note.linkType,
          }));
          setLinkedNotes(links);
        }

        // Clean up search params after note is loaded
        if (initialTitle || initialContent) {
          navigate({ to: `/app/notes/${noteId}`, replace: true });
        }
      } catch (error) {
        console.error("Failed to fetch note:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNote();
  }, [noteId]);

  // Periodic auto-save every 30 seconds
  useEffect(() => {
    periodicSaveTimer.current = setInterval(() => {
      if (hasUnsavedChanges && note && title.trim()) {
        handleSave();
      }
    }, 30000); // Save every 30 seconds

    return () => {
      if (periodicSaveTimer.current) {
        clearInterval(periodicSaveTimer.current);
      }
    };
  }, [hasUnsavedChanges, note, title]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
      }
      if (periodicSaveTimer.current) {
        clearInterval(periodicSaveTimer.current);
      }
    };
  }, []);

  const handleSave = async () => {
    if (!note || !title.trim()) return;

    setSaving(true);
    const token = localStorage.getItem("accessToken");

    try {
      const apiUrl = (typeof window !== "undefined" && (window as any).__API_URL__) || "http://localhost:3001";
      const response = await fetch(`${apiUrl}/api/notes/${noteId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          content,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setNote(data.data.note);
        setLastSaved(new Date());
        setHasUnsavedChanges(false);
      }
    } catch (error) {
      console.error("Failed to save note:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    setHasUnsavedChanges(true);

    // Debounce save on content change
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
    }
    saveTimer.current = setTimeout(handleSave, 2000);
  };

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    setHasUnsavedChanges(true);

    // Debounce save on title change
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
    }
    saveTimer.current = setTimeout(handleSave, 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center">
        <p className="text-muted">Loading note...</p>
      </div>
    );
  }

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

      <TagsManager
        noteId={noteId}
        noteTags={note?.tags || []}
        loading={saving}
      />

      <LinksManager
        noteId={noteId}
        linkedNotes={linkedNotes}
        onLinksChange={setLinkedNotes}
        loading={saving}
      />
    </div>
  );
}
