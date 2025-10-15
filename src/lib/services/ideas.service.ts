import { z } from "zod";
import type { supabaseClient } from "@/db/supabase.client";
import type { GetIdeasQueryParams, IdeaDTO, PaginatedIdeasDTO } from "@/types";

// ============================================================================
// Validation Schema
// ============================================================================

/**
 * Zod schema for GET /api/ideas query parameters
 * Validates and coerces query string parameters with defaults
 */
export const getIdeasQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(["created_at", "updated_at", "name"]).default("created_at"),
  order: z.enum(["asc", "desc"]).default("desc"),
  relation_id: z.coerce.number().int().positive().optional(),
  occasion_id: z.coerce.number().int().positive().optional(),
  source: z.enum(["manual", "ai", "edited-ai"]).optional(),
});

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Parses and validates query parameters for GET /api/ideas
 *
 * @param query - URLSearchParams or Record of query string parameters
 * @returns Validated GetIdeasQueryParams
 * @throws ZodError if validation fails
 */
export function parseAndValidateGetIdeasQuery(query: URLSearchParams | Record<string, string>): GetIdeasQueryParams {
  // Convert URLSearchParams to plain object if needed
  const queryObj = query instanceof URLSearchParams ? Object.fromEntries(query.entries()) : query;

  // Validate and parse with Zod
  const result = getIdeasQuerySchema.parse(queryObj);

  return result;
}

// ============================================================================
// Database Query Functions
// ============================================================================

/**
 * Fetches paginated ideas with optional filters
 *
 * @param supabase - Supabase client instance
 * @param params - Validated query parameters
 * @returns Paginated ideas with metadata
 */
export async function getIdeasForUser(
  supabase: typeof supabaseClient,
  params: GetIdeasQueryParams
): Promise<PaginatedIdeasDTO> {
  const { page = 1, limit = 20, sort = "created_at", order = "desc", relation_id, occasion_id, source } = params;

  // Calculate offset for pagination
  const offset = (page - 1) * limit;

  // Build base query with joins
  let dataQuery = supabase.from("ideas").select(
    `
      id,
      name,
      content,
      age,
      interests,
      person_description,
      budget_min,
      budget_max,
      relation_id,
      occasion_id,
      source,
      created_at,
      updated_at,
      relations!left(name),
      occasions!left(name)
    `,
    { count: "exact" }
  );

  // Apply optional filters
  if (relation_id !== undefined) {
    dataQuery = dataQuery.eq("relation_id", relation_id);
  }

  if (occasion_id !== undefined) {
    dataQuery = dataQuery.eq("occasion_id", occasion_id);
  }

  if (source !== undefined) {
    dataQuery = dataQuery.eq("source", source);
  }

  // Apply sorting
  dataQuery = dataQuery.order(sort, { ascending: order === "asc" });

  // Apply pagination
  dataQuery = dataQuery.range(offset, offset + limit - 1);

  // Execute query
  const { data: ideas, error: dbError, count } = await dataQuery;

  if (dbError) {
    throw dbError;
  }

  // Map database rows to IdeaDTO
  const mappedIdeas: IdeaDTO[] = (ideas || []).map((row) => ({
    id: row.id,
    name: row.name,
    content: row.content,
    age: row.age,
    interests: row.interests,
    person_description: row.person_description,
    budget_min: row.budget_min,
    budget_max: row.budget_max,
    relation_id: row.relation_id,
    occasion_id: row.occasion_id,
    source: row.source,
    created_at: row.created_at,
    updated_at: row.updated_at,
    // Extract joined names from nested objects
    relation_name: Array.isArray(row.relations) ? (row.relations[0]?.name ?? null) : (row.relations?.name ?? null),
    occasion_name: Array.isArray(row.occasions) ? (row.occasions[0]?.name ?? null) : (row.occasions?.name ?? null),
  }));

  // Calculate pagination metadata
  const total = count ?? 0;
  const totalPages = Math.ceil(total / limit);

  return {
    data: mappedIdeas,
    pagination: {
      page,
      limit,
      total,
      total_pages: totalPages,
    },
  };
}
