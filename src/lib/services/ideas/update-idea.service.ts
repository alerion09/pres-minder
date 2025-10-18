import { z } from "zod";
import type { supabaseClient } from "@/db/supabase.client";
import type { UpdateIdeaCommand, IdeaDTO, Idea } from "@/types";

// ============================================================================
// Internal Types
// ============================================================================

/**
 * Minimal idea data required for ownership verification and budget validation
 * Used by getIdeaByIdForUser to minimize database query size
 */
type IdeaForBudgetValidation = Pick<Idea, "id" | "name" | "budget_min" | "budget_max" | "user_id">;

// ============================================================================
// Validation Schema
// ============================================================================

/**
 * Zod schema for PUT /api/ideas/:id request body
 * Validates UpdateIdeaCommand with comprehensive business rules for partial updates
 * Note: user_id is required (no authentication)
 */
export const updateIdeaSchema = z
  .object({
    user_id: z.string().uuid("User ID must be a valid UUID"),
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters long")
      .max(255, "Name cannot exceed 255 characters")
      .optional(),
    content: z.string().trim().max(10000, "Content cannot exceed 10000 characters").optional(),
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
      .max(5000, "Interests cannot exceed 5000 characters")
      .optional()
      .nullable()
      .transform((val) => (val === "" ? null : val)),
    person_description: z
      .string()
      .trim()
      .max(5000, "Person description cannot exceed 5000 characters")
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
      .optional(),
  })
  .refine(
    (obj) => {
      // At least one field besides user_id must be provided
      const fieldsWithoutUserId = Object.keys(obj).filter((key) => key !== "user_id");
      return fieldsWithoutUserId.length > 0;
    },
    {
      message: "At least one field must be provided for update",
    }
  )
  .refine(
    (data) => {
      // If both budgets are provided in the update, max must be >= min
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
 * Parses and validates request body for PUT /api/ideas/:id
 *
 * @param body - Raw request body object
 * @returns Validated UpdateIdeaCommand
 * @throws ZodError if validation fails
 */
export function parseAndValidateUpdateIdea(body: unknown): UpdateIdeaCommand {
  return updateIdeaSchema.parse(body);
}

// ============================================================================
// Database Operations
// ============================================================================

/**
 * Fetches minimal idea data by ID for a specific user
 *
 * Used for ownership verification and budget cross-validation.
 * Only fetches fields needed for these checks to optimize query performance.
 *
 * @param supabase - Supabase client instance
 * @param userId - User ID (UUID)
 * @param id - Idea ID
 * @returns Minimal idea data or null if not found
 */
export async function getIdeaByIdForUser(
  supabase: typeof supabaseClient,
  userId: string,
  id: number
): Promise<IdeaForBudgetValidation | null> {
  const { data, error } = await supabase
    .from("ideas")
    .select("id, name, budget_min, budget_max, user_id")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (error) {
    // Not found or other database error
    if (error.code === "PGRST116") {
      // PostgREST code for no rows returned
      return null;
    }
    throw error;
  }

  return data as IdeaForBudgetValidation;
}

/**
 * Updates an existing gift idea for the specified user
 *
 * Performs cross-field budget validation against existing values when only one budget field is updated.
 *
 * @param supabase - Supabase client instance
 * @param id - Idea ID to update
 * @param command - Validated UpdateIdeaCommand with user_id and partial fields
 * @returns Updated idea as IdeaDTO with denormalized relation and occasion names, or null if not found
 * @throws Error if database operation fails, foreign key constraint violated, or budget validation fails
 */
export async function updateIdea(
  supabase: typeof supabaseClient,
  id: number,
  command: UpdateIdeaCommand
): Promise<IdeaDTO | null> {
  // 1. Fetch existing idea to verify ownership and get current budget values
  const existingIdea = await getIdeaByIdForUser(supabase, command.user_id, id);

  if (!existingIdea) {
    return null;
  }

  // 2. Cross-field budget validation
  // If only one budget field is provided, validate against existing value
  const hasNewBudgetMin = command.budget_min !== undefined && command.budget_min !== null;
  const hasNewBudgetMax = command.budget_max !== undefined && command.budget_max !== null;
  const hasOldBudgetMin = existingIdea.budget_min !== null;
  const hasOldBudgetMax = existingIdea.budget_max !== null;

  if (hasNewBudgetMax && !hasNewBudgetMin && hasOldBudgetMin) {
    // Updating only budget_max, check against existing budget_min
    const newMax = command.budget_max;
    const currentMin = existingIdea.budget_min;
    if (typeof newMax === "number" && typeof currentMin === "number" && newMax < currentMin) {
      throw new Error("VALIDATION_ERROR: Maximum budget must be greater than or equal to minimum budget");
    }
  }

  if (hasNewBudgetMin && !hasNewBudgetMax && hasOldBudgetMax) {
    // Updating only budget_min, check against existing budget_max
    const newMin = command.budget_min;
    const currentMax = existingIdea.budget_max;
    if (typeof newMin === "number" && typeof currentMax === "number" && newMin > currentMax) {
      throw new Error("VALIDATION_ERROR: Minimum budget must be less than or equal to maximum budget");
    }
  }

  // 3. Prepare update payload (remove undefined values, keep null for deletion)
  const updatePayload: Record<string, unknown> = {};

  if (command.name !== undefined) updatePayload.name = command.name;
  if (command.content !== undefined) updatePayload.content = command.content;
  if (command.age !== undefined) updatePayload.age = command.age;
  if (command.interests !== undefined) updatePayload.interests = command.interests;
  if (command.person_description !== undefined) updatePayload.person_description = command.person_description;
  if (command.budget_min !== undefined) updatePayload.budget_min = command.budget_min;
  if (command.budget_max !== undefined) updatePayload.budget_max = command.budget_max;
  if (command.relation_id !== undefined) updatePayload.relation_id = command.relation_id;
  if (command.occasion_id !== undefined) updatePayload.occasion_id = command.occasion_id;
  if (command.source !== undefined) updatePayload.source = command.source;

  // 4. Update the idea
  const { data: updatedIdea, error: updateError } = await supabase
    .from("ideas")
    .update(updatePayload)
    .eq("id", id)
    .eq("user_id", command.user_id)
    .select("id")
    .single();

  if (updateError) {
    // Check for foreign key constraint violations
    if (updateError.code === "23503") {
      // PostgreSQL foreign key violation code
      const detail = updateError.details || updateError.message;

      if (detail.includes("relation_id")) {
        throw new Error("VALIDATION_ERROR: relation_id not found");
      }

      if (detail.includes("occasion_id")) {
        throw new Error("VALIDATION_ERROR: occasion_id not found");
      }
    }

    throw updateError;
  }

  if (!updatedIdea) {
    // This shouldn't happen as we already verified the idea exists
    return null;
  }

  // 5. Fetch the updated idea with joined relation and occasion names
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
    .eq("id", updatedIdea.id)
    .single();

  if (selectError) {
    throw selectError;
  }

  if (!ideaWithJoins) {
    throw new Error("Failed to fetch updated idea");
  }

  // 6. Map to IdeaDTO format
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
