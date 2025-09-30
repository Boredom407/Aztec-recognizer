import { defineConfig } from "vitest/config"
import { fileURLToPath } from "node:url"

const srcPath = fileURLToPath(new URL("./src", import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      "@": srcPath,
      "@/": srcPath + "/",
    },
  },
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],
    exclude: ["tests/e2e/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      reportsDirectory: "coverage",
    },
    setupFiles: ["./vitest.setup.ts"],
  },
})
