import type { APIRoute } from "astro";
import { ZodError } from "zod";
import { idParamSchema } from "@/lib/validation/common-schemas";
import { getIdeaById } from "@/lib/services/ideas/get-idea-by-id.service";
import { parseAndValidateUpdateIdea, updateIdea } from "@/lib/services/ideas/update-idea.service";

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

/**
 * PUT /api/ideas/:id
 *
 * Updates an existing gift idea.
 * Supports partial updates of all user-editable fields.
 * Note: Currently accepts user_id in request body (no authentication required).
 *
 * @param id - Idea ID (positive integer)
 * @param body - UpdateIdeaCommand with user_id (all other fields optional)
 *
 * @returns 200 - Success with updated IdeaDTO
 * @returns 400 - Validation error with details
 * @returns 404 - Idea not found or doesn't belong to user
 * @returns 500 - Internal server error
 */
export const PUT: APIRoute = async (context) => {
  const supabase = context.locals.supabase;

  // 1. Validate ID parameter
  let validatedId: number;
  try {
    validatedId = idParamSchema.parse(context.params.id);
  } catch (error) {
    if (error instanceof ZodError) {
      console.warn("[PUT /api/ideas/:id] Invalid id parameter:", {
        timestamp: new Date().toISOString(),
        route: context.url.pathname,
        paramId: context.params.id,
        details: error.errors.map((err) => `${err.path.join(".")}: ${err.message}`),
      });

      return new Response(
        JSON.stringify({
          error: "Validation error",
          details: error.errors.map((err) => `${err.path.join(".")}: ${err.message}`),
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
    console.error("[PUT /api/ideas/:id] Unexpected validation error:", {
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

  // 2. Parse and validate request body
  let requestBody: unknown;
  try {
    requestBody = await context.request.json();
  } catch (error) {
    console.warn("[PUT /api/ideas/:id] Invalid JSON body:", {
      timestamp: new Date().toISOString(),
      route: context.url.pathname,
      ideaId: validatedId,
      error,
    });

    return new Response(
      JSON.stringify({
        error: "Validation error",
        details: ["Invalid JSON in request body"],
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

  let validatedCommand;
  try {
    validatedCommand = parseAndValidateUpdateIdea(requestBody);
  } catch (error) {
    if (error instanceof ZodError) {
      console.warn("[PUT /api/ideas/:id] Validation error:", {
        timestamp: new Date().toISOString(),
        route: context.url.pathname,
        ideaId: validatedId,
        details: error.errors.map((err) => `${err.path.join(".")}: ${err.message}`),
      });

      return new Response(
        JSON.stringify({
          error: "Validation error",
          details: error.errors.map((err) => `${err.path.join(".")}: ${err.message}`),
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
    console.error("[PUT /api/ideas/:id] Unexpected validation error:", {
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

  // 3. Update idea in database
  try {
    const updatedIdea = await updateIdea(supabase, validatedId, validatedCommand);

    if (!updatedIdea) {
      console.warn("[PUT /api/ideas/:id] Idea not found:", {
        timestamp: new Date().toISOString(),
        route: context.url.pathname,
        userId: validatedCommand.user_id,
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

    return new Response(JSON.stringify({ data: updatedIdea }), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    // Handle validation errors from service layer
    if (error instanceof Error && error.message.startsWith("VALIDATION_ERROR:")) {
      const validationMessage = error.message.replace("VALIDATION_ERROR: ", "");

      console.warn("[PUT /api/ideas/:id] Business validation error:", {
        timestamp: new Date().toISOString(),
        route: context.url.pathname,
        userId: validatedCommand.user_id,
        ideaId: validatedId,
        message: validationMessage,
      });

      return new Response(
        JSON.stringify({
          error: "Validation error",
          details: [validationMessage],
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

    // Unexpected database or other error
    console.error("[PUT /api/ideas/:id] Database error:", {
      timestamp: new Date().toISOString(),
      route: context.url.pathname,
      userId: validatedCommand.user_id,
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
