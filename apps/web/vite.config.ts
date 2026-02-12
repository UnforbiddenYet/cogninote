import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  plugins: [
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
      routesDirectory: "./src/routes",
      generatedRouteTree: "./src/routeTree.gen.ts",
    }),
    tailwindcss(),
    react(),
  ],
  resolve: {
    alias: {
      "@api-server/hc": path.resolve(__dirname, "../api/src/hc.ts"),
    },
  },
  server: {
    port: 3000,
    cors: true,
  },
  define: {
    __API_URL__: JSON.stringify(process.env.API_URL || "http://localhost:3001"),
  },
});
