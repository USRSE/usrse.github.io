import { test, expect } from "@playwright/test";

/**
 * Foundation smoke: visit the admin app unauthenticated, expect the
 * sign-in surface (no admin chrome). Doesn't sign in — that requires
 * WorkOS automation we don't ship at v1. The test catches the most
 * common failure modes (deploy serving a 404, env var missing,
 * RootErrorBoundary tripping on bad config) without auth complexity.
 */
test("unauthenticated visit shows sign-in", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "US-RSE Admin" })).toBeVisible();
  await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
});

test("the auth callback path renders without crashing", async ({ page }) => {
  await page.goto("/auth/callback");
  await expect(page.getByText(/signing you in/i)).toBeVisible();
});

test("unauthenticated visit to /members triggers sign-in flow", async ({ page }) => {
  await page.goto("/members");
  // Auto-redirect kicks in; expect Connecting to WorkOS text (or sign-in card).
  await expect(page.getByText(/connecting to workos|sign in/i)).toBeVisible();
});

test("the duplicates page renders its sign-in surface unauthenticated", async ({ page }) => {
  await page.goto("/members/duplicates");
  await expect(page.getByText(/connecting to workos|sign in/i)).toBeVisible();
});
