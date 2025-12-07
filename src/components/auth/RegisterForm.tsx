import { useState, useId } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { RegisterSchema } from "@/lib/validation/auth.schemas";
import { showSuccessToast } from "@/lib/utils/toast-helpers";
import type { RegisterDto } from "@/types";
import { AlertCircle } from "lucide-react";

export function RegisterForm() {
  const [formData, setFormData] = useState<RegisterDto>({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof RegisterDto, string>>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const emailId = useId();
  const passwordId = useId();
  const confirmPasswordId = useId();

  const handleFieldChange = (field: keyof RegisterDto, value: string) => {
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
    const result = RegisterSchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors: Partial<Record<keyof RegisterDto, string>> = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof RegisterDto;
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
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        // Handle specific error codes
        if (response.status === 409) {
          setGlobalError("Ten adres email jest już zajęty");
        } else if (response.status === 422) {
          setGlobalError(data.error || "Nieprawidłowe dane formularza");
        } else {
          setGlobalError(data.error || "Wystąpił błąd podczas rejestracji");
        }
        return;
      }

      // Check if email verification is required
      if (data.requiresEmailVerification) {
        showSuccessToast("Konto zostało utworzone. Sprawdź swoją skrzynkę email i potwierdź adres");
        // Redirect to login page with info message
        window.location.href = "/login";
      } else {
        showSuccessToast("Konto zostało utworzone pomyślnie");
        // Redirect to home page
        window.location.href = "/";
      }
    } catch (err) {
      console.error("[RegisterForm] Submit error:", err);
      setGlobalError("Wystąpił błąd połączenia. Sprawdź połączenie z internetem");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Rejestracja</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Utwórz nowe konto, aby zacząć korzystać z PresMinder. Po rejestracji otrzymasz email z linkiem
          potwierdzającym.
        </p>
      </div>

      {globalError && (
        <Alert variant="destructive" aria-live="polite">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Błąd</AlertTitle>
          <AlertDescription>{globalError}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        {/* Email Field */}
        <div className="space-y-2">
          <Label htmlFor={emailId}>
            Email <span className="text-destructive">*</span>
          </Label>
          <Input
            id={emailId}
            type="email"
            value={formData.email}
            onChange={(e) => handleFieldChange("email", e.target.value)}
            placeholder="twoj@email.pl"
            disabled={isPending}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? `${emailId}-error` : undefined}
            autoComplete="email"
          />
          {errors.email && (
            <p id={`${emailId}-error`} className="text-sm text-destructive">
              {errors.email}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <Label htmlFor={passwordId}>
            Hasło <span className="text-destructive">*</span>
          </Label>
          <Input
            id={passwordId}
            type="password"
            value={formData.password}
            onChange={(e) => handleFieldChange("password", e.target.value)}
            placeholder="Minimum 8 znaków"
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
            Powtórz hasło <span className="text-destructive">*</span>
          </Label>
          <Input
            id={confirmPasswordId}
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => handleFieldChange("confirmPassword", e.target.value)}
            placeholder="Powtórz hasło"
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
        {isPending ? "Tworzenie konta..." : "Utwórz konto"}
      </Button>

      {/* Navigation Link */}
      <div className="text-center text-sm text-slate-600 dark:text-slate-400">
        Masz już konto?{" "}
        <a href="/login" className="font-medium text-slate-900 dark:text-slate-50 hover:underline">
          Zaloguj się
        </a>
      </div>
    </form>
  );
}
