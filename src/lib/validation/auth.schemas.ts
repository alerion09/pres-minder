/**
 * Zod validation schemas for authentication forms
 *
 * These schemas are shared between frontend and backend to ensure
 * consistent validation across the application.
 */

import { z } from "zod";

/**
 * Email validation schema
 */
export const AuthEmailSchema = z.string().min(1, "Email jest wymagany").email("Nieprawidłowy format adresu email");

/**
 * Password validation schema
 * Minimum 8 characters required
 */
export const AuthPasswordSchema = z.string().min(8, "Hasło musi mieć co najmniej 8 znaków");

/**
 * Login form validation schema
 */
export const LoginSchema = z.object({
  email: AuthEmailSchema,
  password: AuthPasswordSchema,
});

/**
 * Registration form validation schema
 */
export const RegisterSchema = z.object({
  email: AuthEmailSchema,
  password: AuthPasswordSchema,
});

/**
 * Password reset request validation schema
 */
export const PasswordResetRequestSchema = z.object({
  email: AuthEmailSchema,
});

/**
 * Password update validation schema with confirmation
 */
export const PasswordUpdateSchema = z
  .object({
    password: AuthPasswordSchema,
    confirmPassword: z.string().min(1, "Potwierdzenie hasła jest wymagane"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła muszą być identyczne",
    path: ["confirmPassword"],
  });
