import { Hono } from "hono";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth } from "../lib/middleware/auth";
import { requireLightRAG } from "../lib/middleware/lightrag";
import {
  searchEntities,
  getPopularEntities,
  getSubgraph,
  getEntityLabels,
  LIGHTRAG_ENABLED,
} from "../services/lightrag";
import { db } from "../db";
import { notes, connections } from "../db/schema";

const app = new Hono();

// GET /api/graph/entities/search
app.get(
  "/entities/search",
  requireAuth(),
  requireLightRAG(),
  async (c: any) => {
    try {
      const userId = c.get("userId");
      const query = c.req.query("q") || "";
      const limit = Math.min(parseInt(c.req.query("limit") || "10"), 50);

      if (!query) {
        return c.json(
          { success: false, error: "Query parameter 'q' is required" },
          400,
        );
      }

      const entities = await searchEntities(userId, query, limit);

      return c.json({ success: true, data: { entities } });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Entity search failed";
      return c.json({ success: false, error: message }, 500);
    }
  },
);

// GET /api/graph/entities/popular
app.get(
  "/entities/popular",
  requireAuth(),
  requireLightRAG(),
  async (c: any) => {
    try {
      const userId = c.get("userId");
      const limit = Math.min(parseInt(c.req.query("limit") || "20"), 50);

      const entities = await getPopularEntities(userId, limit);

      return c.json({ success: true, data: { entities } });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to get popular entities";
      return c.json({ success: false, error: message }, 500);
    }
  },
);

// GET /api/graph/subgraph
app.get("/subgraph", requireAuth(), requireLightRAG(), async (c: any) => {
  try {
    const userId = c.get("userId");
    const label = c.req.query("label") || "";
    const maxDepth = Math.min(parseInt(c.req.query("maxDepth") || "2"), 5);
    const maxNodes = Math.min(parseInt(c.req.query("maxNodes") || "50"), 200);

    if (!label) {
      return c.json(
        { success: false, error: "Query parameter 'label' is required" },
        400,
      );
    }

    const graph = await getSubgraph(userId, label, maxDepth, maxNodes);

    return c.json({ success: true, data: { graph } });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to get subgraph";
    return c.json({ success: false, error: message }, 500);
  }
});

// GET /api/graph/stats
app.get("/stats", requireAuth(), async (c: any) => {
  try {
    const userId = c.get("userId");

    const [noteCountResult, connectionCountResult] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)` })
        .from(notes)
        .where(and(eq(notes.userId, userId), eq(notes.isArchived, false))),
      db
        .select({ count: sql<number>`count(*)` })
        .from(connections)
        .where(eq(connections.userId, userId)),
    ]);

    let entityCount = 0;
    if (LIGHTRAG_ENABLED) {
      try {
        const labels = await getEntityLabels(userId);
        entityCount = labels.length;
      } catch {
        // LightRAG unavailable
      }
    }

    return c.json({
      success: true,
      data: {
        noteCount: noteCountResult[0]?.count || 0,
        connectionCount: connectionCountResult[0]?.count || 0,
        entityCount,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to get graph stats";
    return c.json({ success: false, error: message }, 500);
  }
});

export default app;
