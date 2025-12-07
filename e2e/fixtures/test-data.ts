/**
 * Test data fixtures for E2E tests
 */

export const TEST_USERS = {
  valid: {
    email: "test@example.com",
    password: "ValidPassword123!",
  },
  invalid: {
    email: "invalid@example.com",
    password: "wrongpassword",
  },
};

export const TEST_IDEAS = {
  manual: {
    title: "Test Idea Title",
    description: "Test idea description for E2E testing",
    source: "manual" as const,
  },
};
