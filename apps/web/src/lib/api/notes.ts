import { apiRequest } from "./apiClient";

export type Note = {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
};

export async function fetchNote(noteId: string): Promise<Note> {
  const result = await apiRequest<{
    success: boolean;
    data: { note: Note };
  }>(`/api/notes/${noteId}`);
  return result.data.note;
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
): Promise<Note> {
  const result = await apiRequest<{
    success: boolean;
    data: { note: Note };
  }>("/api/notes", {
    method: "POST",
    body: JSON.stringify({ title, content }),
  });
  return result.data.note;
}

export async function deleteNote(noteId: string): Promise<void> {
  await apiRequest(`/api/notes/${noteId}`, { method: "DELETE" });
}
