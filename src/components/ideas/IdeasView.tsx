import { useState } from "react";
import { useQueryStateSync } from "@/hooks/useQueryStateSync";
import { FilterBar } from "./FilterBar";
import { IdeasGrid } from "./IdeasGrid";
import { IdeasPagination } from "./IdeasPagination";
import type { IdeaDTO, RelationDTO, OccasionDTO, PaginationMetaDTO } from "@/types";
import type { FilterStateVM, FilterOptionsVM } from "@/lib/types/ideas-view.types";

interface IdeasViewProps {
  initialIdeas: IdeaDTO[];
  initialPagination: PaginationMetaDTO;
  initialFilters: FilterStateVM;
  relations: RelationDTO[];
  occasions: OccasionDTO[];
}

/**
 * Prepare filter options from relations and occasions
 */
function prepareFilterOptions(relations: RelationDTO[], occasions: OccasionDTO[]): FilterOptionsVM {
  return {
    relations: relations.map((r) => ({ value: r.id, label: r.name })),
    occasions: occasions.map((o) => ({ value: o.id, label: o.name })),
    sources: [
      { value: "manual" as const, label: "Ręczne" },
      { value: "ai" as const, label: "AI" },
      { value: "edited-ai" as const, label: "AI (edytowane)" },
    ],
    sorts: [
      { value: "created_at" as const, label: "Data utworzenia" },
      { value: "updated_at" as const, label: "Data aktualizacji" },
      { value: "name" as const, label: "Nazwa" },
    ],
    orders: [
      { value: "asc" as const, label: "Rosnąco" },
      { value: "desc" as const, label: "Malejąco" },
    ],
  };
}

export function IdeasView({ initialIdeas, initialPagination, initialFilters, relations, occasions }: IdeasViewProps) {
  const [selectedIdeaId, setSelectedIdeaId] = useState<number | null>(null);

  const { filters, updateFilters, resetFilters, isUpdating } = useQueryStateSync(initialFilters);

  const filterOptions = prepareFilterOptions(relations, occasions);

  const handlePreview = (id: number) => {
    setSelectedIdeaId(id);
    // TODO: Open preview dialog
    console.log("Preview idea:", id);
  };

  const handleEdit = (id: number) => {
    setSelectedIdeaId(id);
    // TODO: Open edit dialog
    console.log("Edit idea:", id);
  };

  const handleDelete = (id: number) => {
    setSelectedIdeaId(id);
    // TODO: Open delete confirmation
    console.log("Delete idea:", id);
  };

  const handleCreate = () => {
    // TODO: Open create dialog
    console.log("Create new idea");
  };

  const handlePageChange = (page: number) => {
    updateFilters({ page });
    // Focus the list for accessibility
    document.getElementById("ideas-list")?.focus();
  };

  return (
    <div className="space-y-6">
      <FilterBar
        value={filters}
        options={filterOptions}
        pagination={initialPagination}
        onChange={updateFilters}
        onReset={resetFilters}
      />

      <IdeasGrid
        ideas={initialIdeas}
        isLoading={isUpdating}
        onPreview={handlePreview}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCreate={handleCreate}
        pending={isUpdating}
      />

      <IdeasPagination pagination={initialPagination} onPageChange={handlePageChange} />

      {/* TODO: Add dialogs for preview, edit, delete, create */}
    </div>
  );
}
