import { eq, and, or } from "drizzle-orm";
import { db } from "../db";
import { links } from "../db/schema";

type LinkType = "manual" | "ai_suggested" | "bidirectional";

type Link = {
  id: string;
  userId: string;
  sourceNoteId: string;
  targetNoteId: string;
  linkType: LinkType;
  strength: number;
  createdAt: Date;
};

export async function createLink(
  userId: string,
  sourceNoteId: string,
  targetNoteId: string,
  linkType: LinkType = "manual",
  strength: number = 1.0
): Promise<Link> {
  // Prevent self-links
  if (sourceNoteId === targetNoteId) {
    throw new Error("Cannot link a note to itself");
  }

  const result = await db
    .insert(links)
    .values({
      userId,
      sourceNoteId,
      targetNoteId,
      linkType,
      strength,
    })
    .returning();

  const link = result[0];

  return {
    id: link.id,
    userId: link.userId,
    sourceNoteId: link.sourceNoteId,
    targetNoteId: link.targetNoteId,
    linkType: link.linkType as LinkType,
    strength: (link.strength as number) || 1.0,
    createdAt: link.createdAt,
  };
}

export async function listLinksForUser(userId: string): Promise<Link[]> {
  const result = await db
    .select()
    .from(links)
    .where(eq(links.userId, userId));

  return result.map((link) => ({
    id: link.id,
    userId: link.userId,
    sourceNoteId: link.sourceNoteId,
    targetNoteId: link.targetNoteId,
    linkType: link.linkType as LinkType,
    strength: (link.strength as number) || 1.0,
    createdAt: link.createdAt,
  }));
}

export async function getRelatedNotes(
  userId: string,
  noteId: string
): Promise<Array<{ id: string; title: string; linkType: LinkType }>> {
  const result = await db
    .select({
      id: links.targetNoteId,
      title: links.targetNoteId,
      linkType: links.linkType,
    })
    .from(links)
    .where(and(eq(links.userId, userId), eq(links.sourceNoteId, noteId)));

  return result.map((r) => ({
    id: r.id,
    title: r.title,
    linkType: r.linkType as LinkType,
  }));
}

export async function deleteLink(userId: string, linkId: string): Promise<boolean> {
  await db
    .delete(links)
    .where(and(eq(links.id, linkId), eq(links.userId, userId)));

  return true;
}

export async function updateLink(
  userId: string,
  linkId: string,
  linkType?: LinkType,
  strength?: number
): Promise<Link | null> {
  const existing = await db
    .select()
    .from(links)
    .where(and(eq(links.id, linkId), eq(links.userId, userId)))
    .limit(1);

  if (existing.length === 0) {
    return null;
  }

  const updateData: any = {};
  if (linkType !== undefined) updateData.linkType = linkType;
  if (strength !== undefined) updateData.strength = strength;

  if (Object.keys(updateData).length > 0) {
    await db.update(links).set(updateData).where(eq(links.id, linkId));
  }

  const updated = await db
    .select()
    .from(links)
    .where(eq(links.id, linkId))
    .limit(1);

  const link = updated[0];

  return {
    id: link.id,
    userId: link.userId,
    sourceNoteId: link.sourceNoteId,
    targetNoteId: link.targetNoteId,
    linkType: link.linkType as LinkType,
    strength: link.strength || 1.0,
    createdAt: link.createdAt,
  };
}
