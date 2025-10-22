import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { IdeaSourceBadge } from "./IdeaSourceBadge";
import type { IdeaDTO } from "@/types";

interface IdeaCardProps {
  idea: IdeaDTO;
  onPreview: (id: number) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  pending?: boolean;
}

/**
 * Truncate text to a maximum length with ellipsis
 */
function truncateText(text: string, maxLength = 150): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength).trim() + "...";
}

export function IdeaCard({ idea, onPreview, onEdit, onDelete, pending = false }: IdeaCardProps) {
  const excerpt = truncateText(idea.content);

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg line-clamp-2">{idea.name}</CardTitle>
          <IdeaSourceBadge source={idea.source} />
        </div>
        {(idea.relation_name || idea.occasion_name) && (
          <div className="text-sm text-muted-foreground">
            {[idea.relation_name, idea.occasion_name].filter(Boolean).join(" • ")}
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1">
        <p className="text-sm text-muted-foreground line-clamp-3">{excerpt}</p>
      </CardContent>

      <CardFooter className="flex justify-end gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPreview(idea.id)}
          disabled={pending}
          aria-label={`Podgląd pomysłu: ${idea.name}`}
        >
          Podgląd
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(idea.id)}
          disabled={pending}
          aria-label={`Edytuj pomysł: ${idea.name}`}
        >
          Edytuj
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(idea.id)}
          disabled={pending}
          aria-label={`Usuń pomysł: ${idea.name}`}
        >
          Usuń
        </Button>
      </CardFooter>
    </Card>
  );
}
