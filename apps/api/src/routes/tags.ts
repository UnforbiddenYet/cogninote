import { Hono } from "hono";
import { z } from "zod";
import {
  createTag,
  listTags,
  updateTag,
  deleteTag,
  addTagToNote,
  removeTagFromNote,
} from "../services/tags";
import { requireAuth } from "../lib/middleware/auth";

const app = new Hono();

const createTagSchema = z.object({
  name: z.string().min(1, "Name required"),
  color: z.string().optional(),
});

const updateTagSchema = z.object({
  name: z.string().min(1).optional(),
  color: z.string().optional(),
});

// GET /api/tags
app.get("/", requireAuth(), async (c: any) => {
  try {
    const userId = c.get("userId");
    const tags = await listTags(userId);

    return c.json({
      success: true,
      data: { tags },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list tags";
    return c.json({ success: false, error: message }, 500);
  }
});

// POST /api/tags
app.post("/", requireAuth(), async (c: any) => {
  try {
    const userId = c.get("userId");
    const body = await c.req.json();
    const data = createTagSchema.parse(body);

    const tag = await createTag(userId, data.name, data.color);

    return c.json({
      success: true,
      data: { tag },
    }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json(
        { success: false, error: "Validation error", details: error.errors },
        400
      );
    }
    const message = error instanceof Error ? error.message : "Failed to create tag";
    return c.json({ success: false, error: message }, 500);
  }
});

// PATCH /api/tags/:id
app.patch("/:id", requireAuth(), async (c: any) => {
  try {
    const userId = c.get("userId");
    const tagId = c.req.param("id");
    const body = await c.req.json();
    const data = updateTagSchema.parse(body);

    const tag = await updateTag(userId, tagId, data.name, data.color);

    if (!tag) {
      return c.json({ success: false, error: "Tag not found" }, 404);
    }

    return c.json({
      success: true,
      data: { tag },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json(
        { success: false, error: "Validation error", details: error.errors },
        400
      );
    }
    const message = error instanceof Error ? error.message : "Failed to update tag";
    return c.json({ success: false, error: message }, 500);
  }
});

// DELETE /api/tags/:id
app.delete("/:id", requireAuth(), async (c: any) => {
  try {
    const userId = c.get("userId");
    const tagId = c.req.param("id");

    const deleted = await deleteTag(userId, tagId);

    if (!deleted) {
      return c.json({ success: false, error: "Tag not found" }, 404);
    }

    return c.json({
      success: true,
      message: "Tag deleted",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete tag";
    return c.json({ success: false, error: message }, 500);
  }
});

// POST /api/tags/:tagId/notes/:noteId
app.post("/:tagId/notes/:noteId", requireAuth(), async (c: any) => {
  try {
    const noteId = c.req.param("noteId");
    const tagId = c.req.param("tagId");

    await addTagToNote(noteId, tagId);

    return c.json({
      success: true,
      message: "Tag added to note",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to add tag";
    return c.json({ success: false, error: message }, 500);
  }
});

// DELETE /api/tags/:tagId/notes/:noteId
app.delete("/:tagId/notes/:noteId", requireAuth(), async (c: any) => {
  try {
    const noteId = c.req.param("noteId");
    const tagId = c.req.param("tagId");

    await removeTagFromNote(noteId, tagId);

    return c.json({
      success: true,
      message: "Tag removed from note",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to remove tag";
    return c.json({ success: false, error: message }, 500);
  }
});

export default app;
