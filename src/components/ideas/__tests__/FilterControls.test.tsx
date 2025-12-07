import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { FilterControls } from "../FilterControls";
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

const baseFilters: FilterStateVM = {
  page: 1,
  limit: 10,
  sort: "created_at",
  order: "desc",
  relationId: undefined,
  occasionId: undefined,
  source: undefined,
};

const filterOptions: FilterOptionsVM = {
  relations: [
    { value: 1, label: "Brat" },
    { value: 2, label: "Siostra" },
  ],
  occasions: [
    { value: 10, label: "Urodziny" },
    { value: 20, label: "Święta" },
  ],
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

function ControlledFilterControls({
  onChange,
  initialValue = baseFilters,
}: {
  onChange: (updates: Partial<FilterStateVM>) => void;
  initialValue?: FilterStateVM;
}) {
  const [value, setValue] = useState<FilterStateVM>(initialValue);

  return (
    <FilterControls
      value={value}
      options={filterOptions}
      onChange={(updates) => {
        setValue((prev) => ({ ...prev, ...updates }));
        onChange(updates);
      }}
    />
  );
}

describe("FilterControls", () => {
  it("renders all filter selects with labels", () => {
    render(<FilterControls value={baseFilters} options={filterOptions} onChange={vi.fn()} />);

    expect(screen.getByText("Relacja")).toBeInTheDocument();
    expect(screen.getByText("Okazja")).toBeInTheDocument();
    expect(screen.getByText("Źródło")).toBeInTheDocument();
    expect(screen.getByText("Sortuj według")).toBeInTheDocument();
    expect(screen.getByText("Kolejność")).toBeInTheDocument();
  });

  it("calls onChange with numeric relation id and resets to undefined for all option", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const onChange = vi.fn();
    render(<ControlledFilterControls onChange={onChange} />);

    await user.click(screen.getByLabelText("Filtruj według relacji"));
    await user.click(await screen.findByRole("option", { name: "Brat" }));
    expect(onChange).toHaveBeenCalledWith({ relationId: 1 });

    await user.click(screen.getByLabelText("Filtruj według relacji"));
    await user.click(await screen.findByRole("option", { name: "Wszystkie relacje" }));
    expect(onChange).toHaveBeenLastCalledWith({ relationId: undefined });
  });

  it("maps source, sort and order selections to correct filter updates", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const onChange = vi.fn();
    render(<ControlledFilterControls onChange={onChange} />);

    await user.click(screen.getByLabelText("Sortuj według"));
    await user.click(await screen.findByRole("option", { name: "Nazwa" }));

    await user.click(screen.getByLabelText("Kolejność sortowania"));
    await user.click(await screen.findByRole("option", { name: "Rosnąco" }));

    await user.click(screen.getByLabelText("Filtruj według źródła"));
    await user.click(await screen.findByRole("option", { name: "AI" }));

    expect(onChange).toHaveBeenNthCalledWith(1, { sort: "name" });
    expect(onChange).toHaveBeenNthCalledWith(2, { order: "asc" });
    expect(onChange).toHaveBeenNthCalledWith(3, { source: "ai" });
  });
});
