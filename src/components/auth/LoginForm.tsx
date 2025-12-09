import { useState, useId } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { LoginSchema } from "@/lib/validation/auth.schemas";
import { showSuccessToast, showErrorToast } from "@/lib/utils/toast-helpers";
import type { LoginDto } from "@/types";
import { AlertCircle } from "lucide-react";

export function LoginForm() {
  const [formData, setFormData] = useState<LoginDto>({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof LoginDto, string>>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const emailId = useId();
  const passwordId = useId();

  const handleFieldChange = (field: keyof LoginDto, value: string) => {
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
    const result = LoginSchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors: Partial<Record<keyof LoginDto, string>> = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof LoginDto;
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
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        // Handle specific error codes
        if (response.status === 401) {
          // Check for specific error type
          if (data.error === "invalid_credentials") {
            setGlobalError("Nieprawidłowy email lub hasło");
          } else {
            setGlobalError(data.error || "Wystąpił błąd podczas logowania");
          }
        } else if (response.status === 422) {
          // Validation errors from backend
          setGlobalError("Dane formularza są nieprawidłowe. Sprawdź wprowadzone wartości");
        } else if (response.status === 429) {
          setGlobalError("Zbyt wiele prób logowania. Spróbuj ponownie później");
        } else {
          setGlobalError(data.error || "Wystąpił błąd podczas logowania");
        }
        return;
      }

      // Success response: { message: "ok" }
      if (data.message === "ok") {
        showSuccessToast("Zalogowano pomyślnie");
        // Redirect to home page
        window.location.href = "/";
      } else {
        setGlobalError("Wystąpił nieoczekiwany błąd podczas logowania");
      }
    } catch (err) {
      console.error("[LoginForm] Submit error:", err);
      setGlobalError("Wystąpił błąd połączenia. Sprawdź połączenie z internetem");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6" data-test-id="login-form">
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-50" data-test-id="login-heading">
          Logowanie
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">Wprowadź swoje dane, aby się zalogować</p>
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
            placeholder="Podaj hasło"
            disabled={isPending}
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? `${passwordId}-error` : undefined}
            autoComplete="current-password"
          />
          {errors.password && (
            <p id={`${passwordId}-error`} className="text-sm text-destructive">
              {errors.password}
            </p>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Logowanie..." : "Zaloguj się"}
      </Button>

      {/* Navigation Links */}
      <div className="space-y-3 text-center text-sm">
        <a
          href="/reset-password"
          className="block text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-50 transition-colors"
        >
          Zapomniałeś hasła?
        </a>
        <div className="text-slate-600 dark:text-slate-400">
          Nie masz konta?{" "}
          <a href="/register" className="font-medium text-slate-900 dark:text-slate-50 hover:underline">
            Zarejestruj się
          </a>
        </div>
      </div>
    </form>
  );
}
