import { apiRequest } from "./apiClient";

export type Tag = {
  id: string;
  name: string;
  color?: string;
};

export type Note = {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  tags?: Tag[];
};

export type LinkedNote = {
  id: string;
  linkId: string;
  title: string;
  linkType: "manual" | "ai_suggested" | "bidirectional";
};

export async function fetchNote(noteId: string): Promise<Note> {
  const result = await apiRequest<{
    success: boolean;
    data: { note: Note };
  }>(`/api/notes/${noteId}`);
  return result.data.note;
}

export async function fetchRelatedNotes(noteId: string): Promise<LinkedNote[]> {
  const result = await apiRequest<{
    success: boolean;
    data: { relatedNotes: LinkedNote[] };
  }>(`/api/notes/${noteId}/related`);
  return result.data.relatedNotes || [];
}

export async function updateNote(
  noteId: string,
  updates: { title?: string; content?: string }
): Promise<Note> {
  const result = await apiRequest<{
    success: boolean;
    data: { note: Note };
  }>(`/api/notes/${noteId}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
  return result.data.note;
}

export async function createNote(
  title: string,
  content?: string,
  folderId?: string
): Promise<Note> {
  const result = await apiRequest<{
    success: boolean;
    data: { note: Note };
  }>("/api/notes", {
    method: "POST",
    body: JSON.stringify({ title, content, folderId }),
  });
  return result.data.note;
}

export async function deleteNote(noteId: string): Promise<void> {
  await apiRequest(`/api/notes/${noteId}`, { method: "DELETE" });
}
