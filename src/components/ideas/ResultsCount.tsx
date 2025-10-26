interface ResultsCountProps {
  results: number;
  totalResults: number;
}

export function ResultsCount({ results, totalResults }: ResultsCountProps) {
  if (totalResults === 0) {
    return (
      <div className="text-sm text-muted-foreground" aria-live="polite">
        Brak wyników
      </div>
    );
  }

  return (
    <div className="text-sm text-muted-foreground" aria-live="polite">
      Wyświetlane {results} z {totalResults} {totalResults === 1 ? "wyniku" : "wyników"}
    </div>
  );
}
