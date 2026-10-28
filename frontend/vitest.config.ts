import path from "path";
import { defineConfig } from "vitest/config";

// A dedicated config keeps the app's Vite plugins out of the test run while
// still resolving the "@/" alias used by the source files under test.
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
