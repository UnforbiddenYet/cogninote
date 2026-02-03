import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { NoteEditor } from "../../../components/editor/NoteEditor";

export const Route = createFileRoute("/app/notes/$noteId")({
  component: NoteDetail,
});

type Note = {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
};

function NoteDetail() {
  const { noteId } = Route.useParams();
  const navigate = useNavigate();
  const [note, setNote] = useState<Note | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const saveTimer = useRef<NodeJS.Timeout>();

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
        setTitle(data.data.note.title);
        setContent(data.data.note.content);
      } catch (error) {
        console.error("Failed to fetch note:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNote();
  }, [noteId]);

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
      }
    } catch (error) {
      console.error("Failed to save note:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);

    // Debounce save
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
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate({ to: "/app/notes" })}
          className="text-primary hover:underline"
        >
          ← Back to notes
        </button>
        <button
          onClick={() => {
            if (saveTimer.current) {
              clearTimeout(saveTimer.current);
            }
            handleSave();
          }}
          disabled={saving}
          className="btn-primary"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>

      <NoteEditor
        title={title}
        content={content}
        onTitleChange={setTitle}
        onContentChange={handleContentChange}
        saving={saving}
      />
    </div>
  );
}
