import { Hono } from "hono";
import * as v from "valibot";
import { vValidator } from "@hono/valibot-validator";
import { requireAuth } from "../lib/middleware/auth";
import {
  createConnection,
  listConnections,
  getConnectionsForNote,
  deleteConnection,
} from "../services/connections";

const app = new Hono()

  // GET /api/connections
  .get("/", requireAuth(), async (c) => {
    try {
      const userId = c.get("userId");
      const result = await listConnections(userId);

      return c.json({ success: true, data: { connections: result } });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to list connections";
      return c.json({ success: false, error: message }, 500);
    }
  })

  // GET /api/connections/note/:noteId
  .get("/note/:noteId", requireAuth(), async (c) => {
    try {
      const userId = c.get("userId");
      const noteId = c.req.param("noteId");
      const result = await getConnectionsForNote(userId, noteId);

      return c.json({ success: true, data: { connections: result } });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get connections for note";
      return c.json({ success: false, error: message }, 500);
    }
  })

  // POST /api/connections
  .post(
    "/",
    requireAuth(),
    vValidator(
      "json",
      v.object({
        sourceNoteId: v.pipe(v.string(), v.uuid()),
        targetNoteId: v.pipe(v.string(), v.uuid()),
        connectionType: v.picklist(["manual", "ai_suggested"]),
        description: v.optional(v.string()),
      }),
    ),
    async (c) => {
      try {
        const userId = c.get("userId");
        const data = c.req.valid("json");

        const connection = await createConnection(
          userId,
          data.sourceNoteId,
          data.targetNoteId,
          data.connectionType,
          data.description,
        );

        return c.json({ success: true, data: { connection } }, 201);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to create connection";
        const status = message.includes("not found")
          ? 404
          : message.includes("already exists") || message.includes("itself")
            ? 409
            : 500;
        return c.json({ success: false, error: message }, status);
      }
    },
  )

  // DELETE /api/connections/:id
  .delete("/:connectionId", requireAuth(), async (c) => {
    try {
      const userId = c.get("userId");
      const connectionId = c.req.param("connectionId");

      const deleted = await deleteConnection(userId, connectionId);
      if (!deleted) {
        return c.json({ success: false, error: "Connection not found" }, 404);
      }

      return c.json({ success: true, message: "Connection deleted" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete connection";
      return c.json({ success: false, error: message }, 500);
    }
  });

export default app;
