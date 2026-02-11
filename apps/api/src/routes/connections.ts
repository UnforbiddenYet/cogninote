import { Hono } from "hono";
import { z } from "zod";
import { requireAuth } from "../lib/middleware/auth";
import {
  createConnection,
  listConnections,
  getConnectionsForNote,
  deleteConnection,
} from "../services/connections";

const app = new Hono();

const createConnectionSchema = z.object({
  sourceNoteId: z.string().uuid(),
  targetNoteId: z.string().uuid(),
  connectionType: z.enum(["manual", "ai_suggested"]).default("manual"),
  description: z.string().optional(),
});

// GET /api/connections
app.get("/", requireAuth(), async (c: any) => {
  try {
    const userId = c.get("userId");
    const result = await listConnections(userId);

    return c.json({ success: true, data: { connections: result } });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to list connections";
    return c.json({ success: false, error: message }, 500);
  }
});

// GET /api/connections/note/:noteId
app.get("/note/:noteId", requireAuth(), async (c: any) => {
  try {
    const userId = c.get("userId");
    const noteId = c.req.param("noteId");
    const result = await getConnectionsForNote(userId, noteId);

    return c.json({ success: true, data: { connections: result } });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to get connections for note";
    return c.json({ success: false, error: message }, 500);
  }
});

// POST /api/connections
app.post("/", requireAuth(), async (c: any) => {
  try {
    const userId = c.get("userId");
    const body = await c.req.json();
    const data = createConnectionSchema.parse(body);

    const connection = await createConnection(
      userId,
      data.sourceNoteId,
      data.targetNoteId,
      data.connectionType,
      data.description,
    );

    return c.json({ success: true, data: { connection } }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json(
        { success: false, error: "Validation error", details: error.errors },
        400,
      );
    }
    const message =
      error instanceof Error ? error.message : "Failed to create connection";
    const status = message.includes("not found")
      ? 404
      : message.includes("already exists") || message.includes("itself")
        ? 409
        : 500;
    return c.json({ success: false, error: message }, status);
  }
});

// DELETE /api/connections/:id
app.delete("/:id", requireAuth(), async (c: any) => {
  try {
    const userId = c.get("userId");
    const connectionId = c.req.param("id");

    const deleted = await deleteConnection(userId, connectionId);
    if (!deleted) {
      return c.json({ success: false, error: "Connection not found" }, 404);
    }

    return c.json({ success: true, message: "Connection deleted" });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete connection";
    return c.json({ success: false, error: message }, 500);
  }
});

export default app;
