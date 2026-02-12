import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchNote,
  updateNote,
  createNote,
  deleteNote,
} from "../lib/api/notes";

type FetchNoteNoteId = Parameters<typeof fetchNote>[0];

// Query keys factory
export const noteKeys = {
  all: ["notes"] as const,
  detail: (id: FetchNoteNoteId) => [...noteKeys.all, "detail", id] as const,
};

// Query Hooks
export function useNote(noteId: FetchNoteNoteId) {
  return useQuery({
    queryKey: noteKeys.detail(noteId),
    queryFn: () => fetchNote(noteId),
    enabled: !!noteId,
  });
}

// Mutation Hooks
export function useUpdateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateNote,
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
    mutationFn: createNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: noteKeys.all });
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteNote,
    onSuccess: () => {
      // Invalidate all notes queries
      queryClient.invalidateQueries({
        queryKey: noteKeys.all,
      });
    },
  });
}
