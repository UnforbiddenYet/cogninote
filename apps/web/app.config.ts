import { defineConfig } from "@tanstack/start/config";

export default defineConfig({
  server: {
    port: 3000,
    middleware: [],
  },
  routers: {
    client: {
      entry: "./app/routes/__root.tsx",
    },
  },
  env: {
    apiUrl: process.env.API_URL || "http://localhost:3001",
  },
});
