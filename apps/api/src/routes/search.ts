import { Hono } from "hono";
import { z } from "zod";
import { searchNotes } from "../services/search";
import { buildSemanticResults } from "../services/notes";
import { searchSemantic } from "../services/lightrag";
import { requireAuth } from "../lib/middleware/auth";
import { requireLightRAG } from "../lib/middleware/lightrag";

const app = new Hono();

// GET /api/search
app.get("/", requireAuth(), async (c: any) => {
  try {
    const userId = c.get("userId");
    const body = await c.req.json();

    const { query, limit, offset } = z
      .object({
        query: z.string().min(1, "Query required"),
        limit: z.number().int().min(1).max(100).default(20),
        offset: z.number().int().min(0).default(0),
      })
      .parse(body);

    const { results, total } = await searchNotes(userId, query, limit, offset);

    return c.json({
      success: true,
      data: { results, total, limit, offset, query, searchType: "basic" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Search failed";
    return c.json({ success: false, error: message }, 500);
  }
});

// POST /api/search/semantic
app.post("/semantic", requireAuth(), requireLightRAG(), async (c: any) => {
  try {
    const userId = c.get("userId");
    const body = await c.req.json();
    const { query, limit, offset, mode } = z
      .object({
        query: z.string().min(1, "Query required"),
        limit: z.number().int().min(1).max(100).default(20),
        offset: z.number().int().min(0).default(0),
        mode: z
          .enum(["local", "global", "hybrid", "naive", "mix"])
          .default("hybrid"),
      })
      .parse(body);

    const topK = Math.min(limit + offset, 100);
    const semanticResults = await searchSemantic(userId, query, mode, topK);
    const slicedResults = semanticResults.slice(offset, offset + limit);
    const orderedResults = await buildSemanticResults(userId, slicedResults);

    return c.json({
      success: true,
      data: {
        results: orderedResults,
        total: orderedResults.length,
        limit,
        offset,
        query,
        searchType: "semantic",
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json(
        { success: false, error: "Validation error", details: error.errors },
        400,
      );
    }
    const message =
      error instanceof Error ? error.message : "Semantic search failed";
    return c.json({ success: false, error: message }, 500);
  }
});

export default app;
