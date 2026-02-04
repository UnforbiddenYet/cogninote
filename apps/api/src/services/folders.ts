import { eq, and, asc, desc, isNull, or } from "drizzle-orm";
import { db } from "../db";
import { folders, notes } from "../db/schema";

type Folder = {
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

type FolderWithNoteCount = Folder & {
  noteCount: number;
};

export async function createFolder(
  userId: string,
  name: string,
  color?: string,
  icon?: string,
  position?: number
): Promise<Folder> {
  // If position is not provided, insert at the top with max position + 1
  if (position === undefined) {
    const existingFolders = await db
      .select({ position: folders.position })
      .from(folders)
      .where(eq(folders.userId, userId))
      .orderBy(desc(folders.position))
      .limit(1);

    position = existingFolders.length > 0 ? existingFolders[0].position + 1 : 0;
  }

  const result = await db
    .insert(folders)
    .values({
      userId,
      name,
      color,
      icon,
      position,
      isExpanded: true,
    })
    .returning();

  const folder = result[0];

  return {
    id: folder.id,
    userId: folder.userId,
    name: folder.name,
    color: folder.color || undefined,
    icon: folder.icon || undefined,
    position: folder.position,
    isExpanded: folder.isExpanded,
    createdAt: folder.createdAt,
    updatedAt: folder.updatedAt,
  };
}

export async function listFolders(userId: string): Promise<Folder[]> {
  const result = await db
    .select()
    .from(folders)
    .where(eq(folders.userId, userId))
    .orderBy(desc(folders.position), desc(folders.createdAt));

  return result.map((folder) => ({
    id: folder.id,
    userId: folder.userId,
    name: folder.name,
    color: folder.color || undefined,
    icon: folder.icon || undefined,
    position: folder.position,
    isExpanded: folder.isExpanded,
    createdAt: folder.createdAt,
    updatedAt: folder.updatedAt,
  }));
}

export async function listFoldersWithCounts(
  userId: string
): Promise<FolderWithNoteCount[]> {
  const folderList = await listFolders(userId);

  const counts = await Promise.all(
    folderList.map(async (folder) => {
      const noteCount = await db
        .select()
        .from(notes)
        .where(and(eq(notes.userId, userId), eq(notes.folderId, folder.id)));

      return { ...folder, noteCount: noteCount.length };
    })
  );

  return counts;
}

export async function getFolder(
  userId: string,
  folderId: string
): Promise<Folder | null> {
  const result = await db
    .select()
    .from(folders)
    .where(and(eq(folders.id, folderId), eq(folders.userId, userId)))
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  const folder = result[0];

  return {
    id: folder.id,
    userId: folder.userId,
    name: folder.name,
    color: folder.color || undefined,
    icon: folder.icon || undefined,
    position: folder.position,
    isExpanded: folder.isExpanded,
    createdAt: folder.createdAt,
    updatedAt: folder.updatedAt,
  };
}

export async function updateFolder(
  userId: string,
  folderId: string,
  updates: {
    name?: string;
    color?: string;
    icon?: string;
    position?: number;
    isExpanded?: boolean;
  }
): Promise<Folder | null> {
  const existing = await getFolder(userId, folderId);

  if (!existing) {
    return null;
  }

  const updateData: any = {};
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.color !== undefined) updateData.color = updates.color;
  if (updates.icon !== undefined) updateData.icon = updates.icon;
  if (updates.position !== undefined) updateData.position = updates.position;
  if (updates.isExpanded !== undefined) updateData.isExpanded = updates.isExpanded;

  if (Object.keys(updateData).length === 0) {
    return existing;
  }

  updateData.updatedAt = new Date();

  await db.update(folders).set(updateData).where(eq(folders.id, folderId));

  const updated = await getFolder(userId, folderId);
  return updated;
}

export async function deleteFolder(userId: string, folderId: string): Promise<boolean> {
  const existing = await getFolder(userId, folderId);

  if (!existing) {
    return false;
  }

  // Move all notes in this folder to uncategorized (folderId = null)
  await db
    .update(notes)
    .set({ folderId: null })
    .where(and(eq(notes.userId, userId), eq(notes.folderId, folderId)));

  // Delete folder
  await db.delete(folders).where(eq(folders.id, folderId));

  return true;
}

export async function moveNoteToFolder(
  userId: string,
  noteId: string,
  folderId: string | null
): Promise<boolean> {
  // Verify note belongs to user
  const note = await db
    .select()
    .from(notes)
    .where(and(eq(notes.id, noteId), eq(notes.userId, userId)))
    .limit(1);

  if (note.length === 0) {
    return false;
  }

  // If folderId is provided, verify it belongs to user
  if (folderId) {
    const folder = await getFolder(userId, folderId);
    if (!folder) {
      return false;
    }
  }

  await db
    .update(notes)
    .set({ folderId })
    .where(eq(notes.id, noteId));

  return true;
}

export async function getFolderNotes(
  userId: string,
  folderId: string | null,
  limit?: number,
  offset?: number
): Promise<
  Array<{
    id: string;
    title: string;
    createdAt: Date;
    updatedAt: Date;
  }>
> {
  // Handle null folderId case (uncategorized notes)
  const whereCondition =
    folderId === null
      ? and(eq(notes.userId, userId), isNull(notes.folderId))
      : and(eq(notes.userId, userId), eq(notes.folderId, folderId));

  let query: any = db
    .select({
      id: notes.id,
      title: notes.title,
      createdAt: notes.createdAt,
      updatedAt: notes.updatedAt,
    })
    .from(notes)
    .where(whereCondition);

  if (limit) {
    query = query.limit(limit);
  }

  if (offset) {
    query = query.offset(offset);
  }

  const result = await query;
  return result;
}

export async function getUncategorizedNoteCount(userId: string): Promise<number> {
  const result = await db
    .select()
    .from(notes)
    .where(and(eq(notes.userId, userId), isNull(notes.folderId)));

  return result.length;
}
