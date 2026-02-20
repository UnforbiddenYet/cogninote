import { serveStatic } from "hono/bun";
import { resolve } from "node:path";

import app from "./app";
import { purgeStaleEmptyNotes } from "./services/notes";

// Serve built web app (no-op in dev when dist doesn't exist)
const webDist = resolve(import.meta.dirname, "../../web/dist");
app
  .use("/*", serveStatic({ root: webDist }))
  .use("/*", serveStatic({ root: webDist, path: "index.html" }));

const port = process.env.PORT || 3001;

// Purge empty notes older than 24h — every hour
setInterval(purgeStaleEmptyNotes, 60 * 60 * 1000);
purgeStaleEmptyNotes();

export default {
  port,
  fetch: app.fetch,
};
