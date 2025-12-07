import type { APIRoute } from "astro";
import { createSupabaseServerInstance, createSupabaseAdminClient } from "@/db/supabase.ssr";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, locals }) => {
  const route = "/api/account/delete";
  const timestamp = new Date().toISOString();

  try {
    // Check if user is authenticated
    const { user } = locals;

    if (!user) {
      console.error(`[${route}] Unauthorized deletion attempt`);

      return new Response(
        JSON.stringify({
          error: "Musisz być zalogowany, aby usunąć konto",
          timestamp,
          route,
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log(`[${route}] User ${user.id} requested account deletion`);

    // Create admin client to perform deletion
    const adminClient = createSupabaseAdminClient();

    // Delete the user using admin privileges
    // IMPORTANT: We use user.id from the authenticated session
    // This ensures users can only delete their OWN account
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);

    if (deleteError) {
      console.error(`[${route}] Delete error for user ${user.id}:`, deleteError.message);

      return new Response(
        JSON.stringify({
          error: "Nie udało się usunąć konta",
          timestamp,
          route,
          details: deleteError.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log(`[${route}] User ${user.id} successfully deleted`);

    // Sign out the user (clear session cookies)
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    await supabase.auth.signOut();

    // Success response
    return new Response(
      JSON.stringify({
        message: "Konto zostało pomyślnie usunięte",
        timestamp,
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
        error: "Wystąpił nieoczekiwany błąd",
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
