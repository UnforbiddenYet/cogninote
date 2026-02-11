#!/usr/bin/env bun
/**
 * Seed Notes Script
 *
 * Seeds the database with notes from seeds/notes/*.md files.
 * Uses the user ID from seeds/.seed-user-id (created by seed-user.ts)
 *
 * Usage:
 *   bun run src/scripts/seed-user.ts   # First, create user
 *   bun run src/scripts/seed-notes.ts  # Then, seed notes
 */

import { db } from "../db";
import { notes } from "../db/schema";
import { readdir, readFile } from "fs/promises";
import { join } from "path";

const SEEDS_DIR = join(import.meta.dir, "./seeds/notes");
const SEED_USER_FILE = join(import.meta.dir, "./seeds/.seed-user-id");

async function getUserId(): Promise<string> {
  try {
    const userId = await readFile(SEED_USER_FILE, "utf-8");
    return userId.trim();
  } catch {
    console.error("❌ No seed user found. Run seed-user.ts first:");
    console.error("   bun run apps/api/src/scripts/seed-user.ts");
    process.exit(1);
  }
}

async function seedNotes() {
  console.log("📝 Seeding notes...\n");

  await db.delete(notes);

  try {
    // Get user ID
    const userId = await getUserId();
    console.log(`👤 Using user ID: ${userId}\n`);

    // Read markdown files
    console.log("📂 Reading seed files...");
    const files = await readdir(SEEDS_DIR);
    const mdFiles = files.filter((f) => f.endsWith(".md")).sort();
    console.log(`   Found ${mdFiles.length} markdown files\n`);

    // Create notes
    let created = 0;
    let skipped = 0;

    for (let i = 0; i < mdFiles.length; i++) {
      const fileName = mdFiles[i];
      const filePath = join(SEEDS_DIR, fileName);
      const content = await readFile(filePath, "utf-8");

      // Extract title from first line (# Title)
      const firstLine = content.split("\n")[0];
      const title =
        firstLine.replace(/^#\s*/, "").trim() || fileName.replace(".md", "");

      // Create note
      const contentPlain = content.replace(/[#*_`[\]]/g, "").substring(0, 1000);

      await db.insert(notes).values({
        userId,
        title,
        content,
        contentPlain,
      });

      console.log(`✅ Created: ${title}`);
      created++;
    }

    // Summary
    console.log("\n" + "─".repeat(40));
    console.log(`✨ Done! Created: ${created}, Skipped: ${skipped}`);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

seedNotes()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
