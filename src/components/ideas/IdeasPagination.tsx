import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import type { PaginationMetaDTO } from "@/types";

interface IdeasPaginationProps {
  pagination: PaginationMetaDTO;
  onPageChange: (page: number) => void;
}

export function IdeasPagination({ pagination, onPageChange }: IdeasPaginationProps) {
  const { page, total_pages } = pagination;

  const canGoPrev = page > 1;
  const canGoNext = page < total_pages;

  // Keyboard navigation (Arrow keys)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if no input/textarea is focused
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        document.activeElement?.tagName === "SELECT"
      ) {
        return;
      }

      if (e.key === "ArrowLeft" && canGoPrev) {
        e.preventDefault();
        onPageChange(page - 1);
      } else if (e.key === "ArrowRight" && canGoNext) {
        e.preventDefault();
        onPageChange(page + 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [page, canGoPrev, canGoNext, onPageChange]);

  if (total_pages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-between border-t pt-4">
      <div className="text-sm text-muted-foreground">
        Strona {page} z {total_pages}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={!canGoPrev}
          aria-label="Poprzednia strona (strzałka w lewo)"
        >
          Poprzednia
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={!canGoNext}
          aria-label="Następna strona (strzałka w prawo)"
        >
          Następna
        </Button>
      </div>
    </div>
  );
}
