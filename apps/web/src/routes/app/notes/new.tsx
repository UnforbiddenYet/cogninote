import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { NoteEditor } from "../../../components/editor/NoteEditor";

export const Route = createFileRoute("/app/notes/new")({
  component: NewNote,
});

function NewNote() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    if (!title.trim() || !content.trim()) {
      setError("Title and content are required");
      return;
    }

    setSaving(true);
    setError("");
    const token = localStorage.getItem("accessToken");

    try {
      const apiUrl = (typeof window !== "undefined" && (window as any).__API_URL__) || "http://localhost:3001";
      const response = await fetch(`${apiUrl}/api/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          content,
        }),
      });

      if (!response.ok) {
        setError("Failed to create note");
        return;
      }

      const data = await response.json();
      navigate({ to: `/app/notes/$${data.data.note.id}` });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create note");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Create Note</h1>
        <button
          onClick={() => navigate({ to: "/app/notes" })}
          className="text-primary hover:underline"
        >
          Cancel
        </button>
      </div>

      {error && (
        <div className="card bg-red-50 text-red-800 text-sm">{error}</div>
      )}

      <NoteEditor
        title={title}
        content={content}
        onTitleChange={setTitle}
        onContentChange={setContent}
        saving={saving}
      />

      <button
        onClick={handleCreate}
        disabled={saving || !title.trim()}
        className="btn-primary w-full"
      >
        {saving ? "Creating..." : "Create Note"}
      </button>
    </div>
  );
}
