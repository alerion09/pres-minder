import type { supabaseClient } from "@/db/supabase.client";
import type { IdeaDTO } from "@/types";

// ============================================================================
// Database Query Functions
// ============================================================================

/**
 * Fetches a single idea by ID
 *
 * @param supabase - Supabase client instance
 * @param id - Idea ID to fetch
 * @returns IdeaDTO if found, null otherwise
 * @throws Error if database query fails
 */
export async function getIdeaById(supabase: typeof supabaseClient, id: number): Promise<IdeaDTO | null> {
  // Query single idea with joins for relation and occasion names
  const { data, error } = await supabase
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
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  // Return null if not found
  if (!data) {
    return null;
  }

  // Map database row to IdeaDTO
  const ideaDTO: IdeaDTO = {
    id: data.id,
    name: data.name,
    content: data.content,
    age: data.age,
    interests: data.interests,
    person_description: data.person_description,
    budget_min: data.budget_min,
    budget_max: data.budget_max,
    relation_id: data.relation_id,
    occasion_id: data.occasion_id,
    source: data.source,
    created_at: data.created_at,
    updated_at: data.updated_at,
    // Extract joined names from nested objects
    relation_name: Array.isArray(data.relations) ? (data.relations[0]?.name ?? null) : (data.relations?.name ?? null),
    occasion_name: Array.isArray(data.occasions) ? (data.occasions[0]?.name ?? null) : (data.occasions?.name ?? null),
  };

  return ideaDTO;
}
