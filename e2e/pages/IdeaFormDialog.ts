import { type Page, type Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Page Object Model for the Idea Form Dialog
 * Handles both create and edit modes
 */
export class IdeaFormDialog extends BasePage {
  // Dialog container
  private readonly dialog: Locator;

  // Form fields
  private readonly nameInput: Locator;
  private readonly budgetMinInput: Locator;
  private readonly budgetMaxInput: Locator;
  private readonly relationSelect: Locator;
  private readonly occasionSelect: Locator;
  private readonly ageInput: Locator;
  private readonly interestsTextarea: Locator;
  private readonly personDescriptionTextarea: Locator;
  private readonly contentTextarea: Locator;

  // AI Suggestions section
  private readonly aiSuggestionsSection: Locator;
  private readonly generateAiButton: Locator;
  private readonly aiSuggestionsList: Locator;

  // Action buttons
  private readonly cancelButton: Locator;
  private readonly submitButton: Locator;

  constructor(page: Page) {
    super(page);

    // Initialize locators
    this.dialog = this.getByTestId("idea-form-dialog");

    // Form fields
    this.nameInput = this.getByTestId("idea-name-input");
    this.budgetMinInput = this.getByTestId("idea-budget-min-input");
    this.budgetMaxInput = this.getByTestId("idea-budget-max-input");
    this.relationSelect = this.getByTestId("idea-relation-select");
    this.occasionSelect = this.getByTestId("idea-occasion-select");
    this.ageInput = this.getByTestId("idea-age-input");
    this.interestsTextarea = this.getByTestId("idea-interests-textarea");
    this.personDescriptionTextarea = this.getByTestId("idea-person-description-textarea");
    this.contentTextarea = this.getByTestId("idea-content-textarea");

    // AI section
    this.aiSuggestionsSection = this.getByTestId("ai-suggestions-section");
    this.generateAiButton = this.getByTestId("generate-ai-ideas-button");
    this.aiSuggestionsList = this.getByTestId("ai-suggestions-list");

    // Buttons
    this.cancelButton = this.getByTestId("idea-form-cancel-button");
    this.submitButton = this.getByTestId("idea-form-submit-button");
  }

  /**
   * Wait for dialog to open
   */
  async waitForOpen(): Promise<void> {
    await this.dialog.waitFor({ state: "visible", timeout: 10000 });
  }

  /**
   * Wait for dialog to close
   */
  async waitForClose(): Promise<void> {
    await this.dialog.waitFor({ state: "hidden", timeout: 10000 });
  }

  /**
   * Check if dialog is visible
   */
  async isVisible(): Promise<boolean> {
    return await this.dialog.isVisible();
  }

  /**
   * Get dialog title (to determine mode: create or edit)
   */
  async getDialogTitle(): Promise<string> {
    const titleLocator = this.dialog.locator("h2, [role='heading']").first();
    return (await titleLocator.textContent()) || "";
  }

  /**
   * Check if dialog is in create mode
   */
  async isCreateMode(): Promise<boolean> {
    const title = await this.getDialogTitle();
    return title.includes("Dodaj nowy pomysł");
  }

  /**
   * Check if dialog is in edit mode
   */
  async isEditMode(): Promise<boolean> {
    const title = await this.getDialogTitle();
    return title.includes("Edytuj pomysł");
  }

  /**
   * Fill the idea name field
   */
  async fillName(name: string): Promise<void> {
    await this.nameInput.fill(name);
  }

  /**
   * Fill the budget range
   */
  async fillBudget(min?: string, max?: string): Promise<void> {
    if (min) {
      await this.budgetMinInput.fill(min);
    }
    if (max) {
      await this.budgetMaxInput.fill(max);
    }
  }

  /**
   * Select a relation by visible text
   */
  async selectRelation(relationName: string): Promise<void> {
    // Click to open the select
    await this.relationSelect.click();

    // Wait for any of these possible selectors (Radix UI can vary)
    await Promise.race([
      this.page.locator('[data-slot="select-content"]').waitFor({ state: "visible", timeout: 5000 }),
      this.page.locator('[role="listbox"]').waitFor({ state: "visible", timeout: 5000 }),
      this.page.locator("[data-radix-select-content]").waitFor({ state: "visible", timeout: 5000 }),
    ]);

    // Try multiple selectors for the option
    const option = this.page
      .locator(
        `[data-slot="select-item"]:has-text("${relationName}"), ` +
          `[role="option"]:has-text("${relationName}"), ` +
          `[data-radix-collection-item]:has-text("${relationName}")`
      )
      .first();

    await option.click({ timeout: 5000 });
  }

  /**
   * Select an occasion by visible text
   */
  async selectOccasion(occasionName: string): Promise<void> {
    // Click to open the select
    await this.occasionSelect.click();

    // Wait for any of these possible selectors
    await Promise.race([
      this.page.locator('[data-slot="select-content"]').waitFor({ state: "visible", timeout: 5000 }),
      this.page.locator('[role="listbox"]').waitFor({ state: "visible", timeout: 5000 }),
      this.page.locator("[data-radix-select-content]").waitFor({ state: "visible", timeout: 5000 }),
    ]);

    // Try multiple selectors for the option
    const option = this.page
      .locator(
        `[data-slot="select-item"]:has-text("${occasionName}"), ` +
          `[role="option"]:has-text("${occasionName}"), ` +
          `[data-radix-collection-item]:has-text("${occasionName}")`
      )
      .first();

    await option.click({ timeout: 5000 });
  }

  /**
   * Select a relation by index (0-based)
   * More reliable than selecting by text
   */
  async selectRelationByIndex(index: number): Promise<string> {
    await this.relationSelect.click();
    await this.page.waitForTimeout(500);

    const option = this.page.getByRole("option").nth(index);
    const text = (await option.textContent()) || "";
    await option.click();

    return text;
  }

  /**
   * Select an occasion by index (0-based)
   * More reliable than selecting by text
   */
  async selectOccasionByIndex(index: number): Promise<string> {
    await this.occasionSelect.click();
    await this.page.waitForTimeout(500);

    const option = this.page.getByRole("option").nth(index);
    const text = (await option.textContent()) || "";
    await option.click();

    return text;
  }

  /**
   * Get all available relations from the select
   */
  async getAvailableRelations(): Promise<string[]> {
    await this.relationSelect.click();
    await this.page.waitForTimeout(500);

    const options = await this.page.getByRole("option").allTextContents();

    // Close by pressing Escape
    await this.page.keyboard.press("Escape");

    return options.filter((text) => text.trim().length > 0);
  }

  /**
   * Get all available occasions from the select
   */
  async getAvailableOccasions(): Promise<string[]> {
    await this.occasionSelect.click();
    await this.page.waitForTimeout(500);

    const options = await this.page.getByRole("option").allTextContents();

    // Close by pressing Escape
    await this.page.keyboard.press("Escape");

    return options.filter((text) => text.trim().length > 0);
  }

  /**
   * Fill the age field
   */
  async fillAge(age: string): Promise<void> {
    await this.ageInput.fill(age);
  }

  /**
   * Fill the interests field
   */
  async fillInterests(interests: string): Promise<void> {
    await this.interestsTextarea.fill(interests);
  }

  /**
   * Fill the person description field
   */
  async fillPersonDescription(description: string): Promise<void> {
    await this.personDescriptionTextarea.fill(description);
  }

  /**
   * Fill the content field
   */
  async fillContent(content: string): Promise<void> {
    await this.contentTextarea.fill(content);
  }

  /**
   * Fill all required fields with provided data
   */
  async fillRequiredFields(data: { name: string; content: string }): Promise<void> {
    await this.fillName(data.name);
    await this.fillContent(data.content);
  }

  /**
   * Fill complete form with all optional fields
   */
  async fillCompleteForm(data: {
    name: string;
    content: string;
    budgetMin?: string;
    budgetMax?: string;
    relation?: string;
    occasion?: string;
    age?: string;
    interests?: string;
    personDescription?: string;
  }): Promise<void> {
    await this.fillName(data.name);
    await this.fillContent(data.content);

    if (data.budgetMin || data.budgetMax) {
      await this.fillBudget(data.budgetMin, data.budgetMax);
    }

    if (data.relation) {
      await this.selectRelation(data.relation);
    }

    if (data.occasion) {
      await this.selectOccasion(data.occasion);
    }

    if (data.age) {
      await this.fillAge(data.age);
    }

    if (data.interests) {
      await this.fillInterests(data.interests);
    }

    if (data.personDescription) {
      await this.fillPersonDescription(data.personDescription);
    }
  }

  /**
   * Click the "Generate AI Ideas" button
   */
  async clickGenerateAI(): Promise<void> {
    await this.generateAiButton.click();
  }

  /**
   * Wait for AI suggestions to appear
   */
  async waitForAISuggestions(timeout = 30000): Promise<void> {
    await this.aiSuggestionsList.waitFor({ state: "visible", timeout });
  }

  /**
   * Check if AI suggestions are visible
   */
  async areAISuggestionsVisible(): Promise<boolean> {
    return await this.aiSuggestionsList.isVisible();
  }

  /**
   * Get count of AI suggestion cards
   */
  async getAISuggestionsCount(): Promise<number> {
    const cards = this.aiSuggestionsList.locator('[data-test-id^="ai-suggestion-card-"]');
    return await cards.count();
  }

  /**
   * Click on an AI suggestion card by index (0-based)
   */
  async clickAISuggestion(index: number): Promise<void> {
    const card = this.getByTestId(`ai-suggestion-card-${index}`);
    await card.click();
  }

  /**
   * Get text of an AI suggestion by index
   */
  async getAISuggestionText(index: number): Promise<string> {
    const card = this.getByTestId(`ai-suggestion-card-${index}`);
    return (await card.textContent()) || "";
  }

  /**
   * Generate AI suggestions and select the first one
   */
  async generateAndSelectFirstAISuggestion(): Promise<string> {
    await this.clickGenerateAI();
    await this.waitForAISuggestions();
    const suggestionText = await this.getAISuggestionText(0);
    await this.clickAISuggestion(0);
    return suggestionText;
  }

  /**
   * Click the Cancel button
   */
  async clickCancel(): Promise<void> {
    await this.cancelButton.click();
    await this.waitForClose();
  }

  /**
   * Click the Submit button (Create or Save)
   */
  async clickSubmit(): Promise<void> {
    await this.submitButton.click();
  }

  /**
   * Submit the form and wait for it to close
   */
  async submitAndWaitForClose(): Promise<void> {
    await this.clickSubmit();
    await this.waitForClose();
  }

  /**
   * Get validation error message for a specific field
   */
  async getFieldError(fieldName: "name" | "content" | "age" | "budget_min" | "budget_max"): Promise<string | null> {
    const errorLocator = this.page.locator(`#${fieldName}-error`);
    const isVisible = await errorLocator.isVisible();
    if (!isVisible) return null;
    return await errorLocator.textContent();
  }

  /**
   * Check if submit button is disabled
   */
  async isSubmitDisabled(): Promise<boolean> {
    return await this.submitButton.isDisabled();
  }

  /**
   * Check if form is in loading/pending state
   */
  async isFormPending(): Promise<boolean> {
    const submitText = await this.submitButton.textContent();
    return submitText?.includes("Zapisywanie...") || false;
  }
}
