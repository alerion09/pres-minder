import { useState, useMemo, useCallback, useId } from "react";
import { AlertTriangle } from "lucide-react";
import type { DeleteAccountActionResult } from "@/types";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface DeleteAccountPanelProps {
  userEmail?: string;
  onRequestDelete?: () => Promise<DeleteAccountActionResult>;
}

export default function DeleteAccountPanel({ userEmail, onRequestDelete }: DeleteAccountPanelProps) {
  const [acknowledged, setAcknowledged] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const checkboxId = useId();

  const isValid = useMemo(() => acknowledged, [acknowledged]);

  const handleAcknowledgeChange = useCallback((checked: boolean) => {
    setAcknowledged(checked);
    if (checked) {
      setError(null);
    }
  }, []);

  const handleDeleteClick = useCallback(async () => {
    if (!isValid) {
      setError("Musisz potwierdzić nieodwracalność operacji");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // TODO: Integrate with API endpoint /api/account/delete
      // For now, simulate async operation
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (onRequestDelete) {
        const result = await onRequestDelete();
        if (result.success) {
          setSuccess(true);
          setError(null);
        } else {
          setError(result.message || "Wystąpił błąd podczas usuwania konta");
          setSuccess(false);
        }
      } else {
        // Mock success for development
        console.log("Mock: Account deletion requested");
        setSuccess(true);
      }
    } catch (err) {
      setError("Wystąpił błąd. Spróbuj ponownie później.");
      setSuccess(false);
    } finally {
      setIsSubmitting(false);
    }
  }, [isValid, onRequestDelete]);

  if (success) {
    return (
      <Alert variant="default" className="border-green-500">
        <AlertTitle>Konto zostało usunięte</AlertTitle>
        <AlertDescription>Twoje konto zostało trwale usunięte. Za chwilę zostaniesz wylogowany.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <Alert variant="destructive">
        <AlertTriangle className="destructive" />
        <AlertTitle className="text-destructive">Ostrzeżenie</AlertTitle>
        <AlertDescription>
          <p className="mb-2">
            Tej operacji nie można cofnąć. Wszystkie Twoje dane z konta
            {userEmail && <strong> {userEmail}</strong>}, w tym pomysły na prezenty, zostaną trwale usunięte.
          </p>
        </AlertDescription>
      </Alert>

      {error && (
        <Alert variant="destructive" aria-live="polite">
          <AlertTriangle />
          <AlertTitle>Błąd</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4 pt-2">
        <div className="flex items-start gap-3">
          <Checkbox
            id={checkboxId}
            checked={acknowledged}
            onCheckedChange={handleAcknowledgeChange}
            disabled={isSubmitting}
            aria-describedby={`${checkboxId}-description`}
          />
          <div className="space-y-1">
            <Label
              htmlFor={checkboxId}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Rozumiem nieodwracalność operacji
            </Label>
            <p id={`${checkboxId}-description`} className="text-sm text-neutral-600 dark:text-neutral-400">
              Potwierdzam, że chcę trwale usunąć moje konto i wszystkie powiązane dane.
            </p>
          </div>
        </div>

        <Button
          variant="destructive"
          onClick={handleDeleteClick}
          disabled={!isValid || isSubmitting}
          aria-busy={isSubmitting}
        >
          {isSubmitting ? "Usuwanie..." : "Usuń konto"}
        </Button>
      </div>
    </div>
  );
}
