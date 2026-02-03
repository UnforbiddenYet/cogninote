import { Hono } from "hono";
import { z } from "zod";
import {
  registerUser,
  loginUser,
  refreshUserToken,
  logoutUser,
  getUserById,
} from "../services/auth";
import { requireAuth } from "../lib/middleware/auth";

const app = new Hono();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1, "Name is required"),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

// POST /api/auth/register
app.post("/register", async (c) => {
  try {
    const body = await c.req.json();
    const data = registerSchema.parse(body);

    const user = await registerUser(data.email, data.password, data.name);

    return c.json(
      {
        success: true,
        data: {
          user,
        },
      },
      201
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json(
        {
          success: false,
          error: "Validation error",
          details: error.errors,
        },
        400
      );
    }

    const message = error instanceof Error ? error.message : "Registration failed";
    return c.json(
      {
        success: false,
        error: message,
      },
      error instanceof Error && message.includes("already exists") ? 409 : 500
    );
  }
});

// POST /api/auth/login
app.post("/login", async (c) => {
  try {
    const body = await c.req.json();
    const data = loginSchema.parse(body);

    const result = await loginUser(data.email, data.password);

    return c.json({
      success: true,
      data: {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json(
        {
          success: false,
          error: "Validation error",
          details: error.errors,
        },
        400
      );
    }

    const message = error instanceof Error ? error.message : "Login failed";
    return c.json(
      {
        success: false,
        error: message,
      },
      401
    );
  }
});

// POST /api/auth/refresh
app.post("/refresh", async (c) => {
  try {
    const body = await c.req.json();
    const data = refreshSchema.parse(body);

    const tokens = await refreshUserToken(data.refreshToken);

    return c.json({
      success: true,
      data: tokens,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json(
        {
          success: false,
          error: "Validation error",
          details: error.errors,
        },
        400
      );
    }

    const message = error instanceof Error ? error.message : "Token refresh failed";
    return c.json(
      {
        success: false,
        error: message,
      },
      401
    );
  }
});

// POST /api/auth/logout
app.post("/logout", requireAuth(), async (c: any) => {
  try {
    const userId = c.get("userId") as string;
    await logoutUser(userId);

    return c.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Logout failed";
    return c.json(
      {
        success: false,
        error: message,
      },
      500
    );
  }
});

// GET /api/auth/me
app.get("/me", requireAuth(), async (c: any) => {
  try {
    const userId = c.get("userId") as string;
    const user = await getUserById(userId);

    if (!user) {
      return c.json(
        {
          success: false,
          error: "User not found",
        },
        404
      );
    }

    return c.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get user";
    return c.json(
      {
        success: false,
        error: message,
      },
      500
    );
  }
});

export default app;
