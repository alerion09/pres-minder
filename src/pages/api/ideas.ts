import type { APIRoute } from "astro";
import { ZodError } from "zod";
import { parseAndValidateGetIdeasQuery, getIdeasForUser } from "@/lib/services/ideas/get-ideas.service";

export const prerender = false;

/**
 * GET /api/ideas
 *
 * Returns a paginated list of all gift ideas,
 * denormalized with relation and occasion names. Supports filtering, sorting, and pagination.
 *
 * @queryParam page - Page number (min 1, default 1)
 * @queryParam limit - Items per page (1-100, default 20)
 * @queryParam sort - Sort field (created_at|updated_at|name, default created_at)
 * @queryParam order - Sort order (asc|desc, default desc)
 * @queryParam relation_id - Filter by relation ID
 * @queryParam occasion_id - Filter by occasion ID
 * @queryParam source - Filter by source (manual|ai|edited-ai)
 *
 * @returns 200 - Success with paginated ideas
 * @returns 400 - Validation error
 * @returns 500 - Internal server error
 */
export const GET: APIRoute = async (context) => {
  const supabase = context.locals.supabase;

  // Parse and validate query parameters
  let validatedParams;
  try {
    validatedParams = parseAndValidateGetIdeasQuery(context.url.searchParams);
  } catch (error) {
    if (error instanceof ZodError) {
      const details = error.errors.map((err) => `${err.path.join(".")}: ${err.message}`);

      console.error("[GET /api/ideas] Validation error:", {
        timestamp: new Date().toISOString(),
        details,
      });

      return new Response(
        JSON.stringify({
          error: "Validation error",
          details,
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            "X-Content-Type-Options": "nosniff",
          },
        }
      );
    }

    // Unexpected validation error
    console.error("[GET /api/ideas] Unexpected validation error:", {
      timestamp: new Date().toISOString(),
      error,
    });

    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }

  // Fetch ideas
  try {
    const result = await getIdeasForUser(supabase, validatedParams);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("[GET /api/ideas] Database error:", {
      timestamp: new Date().toISOString(),
      error,
    });

    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }
};
