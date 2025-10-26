import { useState } from "react";
import { useQueryStateSync } from "@/hooks/useQueryStateSync";
import { IdeasHeader } from "./IdeasHeader";
import { FilterBar } from "./FilterBar";
import { IdeasGrid } from "./IdeasGrid";
import { IdeasPagination } from "./IdeasPagination";
import { IdeaPreviewDialog } from "./IdeaPreviewDialog";
import { IdeaFormDialog } from "./IdeaFormDialog";
import { IdeaDeleteAlert } from "./IdeaDeleteAlert";
import type { IdeaDTO, RelationDTO, OccasionDTO, PaginationMetaDTO } from "@/types";
import type { FilterStateVM, FilterOptionsVM } from "@/lib/types/ideas-view.types";

interface IdeasViewProps {
  userId: string;
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

export function IdeasView({
  userId,
  initialIdeas,
  initialPagination,
  initialFilters,
  relations,
  occasions,
}: IdeasViewProps) {
  const [ideas, setIdeas] = useState<IdeaDTO[]>(initialIdeas);
  const [selectedIdeaId, setSelectedIdeaId] = useState<number | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { filters, updateFilters, resetFilters, isUpdating } = useQueryStateSync(initialFilters);

  const filterOptions = prepareFilterOptions(relations, occasions);
  const selectedIdea = ideas.find((idea) => idea.id === selectedIdeaId);

  const handlePreview = (id: number) => {
    setSelectedIdeaId(id);
    setPreviewOpen(true);
  };

  const handleEdit = (id: number) => {
    setSelectedIdeaId(id);
    setFormMode("edit");
    setFormOpen(true);
  };

  const handleDelete = (id: number) => {
    setSelectedIdeaId(id);
    setDeleteOpen(true);
  };

  const handleCreate = () => {
    setSelectedIdeaId(null);
    setFormMode("create");
    setFormOpen(true);
  };

  const handleSaved = (savedIdea: IdeaDTO) => {
    if (formMode === "create") {
      // Dodaj nowy pomysł na początek listy
      setIdeas((prev) => [savedIdea, ...prev]);
    } else {
      // Zaktualizuj istniejący pomysł
      setIdeas((prev) => prev.map((idea) => (idea.id === savedIdea.id ? savedIdea : idea)));
    }
    // Odśwież stronę aby zsynchronizować z serwerem
    window.location.reload();
  };

  const handleDeleted = () => {
    // Usuń pomysł z listy
    setIdeas((prev) => prev.filter((idea) => idea.id !== selectedIdeaId));
    // Odśwież stronę aby zsynchronizować z serwerem
    window.location.reload();
  };

  const handlePageChange = (page: number) => {
    updateFilters({ page });
    // Focus the list for accessibility
    document.getElementById("ideas-list")?.focus();
  };

  return (
    <div className="space-y-6">
      <IdeasHeader onCreate={handleCreate} />

      <FilterBar
        value={filters}
        options={filterOptions}
        results={ideas?.length || 0}
        totalResults={initialPagination?.total}
        onChange={updateFilters}
        onReset={resetFilters}
      />

      <IdeasGrid
        ideas={ideas}
        isLoading={isUpdating}
        onPreview={handlePreview}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCreate={handleCreate}
        pending={isUpdating}
      />

      <IdeasPagination pagination={initialPagination} onPageChange={handlePageChange} />

      {/* Dialogs */}
      <IdeaPreviewDialog open={previewOpen} idea={selectedIdea} onOpenChange={setPreviewOpen} />

      <IdeaFormDialog
        open={formOpen}
        mode={formMode}
        userId={userId}
        idea={formMode === "edit" ? selectedIdea : undefined}
        relations={relations}
        occasions={occasions}
        onOpenChange={setFormOpen}
        onSaved={handleSaved}
      />

      <IdeaDeleteAlert
        open={deleteOpen}
        ideaId={selectedIdeaId ?? 0}
        onOpenChange={setDeleteOpen}
        onDeleted={handleDeleted}
      />
    </div>
  );
}
