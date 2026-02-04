import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchNote,
  fetchRelatedNotes,
  updateNote,
  createNote,
  deleteNote,
} from "../lib/api/notes";

// Query keys factory
export const noteKeys = {
  all: ["notes"] as const,
  detail: (id: string) => [...noteKeys.all, "detail", id] as const,
  related: (id: string) => [...noteKeys.all, "related", id] as const,
};

// Query Hooks
export function useNote(noteId: string) {
  return useQuery({
    queryKey: noteKeys.detail(noteId),
    queryFn: () => fetchNote(noteId),
    enabled: !!noteId,
  });
}

export function useRelatedNotes(noteId: string) {
  return useQuery({
    queryKey: noteKeys.related(noteId),
    queryFn: () => fetchRelatedNotes(noteId),
    enabled: !!noteId,
  });
}

// Mutation Hooks
export function useUpdateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      noteId,
      updates,
    }: {
      noteId: string;
      updates: { title?: string; content?: string };
    }) => updateNote(noteId, updates),
    onSuccess: (data) => {
      // Invalidate the specific note query
      queryClient.invalidateQueries({
        queryKey: noteKeys.detail(data.id),
      });
    },
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      title,
      content,
      folderId,
    }: {
      title: string;
      content?: string;
      folderId?: string;
    }) => createNote(title, content, folderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: noteKeys.all });
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (noteId: string) => deleteNote(noteId),
    onSuccess: () => {
      // Invalidate all notes queries
      queryClient.invalidateQueries({
        queryKey: noteKeys.all,
      });
    },
  });
}
