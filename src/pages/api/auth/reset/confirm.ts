import type { APIRoute } from "astro";
import { z } from "zod";
import { AuthPasswordSchema } from "@/lib/validation/auth.schemas";
import { createSupabaseServerInstance } from "@/db/supabase.ssr";

export const prerender = false;

// Backend schema - only validates password field
// confirmPassword is validated on frontend only
const PasswordConfirmSchema = z.object({
  password: AuthPasswordSchema,
});

export const POST: APIRoute = async ({ request, cookies }) => {
  const route = "/api/auth/reset/confirm";
  const timestamp = new Date().toISOString();

  try {
    // Parse request body
    const body = await request.json().catch(() => null);

    if (!body) {
      return new Response(
        JSON.stringify({
          error: "Invalid JSON body",
          timestamp,
          route,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validate input with Zod
    const validation = PasswordConfirmSchema.safeParse(body);

    if (!validation.success) {
      const fieldErrors = validation.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      return new Response(
        JSON.stringify({
          error: "Validation failed",
          details: fieldErrors,
          timestamp,
          route,
        }),
        {
          status: 422,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { password } = validation.data;

    // Create SSR Supabase client
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Check if user has valid session (from password reset link)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.error(`[${route}] No valid session found`);
      return new Response(
        JSON.stringify({
          error: "Invalid or expired reset link",
          timestamp,
          route,
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Update user password
    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      console.error(`[${route}] Password update error:`, error.message);

      // Map specific errors
      if (error.message.includes("same as the old password")) {
        return new Response(
          JSON.stringify({
            error: "Nowe hasło nie może być takie samo jak stare",
            timestamp,
            route,
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      if (error.message.includes("Password should be")) {
        return new Response(
          JSON.stringify({
            error: "Password does not meet security requirements",
            timestamp,
            route,
          }),
          {
            status: 422,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Generic error
      return new Response(
        JSON.stringify({
          error: "Failed to update password",
          timestamp,
          route,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Success - password updated
    return new Response(
      JSON.stringify({
        message: "ok",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error(`[${route}] Unexpected error:`, err);

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        timestamp,
        route,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
