import { Hono } from "hono";
import { z } from "zod";
import { requireAuth } from "../lib/middleware/auth";
import { requireLightRAG } from "../lib/middleware/lightrag";
import { executeQuery } from "../services/query";
import { logQuery, getQueryHistory } from "../services/queryHistory";

const app = new Hono();

const querySchema = z.object({
  query: z.string().min(1, "Query is required"),
  maxSources: z.number().min(1).max(50).default(10),
});

// POST /api/query
app.post("/", requireAuth(), requireLightRAG(), async (c: any) => {
  try {
    const userId = c.get("userId");
    const body = await c.req.json();
    const data = querySchema.parse(body);
    const mode = "mix";

    const result = await executeQuery(
      userId,
      data.query,
      mode,
      data.maxSources,
    );

    if (!result) {
      return c.json(
        { success: false, error: "Unable to process query. Please try again." },
        503,
      );
    }

    // Fire-and-forget query logging
    logQuery(
      userId,
      data.query,
      mode,
      result.answer.substring(0, 500),
      result.sources.length,
      result.metadata.processingTimeMs,
    ).catch((err) => console.error("Failed to log query:", err));

    return c.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json(
        { success: false, error: "Validation error", details: error.errors },
        400,
      );
    }
    const message = error instanceof Error ? error.message : "Query failed";
    return c.json({ success: false, error: message }, 500);
  }
});

// GET /api/query/history
app.get("/history", requireAuth(), async (c: any) => {
  try {
    const userId = c.get("userId");
    const limit = Math.min(parseInt(c.req.query("limit") || "10"), 100);
    const offset = parseInt(c.req.query("offset") || "0");

    const history = await getQueryHistory(userId, limit, offset);

    return c.json({ success: true, data: history });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to get query history";
    return c.json({ success: false, error: message }, 500);
  }
});

export default app;
