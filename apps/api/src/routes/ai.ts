import { Hono } from "hono";
import { z } from "zod";

import { requireAuth } from "../lib/middleware/auth";
import { generateSummary } from "../services/lightrag";
import { getNoteById, updateNote } from "../services/notes";

const app = new Hono();

// POST /api/ai/summarize
app.post("/summarize", requireAuth(), async (c: any) => {
  try {
    const userId = c.get("userId");
    const body = await c.req.json();
    const { noteId } = z
      .object({
        noteId: z.string().uuid("Invalid note ID"),
      })
      .parse(body);

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
    if (error instanceof z.ZodError) {
      return c.json(
        { success: false, error: "Validation error", details: error.errors },
        400,
      );
    }
    const message =
      error instanceof Error ? error.message : "Summary generation failed";
    return c.json({ success: false, error: message }, 500);
  }
});

export default app;
