import { test as base, type Page } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";

/**
 * Authentication credentials from environment variables (.env.test)
 */
const E2E_USERNAME = process.env.E2E_USERNAME || "";
const E2E_PASSWORD = process.env.E2E_PASSWORD || "";
const E2E_USERNAME_ID = process.env.E2E_USERNAME_ID || "";

/**
 * Extended test fixture with authenticated page
 * Automatically logs in before each test using credentials from .env.test
 */
export const test = base.extend<{ authenticatedPage: Page }>({
  authenticatedPage: async ({ page }, use) => {
    // Perform login before test
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(E2E_USERNAME, E2E_PASSWORD);
    await loginPage.waitForLoginSuccess();

    // Provide authenticated page to test
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(page);

    // Cleanup (if needed) after test
  },
});

export { expect } from "@playwright/test";

/**
 * Helper function to perform login manually in tests
 */
export async function login(page: Page, email?: string, password?: string) {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(email || E2E_USERNAME, password || E2E_PASSWORD);
  await loginPage.waitForLoginSuccess();
}

/**
 * Get test credentials from environment
 */
export function getTestCredentials() {
  if (!E2E_USERNAME || !E2E_PASSWORD) {
    throw new Error("Test credentials not found. Make sure E2E_USERNAME and E2E_PASSWORD are set in .env.test");
  }
  return {
    username: E2E_USERNAME,
    password: E2E_PASSWORD,
    userId: E2E_USERNAME_ID,
  };
}
