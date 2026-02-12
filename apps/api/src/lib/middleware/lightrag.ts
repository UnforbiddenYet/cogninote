import { createMiddleware } from "hono/factory";
import { LIGHTRAG_ENABLED } from "../../services/lightrag";

export const requireLightRAG = () =>
  createMiddleware(async (c, next) => {
    if (!LIGHTRAG_ENABLED) {
      return c.json(
        { success: false, error: "Q&A feature is not available" },
        503,
      );
    }

    await next();
  });
