import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types";

/**
 * Usuwa pomysł na prezent o podanym ID
 *
 * @param supabase - Klient Supabase
 * @param id - ID pomysłu do usunięcia
 * @returns Promise<boolean> - true jeśli usunięto rekord, false jeśli nie znaleziono
 * @throws Error jeśli wystąpi błąd bazy danych
 */
export async function deleteIdeaById(supabase: SupabaseClient<Database>, id: number): Promise<boolean> {
  try {
    const { error, count } = await supabase.from("ideas").delete({ count: "exact" }).eq("id", id);

    if (error) {
      console.error("Database error in deleteIdeaById:", {
        code: error.code,
        message: error.message,
        details: error.details,
        ideaId: id,
      });
      throw new Error(`Failed to delete idea: ${error.message}`);
    }

    // Zwraca true jeśli usunięto dokładnie jeden rekord
    return (count ?? 0) > 0;
  } catch (error) {
    console.error("Unexpected error in deleteIdeaById:", {
      error: error instanceof Error ? error.message : "Unknown error",
      ideaId: id,
    });
    throw error;
  }
}
