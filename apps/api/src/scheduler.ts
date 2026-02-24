import { db } from "./db";
import { user } from "./db/schema";
import { purgeStaleEmptyNotes } from "./services/notes";
import { generateConnectionSuggestions } from "./services/suggestions";
import { purgeExpiredEntries } from "./cache";
import { HOUR_MS, MINUTE_MS } from "./lib/time";

async function refreshConnectionSuggestions() {
  const users = await db.select({ id: user.id }).from(user);
  for (const u of users) {
    try {
      const count = await generateConnectionSuggestions(u.id, 10);
      if (count > 0) {
        console.log(`[scheduler] Generated ${count} suggestions for user ${u.id}`);
      }
    } catch (err) {
      console.error(`[scheduler] Failed to generate suggestions for user ${u.id}:`, err);
    }
  }
}

export function startScheduler() {
  // Purge empty notes older than 24h — every hour
  setInterval(purgeStaleEmptyNotes, HOUR_MS);
  purgeStaleEmptyNotes();

  // Refresh connection suggestions for all users — every hour
  setInterval(refreshConnectionSuggestions, HOUR_MS);
  refreshConnectionSuggestions();

  // Purge stale in-memory cache entries — every 10 minutes
  setInterval(purgeExpiredEntries, 10 * MINUTE_MS);
}
