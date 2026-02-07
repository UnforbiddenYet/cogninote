import { Hono } from "hono";
import { z } from "zod";

import { requireAuth } from "../lib/middleware/auth";
import { requireLightRAG } from "../lib/middleware/lightrag";
import { askQuestion, generateSummary } from "../services/lightrag";
import { getNoteById, updateNote } from "../services/notes";

const app = new Hono();

// POST /api/ai/qa
app.post("/qa", requireAuth(), requireLightRAG(), async (c: any) => {
  try {
    const userId = c.get("userId");
    const body = await c.req.json();
    const { question, mode } = z
      .object({
        question: z.string().min(1, "Question is required"),
        mode: z
          .enum(["local", "global", "hybrid", "naive", "mix"])
          .default("hybrid"),
      })
      .parse(body);

    const response = await askQuestion(userId, question, mode);

    if (!response) {
      return c.json(
        {
          success: false,
          error: "Unable to generate answer. Please try again.",
        },
        503,
      );
    }

    // Enrich response with full note metadata for sources
    const sourceNotes = [];
    if (response.sources && response.sources.length > 0) {
      for (const sourceId of response.sources) {
        // Extract noteId from format "note_<uuid>"
        const noteId = sourceId.replace(/^note_/, "");
        const note = await getNoteById(userId, noteId);

        if (note) {
          sourceNotes.push({
            id: note.id,
            title: note.title,
            content:
              note.content.substring(0, 200) +
              (note.content.length > 200 ? "..." : ""),
            color: note.color,
            createdAt: note.createdAt,
            updatedAt: note.updatedAt,
          });
        }
      }
    }

    return c.json({
      success: true,
      data: {
        question,
        answer: response.answer,
        context: response.context,
        sources: sourceNotes, // Full note objects instead of just IDs
        mode,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json(
        { success: false, error: "Validation error", details: error.errors },
        400,
      );
    }
    const message = error instanceof Error ? error.message : "Q&A failed";
    return c.json({ success: false, error: message }, 500);
  }
});

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
