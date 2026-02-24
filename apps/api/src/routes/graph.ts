import { Hono } from "hono";
import * as v from "valibot";
import { vValidator } from "@hono/valibot-validator";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth } from "../lib/middleware/auth";
import {
  searchEntities,
  getPopularEntities,
  getSubgraph,
  getEntityLabels,
} from "../services/lightrag";
import { db } from "../db";
import { notes, connections } from "../db/schema";

const app = new Hono()

  // GET /api/graph/entities/search
  .get(
    "/entities/search",
    requireAuth(),
    vValidator(
      "query",
      v.object({
        q: v.pipe(v.string(), v.minLength(1)),
        limit: v.optional(v.pipe(v.string(), v.transform(Number)), "10"),
      }),
    ),
    async (c) => {
      try {
        const { q, limit: rawLimit } = c.req.valid("query");
        const limit = Math.min(rawLimit, 50);

        const entities = await searchEntities(q, limit);

        return c.json({ success: true, data: { entities } });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Entity search failed";
        return c.json({ success: false, error: message }, 500);
      }
    },
  )

  // GET /api/graph/entities/popular
  .get(
    "/entities/popular",
    requireAuth(),
    vValidator(
      "query",
      v.object({
        limit: v.optional(v.pipe(v.string(), v.transform(Number)), "20"),
      }),
    ),
    async (c) => {
      try {
        const { limit: rawLimit } = c.req.valid("query");
        const limit = Math.min(rawLimit, 50);

        const entities = await getPopularEntities(limit);

        return c.json({ success: true, data: { entities } });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to get popular entities";
        return c.json({ success: false, error: message }, 500);
      }
    },
  )

  // GET /api/graph/subgraph
  .get(
    "/subgraph",
    requireAuth(),
    vValidator(
      "query",
      v.object({
        label: v.pipe(v.string(), v.minLength(1)),
        maxDepth: v.optional(v.pipe(v.string(), v.transform(Number)), "2"),
        maxNodes: v.optional(v.pipe(v.string(), v.transform(Number)), "50"),
      }),
    ),
    async (c) => {
      try {
        const { label, maxDepth: rawMaxDepth, maxNodes: rawMaxNodes } = c.req.valid("query");
        const maxDepth = Math.min(rawMaxDepth, 5);
        const maxNodes = Math.min(rawMaxNodes, 200);

        const graph = await getSubgraph(label, maxDepth, maxNodes);

        return c.json({ success: true, data: { graph } });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to get subgraph";
        return c.json({ success: false, error: message }, 500);
      }
    },
  )

  // GET /api/graph/stats
  .get("/stats", requireAuth(), async (c) => {
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
      try {
        const labels = await getEntityLabels();
        entityCount = labels.length;
      } catch {
        // LightRAG unavailable
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
      const message = error instanceof Error ? error.message : "Failed to get graph stats";
      return c.json({ success: false, error: message }, 500);
    }
  });

export default app;
