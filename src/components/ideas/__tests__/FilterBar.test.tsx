import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FilterBar } from "../FilterBar";
import type { FilterOptionsVM, FilterStateVM } from "@/lib/types/ideas-view.types";

if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false;
}

if (!Element.prototype.setPointerCapture) {
  Element.prototype.setPointerCapture = () => undefined;
}

if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => undefined;
}

const filterOptions: FilterOptionsVM = {
  relations: [
    { value: 1, label: "Brat" },
    { value: 2, label: "Siostra" },
  ],
  occasions: [{ value: 10, label: "Urodziny" }],
  sources: [
    { value: "ai", label: "AI" },
    { value: "manual", label: "Ręczne" },
  ],
  sorts: [
    { value: "created_at", label: "Data utworzenia" },
    { value: "name", label: "Nazwa" },
  ],
  orders: [
    { value: "desc", label: "Malejąco" },
    { value: "asc", label: "Rosnąco" },
  ],
};

const defaultFilters: FilterStateVM = {
  page: 1,
  limit: 10,
  sort: "created_at",
  order: "desc",
  relationId: undefined,
  occasionId: undefined,
  source: undefined,
};

describe("FilterBar", () => {
  it("renders heading, results count and filter controls without reset button by default", () => {
    render(
      <FilterBar
        value={defaultFilters}
        options={filterOptions}
        results={3}
        totalResults={10}
        onChange={vi.fn()}
        onReset={vi.fn()}
      />
    );

    expect(screen.getByText("Filtry")).toBeInTheDocument();
    expect(screen.getAllByText("Wyświetlane 3 z 10 wyników")).toHaveLength(2);
    expect(screen.queryByRole("button", { name: /Resetuj filtry/ })).not.toBeInTheDocument();
    expect(screen.getByText("Relacja")).toBeInTheDocument();
  });

  it("shows reset button when filters differ from defaults and triggers onReset", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const onReset = vi.fn();
    render(
      <FilterBar
        value={{ ...defaultFilters, relationId: 1 }}
        options={filterOptions}
        results={5}
        totalResults={12}
        onChange={vi.fn()}
        onReset={onReset}
      />
    );

    const resetButton = screen.getByRole("button", { name: "Resetuj filtry" });
    await user.click(resetButton);

    expect(onReset).toHaveBeenCalled();
  });

  it("forwards onChange to underlying filter controls", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const onChange = vi.fn();
    render(
      <FilterBar
        value={defaultFilters}
        options={filterOptions}
        results={2}
        totalResults={8}
        onChange={onChange}
        onReset={vi.fn()}
      />
    );

    await user.click(screen.getByLabelText("Sortuj według"));
    await user.click(await screen.findByRole("option", { name: "Nazwa" }));

    expect(onChange).toHaveBeenCalledWith({ sort: "name" });
  });
});
