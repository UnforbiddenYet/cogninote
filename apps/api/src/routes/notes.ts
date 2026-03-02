import { Hono } from "hono";
import * as v from "valibot";
import { vValidator } from "@hono/valibot-validator";
import {
  createNote,
  findOrCreateEmptyNote,
  getNoteById,
  getNotesByIds,
  listNotes,
  updateNote,
  deleteNote,
} from "../services/notes";
import { getConnectionsForNote } from "../services/connections";
import { requireAuth } from "../lib/middleware/auth";
import { getNoteEntities } from "../services/notes";

const app = new Hono()

  // GET /api/notes
  .get(
    "/",
    requireAuth(),
    vValidator(
      "query",
      v.object({
        limit: v.optional(v.pipe(v.string(), v.transform(Number)), "20"),
        offset: v.optional(v.pipe(v.string(), v.transform(Number)), "0"),
      }),
    ),
    async (c) => {
      try {
        const userId = c.get("userId");
        const { limit: rawLimit, offset } = c.req.valid("query");
        const limit = Math.min(rawLimit, 100);

        const { notes, total } = await listNotes(userId, limit, offset);

        return c.json({
          success: true,
          data: { notes, total, limit, offset },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to list notes";
        return c.json({ success: false, error: message }, 500);
      }
    },
  )

  // POST /api/notes
  .post(
    "/",
    requireAuth(),
    vValidator(
      "json",
      v.object({
        content: v.pipe(v.string(), v.minLength(0, "Content required")),
        color: v.optional(v.string()),
      }),
    ),
    async (c) => {
      try {
        const userId = c.get("userId");
        const data = c.req.valid("json");

        const note = data.content
          ? await createNote(userId, data)
          : await findOrCreateEmptyNote(userId);

        return c.json(
          {
            success: true,
            data: { note },
          },
          201,
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to create note";
        return c.json({ success: false, error: message }, 500);
      }
    },
  )

  // GET /api/notes/:noteId
  .get("/:noteId", requireAuth(), async (c) => {
    try {
      const userId = c.get("userId");
      const noteId = c.req.param("noteId");

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
  })

  // PATCH /api/notes/:noteId
  .patch(
    "/:noteId",
    requireAuth(),
    vValidator(
      "json",
      v.object({
        content: v.optional(v.string()),
        color: v.optional(v.string()),
        isArchived: v.optional(v.boolean()),
      }),
    ),
    async (c) => {
      try {
        const userId = c.get("userId");
        const noteId = c.req.param("noteId");
        const data = c.req.valid("json");

        const note = await updateNote(userId, noteId, data);

        if (!note) {
          return c.json({ success: false, error: "Note not found" }, 404);
        }

        return c.json({
          success: true,
          data: { note },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to update note";
        return c.json({ success: false, error: message }, 500);
      }
    },
  )

  // DELETE /api/notes/:noteId
  .delete("/:noteId", requireAuth(), async (c) => {
    try {
      const userId = c.get("userId");
      const noteId = c.req.param("noteId");

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
  })

  // GET /api/notes/:noteId/related
  .get("/:noteId/related", requireAuth(), async (c) => {
    try {
      const userId = c.get("userId");
      const noteId = c.req.param("noteId");

      const note = await getNoteById(userId, noteId);
      if (!note) {
        return c.json({ success: false, error: "Note not found" }, 404);
      }

      const noteConnections = await getConnectionsForNote(userId, noteId);

      const connectedNoteIds = noteConnections.map((conn) =>
        conn.sourceNoteId === noteId ? conn.targetNoteId : conn.sourceNoteId,
      );
      const connectedNotes = await getNotesByIds(userId, connectedNoteIds);
      const noteTitlesById = new Map(connectedNotes.map((n) => [n.id, n.title]));

      const enriched = noteConnections.map((conn) => {
        const connectedNoteId =
          conn.sourceNoteId === noteId ? conn.targetNoteId : conn.sourceNoteId;
        return {
          id: conn.id,
          noteId: connectedNoteId,
          noteTitle: noteTitlesById.get(connectedNoteId) ?? "Untitled",
          connectionType: conn.connectionType,
          description: conn.description,
        };
      });

      return c.json({
        success: true,
        data: { connections: enriched },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get related notes";
      return c.json({ success: false, error: message }, 500);
    }
  })

  // GET /api/notes/:noteId/entities
  .get("/:noteId/entities", requireAuth(), async (c) => {
    try {
      const userId = c.get("userId");
      const noteId = c.req.param("noteId");

      const note = await getNoteById(userId, noteId);
      if (!note) {
        return c.json({ success: false, error: "Note not found" }, 404);
      }

      const entities = await getNoteEntities(userId, noteId);

      return c.json({
        success: true,
        data: { entities },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get note entities";
      return c.json({ success: false, error: message }, 500);
    }
  });

export default app;
