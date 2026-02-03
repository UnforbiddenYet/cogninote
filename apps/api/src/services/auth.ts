import { eq } from "drizzle-orm";
import { db } from "../db";
import { users, sessions } from "../db/schema";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../lib/jwt";
import { hashPassword, verifyPassword } from "../lib/password";

type User = {
  id: string;
  email: string;
  name: string;
  settings: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
};

export async function registerUser(
  email: string,
  password: string,
  name: string
): Promise<User> {
  // Check if user already exists
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser.length > 0) {
    throw new Error("User with this email already exists");
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create user
  const result = await db
    .insert(users)
    .values({
      email,
      passwordHash,
      name,
    })
    .returning();

  const newUser = result[0];

  return {
    id: newUser.id,
    email: newUser.email,
    name: newUser.name,
    settings: newUser.settings as Record<string, unknown>,
    createdAt: newUser.createdAt,
    updatedAt: newUser.updatedAt,
  };
}

export async function loginUser(
  email: string,
  password: string
): Promise<{ user: User; accessToken: string; refreshToken: string }> {
  // Find user
  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (userResult.length === 0) {
    throw new Error("Invalid email or password");
  }

  const user = userResult[0];

  // Verify password
  const isPasswordValid = await verifyPassword(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new Error("Invalid email or password");
  }

  // Generate tokens
  const accessToken = await generateAccessToken(user.id);
  const refreshToken = await generateRefreshToken(user.id);

  // Store refresh token hash in database
  const refreshTokenHash = await hashPassword(refreshToken);
  await db.insert(sessions).values({
    userId: user.id,
    tokenHash: refreshTokenHash,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      settings: user.settings as Record<string, unknown>,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
    accessToken,
    refreshToken,
  };
}

export async function refreshUserToken(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
}> {
  // Verify refresh token
  let userId: string;
  try {
    const verified = await verifyRefreshToken(refreshToken);
    userId = verified.userId;
  } catch {
    throw new Error("Invalid refresh token");
  }

  // Generate new tokens
  const accessToken = await generateAccessToken(userId);
  const newRefreshToken = await generateRefreshToken(userId);

  // Update session
  const refreshTokenHash = await hashPassword(newRefreshToken);
  await db
    .update(sessions)
    .set({
      tokenHash: refreshTokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    })
    .where(eq(sessions.userId, userId));

  return {
    accessToken,
    refreshToken: newRefreshToken,
  };
}

export async function logoutUser(userId: string): Promise<void> {
  // Delete all sessions for this user
  await db.delete(sessions).where(eq(sessions.userId, userId));
}

export async function getUserById(userId: string): Promise<User | null> {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  const user = result[0];

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    settings: user.settings as Record<string, unknown>,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
