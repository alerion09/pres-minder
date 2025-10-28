import { useState, useCallback } from "react";
import { showSuccessToast, showErrorToast } from "@/lib/utils/toast-helpers";

interface LogoutButtonProps {
  redirectTo?: string;
}

export default function LogoutButton({ redirectTo = "/" }: LogoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = useCallback(async () => {
    if (isLoading) return;

    setIsLoading(true);

    try {
      // TODO: Implement actual signOut when auth is ready
      // await supabaseClient.auth.signOut();

      // Mock successful logout for now
      await new Promise((resolve) => setTimeout(resolve, 500));

      showSuccessToast("Wylogowano pomyślnie");

      // Redirect after short delay to show toast
      setTimeout(() => {
        window.location.href = redirectTo;
      }, 300);
    } catch (error) {
      console.error("Logout error:", error);
      showErrorToast("Nie udało się wylogować. Spróbuj ponownie.");
      setIsLoading(false);
    }
  }, [isLoading, redirectTo]);

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      aria-label="Wyloguj"
      aria-busy={isLoading}
      aria-disabled={isLoading}
      className="inline-flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
    >
      {isLoading ? (
        // Loading spinner
        <svg
          className="animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
      ) : (
        // Logout icon (log-out)
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" x2="9" y1="12" y2="12" />
        </svg>
      )}
    </button>
  );
}
