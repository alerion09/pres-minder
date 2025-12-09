import { Button } from "@/components/ui/button";

interface IdeasHeaderProps {
  onCreate: () => void;
}

export function IdeasHeader({ onCreate }: IdeasHeaderProps) {
  return (
    <header className="mb-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Moje pomysły</h1>
          <p className="text-muted-foreground">Zarządzaj swoimi pomysłami na prezenty</p>
        </div>
        <Button onClick={onCreate} size="lg" className="shrink-0" data-test-id="create-idea-button">
          Dodaj nowy pomysł
        </Button>
      </div>
    </header>
  );
}
