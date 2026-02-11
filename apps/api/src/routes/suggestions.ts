import { Hono } from "hono";
import { requireAuth } from "../lib/middleware/auth";
import { requireLightRAG } from "../lib/middleware/lightrag";
import {
  generateConnectionSuggestions,
  getConnectionSuggestions,
  acceptSuggestion,
  dismissSuggestion,
} from "../services/suggestions";

const app = new Hono();

// GET /api/suggestions/connections
app.get("/connections", requireAuth(), async (c: any) => {
  try {
    const userId = c.get("userId");
    const limit = Math.min(parseInt(c.req.query("limit") || "5"), 20);

    const suggestions = await getConnectionSuggestions(userId, limit);

    return c.json({ success: true, data: { suggestions } });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to get suggestions";
    return c.json({ success: false, error: message }, 500);
  }
});

// POST /api/suggestions/connections/generate
app.post(
  "/connections/generate",
  requireAuth(),
  requireLightRAG(),
  async (c: any) => {
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
);

// POST /api/suggestions/:id/accept
app.post("/:id/accept", requireAuth(), async (c: any) => {
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
});

// POST /api/suggestions/:id/dismiss
app.post("/:id/dismiss", requireAuth(), async (c: any) => {
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
