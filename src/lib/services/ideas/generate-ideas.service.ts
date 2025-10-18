import { z } from "zod";
import type { GenerateIdeaCommand, GenerateIdeaResponseDTO, IdeaSuggestionDTO } from "@/types";

// ============================================================================
// Validation Schema
// ============================================================================

/**
 * Zod schema for POST /api/ideas/generate request body
 * Validates GenerateIdeaCommand with comprehensive business rules
 */
export const generateIdeaSchema = z
  .object({
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
 * Parses and validates request body for POST /api/ideas/generate
 *
 * @param body - Raw request body object
 * @returns Validated GenerateIdeaCommand
 * @throws ZodError if validation fails
 */
export function parseAndValidateGenerateIdea(body: unknown): GenerateIdeaCommand {
  return generateIdeaSchema.parse(body);
}

// ============================================================================
// AI Generation Service (Mocked)
// ============================================================================

/**
 * Generates gift idea suggestions based on provided hints
 * Currently returns mocked data - AI integration will be added later
 *
 * @param command - Validated GenerateIdeaCommand with optional context
 * @returns GenerateIdeaResponseDTO with mocked suggestions and metadata
 */
export async function generateGiftIdeas(command: GenerateIdeaCommand): Promise<GenerateIdeaResponseDTO> {
  // Simulate AI processing delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Generate mock suggestions
  const suggestions: IdeaSuggestionDTO[] = generateMockSuggestions();

  const response: GenerateIdeaResponseDTO = {
    suggestions,
    metadata: {
      model: "mock-model-v1",
      generated_at: new Date().toISOString(),
    },
  };

  return response;
}

/**
 * Generates mock suggestions with hardcoded examples
 * This function will be replaced with actual AI integration later
 *
 * @returns Array of 5 mock suggestions
 */
function generateMockSuggestions(): IdeaSuggestionDTO[] {
  // Hardcoded mock suggestions for testing
  const mockSuggestions: IdeaSuggestionDTO[] = [
    { content: "Personalized photo album - A thoughtful collection of memorable moments" },
    { content: "Experience voucher - An unforgettable adventure or activity" },
    { content: "High-quality book set - Carefully curated selection based on interests" },
    { content: "Artisanal craft item - Unique handmade piece from local artisan" },
    { content: "Premium subscription service - Year-long access to favorite content or service" },
  ];

  return mockSuggestions;
}
