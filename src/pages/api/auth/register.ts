import type { APIRoute } from "astro";
import { RegisterSchema } from "@/lib/validation/auth.schemas";
import { createSupabaseServerInstance } from "@/db/supabase.ssr";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  const route = "/api/auth/register";
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
    const validation = RegisterSchema.safeParse(body);

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

    const { email, password } = validation.data;

    // Create SSR Supabase client
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Attempt to sign up
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      console.error(`[${route}] Auth error:`, error.message);

      // Map Supabase auth errors to standardized responses
      if (error.message.includes("User already registered")) {
        return new Response(
          JSON.stringify({
            error: "Email already registered",
            timestamp,
            route,
          }),
          {
            status: 409,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Check for weak password error
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

      // Generic auth error
      return new Response(
        JSON.stringify({
          error: "Registration failed",
          timestamp,
          route,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Success - check if email verification is required
    // If session exists immediately, email confirmation is disabled
    // If session is null, email confirmation is required
    const requiresEmailVerification = !data.session;

    return new Response(
      JSON.stringify({
        user: data.user,
        requiresEmailVerification,
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
