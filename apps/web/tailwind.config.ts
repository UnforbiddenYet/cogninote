import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  // In Tailwind v4, most theme configuration is done in CSS using @theme
  // Keep JS config minimal - only for things that can't be done in CSS
} satisfies Config;
