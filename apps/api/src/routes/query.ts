import { Hono } from "hono";
import * as v from "valibot";
import { vValidator } from "@hono/valibot-validator";
import { requireAuth } from "../lib/middleware/auth";
import { executeQuery } from "../services/query";
import { toPreview } from "../services/notes";
import { logQuery, getQueryHistory } from "../services/queryHistory";

const app = new Hono()
  // POST /api/query
  .post(
    "/",
    requireAuth(),
    vValidator(
      "json",
      v.object({
        query: v.pipe(v.string(), v.minLength(1, "Query is required")),
        maxSources: v.optional(
          v.pipe(v.number(), v.minValue(1), v.maxValue(50)),
          10,
        ),
      }),
    ),
    async (c) => {
      try {
        const userId = c.get("userId");
        const data = c.req.valid("json");
        const mode = "mix";

        const result = await executeQuery(
          userId,
          data.query,
          mode,
          data.maxSources,
        );

        if (!result) {
          return c.json(
            {
              success: false,
              error: "Unable to process query. Please try again.",
            },
            503,
          );
        }

        // Fire-and-forget query logging
        logQuery(
          userId,
          data.query,
          mode,
          toPreview(result.answer, 300),
          result.sources.length,
          result.metadata.processingTimeMs,
        ).catch((err) => console.error("Failed to log query:", err));

        return c.json({ success: true, data: result });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Query failed";
        return c.json({ success: false, error: message }, 500);
      }
    },
  )

  // GET /api/query/history
  .get(
    "/history",
    requireAuth(),
    vValidator(
      "query",
      v.object({
        limit: v.optional(v.pipe(v.string(), v.transform(Number)), "10"),
        offset: v.optional(v.pipe(v.string(), v.transform(Number)), "0"),
      }),
    ),
    async (c) => {
      try {
        const userId = c.get("userId");
        const { limit: rawLimit, offset } = c.req.valid("query");
        const limit = Math.min(rawLimit, 100);

        const history = await getQueryHistory(userId, limit, offset);

        return c.json({ success: true, data: history });
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to get query history";
        return c.json({ success: false, error: message }, 500);
      }
    },
  );

export default app;
