import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/db/database.types";

/**
 * Global teardown - cleanup test data from Supabase
 * Runs after all tests complete
 */
async function globalTeardown() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_PUBLIC_KEY;
  const testUserId = process.env.E2E_USERNAME_ID;

  if (!supabaseUrl || !supabaseKey) {
    console.warn("⚠️  Supabase credentials not found - skipping database cleanup");
    return;
  }

  if (!testUserId) {
    console.warn("⚠️  E2E_USERNAME_ID not found - skipping database cleanup");
    return;
  }

  console.log("🧹 Cleaning up test data from Supabase...");

  // Create Supabase client for cleanup
  const supabase = createClient<Database>(supabaseUrl, supabaseKey);

  // Delete all ideas created by the test user
  const { error, count } = await supabase.from("ideas").delete({ count: "exact" }).eq("user_id", testUserId);

  if (error) {
    console.error("❌ Failed to cleanup test ideas:", error.message);
    throw error;
  }

  console.log(`✅ Successfully deleted ${count ?? 0} test idea(s) from database`);
}

export default globalTeardown;
