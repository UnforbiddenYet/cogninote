import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchFolders,
  createFolder as createFolderAPI,
  updateFolder as updateFolderAPI,
  deleteFolder as deleteFolderAPI,
  getFolderNotes as getFolderNotesAPI,
  moveNoteToFolder as moveNoteToFolderAPI,
  type Folder,
  type FolderWithNoteCount,
  type FolderNote,
} from "../lib/api/folders";

// Query keys factory
export const folderKeys = {
  all: ["folders"] as const,
  list: () => [...folderKeys.all, "list"] as const,
  detail: (id: string) => [...folderKeys.all, "detail", id] as const,
  notes: (id: string | null) => [...folderKeys.all, "notes", id] as const,
};

// Query Hooks
export function useFolders() {
  return useQuery({
    queryKey: folderKeys.list(),
    queryFn: () => fetchFolders(),
    placeholderData: (previousData) => previousData,
  });
}

export function useGetFolderNotes(
  folderId: string | null | undefined,
  limit?: number,
  offset?: number
) {
  return useQuery({
    queryKey: folderKeys.notes(folderId ?? null),
    queryFn: () => getFolderNotesAPI(folderId ?? null, limit, offset),
    enabled: folderId !== undefined,
  });
}

// Mutation Hooks
export function useCreateFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ name, color, icon, position }: { name: string; color?: string; icon?: string; position?: number }) =>
      createFolderAPI(name, color, icon, position),
    onMutate: async ({ name, color, icon }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: folderKeys.list() });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData(folderKeys.list());

      // Optimistically add the new folder
      queryClient.setQueryData(folderKeys.list(), (old: any) => {
        if (!old) return old;

        const maxPosition = old.folders.length > 0 ? Math.max(...old.folders.map((f: FolderWithNoteCount) => f.position)) : -1;
        const newPosition = maxPosition + 1;

        // Create optimistic folder with temporary ID
        const optimisticFolder: FolderWithNoteCount = {
          id: `temp-${Date.now()}`,
          userId: 'temp',
          name,
          color,
          icon,
          position: newPosition,
          isExpanded: true,
          noteCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        return {
          ...old,
          folders: [optimisticFolder, ...old.folders],
        };
      });

      // Return context with previous data
      return { previousData };
    },
    onSuccess: (data, variables) => {
      // Replace the optimistic folder with the real one
      queryClient.setQueryData(folderKeys.list(), (old: any) => {
        if (!old) return old;

        return {
          ...old,
          folders: old.folders.map((f: FolderWithNoteCount) =>
            f.id.startsWith('temp-') && f.name === variables.name
              ? { ...data, noteCount: 0 } // Replace temp with real folder
              : f
          ),
        };
      });
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(folderKeys.list(), context.previousData);
      }
    },
  });
}

export function useUpdateFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ folderId, updates }: { folderId: string; updates: Partial<Folder> }) =>
      updateFolderAPI(folderId, updates as any),
    onMutate: async ({ folderId, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: folderKeys.list() });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData(folderKeys.list());

      // Optimistically update to the new value
      queryClient.setQueryData(folderKeys.list(), (old: any) => {
        if (!old) return old;

        return {
          ...old,
          folders: old.folders.map((folder: FolderWithNoteCount) =>
            folder.id === folderId
              ? { ...folder, ...updates, updatedAt: new Date() }
              : folder
          ),
        };
      });

      // Return context with previous data
      return { previousData };
    },
    onSuccess: (data, variables) => {
      // Update with real data from server without triggering refetch
      queryClient.setQueryData(folderKeys.list(), (old: any) => {
        if (!old) return old;

        return {
          ...old,
          folders: old.folders.map((folder: FolderWithNoteCount) =>
            folder.id === variables.folderId
              ? { ...folder, ...data }
              : folder
          ),
        };
      });
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(folderKeys.list(), context.previousData);
      }
    },
  });
}

export function useDeleteFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (folderId: string) => deleteFolderAPI(folderId),
    onSuccess: () => {
      // Invalidate folders list
      queryClient.invalidateQueries({
        queryKey: folderKeys.list(),
      });
    },
  });
}

export function useMoveNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ noteId, folderId }: { noteId: string; folderId: string | null }) =>
      moveNoteToFolderAPI(noteId, folderId),
    onSuccess: () => {
      // Invalidate all folder-related queries
      queryClient.invalidateQueries({
        queryKey: folderKeys.all,
      });
    },
  });
}
