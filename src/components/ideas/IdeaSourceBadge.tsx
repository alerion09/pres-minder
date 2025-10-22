import { Badge } from "@/components/ui/badge";
import type { IdeaSource } from "@/types";

interface IdeaSourceBadgeProps {
  source: IdeaSource;
}

const sourceConfig = {
  manual: {
    label: "Ręczne",
    variant: "secondary" as const,
  },
  ai: {
    label: "AI",
    variant: "default" as const,
  },
  "edited-ai": {
    label: "AI (edytowane)",
    variant: "outline" as const,
  },
};

export function IdeaSourceBadge({ source }: IdeaSourceBadgeProps) {
  const config = sourceConfig[source] || sourceConfig.manual;

  return (
    <Badge variant={config.variant} className="text-xs">
      {config.label}
    </Badge>
  );
}
