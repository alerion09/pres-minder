import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { IdeaCard } from "../IdeaCard";
import type { IdeaDTO } from "@/types";

const baseIdea: IdeaDTO = {
  id: 1,
  name: "Pomysł prezentu",
  content: "Krótki opis",
  source: "manual",
  relation_name: "Brat",
  occasion_name: "Urodziny",
  relation_id: null,
  occasion_id: null,
  age: null,
  budget_max: null,
  budget_min: null,
  interests: null,
  person_description: null,
  created_at: "",
  updated_at: "",
};

describe("IdeaCard", () => {
  it("should render title, badge, relations and excerpt", () => {
    render(<IdeaCard idea={baseIdea} onPreview={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getByText("Pomysł prezentu")).toBeInTheDocument();
    expect(screen.getByText("Ręczne")).toBeInTheDocument();
    expect(screen.getByText("Brat • Urodziny")).toBeInTheDocument();
    expect(screen.getByText("Krótki opis")).toBeInTheDocument();
  });

  it("should not render relation/occasion line when both are missing", () => {
    const idea: IdeaDTO = { ...baseIdea, relation_name: null, occasion_name: null };
    render(<IdeaCard idea={idea} onPreview={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.queryByText(/•/)).not.toBeInTheDocument();
  });

  it("should truncate long content to 150 chars plus ellipsis", () => {
    const longContent = "a".repeat(200);
    render(
      <IdeaCard idea={{ ...baseIdea, content: longContent }} onPreview={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />
    );

    const excerpt = screen.getByText((content) => content.startsWith("a") && content.endsWith("..."));
    expect(excerpt.textContent?.endsWith("...")).toBe(true);
    expect(excerpt.textContent?.length).toBe(153);
  });

  it("should call action handlers with idea id", async () => {
    const onPreview = vi.fn();
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(<IdeaCard idea={baseIdea} onPreview={onPreview} onEdit={onEdit} onDelete={onDelete} />);

    await userEvent.click(screen.getByRole("button", { name: /Podgląd pomysłu/ }));
    await userEvent.click(screen.getByRole("button", { name: /Edytuj pomysł/ }));
    await userEvent.click(screen.getByRole("button", { name: /Usuń pomysł/ }));

    expect(onPreview).toHaveBeenCalledWith(baseIdea.id);
    expect(onEdit).toHaveBeenCalledWith(baseIdea.id);
    expect(onDelete).toHaveBeenCalledWith(baseIdea.id);
  });

  it("should disable all buttons when pending is true", () => {
    render(<IdeaCard idea={baseIdea} onPreview={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} pending />);

    expect(screen.getByRole("button", { name: /Podgląd pomysłu/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Edytuj pomysł/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Usuń pomysł/ })).toBeDisabled();
  });
});
