import { createMiddleware } from "hono/factory";
import type { Context } from "hono";
import { auth } from "../auth";

declare global {
  namespace HonoRequest {
    interface HonoRequest {
      userId?: string;
    }
  }
}

export const requireAuth = () =>
  createMiddleware(async (c: Context<any, any, {}>, next) => {
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });

    if (!session) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Set userId and user for downstream handlers
    c.set("userId", session.user.id);
    c.set("user", session.user);

    await next();
  });
