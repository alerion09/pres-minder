import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Mock scrollIntoView (not available in JSDOM)
Element.prototype.scrollIntoView = function () {
  // No-op in test environment
};

// Cleanup after each test
afterEach(() => {
  cleanup();
});
