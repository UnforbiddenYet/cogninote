import { apiRequest } from "./apiClient";

export type Folder = {
  id: string;
  userId: string;
  name: string;
  color?: string;
  icon?: string;
  position: number;
  isExpanded: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type FolderWithNoteCount = Folder & {
  noteCount: number;
};

export type FolderNote = {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
};

export async function fetchFolders(): Promise<{
  folders: FolderWithNoteCount[];
  uncategorizedCount: number;
}> {
  const result = await apiRequest<{
    success: boolean;
    data: { folders: FolderWithNoteCount[]; uncategorizedCount: number };
  }>("/api/folders");
  return result.data;
}

export async function createFolder(
  name: string,
  color?: string,
  icon?: string,
  position?: number
): Promise<Folder> {
  const result = await apiRequest<{ success: boolean; data: { folder: Folder } }>(
    "/api/folders",
    {
      method: "POST",
      body: JSON.stringify({ name, color, icon, position }),
    }
  );
  return result.data.folder;
}

export async function updateFolder(
  folderId: string,
  updates: {
    name?: string;
    color?: string;
    icon?: string;
    position?: number;
    isExpanded?: boolean;
  }
): Promise<Folder> {
  const result = await apiRequest<{ success: boolean; data: { folder: Folder } }>(
    `/api/folders/${folderId}`,
    {
      method: "PATCH",
      body: JSON.stringify(updates),
    }
  );
  return result.data.folder;
}

export async function deleteFolder(folderId: string): Promise<void> {
  await apiRequest(`/api/folders/${folderId}`, { method: "DELETE" });
}

export async function getFolderNotes(
  folderId: string | null,
  limit?: number,
  offset?: number
): Promise<FolderNote[]> {
  const endpoint =
    folderId === null
      ? "/api/notes/uncategorized"
      : `/api/folders/${folderId}/notes`;

  const params = new URLSearchParams();
  if (limit) params.append("limit", String(limit));
  if (offset) params.append("offset", String(offset));

  const path = params.toString() ? `${endpoint}?${params}` : endpoint;

  const result = await apiRequest<{
    success: boolean;
    data: { notes: FolderNote[] };
  }>(path);
  return result.data.notes;
}

export async function moveNoteToFolder(
  noteId: string,
  folderId: string | null
): Promise<void> {
  await apiRequest("/api/folders/move-note", {
    method: "POST",
    body: JSON.stringify({ noteId, folderId }),
  });
}
