interface ResultsCountProps {
  total: number;
  page: number;
  limit: number;
}

export function ResultsCount({ total, page, limit }: ResultsCountProps) {
  if (total === 0) {
    return (
      <div className="text-sm text-muted-foreground" aria-live="polite">
        Brak wyników
      </div>
    );
  }

  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div className="text-sm text-muted-foreground" aria-live="polite">
      Wyświetlane {start}–{end} z {total} {total === 1 ? "wyniku" : "wyników"}
    </div>
  );
}
