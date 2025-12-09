import { test, expect } from "./fixtures/auth.fixture";
import { IdeasPage } from "./pages/IdeasPage";
import { IdeaFormDialog } from "./pages/IdeaFormDialog";

/**
 * E2E tests for Ideas management
 * Tests the complete flow of creating, editing, and managing ideas
 *
 * Prerequisites:
 * - Application must be running on http://localhost:3000
 * - .env.test must contain TEST_USER_EMAIL and TEST_USER_PASSWORD
 */

test.describe("Ideas Management", () => {
  let ideasPage: IdeasPage;

  test.beforeEach(async ({ authenticatedPage }) => {
    ideasPage = new IdeasPage(authenticatedPage);
    await ideasPage.goto();
  });

  test.describe("Create New Idea", () => {
    test("should open idea form dialog when clicking create button", async () => {
      // Act
      const formDialog = await ideasPage.clickCreateIdea();

      // Assert
      expect(await formDialog.isVisible()).toBeTruthy();
      expect(await formDialog.isCreateMode()).toBeTruthy();
    });

    test("should create a new idea with required fields only", async () => {
      // Arrange
      const ideaData = {
        name: "Test Idea - Required Fields Only",
        content: "This is a test idea with only required fields filled.",
      };

      // Act
      const formDialog = await ideasPage.clickCreateIdea();
      await formDialog.fillRequiredFields(ideaData);
      await formDialog.submitAndWaitForClose();

      // Assert - check if idea appears in the list
      await ideasPage.waitForIdeasLoad();
      const ideaIndex = await ideasPage.findIdeaByTitle(ideaData.name);
      expect(ideaIndex).not.toBeNull();
    });

    test("should create a new idea with all fields filled", async () => {
      // Arrange
      const ideaData = {
        name: "Complete Test Idea",
        content: "This is a comprehensive test idea with all fields filled.",
        budgetMin: "100",
        budgetMax: "500",
        age: "30",
        interests: "Czytanie, sport, gotowanie",
        personDescription: "Osoba aktywna i kreatywna",
      };

      // Act
      const formDialog = await ideasPage.clickCreateIdea();

      // Fill basic fields
      await formDialog.fillName(ideaData.name);
      await formDialog.fillContent(ideaData.content);
      await formDialog.fillBudget(ideaData.budgetMin, ideaData.budgetMax);
      await formDialog.fillAge(ideaData.age);
      await formDialog.fillInterests(ideaData.interests);
      await formDialog.fillPersonDescription(ideaData.personDescription);

      // Select first available relation and occasion (by index)
      const selectedRelation = await formDialog.selectRelationByIndex(0);
      const selectedOccasion = await formDialog.selectOccasionByIndex(0);

      console.log("Selected relation:", selectedRelation);
      console.log("Selected occasion:", selectedOccasion);

      await formDialog.submitAndWaitForClose();

      // Assert
      await ideasPage.waitForIdeasLoad();
      const ideaIndex = await ideasPage.findIdeaByTitle(ideaData.name);
      expect(ideaIndex).not.toBeNull();
    });

    test("should show validation error when submitting empty form", async () => {
      // Act
      const formDialog = await ideasPage.clickCreateIdea();
      await formDialog.clickSubmit();

      // Assert - dialog should still be visible with errors
      expect(await formDialog.isVisible()).toBeTruthy();
      const nameError = await formDialog.getFieldError("name");
      const contentError = await formDialog.getFieldError("content");
      expect(nameError).not.toBeNull();
      expect(contentError).not.toBeNull();
    });

    test("should cancel idea creation and close dialog", async () => {
      // Act
      const formDialog = await ideasPage.clickCreateIdea();
      await formDialog.fillName("Test Idea to Cancel");
      await formDialog.clickCancel();

      // Assert - dialog should be closed
      expect(await formDialog.isVisible()).toBeFalsy();
    });
  });

  test.describe("Create Idea with AI Suggestions", () => {
    test("should generate AI suggestions and select one", async () => {
      // Arrange
      const ideaData = {
        name: "AI-Generated Gift Idea",
        age: "25",
        interests: "Technologia, gry komputerowe",
        budgetMin: "200",
        budgetMax: "800",
      };

      // Act
      const formDialog = await ideasPage.clickCreateIdea();
      await formDialog.fillName(ideaData.name);
      await formDialog.fillBudget(ideaData.budgetMin, ideaData.budgetMax);

      // Select first available options
      await formDialog.selectRelationByIndex(0);
      await formDialog.selectOccasionByIndex(0);

      await formDialog.fillAge(ideaData.age);
      await formDialog.fillInterests(ideaData.interests);

      // Generate AI suggestions
      await formDialog.clickGenerateAI();
      await formDialog.waitForAISuggestions();

      // Assert - check if suggestions are visible
      expect(await formDialog.areAISuggestionsVisible()).toBeTruthy();
      const suggestionsCount = await formDialog.getAISuggestionsCount();
      expect(suggestionsCount).toBeGreaterThan(0);

      // Select first suggestion
      const suggestionText = await formDialog.getAISuggestionText(0);
      await formDialog.clickAISuggestion(0);

      // Submit the form
      await formDialog.submitAndWaitForClose();

      // Assert - idea should be created
      await ideasPage.waitForIdeasLoad();
      const ideaIndex = await ideasPage.findIdeaByTitle(ideaData.name);
      expect(ideaIndex).not.toBeNull();
    });

    test("should generate and select AI suggestion using helper method", async () => {
      // Arrange
      const ideaData = {
        name: "Quick AI Idea",
        budgetMin: "50",
        budgetMax: "150",
      };

      // Act
      const formDialog = await ideasPage.clickCreateIdea();
      await formDialog.fillName(ideaData.name);
      await formDialog.fillBudget(ideaData.budgetMin, ideaData.budgetMax);

      // Use helper method to generate and select first suggestion
      const suggestionText = await formDialog.generateAndSelectFirstAISuggestion();

      // Assert - content should be filled with suggestion
      expect(suggestionText).toBeTruthy();
      expect(suggestionText.length).toBeGreaterThan(0);

      // Submit
      await formDialog.submitAndWaitForClose();

      // Verify idea was created
      await ideasPage.waitForIdeasLoad();
      const ideaIndex = await ideasPage.findIdeaByTitle(ideaData.name);
      expect(ideaIndex).not.toBeNull();
    });
  });

  test.describe("Ideas List Display", () => {
    test("should display ideas grid on page load", async () => {
      // Assert
      expect(await ideasPage.isIdeasGridVisible()).toBeTruthy();
      expect(await ideasPage.isCreateButtonVisible()).toBeTruthy();
    });

    test("should show filter bar", async () => {
      // Assert
      expect(await ideasPage.isFilterBarVisible()).toBeTruthy();
    });

    test("should display multiple ideas if available", async () => {
      // Act
      await ideasPage.waitForIdeasLoad();
      const ideaCount = await ideasPage.getIdeaCount();

      // Assert
      expect(ideaCount).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe("Edit Existing Idea", () => {
    test("should open edit dialog when clicking edit button", async () => {
      // Arrange - ensure at least one idea exists
      await ideasPage.waitForIdeasLoad();
      const ideaCount = await ideasPage.getIdeaCount();

      if (ideaCount === 0) {
        // Create an idea first
        const formDialog = await ideasPage.clickCreateIdea();
        await formDialog.fillRequiredFields({
          name: "Idea for Edit Test",
          content: "This idea will be edited",
        });
        await formDialog.submitAndWaitForClose();
        await ideasPage.waitForIdeasLoad();
      }

      // Act
      const editDialog = await ideasPage.clickEditOnCard(0);

      // Assert
      expect(await editDialog.isVisible()).toBeTruthy();
      expect(await editDialog.isEditMode()).toBeTruthy();
    });
  });
});
