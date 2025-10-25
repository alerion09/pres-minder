/**
 * Toast helpers for displaying user-friendly notifications
 */

import { toast } from "sonner";

/**
 * Displays success toast
 */
export function showSuccessToast(message: string): void {
  toast.success(message, {
    duration: 3000,
  });
}

/**
 * Displays error toast
 */
export function showErrorToast(message: string): void {
  toast.error(message, {
    duration: 5000,
  });
}

/**
 * Displays info toast
 */
export function showInfoToast(message: string): void {
  toast.info(message, {
    duration: 3000,
  });
}

/**
 * Displays warning toast
 */
export function showWarningToast(message: string): void {
  toast.warning(message, {
    duration: 4000,
  });
}
