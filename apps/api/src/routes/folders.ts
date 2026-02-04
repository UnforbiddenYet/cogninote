import { Hono } from "hono";
import { z } from "zod";
import {
  createFolder,
  listFoldersWithCounts,
  getFolder,
  updateFolder,
  deleteFolder,
  getFolderNotes,
  moveNoteToFolder,
  getUncategorizedNoteCount,
} from "../services/folders";
import { requireAuth } from "../lib/middleware/auth";

const app = new Hono();

const createFolderSchema = z.object({
  name: z.string().min(1, "Folder name required"),
  color: z.string().optional(),
  icon: z.string().optional(),
  position: z.number().optional(),
});

const updateFolderSchema = z.object({
  name: z.string().min(1).optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  position: z.number().optional(),
  isExpanded: z.boolean().optional(),
});

const moveNoteSchema = z.object({
  folderId: z.string().uuid().nullable().optional(),
});

// GET /api/folders
app.get("/", requireAuth(), async (c: any) => {
  try {
    const userId = c.get("userId");
    const folders = await listFoldersWithCounts(userId);

    // Get uncategorized note count
    const uncategorizedCount = await getUncategorizedNoteCount(userId);

    return c.json({
      success: true,
      data: { folders, uncategorizedCount },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list folders";
    return c.json({ success: false, error: message }, 500);
  }
});

// POST /api/folders
app.post("/", requireAuth(), async (c: any) => {
  try {
    const userId = c.get("userId");
    const body = await c.req.json();
    const data = createFolderSchema.parse(body);

    const folder = await createFolder(userId, data.name, data.color, data.icon, data.position);

    return c.json(
      {
        success: true,
        data: { folder },
      },
      201
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json(
        { success: false, error: "Validation error", details: error.errors },
        400
      );
    }
    const message = error instanceof Error ? error.message : "Failed to create folder";
    return c.json({ success: false, error: message }, 500);
  }
});

// GET /api/folders/:id
app.get("/:id", requireAuth(), async (c: any) => {
  try {
    const userId = c.get("userId");
    const folderId = c.req.param("id");

    const folder = await getFolder(userId, folderId);

    if (!folder) {
      return c.json({ success: false, error: "Folder not found" }, 404);
    }

    return c.json({
      success: true,
      data: { folder },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get folder";
    return c.json({ success: false, error: message }, 500);
  }
});

// PATCH /api/folders/:id
app.patch("/:id", requireAuth(), async (c: any) => {
  try {
    const userId = c.get("userId");
    const folderId = c.req.param("id");
    const body = await c.req.json();
    const data = updateFolderSchema.parse(body);

    const folder = await updateFolder(userId, folderId, data);

    if (!folder) {
      return c.json({ success: false, error: "Folder not found" }, 404);
    }

    return c.json({
      success: true,
      data: { folder },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json(
        { success: false, error: "Validation error", details: error.errors },
        400
      );
    }
    const message = error instanceof Error ? error.message : "Failed to update folder";
    return c.json({ success: false, error: message }, 500);
  }
});

// DELETE /api/folders/:id
app.delete("/:id", requireAuth(), async (c: any) => {
  try {
    const userId = c.get("userId");
    const folderId = c.req.param("id");

    const deleted = await deleteFolder(userId, folderId);

    if (!deleted) {
      return c.json({ success: false, error: "Folder not found" }, 404);
    }

    return c.json({
      success: true,
      message: "Folder deleted",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete folder";
    return c.json({ success: false, error: message }, 500);
  }
});

// GET /api/folders/:id/notes
app.get("/:id/notes", requireAuth(), async (c: any) => {
  try {
    const userId = c.get("userId");
    const folderId = c.req.param("id");
    const limit = c.req.query("limit") ? Number(c.req.query("limit")) : undefined;
    const offset = c.req.query("offset") ? Number(c.req.query("offset")) : undefined;

    // Verify folder exists and belongs to user
    const folder = await getFolder(userId, folderId);
    if (!folder) {
      return c.json({ success: false, error: "Folder not found" }, 404);
    }

    const folderNotes = await getFolderNotes(userId, folderId, limit, offset);

    return c.json({
      success: true,
      data: { notes: folderNotes },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get folder notes";
    return c.json({ success: false, error: message }, 500);
  }
});

// POST /api/folders/move-note
app.post("/move-note", requireAuth(), async (c: any) => {
  try {
    const userId = c.get("userId");
    const body = await c.req.json();
    const { noteId, folderId } = z
      .object({
        noteId: z.string().uuid("Invalid note ID"),
        folderId: z.string().uuid().nullable().optional(),
      })
      .parse(body);

    const moved = await moveNoteToFolder(userId, noteId, folderId || null);

    if (!moved) {
      return c.json({ success: false, error: "Note or folder not found" }, 404);
    }

    return c.json({
      success: true,
      message: "Note moved to folder",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json(
        { success: false, error: "Validation error", details: error.errors },
        400
      );
    }
    const message = error instanceof Error ? error.message : "Failed to move note";
    return c.json({ success: false, error: message }, 500);
  }
});

export default app;
