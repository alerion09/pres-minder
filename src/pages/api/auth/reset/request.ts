import type { APIRoute } from "astro";
import { PasswordResetRequestSchema } from "@/lib/validation/auth.schemas";
import { createSupabaseServerInstance } from "@/db/supabase.ssr";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, url }) => {
  const route = "/api/auth/reset/request";
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
    const validation = PasswordResetRequestSchema.safeParse(body);

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

    const { email } = validation.data;

    // Create SSR Supabase client
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Build the redirect URL for password update
    const origin = url.origin;
    const redirectTo = `${origin}/update-password`;

    // Request password reset email
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    // SECURITY: Always return success to prevent email enumeration
    // Even if the email doesn't exist, we return success to avoid revealing
    // which emails are registered in the system
    if (error) {
      console.error(`[${route}] Password reset error:`, error.message);
      // Still return success response - don't reveal if email exists
    }

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
