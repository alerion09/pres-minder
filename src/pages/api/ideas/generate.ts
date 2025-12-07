import type { APIRoute } from "astro";
import { ZodError } from "zod";
import { parseAndValidateGenerateIdea, generateGiftIdeas } from "@/lib/services/ideas/generate-ideas.service";

export const prerender = false;

/**
 * POST /api/ideas/generate
 *
 * Generates gift idea suggestions using AI based on provided hints.
 * Requires authentication. Does not save data to database.
 *
 * Request body (JSON) - all fields optional:
 * - age?: integer 1..500
 * - interests?: string (max 1000 characters)
 * - person_description?: string (max 1000 characters)
 * - budget_min?: number >= 0
 * - budget_max?: number >= budget_min
 * - relation?: string (max 100 characters) - relationship type name
 * - occasion?: string (max 100 characters) - occasion name
 *
 * Responses:
 * - 200: { data: { suggestions: IdeaSuggestionDTO[]; metadata: { model: string; generated_at: string } } }
 * - 400: { error: "Validation error", details: string[] }
 * - 401: { error: "Unauthorized" }
 * - 500: { error: "Internal server error" }
 */
export const POST: APIRoute = async (context) => {
  const supabase = context.locals.supabase;

  // 1) Get authenticated user from session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response(
      JSON.stringify({
        error: "Unauthorized",
        timestamp: new Date().toISOString(),
        route: "/api/ideas/generate",
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // 2) Parse JSON body
  let body: unknown;
  try {
    body = await context.request.json();
  } catch (error) {
    console.warn("[POST /api/ideas/generate] Invalid JSON payload:", {
      timestamp: new Date().toISOString(),
      route: context.url.pathname,
      error,
    });

    return new Response(JSON.stringify({ error: "Validation error", details: ["Invalid JSON payload"] }), {
      status: 400,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }

  // 3) Validate with Zod
  let command;
  try {
    command = parseAndValidateGenerateIdea(body);
  } catch (error) {
    if (error instanceof ZodError) {
      const details = error.errors.map((err) => `${err.path.join(".")}: ${err.message}`);

      console.warn("[POST /api/ideas/generate] Validation error:", {
        timestamp: new Date().toISOString(),
        route: context.url.pathname,
        details,
      });

      return new Response(JSON.stringify({ error: "Validation error", details }), {
        status: 400,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    console.error("[POST /api/ideas/generate] Unexpected validation error:", {
      timestamp: new Date().toISOString(),
      route: context.url.pathname,
      error,
    });

    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }

  // 4) Generate ideas via service
  try {
    const responseData = await generateGiftIdeas(command);

    return new Response(JSON.stringify({ data: responseData }), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("[POST /api/ideas/generate] Service error:", {
      timestamp: new Date().toISOString(),
      route: context.url.pathname,
      error,
    });

    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }
};
