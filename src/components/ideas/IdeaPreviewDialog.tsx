import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { IdeaSourceBadge } from "./IdeaSourceBadge";
import type { IdeaDTO } from "@/types";

interface IdeaPreviewDialogProps {
  open: boolean;
  idea?: IdeaDTO;
  onOpenChange: (open: boolean) => void;
}

export function IdeaPreviewDialog({ open, idea, onOpenChange }: IdeaPreviewDialogProps) {
  if (!idea) return null;

  const formatBudget = (min?: number | null, max?: number | null): string => {
    const notSpecified = "Nie określono";
    if (!min && !max) return notSpecified;
    if (min && max) return `${min} - ${max} PLN`;
    if (min) return `Od ${min} PLN`;
    if (max) return `Do ${max} PLN`;
    return notSpecified;
  };

  const formatDate = (date: string): string => {
    return new Date(date).toLocaleDateString("pl-PL", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" aria-describedby="idea-preview-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span>{idea.name}</span>
            <IdeaSourceBadge source={idea.source} />
          </DialogTitle>
        </DialogHeader>

        <div id="idea-preview-description" className="grid gap-6">
          {/* Podstawowe informacje */}
          <div className="grid gap-4">
            <div className="grid grid-cols-[120px_1fr] gap-2 items-start">
              <span className="text-sm font-medium text-muted-foreground">Relacja:</span>
              <span className="text-sm">{idea.relation_name || "Nie określono"}</span>
            </div>

            <div className="grid grid-cols-[120px_1fr] gap-2 items-start">
              <span className="text-sm font-medium text-muted-foreground">Okazja:</span>
              <span className="text-sm">{idea.occasion_name || "Nie określono"}</span>
            </div>

            {idea.age && (
              <div className="grid grid-cols-[120px_1fr] gap-2 items-start">
                <span className="text-sm font-medium text-muted-foreground">Wiek:</span>
                <span className="text-sm">{idea.age} lat</span>
              </div>
            )}

            {idea.interests && (
              <div className="grid grid-cols-[120px_1fr] gap-2 items-start">
                <span className="text-sm font-medium text-muted-foreground">Zainteresowania:</span>
                <span className="text-sm">{idea.interests}</span>
              </div>
            )}

            {idea.person_description && (
              <div className="grid grid-cols-[120px_1fr] gap-2 items-start">
                <span className="text-sm font-medium text-muted-foreground">Opis osoby:</span>
                <span className="text-sm whitespace-pre-wrap">{idea.person_description}</span>
              </div>
            )}

            <div className="grid grid-cols-[120px_1fr] gap-2 items-start">
              <span className="text-sm font-medium text-muted-foreground">Budżet:</span>
              <span className="text-sm">{formatBudget(idea.budget_min, idea.budget_max)}</span>
            </div>
          </div>

          {/* Treść pomysłu */}
          <div className="space-y-2 border-t pt-4">
            <h3 className="text-sm font-semibold">Pomysł na prezent</h3>
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{idea.content}</p>
          </div>

          {/* Metadane */}
          <div className="grid gap-2 border-t pt-4 text-xs text-muted-foreground">
            <div className="grid grid-cols-[120px_1fr] gap-2">
              <span>Utworzono:</span>
              <span>{formatDate(idea.created_at)}</span>
            </div>
            <div className="grid grid-cols-[120px_1fr] gap-2">
              <span>Ostatnia edycja:</span>
              <span>{formatDate(idea.updated_at)}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
