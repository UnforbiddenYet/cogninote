import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import authRoutes from "./routes/auth";

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

// Auth routes
app.route("/api/auth", authRoutes);

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
