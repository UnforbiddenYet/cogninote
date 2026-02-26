import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { auth } from "./lib/auth";
import notesRoutes from "./routes/notes";
import connectionsRoutes from "./routes/connections";
import aiRoutes from "./routes/ai";
import queryRoutes from "./routes/query";
import suggestionsRoutes from "./routes/suggestions";
import dashboardRoutes from "./routes/dashboard";
import graphRoutes from "./routes/graph";

const app = new Hono()
  // Middleware
  .use(logger())
  .use(
    cors({
      origin: process.env.ALLOWED_ORIGIN || "http://localhost:3000",
      credentials: true,
    }),
  )
  // Health check
  .get("/health", async (c) => {
    return c.json({
      status: "ok",
      timestamp: new Date().toISOString(),
    });
  })
  // API routes
  .use("/api/auth/*", async (c) => {
    return auth.handler(c.req.raw);
  })
  .route("/api/notes", notesRoutes)
  .route("/api/connections", connectionsRoutes)
  .route("/api/ai", aiRoutes)
  .route("/api/query", queryRoutes)
  .route("/api/suggestions", suggestionsRoutes)
  .route("/api/dashboard", dashboardRoutes)
  .route("/api/graph", graphRoutes);

export type AppType = typeof app;

app.onError((err, c) => {
  console.error(err);
  return c.json(
    {
      error: err.message || "Internal Server Error",
    },
    500,
  );
});

export default app;
