import { useState, useId } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { PasswordResetRequestSchema } from "@/lib/validation/auth.schemas";
import type { PasswordResetRequestDto } from "@/types";
import { AlertCircle, CheckCircle } from "lucide-react";

export function PasswordResetRequestForm() {
  const [formData, setFormData] = useState<PasswordResetRequestDto>({
    email: "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof PasswordResetRequestDto, string>>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const emailId = useId();

  const handleFieldChange = (field: keyof PasswordResetRequestDto, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear field-specific error
    setErrors((prev) => {
      const { [field]: _, ...rest } = prev;
      return rest;
    });
    // Clear global error and success
    setGlobalError(null);
    setSuccess(false);
  };

  const validateForm = (): boolean => {
    const result = PasswordResetRequestSchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors: Partial<Record<keyof PasswordResetRequestDto, string>> = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof PasswordResetRequestDto;
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
    setSuccess(false);

    if (!validateForm()) {
      document.getElementById(emailId)?.focus();
      return;
    }

    setIsPending(true);

    try {
      const response = await fetch("/api/auth/reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setGlobalError(data.error || "Wystąpił błąd podczas wysyłania linku resetującego");
        return;
      }

      // Always show success message (spec: don't reveal if account exists)
      setSuccess(true);
      setFormData({ email: "" });
    } catch (err) {
      console.error("[PasswordResetRequestForm] Submit error:", err);
      setGlobalError("Wystąpił błąd połączenia. Sprawdź połączenie z internetem");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Odzyskiwanie hasła</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Wprowadź adres email powiązany z Twoim kontem, a wyślemy Ci link do resetowania hasła
        </p>
      </div>

      {globalError && (
        <Alert variant="destructive" aria-live="polite">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Błąd</AlertTitle>
          <AlertDescription>{globalError}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert variant="default" aria-live="polite" className="border-green-500">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle>Email wysłany</AlertTitle>
          <AlertDescription>
            Jeśli podany adres email istnieje w naszej bazie, wysłaliśmy na niego instrukcje resetowania hasła. Sprawdź
            swoją skrzynkę odbiorczą.
          </AlertDescription>
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
      </div>

      {/* Submit Button */}
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Wysyłanie..." : "Wyślij link resetujący"}
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
