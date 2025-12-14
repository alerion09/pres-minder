import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/db/database.types";

/**
 * Global teardown - cleanup test data from Supabasetak
 * Runs after all tests complete
 */
async function globalTeardown() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const testUserId = process.env.E2E_USERNAME_ID;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.warn("⚠️  Supabase credentials not found - skipping database cleanup");
    console.warn("⚠️  Required: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.test");
    return;
  }

  if (!testUserId) {
    console.warn("⚠️  E2E_USERNAME_ID not found - skipping database cleanup");
    return;
  }
  console.log("🧹 Cleaning up test data from Supabase...");

  const supabase = createClient<Database>(supabaseUrl, supabaseServiceRoleKey);
  const { error, count } = await supabase.from("ideas").delete({ count: "exact" }).eq("user_id", testUserId);

  if (error) {
    console.error("❌ Failed to cleanup test ideas:", error.message);
    throw error;
  }

  console.log(`✅ Successfully deleted ${count ?? 0} test idea(s) from database`);
}

export default globalTeardown;
