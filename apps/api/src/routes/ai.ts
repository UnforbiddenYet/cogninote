import { Hono } from "hono";
import * as v from "valibot";
import { vValidator } from "@hono/valibot-validator";
import { requireAuth } from "../lib/middleware/auth";
import { generateSummary } from "../services/lightrag";
import { getNoteById, updateNote } from "../services/notes";

const app = new Hono()

  // POST /api/ai/summarize
  .post(
    "/summarize",
    requireAuth(),
    vValidator(
      "json",
      v.object({
        noteId: v.pipe(v.string(), v.uuid("Invalid note ID")),
      }),
    ),
    async (c) => {
      try {
        const userId = c.get("userId");
        const { noteId } = c.req.valid("json");

        // Verify note ownership
        const note = await getNoteById(userId, noteId);
        if (!note) {
          return c.json({ success: false, error: "Note not found" }, 404);
        }

        // Generate summary
        const summary = await generateSummary(note.content);

        if (!summary) {
          return c.json(
            {
              success: false,
              error: "Unable to generate summary. Please try again.",
            },
            503,
          );
        }

        // Update note with summary
        await updateNote(userId, noteId, { summary });

        return c.json({
          success: true,
          data: { noteId, summary },
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Summary generation failed";
        return c.json({ success: false, error: message }, 500);
      }
    },
  );

export default app;
