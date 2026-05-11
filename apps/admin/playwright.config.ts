import { defineConfig, devices } from "@playwright/test";

/**
 * Single-browser smoke. Tests run against the deployed admin URL
 * (set ADMIN_URL in env) — usually a preview deploy after PR review,
 * or admin.us-rse.org in CI for main pushes.
 */
export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: process.env.ADMIN_URL ?? "http://localhost:5174",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
