import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import {
  fetchNotes,
  fetchNote,
  updateNote,
  createNote,
  deleteNote,
} from "../lib/api/notes";

type FetchNoteNoteId = Parameters<typeof fetchNote>[0];
type FetchNotesQuery = Parameters<typeof fetchNotes>[0];

// Query keys factory
export const noteKeys = {
  all: ["notes"] as const,
  list: (params: FetchNotesQuery) => [...noteKeys.all, "list", params] as const,
  detail: (id: FetchNoteNoteId) => [...noteKeys.all, "detail", id] as const,
};

// Query Hooks
export function useNotes(params: FetchNotesQuery) {
  return useQuery({
    queryKey: noteKeys.list(params),
    queryFn: () => fetchNotes(params),
    staleTime: 0,
    placeholderData: keepPreviousData,
  });
}

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
      queryClient.setQueryData(noteKeys.detail(data.id), data);
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
      queryClient.invalidateQueries({
        queryKey: noteKeys.all,
      });
    },
  });
}
