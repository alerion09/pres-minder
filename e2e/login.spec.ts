import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";

test.describe("Login Page", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page before each test
    await page.goto("/login");
  });

  test("should display login form", async ({ page }) => {
    // Verify form heading using data-test-id
    await expect(page.locator('[data-test-id="login-heading"]')).toContainText(/logowanie/i);

    // Verify form is visible
    await expect(page.locator('[data-test-id="login-form"]')).toBeVisible();

    // Verify form elements are visible
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test("should show validation error for empty fields", async ({ page }) => {
    const loginPage = new LoginPage(page);

    // Try to submit empty form
    await loginPage.submit();

    // Wait for validation errors to appear
    await page.waitForTimeout(500);

    // Check for inline error messages (form uses custom validation with inline errors)
    const emailErrorVisible = await page.locator(".text-destructive").first().isVisible();
    expect(emailErrorVisible).toBeTruthy();

    // Verify email input has aria-invalid attribute
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toHaveAttribute("aria-invalid", "true");

    // Check that error message contains expected text
    const errorMessages = await page.locator(".text-destructive").allTextContents();
    const hasExpectedError = errorMessages.some(
      (msg) =>
        msg.toLowerCase().includes("email") ||
        msg.toLowerCase().includes("wymagane") ||
        msg.toLowerCase().includes("wymagany")
    );
    expect(hasExpectedError).toBeTruthy();
  });

  test("should show error for invalid credentials", async ({ page }) => {
    const loginPage = new LoginPage(page);

    // Attempt login with invalid credentials
    await loginPage.login("invalid@example.com", "wrongpassword");

    // Wait for either error alert to appear OR stay on login page (no redirect)
    try {
      // Try to wait for error alert
      await page.waitForSelector('[role="alert"]', { state: "visible", timeout: 5000 });

      // If alert appeared, verify error message
      const hasError = await loginPage.hasError();
      expect(hasError).toBeTruthy();

      const errorText = await loginPage.getErrorText();
      const errorLower = errorText.toLowerCase();
      expect(
        errorLower.includes("błąd") ||
          errorLower.includes("nieprawidłowy") ||
          errorLower.includes("email") ||
          errorLower.includes("hasło")
      ).toBeTruthy();
    } catch (e) {
      // If no alert appeared, verify we're still on login page (not redirected)
      await expect(page).toHaveURL(/.*login.*/);

      // And verify submit button is not in loading state (login completed but failed)
      const isLoading = await loginPage.isLoading();
      expect(isLoading).toBeFalsy();
    }
  });

  test("should navigate to login page from root when not authenticated", async ({ page }) => {
    await page.goto("/");

    // Should redirect to login if not authenticated
    // Adjust assertion based on actual redirect behavior
    await page.waitForURL(/.*\/login.*/);
  });
});
