import type { APIRoute } from "astro";
import { LoginSchema } from "@/lib/validation/auth.schemas";
import { createSupabaseServerInstance } from "@/db/supabase.ssr";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  const route = "/api/auth/login";
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
    const validation = LoginSchema.safeParse(body);

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

    // Attempt to sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error(`[${route}] Auth error:`, error.message);

      // Map Supabase auth errors to standardized responses
      if (error.message.includes("Invalid login credentials")) {
        return new Response(
          JSON.stringify({
            error: "invalid_credentials",
            timestamp,
            route,
          }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Generic auth error
      return new Response(
        JSON.stringify({
          error: "Authentication failed",
          timestamp,
          route,
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Success - session cookies are automatically set by SSR client
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
