import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    // Environment configuration
    environment: "jsdom",

    // Global test APIs (describe, it, expect)
    globals: true,

    // Setup files to run before tests
    setupFiles: ["./vitest.setup.ts"],

    // Coverage configuration
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "dist/",
        ".astro/",
        "**/*.config.{js,ts,mjs}",
        "**/*.d.ts",
        "**/types.ts",
        "src/db/database.types.ts",
        "src/components/ui/**", // Shadcn UI components (external)
      ],
    },

    // Include test files
    include: ["**/*.{test,spec}.{js,ts,jsx,tsx}"],

    // Exclude patterns
    exclude: ["node_modules", "dist", ".astro", "e2e/**"],
  },

  // Path resolution
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
