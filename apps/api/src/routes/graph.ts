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
  mergeEntities,
  deleteEntity,
} from "../services/lightrag";
import { db } from "../db";
import { notes, connections } from "../db/schema";
import { invalidatePrefix } from "../cache";

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

  // GET /api/graph/entities/list
  .get(
    "/entities/list",
    requireAuth(),
    vValidator(
      "query",
      v.object({
        q: v.optional(v.string()),
        limit: v.optional(v.pipe(v.string(), v.transform(Number)), "50"),
        offset: v.optional(v.pipe(v.string(), v.transform(Number)), "0"),
      }),
    ),
    async (c) => {
      try {
        const { q, limit: rawLimit, offset } = c.req.valid("query");
        const limit = Math.min(rawLimit, 200);

        let entities: string[];
        let total: number;

        if (q && q.length > 0) {
          const results = await searchEntities(q, 100);
          const all = results.map((e) => e.label);
          total = all.length;
          entities = all.slice(offset, offset + limit);
        } else {
          const results = await getPopularEntities(offset + limit);
          entities = results.slice(offset).map((e) => e.label);
          // If we got a full page, there are likely more
          total = results.length < offset + limit ? results.length : offset + limit + 1;
        }

        return c.json({ success: true, data: { entities, total } });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to list entities";
        return c.json({ success: false, error: message }, 500);
      }
    },
  )

  // POST /api/graph/entities/merge
  .post(
    "/entities/merge",
    requireAuth(),
    vValidator(
      "json",
      v.object({
        entitiesToChange: v.pipe(v.array(v.string()), v.minLength(1)),
        entityToChangeInto: v.pipe(v.string(), v.minLength(1)),
      }),
    ),
    async (c) => {
      try {
        const { entitiesToChange, entityToChangeInto } = c.req.valid("json");
        const success = await mergeEntities(entitiesToChange, entityToChangeInto);

        if (!success) {
          return c.json({ success: false, error: "Merge failed" }, 500);
        }

        invalidatePrefix("popular_entities:");
        return c.json({ success: true, data: { merged: true } });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Merge failed";
        return c.json({ success: false, error: message }, 500);
      }
    },
  )

  // DELETE /api/graph/entities/:name
  .delete("/entities/:name", requireAuth(), async (c) => {
    try {
      const name = decodeURIComponent(c.req.param("name"));
      const success = await deleteEntity(name);

      if (!success) {
        return c.json({ success: false, error: "Delete failed" }, 500);
      }

      invalidatePrefix("popular_entities:");
      return c.json({ success: true, data: { deleted: true } });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Delete failed";
      return c.json({ success: false, error: message }, 500);
    }
  })

  // GET /api/graph/stats
  .get("/stats", requireAuth(), async (c) => {
    try {
      const userId = c.get("userId");

      const [noteCountResult, connectionCountResult] = await Promise.all([
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(notes)
          .where(and(eq(notes.userId, userId), eq(notes.isArchived, false))),
        db
          .select({ count: sql<number>`count(*)::int` })
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
