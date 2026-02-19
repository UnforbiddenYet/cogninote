import { Hono } from "hono";
import * as v from "valibot";
import { vValidator } from "@hono/valibot-validator";
import { requireAuth } from "../lib/middleware/auth";
import { getDashboardData } from "../services/dashboard";

const app = new Hono()

  // GET /api/dashboard
  .get(
    "/",
    requireAuth(),
    vValidator(
      "query",
      v.object({
        timeRange: v.picklist(["1d", "7d", "30d"]),
      }),
    ),
    async (c) => {
      try {
        const userId = c.get("userId");
        const timeRange = c.req.valid("query").timeRange;

        const data = await getDashboardData(userId, timeRange);
        return c.json({ success: true, data });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to get dashboard data";
        return c.json({ success: false, error: message }, 500);
      }
    },
  );

export default app;
