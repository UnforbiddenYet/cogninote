import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { NoteList } from "../../../components/notes/NoteList";

export const Route = createFileRoute("/app/notes/")({
  component: NotesPage,
});

type Note = {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  color?: string;
};

function NotesPage() {
  const navigate = useNavigate();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotes = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        navigate({ to: "/auth/login" });
        return;
      }

      try {
        const apiUrl = (typeof window !== "undefined" && (window as any).__API_URL__) || "http://localhost:3001";
        const response = await fetch(`${apiUrl}/api/notes?limit=50`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem("accessToken");
            navigate({ to: "/auth/login" });
          }
          return;
        }

        const data = await response.json();
        setNotes(data.data.notes);
      } catch (error) {
        console.error("Failed to fetch notes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Notes</h1>
          <p className="text-muted mt-1">Your personal note collection</p>
        </div>
        <button
          onClick={() => navigate({ to: "/app/notes/new" })}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Note
        </button>
      </div>

      <NoteList notes={notes} loading={loading} />
    </div>
  );
}
