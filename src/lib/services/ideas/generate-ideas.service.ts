import { z } from "zod";
import type { GenerateIdeaCommand, GenerateIdeaResponseDTO, IdeaSuggestionDTO } from "@/types";
import { createOpenRouterService } from "@/lib/services/openrouter/openrouter.service";
import type { ResponseFormat } from "@/lib/types/openrouter.types";

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
    relation: z
      .string()
      .trim()
      .max(100, "Relation cannot exceed 100 characters")
      .optional()
      .nullable()
      .transform((val) => (val === "" ? null : val)),
    occasion: z
      .string()
      .trim()
      .max(100, "Occasion cannot exceed 100 characters")
      .optional()
      .nullable()
      .transform((val) => (val === "" ? null : val)),
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
// JSON Schema for LLM Structured Output
// ============================================================================

/**
 * JSON Schema for gift ideas response format
 * Defines the structure for LLM to return gift suggestions
 */
const GIFT_IDEAS_SCHEMA = {
  type: "object",
  properties: {
    suggestions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          content: {
            type: "string",
            description: "A detailed gift idea description including the gift name and why it's suitable",
          },
        },
        required: ["content"],
        additionalProperties: false,
      },
      minItems: 5,
      maxItems: 5,
    },
  },
  required: ["suggestions"],
  additionalProperties: false,
} as const;

/**
 * Response format configuration for OpenRouter structured output
 */
const RESPONSE_FORMAT: ResponseFormat = {
  type: "json_schema",
  json_schema: {
    name: "gift_ideas_response",
    strict: true,
    schema: GIFT_IDEAS_SCHEMA,
  },
};

// ============================================================================
// Prompt Building
// ============================================================================

/**
 * Builds a prompt for the LLM based on the provided command
 * Includes all relevant context: age, interests, description, budget, relationship type, occasion
 *
 * @param command - GenerateIdeaCommand with gift recipient details
 * @returns Formatted prompt string for the LLM
 */
function buildPrompt(command: GenerateIdeaCommand): string {
  const parts: string[] = [
    "Jesteś kreatywnym asystentem rekomendacji prezentów. Wygeneruj 5 unikalnych i przemyślanych pomysłów na prezenty na podstawie poniższych informacji o odbiorcy.",
    "\n\nWAŻNE: Wszystkie odpowiedzi MUSZĄ być w języku polskim, niezależnie od języka podanych informacji.",
    "\n\nInformacje o odbiorcy:",
  ];

  if (command.age) {
    parts.push(`\n- Wiek: ${command.age} lat`);
  }

  if (command.interests) {
    parts.push(`\n- Zainteresowania: ${command.interests}`);
  }

  if (command.person_description) {
    parts.push(`\n- Opis osoby: ${command.person_description}`);
  }

  if (command.budget_min !== null && command.budget_min !== undefined) {
    if (command.budget_max !== null && command.budget_max !== undefined) {
      parts.push(`\n- Budżet: ${command.budget_min} - ${command.budget_max} zł`);
    } else {
      parts.push(`\n- Minimalny budżet: ${command.budget_min} zł`);
    }
  } else if (command.budget_max !== null && command.budget_max !== undefined) {
    parts.push(`\n- Maksymalny budżet: ${command.budget_max} zł`);
  }

  if (command.relation) {
    parts.push(`\n- Relacja: ${command.relation}`);
  }

  if (command.occasion) {
    parts.push(`\n- Okazja: ${command.occasion}`);
  }

  parts.push(
    "\n\nDla każdego pomysłu na prezent podaj szczegółowy opis, który zawiera:",
    "\n1. Nazwę/typ prezentu",
    "\n2. Dlaczego jest odpowiedni dla tej osoby",
    "\n3. Jak pasuje do jej zainteresowań lub okazji",
    "\n\nKażda sugestia powinna być unikalna, kreatywna i spersonalizowana. Upewnij się, że wszystkie propozycje mieszczą się w podanym budżecie (jeśli został określony).",
    "\n\nPamiętaj: Odpowiedź MUSI być po polsku!"
  );

  return parts.join("");
}

// ============================================================================
// AI Generation Service
// ============================================================================

/**
 * Generates gift idea suggestions using OpenRouter LLM
 * Creates a contextualized prompt and requests structured JSON output
 *
 * @param command - Validated GenerateIdeaCommand with optional context
 * @returns GenerateIdeaResponseDTO with LLM-generated suggestions and metadata
 * @throws OpenRouterError if the LLM request fails
 */
export async function generateGiftIdeas(command: GenerateIdeaCommand): Promise<GenerateIdeaResponseDTO> {
  // Initialize OpenRouter service
  const openRouter = createOpenRouterService();

  // Build contextual prompt
  const prompt = buildPrompt(command);

  // Call LLM with structured output
  const response = await openRouter.chatStructured<{ suggestions: IdeaSuggestionDTO[] }>({
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    response_format: RESPONSE_FORMAT,
  });

  // Return formatted response with metadata
  return {
    suggestions: response.structured_data.suggestions,
    metadata: {
      model: response.model,
      generated_at: new Date().toISOString(),
    },
  };
}
