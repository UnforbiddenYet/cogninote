import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { auth } from "./lib/auth";
import notesRoutes from "./routes/notes";
import tagsRoutes from "./routes/tags";
import linksRoutes from "./routes/links";
import searchRoutes from "./routes/search";
import foldersRoutes from "./routes/folders";

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
app.use("/api/auth/*", async (c) => {
  return auth.handler(c.req.raw);
});
app.route("/api/notes", notesRoutes);
app.route("/api/tags", tagsRoutes);
app.route("/api/links", linksRoutes);
app.route("/api/search", searchRoutes);
app.route("/api/folders", foldersRoutes);

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
