import { eq, and } from "drizzle-orm";
import { db } from "../db";
import { tags, noteTags } from "../db/schema";

type Tag = {
  id: string;
  userId: string;
  name: string;
  color?: string;
  createdAt: Date;
};

export async function createTag(
  userId: string,
  name: string,
  color?: string
): Promise<Tag> {
  const result = await db
    .insert(tags)
    .values({
      userId,
      name,
      color,
    })
    .returning();

  const tag = result[0];

  return {
    id: tag.id,
    userId: tag.userId,
    name: tag.name,
    color: tag.color || undefined,
    createdAt: tag.createdAt,
  };
}

export async function listTags(userId: string): Promise<Tag[]> {
  const result = await db
    .select()
    .from(tags)
    .where(eq(tags.userId, userId));

  return result.map((tag) => ({
    id: tag.id,
    userId: tag.userId,
    name: tag.name,
    color: tag.color || undefined,
    createdAt: tag.createdAt,
  }));
}

export async function updateTag(
  userId: string,
  tagId: string,
  name?: string,
  color?: string
): Promise<Tag | null> {
  const existing = await db
    .select()
    .from(tags)
    .where(and(eq(tags.id, tagId), eq(tags.userId, userId)))
    .limit(1);

  if (existing.length === 0) {
    return null;
  }

  const updateData: any = {};
  if (name !== undefined) updateData.name = name;
  if (color !== undefined) updateData.color = color;

  if (Object.keys(updateData).length === 0) {
    const tag = existing[0];
    return {
      id: tag.id,
      userId: tag.userId,
      name: tag.name,
      color: tag.color || undefined,
      createdAt: tag.createdAt,
    };
  }

  await db.update(tags).set(updateData).where(eq(tags.id, tagId));

  const updated = await db
    .select()
    .from(tags)
    .where(eq(tags.id, tagId))
    .limit(1);

  const tag = updated[0];

  return {
    id: tag.id,
    userId: tag.userId,
    name: tag.name,
    color: tag.color || undefined,
    createdAt: tag.createdAt,
  };
}

export async function deleteTag(userId: string, tagId: string): Promise<boolean> {
  const existing = await db
    .select()
    .from(tags)
    .where(and(eq(tags.id, tagId), eq(tags.userId, userId)))
    .limit(1);

  if (existing.length === 0) {
    return false;
  }

  // Delete associations first
  await db.delete(noteTags).where(eq(noteTags.tagId, tagId));

  // Delete tag
  await db.delete(tags).where(eq(tags.id, tagId));

  return true;
}

export async function addTagToNote(noteId: string, tagId: string): Promise<boolean> {
  try {
    await db
      .insert(noteTags)
      .values({
        noteId,
        tagId,
      });
    return true;
  } catch {
    // Already exists
    return true;
  }
}

export async function removeTagFromNote(noteId: string, tagId: string): Promise<boolean> {
  await db
    .delete(noteTags)
    .where(and(eq(noteTags.noteId, noteId), eq(noteTags.tagId, tagId)));

  return true;
}
