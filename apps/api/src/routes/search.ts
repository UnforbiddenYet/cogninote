import { Hono } from "hono";
import { z } from "zod";
import { searchNotes } from "../services/search";
import { requireAuth } from "../lib/middleware/auth";

const app = new Hono();

const searchSchema = z.object({
  q: z.string().min(1, "Query required"),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

// GET /api/search
app.get("/", requireAuth(), async (c: any) => {
  try {
    const userId = c.get("userId");
    const q = c.req.query("q");
    const limit = Math.min(parseInt(c.req.query("limit") || "20"), 100);
    const offset = parseInt(c.req.query("offset") || "0");

    if (!q) {
      return c.json(
        { success: false, error: "Query parameter 'q' is required" },
        400
      );
    }

    const { results, total } = await searchNotes(userId, q, limit, offset);

    return c.json({
      success: true,
      data: { results, total, limit, offset, query: q },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Search failed";
    return c.json({ success: false, error: message }, 500);
  }
});

export default app;
