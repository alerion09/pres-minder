import { z } from "zod";
import type { supabaseClient } from "@/db/supabase.client";
import type { CreateIdeaCommand, IdeaDTO } from "@/types";

// ============================================================================
// Validation Schema
// ============================================================================

/**
 * Zod schema for POST /api/ideas request body
 * Validates CreateIdeaCommand with comprehensive business rules
 * Note: user_id is now taken from session, not from request body
 */
export const createIdeaSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters long")
      .max(255, "Name cannot exceed 255 characters"),
    content: z.string().trim().min(1, "Content is required").max(10000, "Content cannot exceed 10000 characters"),
    age: z
      .number()
      .int("Age must be an integer")
      .min(1, "Age must be at least 1")
      .max(500, "Age cannot exceed 500")
      .optional()
      .nullable(),
    interests: z
      .string()
      .trim()
      .max(1000, "Interests cannot exceed 1000 characters")
      .optional()
      .nullable()
      .transform((val) => (val === "" ? null : val)),
    person_description: z
      .string()
      .trim()
      .max(1000, "Person description cannot exceed 1000 characters")
      .optional()
      .nullable()
      .transform((val) => (val === "" ? null : val)),
    budget_min: z.number().min(0, "Minimum budget must be non-negative").optional().nullable(),
    budget_max: z.number().min(0, "Maximum budget must be non-negative").optional().nullable(),
    relation_id: z
      .number()
      .int("Relation ID must be an integer")
      .positive("Relation ID must be positive")
      .optional()
      .nullable(),
    occasion_id: z
      .number()
      .int("Occasion ID must be an integer")
      .positive("Occasion ID must be positive")
      .optional()
      .nullable(),
    source: z
      .enum(["manual", "ai", "edited-ai"], {
        errorMap: () => ({ message: "Source must be one of: manual, ai, edited-ai" }),
      })
      .default("manual"),
  })
  .refine(
    (data) => {
      // If both budgets are provided, max must be >= min
      if (
        data.budget_min !== null &&
        data.budget_min !== undefined &&
        data.budget_max !== null &&
        data.budget_max !== undefined
      ) {
        return data.budget_max >= data.budget_min;
      }
      return true;
    },
    {
      message: "Maximum budget must be greater than or equal to minimum budget",
      path: ["budget_max"],
    }
  );

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Parses and validates request body for POST /api/ideas
 *
 * @param body - Raw request body object
 * @returns Validated CreateIdeaCommand with defaults applied
 * @throws ZodError if validation fails
 */
export function parseAndValidateCreateIdea(body: unknown): CreateIdeaCommand {
  return createIdeaSchema.parse(body);
}

// ============================================================================
// Database Operations
// ============================================================================

/**
 * Creates a new gift idea for the specified user
 *
 * @param supabase - Supabase client instance
 * @param userId - User ID from authenticated session
 * @param command - Validated CreateIdeaCommand (without user_id)
 * @returns Created idea as IdeaDTO with denormalized relation and occasion names
 * @throws Error if database operation fails or foreign key constraint violated
 */
export async function createIdea(
  supabase: typeof supabaseClient,
  userId: string,
  command: Omit<CreateIdeaCommand, "user_id">
): Promise<IdeaDTO> {
  // Insert new idea into database
  const { data: insertedIdea, error: insertError } = await supabase
    .from("ideas")
    .insert({
      user_id: userId,
      name: command.name,
      content: command.content,
      age: command.age ?? null,
      interests: command.interests ?? null,
      person_description: command.person_description ?? null,
      budget_min: command.budget_min ?? null,
      budget_max: command.budget_max ?? null,
      relation_id: command.relation_id ?? null,
      occasion_id: command.occasion_id ?? null,
      source: command.source,
    })
    .select("id")
    .single();

  if (insertError) {
    // Check for foreign key constraint violations
    if (insertError.code === "23503") {
      // PostgreSQL foreign key violation code
      const detail = insertError.details || insertError.message;

      if (detail.includes("user_id")) {
        throw new Error("VALIDATION_ERROR: user_id not found");
      }

      if (detail.includes("relation_id")) {
        throw new Error("VALIDATION_ERROR: relation_id not found");
      }

      if (detail.includes("occasion_id")) {
        throw new Error("VALIDATION_ERROR: occasion_id not found");
      }
    }

    throw insertError;
  }

  if (!insertedIdea) {
    throw new Error("Failed to create idea: no data returned");
  }

  // Fetch the created idea with joined relation and occasion names
  const { data: ideaWithJoins, error: selectError } = await supabase
    .from("ideas")
    .select(
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
    `
    )
    .eq("id", insertedIdea.id)
    .single();

  if (selectError) {
    throw selectError;
  }

  if (!ideaWithJoins) {
    throw new Error("Failed to fetch created idea");
  }

  // Map to IdeaDTO format
  const ideaDto: IdeaDTO = {
    id: ideaWithJoins.id,
    name: ideaWithJoins.name,
    content: ideaWithJoins.content,
    age: ideaWithJoins.age,
    interests: ideaWithJoins.interests,
    person_description: ideaWithJoins.person_description,
    budget_min: ideaWithJoins.budget_min,
    budget_max: ideaWithJoins.budget_max,
    relation_id: ideaWithJoins.relation_id,
    occasion_id: ideaWithJoins.occasion_id,
    source: ideaWithJoins.source,
    created_at: ideaWithJoins.created_at,
    updated_at: ideaWithJoins.updated_at,
    // Extract joined names from nested objects
    relation_name: Array.isArray(ideaWithJoins.relations)
      ? (ideaWithJoins.relations[0]?.name ?? null)
      : (ideaWithJoins.relations?.name ?? null),
    occasion_name: Array.isArray(ideaWithJoins.occasions)
      ? (ideaWithJoins.occasions[0]?.name ?? null)
      : (ideaWithJoins.occasions?.name ?? null),
  };

  return ideaDto;
}
