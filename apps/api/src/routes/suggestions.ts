import { Hono } from "hono";
import * as v from "valibot";
import { vValidator } from "@hono/valibot-validator";
import { requireAuth } from "../lib/middleware/auth";
import { requireLightRAG } from "../lib/middleware/lightrag";
import {
  generateConnectionSuggestions,
  getConnectionSuggestions,
  acceptSuggestion,
  dismissSuggestion,
} from "../services/suggestions";

const app = new Hono()

  // GET /api/suggestions/connections
  .get(
    "/connections",
    requireAuth(),
    vValidator(
      "query",
      v.object({
        limit: v.optional(v.pipe(v.string(), v.transform(Number)), "5"),
      }),
    ),
    async (c) => {
      try {
        const userId = c.get("userId");
        const { limit: rawLimit } = c.req.valid("query");
        const limit = Math.min(rawLimit, 20);

        const suggestions = await getConnectionSuggestions(userId, limit);

        return c.json({ success: true, data: { suggestions } });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to get suggestions";
        return c.json({ success: false, error: message }, 500);
      }
    },
  )

  // POST /api/suggestions/connections/generate
  .post(
    "/connections/generate",
    requireAuth(),
    requireLightRAG(),
    async (c) => {
      try {
        const userId = c.get("userId");
        const count = await generateConnectionSuggestions(userId);

        return c.json({
          success: true,
          data: { generatedCount: count },
        });
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to generate suggestions";
        return c.json({ success: false, error: message }, 500);
      }
    },
  )

  // POST /api/suggestions/:id/accept
  .post("/:id/accept", requireAuth(), async (c) => {
    try {
      const userId = c.get("userId");
      const suggestionId = c.req.param("id");

      const connection = await acceptSuggestion(userId, suggestionId);
      if (!connection) {
        return c.json({ success: false, error: "Suggestion not found" }, 404);
      }

      return c.json({ success: true, data: { connection } });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to accept suggestion";
      return c.json({ success: false, error: message }, 500);
    }
  })

  // POST /api/suggestions/:id/dismiss
  .post("/:id/dismiss", requireAuth(), async (c) => {
    try {
      const userId = c.get("userId");
      const suggestionId = c.req.param("id");

      const dismissed = await dismissSuggestion(userId, suggestionId);
      if (!dismissed) {
        return c.json({ success: false, error: "Suggestion not found" }, 404);
      }

      return c.json({ success: true, message: "Suggestion dismissed" });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to dismiss suggestion";
      return c.json({ success: false, error: message }, 500);
    }
  });

export default app;
