import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import authRoutes from "./routes/auth";
import notesRoutes from "./routes/notes";
import tagsRoutes from "./routes/tags";
import linksRoutes from "./routes/links";
import searchRoutes from "./routes/search";

const app = new Hono();

// Middleware
app.use(logger());
app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);

// Health check
app.get("/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.get("/", (c) => {
  return c.json({
    message: "MindGraph API",
    version: "0.1.0",
    status: "running",
  });
});

// API routes
app.route("/api/auth", authRoutes);
app.route("/api/notes", notesRoutes);
app.route("/api/tags", tagsRoutes);
app.route("/api/links", linksRoutes);
app.route("/api/search", searchRoutes);

// Error handling
app.onError((err, c) => {
  console.error(err);
  return c.json(
    {
      error: err.message || "Internal Server Error",
    },
    500
  );
});

const port = process.env.API_PORT || 3001;

export default {
  port,
  fetch: app.fetch,
};

console.log(`🚀 MindGraph API running on port ${port}`);
