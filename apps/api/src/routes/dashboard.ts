import { Hono } from "hono";
import { requireAuth } from "../lib/middleware/auth";
import { getDashboardData } from "../services/dashboard";

const app = new Hono();

// GET /api/dashboard
app.get("/", requireAuth(), async (c: any) => {
  try {
    const userId = c.get("userId");
    const timeRange = (c.req.query("timeRange") || "7d") as
      | "1d"
      | "7d"
      | "30d";

    if (!["1d", "7d", "30d"].includes(timeRange)) {
      return c.json(
        { success: false, error: "Invalid timeRange. Use 1d, 7d, or 30d" },
        400,
      );
    }

    const data = await getDashboardData(userId, timeRange);

    return c.json({ success: true, data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to get dashboard data";
    return c.json({ success: false, error: message }, 500);
  }
});

export default app;
