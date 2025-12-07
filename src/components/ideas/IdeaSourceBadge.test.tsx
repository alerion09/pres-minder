import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { IdeaSourceBadge } from "./IdeaSourceBadge";
import type { IdeaSource } from "@/types";

describe("IdeaSourceBadge", () => {
  it("renders manual source badge with correct label", () => {
    render(<IdeaSourceBadge source="manual" />);
    expect(screen.getByText("Ręczne")).toBeInTheDocument();
  });

  it("renders AI source badge with correct label", () => {
    render(<IdeaSourceBadge source="ai" />);
    expect(screen.getByText("AI")).toBeInTheDocument();
  });

  it("renders edited AI source badge with correct label", () => {
    render(<IdeaSourceBadge source="edited-ai" />);
    expect(screen.getByText("AI (edytowane)")).toBeInTheDocument();
  });

  it("falls back to manual config for unknown source", () => {
    render(<IdeaSourceBadge source={"unknown" as IdeaSource} />);
    expect(screen.getByText("Ręczne")).toBeInTheDocument();
  });

  it("applies correct CSS classes", () => {
    render(<IdeaSourceBadge source="manual" />);
    const badge = screen.getByText("Ręczne");
    expect(badge).toHaveClass("text-xs");
  });
});
