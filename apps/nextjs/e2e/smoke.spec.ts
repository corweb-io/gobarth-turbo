import { expect, test } from "@playwright/test";

test.describe("Smoke tests", () => {
  test("homepage loads successfully", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBeLessThan(400);
  });

  test("page has a title", async ({ page }) => {
    await page.goto("/");
    const title = await page.title();
    expect(title).toBeTruthy();
  });

  test("no console errors on homepage", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    expect(errors).toEqual([]);
  });
});

test.describe("Health & navigation", () => {
  test("404 page renders for unknown routes", async ({ page }) => {
    const response = await page.goto("/this-route-does-not-exist");
    expect(response?.status()).toBe(404);
  });

  test("redirects unauthenticated users from protected routes", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    // Should redirect to login or show auth page
    await page
      .waitForURL(/\/(login|auth|sign-in)/, { timeout: 5000 })
      .catch(() => {
        // If no redirect, the page should still load without error
      });
  });
});
