import { defineConfig, devices } from "@playwright/test"

const testUser = JSON.stringify({
  id: "test-user",
  name: "Test User",
  email: "test@example.com",
  image: null,
})

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: "http://localhost:3000",
    headless: true,
  },
  webServer: {
    command:
      "cross-env AUTH_TEST_MODE=true AUTH_TEST_USER='" +
      testUser +
      "' NEXT_TELEMETRY_DISABLED=1 pnpm dev",
    port: 3000,
    reuseExistingServer: !process.env.CI,
    stdout: "pipe",
    stderr: "pipe",
    timeout: 240_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
})
