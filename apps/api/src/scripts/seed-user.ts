#!/usr/bin/env bun
/**
 * Seed User Script
 *
 * Creates a seed user using Better Auth's sign-up handler.
 *
 * Usage: bun run src/scripts/seed-user.ts
 *
 * Login credentials:
 *   Email: seed@example.com
 *   Password: password123
 */

import { writeFile } from "fs/promises";
import { join } from "path";
import { db } from "../db";
import { user } from "../db/auth-schema";
import { auth } from "../lib/auth";

const SEED_USER_EMAIL = "seed@example.com";
const SEED_USER_NAME = "Seed User";
const SEED_PASSWORD = "password123";
const API_URL = process.env.API_URL || "http://localhost:3001";
const SEED_FILE = join(import.meta.dir, "./seeds/.seed-user-id");

async function seedUser() {
  console.log("👤 Seeding user via Better Auth...\n");

  try {
    await db.delete(user);

    const response = await auth.api.signUpEmail({
      body: {
        email: SEED_USER_EMAIL,
        password: SEED_PASSWORD,
        name: SEED_USER_NAME,
      },
    });

    const { id: userId } = response.user;
    await writeFile(SEED_FILE, userId, "utf-8");
    console.log(`User ID: ${userId}`);
    console.log("\n" + "─".repeat(40));
    console.log("🔐 Login credentials:");
    console.log(`   Email:    ${SEED_USER_EMAIL}`);
    console.log(`   Password: ${SEED_PASSWORD}`);
    console.log("─".repeat(40));
    console.log(`\n💡 Login at: ${API_URL.replace("3001", "3000")}/sign-in`);
  } catch (error) {
    console.error("❌ Failed:", error);
    console.error("\n💡 Make sure the API server is running:");
    console.error("   bun run dev");
    process.exit(1);
  }
}

seedUser()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
