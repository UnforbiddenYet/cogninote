#!/usr/bin/env bun
/**
 * Interactive Note Indexing CLI
 *
 * Allows you to select notes and index them in LightRAG.
 *
 * Usage: bun run apps/api/src/scripts/index-notes-cli.ts
 */

import { db } from "../db";
import { notes } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { indexNote, LIGHTRAG_ENABLED } from "../services/lightrag";
import { select, checkbox, input, confirm } from "@inquirer/prompts";
import { readFile } from "fs/promises";
import { join } from "path";

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

async function main() {
  console.log("🔍 Interactive Note Indexing Tool\n");

  if (!LIGHTRAG_ENABLED) {
    console.error("❌ LightRAG is not enabled");
    console.error("   Set LIGHTRAG_ENABLED=true in .env");
    process.exit(1);
  }

  try {
    // Get user ID
    const useDefaultUser = await confirm({
      message: "Use seed user?",
      default: true,
    });

    let userId: string;

    if (useDefaultUser) {
      userId = await getUserId();
      console.log(`   Using: ${userId}\n`);
    } else {
      userId = await input({
        message: "Enter user ID:",
        validate: (value) => (value.length > 0 ? true : "User ID required"),
      });
    }

    // Fetch all non-archived notes
    const allNotes = await db
      .select()
      .from(notes)
      .where(and(eq(notes.userId, userId), eq(notes.isArchived, false)));

    if (allNotes.length === 0) {
      console.log("ℹ️  No notes found for this user");
      process.exit(0);
    }

    // Show selection mode
    const mode = await select({
      message: "What would you like to do?",
      choices: [
        { name: "Select specific notes to index", value: "select" },
        { name: "Index all notes", value: "all" },
        { name: "Index recently created notes (last 7 days)", value: "recent" },
        { name: "Search and index", value: "search" },
      ],
    });

    let notesToIndex = allNotes;

    if (mode === "select") {
      const selected = await checkbox({
        message: "Select notes to index (space to select, enter to confirm):",
        choices: allNotes.map((note) => ({
          name: `${note.title} (${new Date(note.createdAt).toLocaleDateString()})`,
          value: note.id,
          checked: false,
        })),
        pageSize: 15,
      });

      if (selected.length === 0) {
        console.log("ℹ️  No notes selected");
        process.exit(0);
      }

      notesToIndex = allNotes.filter((n) => selected.includes(n.id));
    } else if (mode === "recent") {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      notesToIndex = allNotes.filter(
        (n) => new Date(n.createdAt) > sevenDaysAgo,
      );

      if (notesToIndex.length === 0) {
        console.log("ℹ️  No notes created in the last 7 days");
        process.exit(0);
      }

      console.log(`\n📅 Found ${notesToIndex.length} notes from last 7 days`);
    } else if (mode === "search") {
      const searchTerm = await input({
        message: "Search notes by title:",
        validate: (value) => (value.length > 0 ? true : "Search term required"),
      });

      notesToIndex = allNotes.filter((n) =>
        n.title.toLowerCase().includes(searchTerm.toLowerCase()),
      );

      if (notesToIndex.length === 0) {
        console.log(`ℹ️  No notes found matching "${searchTerm}"`);
        process.exit(0);
      }

      console.log(`\n🔍 Found ${notesToIndex.length} matching notes`);

      // Show what was found
      const proceed = await confirm({
        message: `Index ${notesToIndex.length} notes?`,
        default: true,
      });

      if (!proceed) {
        console.log("ℹ️  Cancelled");
        process.exit(0);
      }
    }

    // Confirm before indexing
    console.log(`\n📊 About to index ${notesToIndex.length} notes`);

    const confirmed = await confirm({
      message: "Proceed with indexing?",
      default: true,
    });

    if (!confirmed) {
      console.log("ℹ️  Cancelled");
      process.exit(0);
    }

    // Index selected notes
    console.log("\n⚙️  Indexing...\n");

    let success = 0;
    let failed = 0;
    const failedNotes: Array<{ id: string; title: string; error: string }> = [];

    for (let i = 0; i < notesToIndex.length; i++) {
      const note = notesToIndex[i];
      const progress = `[${i + 1}/${notesToIndex.length}]`;

      try {
        process.stdout.write(`${progress} ${note.title.substring(0, 50)}... `);

        const result = await indexNote(
          userId,
          note.id,
          note.title,
          note.content,
        );

        if (result) {
          console.log("✅");
          success++;
        } else {
          console.log("❌");
          failed++;
          failedNotes.push({
            id: note.id,
            title: note.title,
            error: "Indexing returned false",
          });
        }

        // Small delay to avoid overwhelming LightRAG
        await new Promise((r) => setTimeout(r, 300));
      } catch (error) {
        console.log("❌");
        failed++;
        failedNotes.push({
          id: note.id,
          title: note.title,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // Summary
    console.log("\n" + "─".repeat(50));
    console.log("✨ Indexing Complete!");
    console.log("─".repeat(50));
    console.log(`✅ Success: ${success}`);
    console.log(`❌ Failed:  ${failed}`);

    if (failedNotes.length > 0) {
      console.log("\n⚠️  Failed Notes:");
      failedNotes.forEach((n) => {
        console.log(`   • ${n.title}`);
        console.log(`     Error: ${n.error}`);
      });
    }

    console.log("\n");
    process.exit(0);
  } catch (error) {
    if (error instanceof Error && error.name === "ExitPromptError") {
      console.log("\n\nℹ️  Cancelled");
      process.exit(0);
    }
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
