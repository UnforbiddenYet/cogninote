import { createMiddleware } from "hono/factory";
import { auth, type User } from "../auth";

export type AuthVariables = {
  userId: string;
  user: User;
};

export const requireAuth = () =>
  createMiddleware<{ Variables: AuthVariables }>(async (c, next) => {
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });

    if (!session) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    c.set("userId", session.user.id);
    c.set("user", session.user);

    await next();
  });
