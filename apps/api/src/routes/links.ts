import { Hono } from "hono";
import { z } from "zod";
import {
  createLink,
  listLinksForUser,
  deleteLink,
  updateLink,
} from "../services/links";
import { requireAuth } from "../lib/middleware/auth";

const app = new Hono();

const linkTypeEnum = z.enum(["manual", "ai_suggested", "bidirectional"]);

const createLinkSchema = z.object({
  sourceNoteId: z.string().uuid("Invalid source note ID"),
  targetNoteId: z.string().uuid("Invalid target note ID"),
  linkType: linkTypeEnum.default("manual"),
  strength: z.number().min(0).max(1).default(1.0),
});

const updateLinkSchema = z.object({
  linkType: linkTypeEnum.optional(),
  strength: z.number().min(0).max(1).optional(),
});

// GET /api/links
app.get("/", requireAuth(), async (c: any) => {
  try {
    const userId = c.get("userId");
    const links = await listLinksForUser(userId);

    return c.json({
      success: true,
      data: { links },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list links";
    return c.json({ success: false, error: message }, 500);
  }
});

// POST /api/links
app.post("/", requireAuth(), async (c: any) => {
  try {
    const userId = c.get("userId");
    const body = await c.req.json();
    const data = createLinkSchema.parse(body);

    const link = await createLink(
      userId,
      data.sourceNoteId,
      data.targetNoteId,
      data.linkType,
      data.strength
    );

    return c.json({
      success: true,
      data: { link },
    }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json(
        { success: false, error: "Validation error", details: error.errors },
        400
      );
    }
    const message = error instanceof Error ? error.message : "Failed to create link";
    return c.json({ success: false, error: message }, 500);
  }
});

// PATCH /api/links/:id
app.patch("/:id", requireAuth(), async (c: any) => {
  try {
    const userId = c.get("userId");
    const linkId = c.req.param("id");
    const body = await c.req.json();
    const data = updateLinkSchema.parse(body);

    const link = await updateLink(userId, linkId, data.linkType, data.strength);

    if (!link) {
      return c.json({ success: false, error: "Link not found" }, 404);
    }

    return c.json({
      success: true,
      data: { link },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json(
        { success: false, error: "Validation error", details: error.errors },
        400
      );
    }
    const message = error instanceof Error ? error.message : "Failed to update link";
    return c.json({ success: false, error: message }, 500);
  }
});

// DELETE /api/links/:id
app.delete("/:id", requireAuth(), async (c: any) => {
  try {
    const userId = c.get("userId");
    const linkId = c.req.param("id");

    const deleted = await deleteLink(userId, linkId);

    if (!deleted) {
      return c.json({ success: false, error: "Link not found" }, 404);
    }

    return c.json({
      success: true,
      message: "Link deleted",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete link";
    return c.json({ success: false, error: message }, 500);
  }
});

export default app;
