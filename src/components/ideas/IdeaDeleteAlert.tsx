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
import { showSuccessToast, showErrorToast } from "@/lib/utils/toast-helpers";

interface IdeaDeleteAlertProps {
  open: boolean;
  ideaId: number;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}

export function IdeaDeleteAlert({ open, ideaId, onOpenChange, onDeleted }: IdeaDeleteAlertProps) {
  const [isPending, setIsPending] = useState(false);

  const handleDelete = async () => {
    setIsPending(true);

    try {
      const response = await fetch(`/api/ideas/${ideaId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        console.error("[IdeaDeleteAlert] Delete error:", { status: response.status, error: data });
        showErrorToast(data.error || "Nie udało się usunąć pomysłu");
        return;
      }

      // Sukces - zamknij dialog, pokaż toast i wywołaj callback
      showSuccessToast("Pomysł został usunięty");
      onOpenChange(false);
      onDeleted();
    } catch (err) {
      console.error("[IdeaDeleteAlert] Delete error:", err);
      showErrorToast("Wystąpił błąd podczas usuwania pomysłu");
    } finally {
      setIsPending(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    // Nie pozwalaj zamknąć podczas pending
    if (isPending) return;

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
