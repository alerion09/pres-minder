import type { APIRoute } from "astro";
import type { OccasionDTO } from "@/types.ts";

export const prerender = false;

/**
 * GET /api/occasions
 *
 * Returns a list of available occasion types (dictionary).
 *
 * @returns 200 - Success with list of occasions
 * @returns 500 - Internal server error
 */
export const GET: APIRoute = async (context) => {
  const supabase = context.locals.supabase;

  // Query occasions from database
  const { data: occasions, error: dbError } = await supabase
    .from("occasions")
    .select("*")
    .order("name", { ascending: true });

  // Handle database errors
  if (dbError) {
    console.error("[GET /api/occasions] Database error:", {
      error: dbError,
      timestamp: new Date().toISOString(),
    });

    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }

  // Return successful response with cache headers
  return new Response(JSON.stringify({ data: occasions as OccasionDTO[] }), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
      "X-Content-Type-Options": "nosniff",
    },
  });
};
