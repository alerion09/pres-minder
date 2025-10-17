import type { APIRoute } from "astro";
import { ZodError } from "zod";
import { idParamSchema, getIdeaById } from "@/lib/services/ideas/get-idea-by-id.service";

export const prerender = false;

/**
 * GET /api/ideas/:id
 *
 * Fetches a single gift idea by ID.
 * Returns enriched IdeaDTO with relation and occasion names.
 *
 * @param id - Idea ID (positive integer)
 *
 * @returns 200 - Success with IdeaDTO
 * @returns 400 - Invalid id parameter
 * @returns 404 - Idea not found
 * @returns 500 - Internal server error
 */
export const GET: APIRoute = async (context) => {
  const supabase = context.locals.supabase;

  // 1. Validate ID parameter
  let validatedId: number;
  try {
    validatedId = idParamSchema.parse(context.params.id);
  } catch (error) {
    if (error instanceof ZodError) {
      console.warn("[GET /api/ideas/:id] Invalid id parameter:", {
        timestamp: new Date().toISOString(),
        route: context.url.pathname,
        paramId: context.params.id,
        details: error.errors.map((err) => `${err.path.join(".")}: ${err.message}`),
      });

      return new Response(JSON.stringify({ error: "Invalid id" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    // Unexpected validation error
    console.error("[GET /api/ideas/:id] Unexpected validation error:", {
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

  // 2. Fetch idea from database
  try {
    const idea = await getIdeaById(supabase, validatedId);

    if (!idea) {
      console.warn("[GET /api/ideas/:id] Idea not found:", {
        timestamp: new Date().toISOString(),
        route: context.url.pathname,
        ideaId: validatedId,
      });

      return new Response(JSON.stringify({ error: "Idea not found" }), {
        status: 404,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    return new Response(JSON.stringify({ data: idea }), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("[GET /api/ideas/:id] Database error:", {
      timestamp: new Date().toISOString(),
      route: context.url.pathname,
      ideaId: validatedId,
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
