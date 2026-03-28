const path = require("path");
require("dotenv").config({ path: path.resolve(process.cwd(), ".env.local") });

/**
 * POST /api/products/lookup-cost is admin-only (Bearer Supabase access token).
 * Set LOOKUP_TEST_BEARER in .env.local to a JWT from an admin session
 * (browser DevTools → Application → localStorage supabase auth token, or sign-in API).
 */
async function test() {
  console.log("--- API ROUTE CHECK ---");

  const port = process.env.PORT || "3000";
  const base = process.env.LOOKUP_TEST_ORIGIN || `http://localhost:${port}`;
  const url = `${base.replace(/\/$/, "")}/api/products/lookup-cost`;

  const bearer = process.env.LOOKUP_TEST_BEARER?.trim();
  const headers = { "Content-Type": "application/json" };
  if (bearer) {
    headers.Authorization = `Bearer ${bearer}`;
  } else {
    console.log("⚠️  LOOKUP_TEST_BEARER not set — expect 403 unless route is open.");
  }

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      productName: "Breeze Pro Disposable Vape Banana Mint",
      sku: "catalog:vape-breeze-pro:banana-mint",
      forceRefresh: true,
    }),
  });

  let data;
  try {
    data = await res.json();
  } catch {
    const text = await res.text();
    console.log("Response status:", res.status);
    console.log("Non-JSON body:", text.slice(0, 500));
    return;
  }

  console.log("Response status:", res.status);
  console.log("Result:", JSON.stringify(data, null, 2));

  if (res.status === 403) {
    console.log("\n❌ Forbidden — add LOOKUP_TEST_BEARER=(Supabase access_token) for an admin user to .env.local");
    return;
  }

  if (data.cost != null) {
    console.log(`\n✅ SUCCESS — Found cost: $${data.cost} from ${data.source}`);
  } else {
    console.log("\n❌ No cost found — check logs above for which source failed");
  }
}

test().catch(err => {
  console.error(err.message || err);
  if (String(err.message || err).includes("fetch failed")) {
    console.log("\n→ Start the dev server: pnpm dev (default http://localhost:3000)");
  }
});
