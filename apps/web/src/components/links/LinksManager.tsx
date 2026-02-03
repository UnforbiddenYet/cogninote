import { useState, useEffect } from "react";
import { NoteSearchDialog } from "./NoteSearchDialog";
import { LinkedNotesList } from "./LinkedNotesList";

type LinkedNote = {
  id: string;
  linkId: string;
  title: string;
  linkType: "manual" | "ai_suggested" | "bidirectional";
};

type LinksManagerProps = {
  noteId: string;
  linkedNotes?: LinkedNote[];
  onLinksChange?: (notes: LinkedNote[]) => void;
  loading?: boolean;
};

export function LinksManager({
  noteId,
  linkedNotes = [],
  onLinksChange,
  loading = false,
}: LinksManagerProps) {
  const [links, setLinks] = useState<LinkedNote[]>(linkedNotes);

  useEffect(() => {
    setLinks(linkedNotes);
  }, [linkedNotes]);

  const handleLinkNote = async (note: { id: string; title: string }) => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    try {
      const apiUrl =
        (typeof window !== "undefined" && (window as any).__API_URL__) ||
        "http://localhost:3001";
      const response = await fetch(`${apiUrl}/api/links`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sourceNoteId: noteId,
          targetNoteId: note.id,
          linkType: "manual",
          strength: 1.0,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const newLink: LinkedNote = {
          id: note.id,
          linkId: data.data.link.id,
          title: note.title,
          linkType: "manual",
        };
        const updatedLinks = [...links, newLink];
        setLinks(updatedLinks);
        onLinksChange?.(updatedLinks);
      }
    } catch (error) {
      console.error("Failed to create link:", error);
    }
  };

  const handleRemoveLink = async (linkId: string) => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    try {
      const apiUrl =
        (typeof window !== "undefined" && (window as any).__API_URL__) ||
        "http://localhost:3001";
      await fetch(`${apiUrl}/api/links/${linkId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const updatedLinks = links.filter((l) => l.linkId !== linkId);
      setLinks(updatedLinks);
      onLinksChange?.(updatedLinks);
    } catch (error) {
      console.error("Failed to remove link:", error);
    }
  };

  const linkedNoteIds = links.map((l) => l.id);

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-foreground">
        Linked Notes
      </label>

      <NoteSearchDialog
        onSelect={handleLinkNote}
        excludeNoteIds={[noteId, ...linkedNoteIds]}
      />

      <LinkedNotesList
        linkedNotes={links}
        onRemoveLink={handleRemoveLink}
        loading={loading}
      />
    </div>
  );
}
