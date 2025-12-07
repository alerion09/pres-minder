import { useState, useId } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { PasswordUpdateSchema } from "@/lib/validation/auth.schemas";
import { showSuccessToast } from "@/lib/utils/toast-helpers";
import type { PasswordUpdateDto } from "@/types";
import { AlertCircle } from "lucide-react";

export function PasswordUpdateForm() {
  const [formData, setFormData] = useState<PasswordUpdateDto>({
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof PasswordUpdateDto, string>>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const passwordId = useId();
  const confirmPasswordId = useId();

  const handleFieldChange = (field: keyof PasswordUpdateDto, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear field-specific error
    setErrors((prev) => {
      const { [field]: _, ...rest } = prev;
      return rest;
    });
    // Clear global error
    setGlobalError(null);
  };

  const validateForm = (): boolean => {
    const result = PasswordUpdateSchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors: Partial<Record<keyof PasswordUpdateDto, string>> = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof PasswordUpdateDto;
        if (!fieldErrors[field]) {
          fieldErrors[field] = err.message;
        }
      });
      setErrors(fieldErrors);
      return false;
    }

    setErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError(null);

    if (!validateForm()) {
      // Focus first error field
      const firstErrorField = Object.keys(errors)[0];
      document.getElementById(firstErrorField)?.focus();
      return;
    }

    setIsPending(true);

    try {
      const response = await fetch("/api/auth/reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: formData.password }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        // Handle specific error codes
        if (response.status === 401 || response.status === 400) {
          setGlobalError("Link resetujący wygasł lub jest nieprawidłowy. Spróbuj ponownie");
        } else {
          setGlobalError(data.error || "Wystąpił błąd podczas zmiany hasła");
        }
        return;
      }

      showSuccessToast("Hasło zostało zmienione pomyślnie");
      // Redirect to login page
      setTimeout(() => {
        window.location.href = "/login";
      }, 1000);
    } catch (err) {
      console.error("[PasswordUpdateForm] Submit error:", err);
      setGlobalError("Wystąpił błąd połączenia. Sprawdź połączenie z internetem");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Ustaw nowe hasło</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">Wprowadź nowe hasło dla swojego konta</p>
      </div>

      {globalError && (
        <Alert variant="destructive" aria-live="polite">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Błąd</AlertTitle>
          <AlertDescription>{globalError}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        {/* Password Field */}
        <div className="space-y-2">
          <Label htmlFor={passwordId}>
            Nowe hasło <span className="text-destructive">*</span>
          </Label>
          <Input
            id={passwordId}
            type="password"
            value={formData.password}
            onChange={(e) => handleFieldChange("password", e.target.value)}
            placeholder="Podaj hasło"
            disabled={isPending}
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? `${passwordId}-error` : undefined}
            autoComplete="new-password"
          />
          {errors.password && (
            <p id={`${passwordId}-error`} className="text-sm text-destructive">
              {errors.password}
            </p>
          )}
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Hasło musi zawierać: min. 8 znaków, cyfrę, dużą literę i znak specjalny
          </p>
        </div>

        {/* Confirm Password Field */}
        <div className="space-y-2">
          <Label htmlFor={confirmPasswordId}>
            Potwierdź hasło <span className="text-destructive">*</span>
          </Label>
          <Input
            id={confirmPasswordId}
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => handleFieldChange("confirmPassword", e.target.value)}
            placeholder="Wprowadź hasło ponownie"
            disabled={isPending}
            aria-invalid={!!errors.confirmPassword}
            aria-describedby={errors.confirmPassword ? `${confirmPasswordId}-error` : undefined}
            autoComplete="new-password"
          />
          {errors.confirmPassword && (
            <p id={`${confirmPasswordId}-error`} className="text-sm text-destructive">
              {errors.confirmPassword}
            </p>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Zapisywanie..." : "Zmień hasło"}
      </Button>

      {/* Navigation Link */}
      <div className="text-center text-sm text-slate-600 dark:text-slate-400">
        Pamiętasz hasło?{" "}
        <a href="/login" className="font-medium text-slate-900 dark:text-slate-50 hover:underline">
          Zaloguj się
        </a>
      </div>
    </form>
  );
}
