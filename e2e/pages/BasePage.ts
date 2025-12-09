import { type Page, type Locator } from "@playwright/test";

/**
 * Base Page Object class with common methods for all pages
 * Provides reusable navigation and interaction patterns
 */
export class BasePage {
  protected readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigate to a specific URL
   */
  async goto(path: string): Promise<void> {
    await this.page.goto(path);
  }

  /**
   * Wait for page to be fully loaded
   */
  async waitForLoad(): Promise<void> {
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Get element by data-test-id
   */
  getByTestId(testId: string): Locator {
    return this.page.locator(`[data-test-id="${testId}"]`);
  }

  /**
   * Click element by data-test-id
   */
  async clickByTestId(testId: string): Promise<void> {
    await this.getByTestId(testId).click();
  }

  /**
   * Fill input by data-test-id
   */
  async fillByTestId(testId: string, value: string): Promise<void> {
    await this.getByTestId(testId).fill(value);
  }

  /**
   * Check if element is visible by data-test-id
   */
  async isVisibleByTestId(testId: string): Promise<boolean> {
    return await this.getByTestId(testId).isVisible();
  }

  /**
   * Wait for element to be visible by data-test-id
   */
  async waitForTestId(testId: string, options?: { timeout?: number }): Promise<void> {
    await this.getByTestId(testId).waitFor({ state: "visible", ...options });
  }

  /**
   * Get page title
   */
  async getTitle(): Promise<string> {
    return await this.page.title();
  }

  /**
   * Get current URL
   */
  getUrl(): string {
    return this.page.url();
  }

  /**
   * Take a screenshot
   */
  async screenshot(options?: { path?: string; fullPage?: boolean }): Promise<Buffer> {
    return await this.page.screenshot(options);
  }
}
