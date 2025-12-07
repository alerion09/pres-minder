import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "@/db/supabase.ssr";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  const route = "/api/auth/logout";
  const timestamp = new Date().toISOString();

  try {
    // Create SSR Supabase client
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Sign out user
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error(`[${route}] Logout error:`, error.message);

      return new Response(
        JSON.stringify({
          error: "Logout failed",
          timestamp,
          route,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Success - session cookies are automatically cleared by SSR client
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
