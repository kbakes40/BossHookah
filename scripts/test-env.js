const path = require("path");
require("dotenv").config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;

console.log("--- ENV CHECK ---");
console.log("SERPAPI_KEY:", process.env.SERPAPI_KEY ? "✅ Loaded" : "❌ Missing");
console.log(
  "SUPABASE_URL:",
  supabaseUrl ? "✅ Loaded" : "❌ Missing",
  supabaseUrl && !process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.VITE_SUPABASE_URL
    ? "(VITE_SUPABASE_URL)"
    : ""
);
console.log(
  "SUPABASE_SERVICE_KEY:",
  process.env.SUPABASE_SERVICE_ROLE_KEY ? "✅ Loaded" : "❌ Missing"
);
