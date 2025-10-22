import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  onCreate?: () => void;
}

export function EmptyState({ onCreate }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="max-w-md space-y-4">
        <h3 className="text-lg font-semibold">Brak pomysłów na prezenty</h3>
        <p className="text-sm text-muted-foreground">
          Nie znaleziono żadnych pomysłów spełniających wybrane kryteria. Spróbuj zmienić filtry lub dodaj nowy pomysł.
        </p>
        {onCreate && (
          <Button onClick={onCreate} size="lg" className="mt-4">
            Dodaj pomysł
          </Button>
        )}
      </div>
    </div>
  );
}
