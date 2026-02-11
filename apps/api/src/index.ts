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
import { healthCheck as lightRAGHealth } from "./services/lightrag";

const app = new Hono();

// Middleware
app.use(logger());
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGIN || "http://localhost:3000",
    credentials: true,
  }),
);

// Health check
app.get("/health", async (c) => {
  const lightRAGHealthy = await lightRAGHealth();

  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    services: {
      database: "ok",
      lightrag: lightRAGHealthy ? "ok" : "degraded",
    },
  });
});

// Routes
app.get("/", (c) => {
  return c.json({
    message: "MindGraph API",
    version: "0.2.0",
    status: "running",
  });
});

// API routes
app.use("/api/auth/*", async (c) => {
  return auth.handler(c.req.raw);
});
app.route("/api/notes", notesRoutes);
app.route("/api/connections", connectionsRoutes);
app.route("/api/ai", aiRoutes);
app.route("/api/query", queryRoutes);
app.route("/api/suggestions", suggestionsRoutes);
app.route("/api/dashboard", dashboardRoutes);
app.route("/api/graph", graphRoutes);

// Error handling
app.onError((err, c) => {
  console.error(err);
  return c.json(
    {
      error: err.message || "Internal Server Error",
    },
    500,
  );
});

const port = process.env.API_PORT || 3001;

export default {
  port,
  fetch: app.fetch,
};

console.log(`🚀 MindGraph API running on port ${port}`);
