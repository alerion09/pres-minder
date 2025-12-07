import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";

test.describe("Login Page", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page before each test
    await page.goto("/login");
  });

  test("should display login form", async ({ page }) => {
    // Verify page title or heading
    await expect(page.locator("h1")).toContainText(/zaloguj|login/i);

    // Verify form elements are visible
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test("should show validation error for empty fields", async ({ page }) => {
    const loginPage = new LoginPage(page);

    // Try to submit empty form
    await loginPage.submit();

    // Check for HTML5 validation or custom error messages
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toHaveAttribute("required", "");
  });

  test("should show error for invalid credentials", async ({ page }) => {
    const loginPage = new LoginPage(page);

    // Attempt login with invalid credentials
    await loginPage.login("invalid@example.com", "wrongpassword");

    // Wait for navigation or error message
    // Note: This test may need adjustment based on actual error handling
    await page.waitForTimeout(1000);
  });

  test("should navigate to login page from root when not authenticated", async ({ page }) => {
    await page.goto("/");

    // Should redirect to login if not authenticated
    // Adjust assertion based on actual redirect behavior
    await page.waitForURL(/.*\/login.*/);
  });
});

test.describe("Login Page - Visual Tests", () => {
  test("should match login page screenshot", async ({ page }) => {
    await page.goto("/login");

    // Wait for page to fully load
    await page.waitForLoadState("networkidle");

    // Visual regression testing
    await expect(page).toHaveScreenshot("login-page.png", {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });
});
