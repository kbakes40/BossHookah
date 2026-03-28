const path = require("path");
require("dotenv").config({ path: path.resolve(process.cwd(), ".env.local") });

async function test() {
  const key = process.env.SERPAPI_KEY;
  if (!key) {
    console.log("❌ SERPAPI_KEY missing");
    return;
  }

  const query = "Breeze Pro Disposable Vape Banana Mint wholesale";
  const url = `https://serpapi.com/search.json?engine=google_shopping&q=${encodeURIComponent(query)}&api_key=${key}`;

  console.log("🔍 Searching:", query);

  const res = await fetch(url);
  const data = await res.json();

  if (data.error) {
    console.log("❌ SerpApi error:", data.error);
    return;
  }

  const results = data.shopping_results || [];
  console.log(`✅ Got ${results.length} results`);

  if (results.length > 0) {
    console.log("\nTop 3 results:");
    results.slice(0, 3).forEach((r, i) => {
      console.log(`  ${i + 1}. ${r.title}`);
      console.log(`     Price: ${r.price}`);
      console.log(`     Link: ${r.link}`);
    });

    const prices = results
      .map(r => parseFloat(String(r.price ?? "").replace(/[^0-9.]/g, "")))
      .filter(p => !isNaN(p));

    if (prices.length === 0) {
      console.log("\n⚠️ No parseable prices in results");
      return;
    }

    const lowest = Math.min(...prices);
    console.log(`\n💰 Lowest price found: $${lowest}`);
  } else {
    console.log("⚠️ No shopping results returned");
  }
}

test().catch(console.error);
