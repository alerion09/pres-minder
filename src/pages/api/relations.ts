import type { APIRoute } from "astro";
import type { RelationDTO } from "@/types.ts";

export const prerender = false;

/**
 * GET /api/relations
 *
 * Returns a list of available relation types (dictionary).
 *
 * @returns 200 - Success with list of relations
 * @returns 500 - Internal server error
 */
export const GET: APIRoute = async (context) => {
  const supabase = context.locals.supabase;

  // Query relations from database
  const { data: relations, error: dbError } = await supabase
    .from("relations")
    .select("*")
    .order("name", { ascending: true });

  // Handle database errors
  if (dbError) {
    console.error("[GET /api/relations] Database error:", {
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
  return new Response(JSON.stringify({ data: relations as RelationDTO[] }), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
      "X-Content-Type-Options": "nosniff",
    },
  });
};
