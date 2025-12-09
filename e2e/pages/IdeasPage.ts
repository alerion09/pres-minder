import { type Page, type Locator } from "@playwright/test";
import { BasePage } from "./BasePage";
import { IdeaFormDialog } from "./IdeaFormDialog";

/**
 * Page Object Model for the Ideas page (index page)
 * Represents the main ideas list view with filters and pagination
 */
export class IdeasPage extends BasePage {
  // Selectors
  private readonly createIdeaButton: Locator;
  private readonly ideasGrid: Locator;
  private readonly filterBar: Locator;
  private readonly pagination: Locator;

  constructor(page: Page) {
    super(page);
    this.createIdeaButton = this.getByTestId("create-idea-button");
    this.ideasGrid = page.locator("#ideas-list");
    this.filterBar = page.locator(".space-y-4.p-4.border.rounded-lg");
    this.pagination = page.locator("nav[aria-label*='pagination'], nav[role='navigation']").last();
  }

  /**
   * Navigate to the ideas page
   */
  async goto(): Promise<void> {
    await super.goto("/");
    await this.waitForLoad();
  }

  /**
   * Click the "Create Idea" button and return IdeaFormDialog instance
   */
  async clickCreateIdea(): Promise<IdeaFormDialog> {
    await this.createIdeaButton.click();
    const dialog = new IdeaFormDialog(this.page);
    await dialog.waitForOpen();
    return dialog;
  }

  /**
   * Check if the create idea button is visible
   */
  async isCreateButtonVisible(): Promise<boolean> {
    return await this.createIdeaButton.isVisible();
  }

  /**
   * Get all idea cards from the grid
   */
  async getIdeaCards(): Promise<Locator[]> {
    const cards = this.ideasGrid.locator('[role="listitem"]');
    const count = await cards.count();
    return Array.from({ length: count }, (_, i) => cards.nth(i));
  }

  /**
   * Get the count of displayed ideas
   */
  async getIdeaCount(): Promise<number> {
    const cards = this.ideasGrid.locator('[role="listitem"]');
    return await cards.count();
  }

  /**
   * Check if the ideas grid is visible
   */
  async isIdeasGridVisible(): Promise<boolean> {
    return await this.ideasGrid.isVisible();
  }

  /**
   * Check if the empty state is displayed
   */
  async isEmptyStateVisible(): Promise<boolean> {
    return await this.page.locator("text=Brak pomysłów").isVisible();
  }

  /**
   * Wait for ideas to load
   */
  async waitForIdeasLoad(): Promise<void> {
    await this.ideasGrid.waitFor({ state: "visible" });
    // Wait for loading state to finish
    await this.page.waitForFunction(
      () => {
        const grid = document.querySelector("#ideas-list");
        return grid?.getAttribute("aria-busy") !== "true";
      },
      { timeout: 10000 }
    );
  }

  /**
   * Click on an idea card by index (0-based)
   */
  async clickIdeaCard(index: number): Promise<void> {
    const cards = this.ideasGrid.locator('[role="listitem"]');
    await cards.nth(index).click();
  }

  /**
   * Click "Preview" button on an idea card by index
   */
  async clickPreviewOnCard(index: number): Promise<void> {
    const cards = this.ideasGrid.locator('[role="listitem"]');
    await cards.nth(index).locator('button:has-text("Podgląd")').click();
  }

  /**
   * Click "Edit" button on an idea card by index and return IdeaFormDialog instance
   */
  async clickEditOnCard(index: number): Promise<IdeaFormDialog> {
    const cards = this.ideasGrid.locator('[role="listitem"]');
    await cards.nth(index).locator('button:has-text("Edytuj")').click();
    const dialog = new IdeaFormDialog(this.page);
    await dialog.waitForOpen();
    return dialog;
  }

  /**
   * Click "Delete" button on an idea card by index
   */
  async clickDeleteOnCard(index: number): Promise<void> {
    const cards = this.ideasGrid.locator('[role="listitem"]');
    await cards.nth(index).locator('button:has-text("Usuń")').click();
  }

  /**
   * Get idea card title by index
   */
  async getIdeaCardTitle(index: number): Promise<string> {
    const cards = this.ideasGrid.locator('[role="listitem"]');
    const titleLocator = cards.nth(index).locator("h3, .text-lg");
    return (await titleLocator.textContent()) || "";
  }

  /**
   * Search for an idea by title
   */
  async findIdeaByTitle(title: string): Promise<number | null> {
    const cards = await this.getIdeaCards();
    for (let i = 0; i < cards.length; i++) {
      const cardTitle = await this.getIdeaCardTitle(i);
      if (cardTitle.includes(title)) {
        return i;
      }
    }
    return null;
  }

  /**
   * Check if filter bar is visible
   */
  async isFilterBarVisible(): Promise<boolean> {
    return await this.filterBar.isVisible();
  }

  /**
   * Check if pagination is visible
   */
  async isPaginationVisible(): Promise<boolean> {
    return await this.pagination.isVisible();
  }
}
