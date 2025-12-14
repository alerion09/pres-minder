import { IdeaCard } from "./IdeaCard";
import { IdeaCardSkeleton } from "./IdeaCardSkeleton";
import { EmptyState } from "./EmptyState";
import type { IdeaDTO } from "@/types";

interface IdeasGridProps {
  ideas: IdeaDTO[];
  isLoading?: boolean;
  onPreview: (id: number) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onCreate?: () => void;
  pending?: boolean;
}

export function IdeasGrid({
  ideas,
  isLoading = false,
  onPreview,
  onEdit,
  onDelete,
  onCreate,
  pending = false,
}: IdeasGridProps) {
  // Show skeletons while loading
  if (isLoading) {
    return (
      <div
        id="ideas-list"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        aria-busy="true"
        aria-live="polite"
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <IdeaCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  // Show empty state if no ideas
  if (ideas.length === 0) {
    return (
      <div className="md:h-[calc(100vh-28rem)]">
        <EmptyState onCreate={onCreate} />
      </div>
    );
  }

  // Show ideas grid
  return (
    <div
      id="ideas-list"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      role="list"
      aria-live="polite"
    >
      {ideas.map((idea) => (
        <div key={idea.id} role="listitem">
          <IdeaCard idea={idea} onPreview={onPreview} onEdit={onEdit} onDelete={onDelete} pending={pending} />
        </div>
      ))}
    </div>
  );
}
