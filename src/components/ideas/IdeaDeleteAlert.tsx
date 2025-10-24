import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface IdeaDeleteAlertProps {
  open: boolean;
  ideaId: number;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}

export function IdeaDeleteAlert({ open, ideaId, onOpenChange, onDeleted }: IdeaDeleteAlertProps) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsPending(true);
    setError(null);

    try {
      const response = await fetch(`/api/ideas/${ideaId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      // Sukces - zamknij dialog i wywołaj callback
      onOpenChange(false);
      onDeleted();
    } catch (err) {
      console.error("[IdeaDeleteAlert] Delete error:", err);
      setError(err instanceof Error ? err.message : "Nie udało się usunąć pomysłu");
    } finally {
      setIsPending(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    // Nie pozwalaj zamknąć podczas pending
    if (isPending) return;

    // Reset błędu przy zamykaniu
    if (!newOpen) {
      setError(null);
    }

    onOpenChange(newOpen);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Czy na pewno chcesz usunąć ten pomysł?</AlertDialogTitle>
          <AlertDialogDescription>
            Ta operacja jest nieodwracalna. Pomysł zostanie trwale usunięty z bazy danych.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive" role="alert" aria-live="assertive">
            {error}
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Anuluj</AlertDialogCancel>
          <AlertDialogAction
            onClick={async (e) => {
              e.preventDefault();
              await handleDelete();
            }}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? "Usuwanie..." : "Usuń"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
