const path = require("path");
require("dotenv").config({ path: path.resolve(process.cwd(), ".env.local") });
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log("--- SUPABASE CHECK ---");

  if (!supabaseUrl || !supabaseKey) {
    console.log("❌ Missing NEXT_PUBLIC_SUPABASE_URL / VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    return;
  }

  // Test insert
  const { error: insertError } = await supabase.from("product_cost_cache").upsert(
    {
      sku: "test:sku:001",
      cost: 9.99,
      source: "test",
      source_url: "https://test.com",
      fetched_at: new Date().toISOString(),
    },
    { onConflict: "sku" }
  );

  if (insertError) {
    console.log("❌ Cache table insert failed:", insertError.message);
    console.log("   → Run the migration: supabase/migrations/010_product_cost_cache.sql");
    return;
  }
  console.log("✅ Cache table insert works");

  // Test read
  const { data, error: readError } = await supabase
    .from("product_cost_cache")
    .select("*")
    .eq("sku", "test:sku:001")
    .single();

  if (readError) {
    console.log("❌ Cache table read failed:", readError.message);
    return;
  }
  console.log("✅ Cache table read works");
  console.log("   Stored:", data);

  // Cleanup
  await supabase.from("product_cost_cache").delete().eq("sku", "test:sku:001");
  console.log("✅ Cache table delete works");
  console.log("\n✅ Supabase is fully working");
}

test().catch(console.error);
