import { Hono } from "hono";
import { z } from "zod";
import {
  createNote,
  getNoteById,
  listNotes,
  updateNote,
  deleteNote,
  getUncategorizedNotes,
} from "../services/notes";
import { getRelatedNotes } from "../services/links";
import { requireAuth } from "../lib/middleware/auth";

const app = new Hono();

const createNoteSchema = z.object({
  title: z.string().min(1, "Title required"),
  content: z.string().min(1, "Content required"),
  color: z.string().optional(),
  folderId: z.string().uuid().optional(),
});

const updateNoteSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  color: z.string().optional(),
  isArchived: z.boolean().optional(),
  folderId: z.string().uuid().nullable().optional(),
});

// GET /api/notes/uncategorized
app.get("/uncategorized", requireAuth(), async (c: any) => {
  try {
    const userId = c.get("userId");
    const limit = Math.min(parseInt(c.req.query("limit") || "100"), 100);
    const offset = parseInt(c.req.query("offset") || "0");

    const { notes, total } = await getUncategorizedNotes(userId, limit, offset);

    return c.json({
      success: true,
      data: { notes, total, limit, offset },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list uncategorized notes";
    return c.json({ success: false, error: message }, 500);
  }
});

// GET /api/notes
app.get("/", requireAuth(), async (c: any) => {
  try {
    const userId = c.get("userId");
    const limit = Math.min(parseInt(c.req.query("limit") || "20"), 100);
    const offset = parseInt(c.req.query("offset") || "0");

    const { notes, total } = await listNotes(userId, limit, offset);

    return c.json({
      success: true,
      data: { notes, total, limit, offset },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list notes";
    return c.json({ success: false, error: message }, 500);
  }
});

// POST /api/notes
app.post("/", requireAuth(), async (c: any) => {
  try {
    const userId = c.get("userId");
    const body = await c.req.json();
    const data = createNoteSchema.parse(body);

    const note = await createNote(userId, data);

    return c.json({
      success: true,
      data: { note },
    }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json(
        { success: false, error: "Validation error", details: error.errors },
        400
      );
    }
    const message = error instanceof Error ? error.message : "Failed to create note";
    return c.json({ success: false, error: message }, 500);
  }
});

// GET /api/notes/:id
app.get("/:id", requireAuth(), async (c: any) => {
  try {
    const userId = c.get("userId");
    const noteId = c.req.param("id");

    const note = await getNoteById(userId, noteId);

    if (!note) {
      return c.json({ success: false, error: "Note not found" }, 404);
    }

    return c.json({
      success: true,
      data: { note },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get note";
    return c.json({ success: false, error: message }, 500);
  }
});

// PATCH /api/notes/:id
app.patch("/:id", requireAuth(), async (c: any) => {
  try {
    const userId = c.get("userId");
    const noteId = c.req.param("id");
    const body = await c.req.json();
    const data = updateNoteSchema.parse(body);

    const note = await updateNote(userId, noteId, data);

    if (!note) {
      return c.json({ success: false, error: "Note not found" }, 404);
    }

    return c.json({
      success: true,
      data: { note },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json(
        { success: false, error: "Validation error", details: error.errors },
        400
      );
    }
    const message = error instanceof Error ? error.message : "Failed to update note";
    return c.json({ success: false, error: message }, 500);
  }
});

// DELETE /api/notes/:id
app.delete("/:id", requireAuth(), async (c: any) => {
  try {
    const userId = c.get("userId");
    const noteId = c.req.param("id");

    const deleted = await deleteNote(userId, noteId);

    if (!deleted) {
      return c.json({ success: false, error: "Note not found" }, 404);
    }

    return c.json({
      success: true,
      message: "Note deleted",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete note";
    return c.json({ success: false, error: message }, 500);
  }
});

// GET /api/notes/:id/related
app.get("/:id/related", requireAuth(), async (c: any) => {
  try {
    const userId = c.get("userId");
    const noteId = c.req.param("id");

    const note = await getNoteById(userId, noteId);
    if (!note) {
      return c.json({ success: false, error: "Note not found" }, 404);
    }

    const relatedNotes = await getRelatedNotes(userId, noteId);

    return c.json({
      success: true,
      data: { relatedNotes },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get related notes";
    return c.json({ success: false, error: message }, 500);
  }
});

export default app;
