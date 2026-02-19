import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db";
import * as schema from "../db/schema";
export type { User } from "better-auth";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  socialProviders: {},
  secret: process.env.BETTER_AUTH_SECRET || "dev-secret-key-change-in-production",
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3001",
  trustedOrigins: [process.env.ALLOWED_ORIGIN || "http://localhost:3000"],
  advanced: {
    cookiePrefix: "mindgraph",
    useSecureCookies: process.env.NODE_ENV === "production",
  },
});
