import { Button } from "@/components/ui/button";
import { FilterControls } from "./FilterControls";
import { ResultsCount } from "./ResultsCount";
import type { FilterStateVM, FilterOptionsVM } from "@/lib/types/ideas-view.types";
import type { PaginationMetaDTO } from "@/types";

interface FilterBarProps {
  value: FilterStateVM;
  options: FilterOptionsVM;
  pagination: PaginationMetaDTO;
  onChange: (updates: Partial<FilterStateVM>) => void;
  onReset: () => void;
}

const DEFAULT_FILTERS: Partial<FilterStateVM> = {
  relationId: undefined,
  occasionId: undefined,
  source: undefined,
  sort: "created_at",
  order: "desc",
};

function hasActiveFilters(filters: FilterStateVM): boolean {
  return (
    filters.relationId !== DEFAULT_FILTERS.relationId ||
    filters.occasionId !== DEFAULT_FILTERS.occasionId ||
    filters.source !== DEFAULT_FILTERS.source ||
    filters.sort !== DEFAULT_FILTERS.sort ||
    filters.order !== DEFAULT_FILTERS.order
  );
}

export function FilterBar({ value, options, pagination, onChange, onReset }: FilterBarProps) {
  const showResetButton = hasActiveFilters(value);

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-card">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Filtry</h2>
        <div className="flex items-center gap-4">
          <ResultsCount total={pagination.total} page={pagination.page} limit={pagination.limit} />
          {showResetButton && (
            <Button variant="outline" size="sm" onClick={onReset} aria-label="Resetuj filtry">
              Resetuj filtry
            </Button>
          )}
        </div>
      </div>

      <FilterControls value={value} options={options} onChange={onChange} />
    </div>
  );
}
