import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
export type { User } from "better-auth";
import { db } from "../db";
import * as schema from "../db/schema";

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
  baseURL: process.env.BETTER_AUTH_BASE_URL || "http://localhost:3001",
  trustedOrigins: [process.env.BETTER_AUTH_TRUSTED_ORIGIN || "http://localhost:3000"],
  advanced: {
    cookiePrefix: "cogninote",
    useSecureCookies: process.env.NODE_ENV === "production",
  },
});
