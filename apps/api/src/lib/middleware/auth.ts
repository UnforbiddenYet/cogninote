import { createMiddleware } from "hono/factory";
import type { Context } from "hono";
import { verifyAccessToken } from "../jwt";

declare global {
  namespace HonoRequest {
    interface HonoRequest {
      userId?: string;
    }
  }
}

export const requireAuth = () =>
  createMiddleware(async (c: Context<any, any, {}>, next) => {
    const authHeader = c.req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return c.json(
        { error: "Missing or invalid authorization header" },
        401
      );
    }

    const token = authHeader.slice(7);

    try {
      const { userId } = await verifyAccessToken(token);
      c.set("userId", userId);
      await next();
    } catch (error) {
      return c.json(
        { error: error instanceof Error ? error.message : "Invalid token" },
        401
      );
    }
  });
