import app from "./app";

const port = process.env.API_PORT || 3001;

export default {
  port,
  fetch: app.fetch,
};

console.log(`🚀 MindGraph API running on port ${port}`);
