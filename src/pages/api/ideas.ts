import type { APIRoute } from "astro";
import { ZodError } from "zod";
import { parseAndValidateGetIdeasQuery, getIdeasForUser } from "@/lib/services/ideas/get-ideas.service";
import { parseAndValidateCreateIdea, createIdea } from "@/lib/services/ideas/create-idea.service";

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

/**
 * POST /api/ideas
 *
 * Creates a new gift idea for the specified user.
 * Note: Currently accepts user_id in request body (no authentication required).
 *
 * Request body (JSON):
 * - user_id: string (UUID)
 * - name: string (min 2, max 255)
 * - content: string (1..10000)
 * - age?: integer 1..500
 * - interests?: string (max 5000)
 * - person_description?: string (max 5000)
 * - budget_min?: number >= 0
 * - budget_max?: number >= budget_min
 * - relation_id?: integer > 0
 * - occasion_id?: integer > 0
 * - source?: enum manual|ai|edited-ai (default: manual)
 *
 * Responses:
 * - 201: { data: IdeaDTO }
 * - 400: { error: "Validation error", details: string[] }
 * - 500: { error: "Internal server error" }
 */
export const POST: APIRoute = async (context) => {
  const supabase = context.locals.supabase;

  // 1) Parse JSON body
  let body: unknown;
  try {
    body = await context.request.json();
  } catch (error) {
    console.warn("[POST /api/ideas] Invalid JSON payload:", {
      timestamp: new Date().toISOString(),
      route: context.url.pathname,
      error,
    });

    return new Response(JSON.stringify({ error: "Validation error", details: ["Invalid JSON payload"] }), {
      status: 400,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }

  // 2) Validate with Zod
  let command;
  try {
    command = parseAndValidateCreateIdea(body);
  } catch (error) {
    if (error instanceof ZodError) {
      const details = error.errors.map((err) => `${err.path.join(".")}: ${err.message}`);

      console.warn("[POST /api/ideas] Validation error:", {
        timestamp: new Date().toISOString(),
        route: context.url.pathname,
        details,
      });

      return new Response(JSON.stringify({ error: "Validation error", details }), {
        status: 400,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    console.error("[POST /api/ideas] Unexpected validation error:", {
      timestamp: new Date().toISOString(),
      route: context.url.pathname,
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

  // 3) Create idea via service
  try {
    const ideaDto = await createIdea(supabase, command);

    return new Response(JSON.stringify({ data: ideaDto }), {
      status: 201,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    // Map known validation errors from service (e.g., FK violations)
    const message = error instanceof Error ? error.message : String(error);
    if (message.startsWith("VALIDATION_ERROR: ")) {
      const detail = message.replace("VALIDATION_ERROR: ", "");
      console.warn("[POST /api/ideas] Referential validation error:", {
        timestamp: new Date().toISOString(),
        route: context.url.pathname,
        details: [detail],
      });

      return new Response(JSON.stringify({ error: "Validation error", details: [detail] }), {
        status: 400,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    console.error("[POST /api/ideas] Database or internal error:", {
      timestamp: new Date().toISOString(),
      route: context.url.pathname,
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
