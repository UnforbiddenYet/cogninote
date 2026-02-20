#!/usr/bin/env bun
/**
 * Bulk Re-indexing Script for LightRAG
 *
 * This script re-indexes all existing notes into LightRAG.
 * Use this when:
 * - Setting up LightRAG for the first time
 * - LightRAG data was lost or corrupted
 * - You want to rebuild the entire index
 *
 * Usage: bun run src/scripts/reindex-notes.ts
 */

import { eq } from "drizzle-orm";
import { db } from "../db";
import { notes } from "../db/schema";
import { indexNote } from "../services/lightrag";

async function reindexAllNotes() {
  console.log("🚀 Starting bulk re-indexing of notes into LightRAG...\n");

  try {
    // Fetch all non-archived notes
    const allNotes = await db.select().from(notes).where(eq(notes.isArchived, false));

    if (allNotes.length === 0) {
      console.log("No notes found to index.");
      return;
    }

    console.log(`Found ${allNotes.length} notes to index\n`);

    let successCount = 0;
    let failCount = 0;
    const failedNotes: string[] = [];

    for (let i = 0; i < allNotes.length; i++) {
      const note = allNotes[i];
      const progress = `[${i + 1}/${allNotes.length}]`;

      try {
        console.log(`${progress} Indexing note: ${note.title.substring(0, 50)}...`);

        const success = await indexNote(note.userId, note.id, note.content);

        if (success) {
          successCount++;
        } else {
          failCount++;
          failedNotes.push(note.id);
          console.error(`${progress} ❌ Failed to index note ${note.id}`);
        }

        // Rate limiting: 500ms between requests to avoid overwhelming LightRAG
        if (i < allNotes.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      } catch (error) {
        failCount++;
        failedNotes.push(note.id);
        console.error(`${progress} ❌ Error indexing note ${note.id}:`, error);
      }
    }

    // Summary
    console.log(`\n${"=".repeat(50)}`);
    console.log("📊 Re-indexing In-progress!");
    console.log("=".repeat(50));
    console.log(`✅ Successfully submitted: ${successCount} notes`);
    console.log(`❌ Failed to submit: ${failCount} notes`);

    if (failedNotes.length > 0) {
      console.log("\n⚠️  Failed note IDs:");
      for (const id of failedNotes) console.log(`  - ${id}`);
    }

    console.log("\n");
  } catch (error) {
    console.error("❌ Fatal error during re-indexing:", error);
    process.exit(1);
  }
}

// Run the script
reindexAllNotes()
  .then(() => {
    console.log("✨ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
