import app from "./app";
import { purgeStaleEmptyNotes } from "./services/notes";

const port = process.env.PORT || 3001;

// Purge empty notes older than 24h — every hour
setInterval(purgeStaleEmptyNotes, 60 * 60 * 1000);
purgeStaleEmptyNotes();

export default {
  port,
  fetch: app.fetch,
};
