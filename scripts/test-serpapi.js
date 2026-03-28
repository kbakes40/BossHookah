const path = require("path");
require("dotenv").config({ path: path.resolve(process.cwd(), ".env.local") });

const SERP_MAX_UNIT_PRICE = 50;
const SERP_PREFERRED_MIN = 5;
const SERP_PREFERRED_MAX = 30;

function parsePriceString(raw) {
  if (raw == null || raw === "") return null;
  const cleaned = String(raw).replace(/[^\d.]/g, "");
  const n = Number(cleaned);
  if (!Number.isFinite(n) || n <= 0 || n >= 50000) return null;
  return Math.round(n * 100) / 100;
}

function pricesFromDollarMatches(text) {
  const re = /\$[\d,]+\.?\d*/g;
  const out = [];
  let m;
  const s = String(text);
  re.lastIndex = 0;
  while ((m = re.exec(s)) !== null) {
    const n = parsePriceString(m[0]);
    if (n != null && n > 0 && n <= SERP_MAX_UNIT_PRICE) out.push(n);
  }
  return out;
}

function pickPreferredWholesaleUnitPrice(candidates) {
  const valid = candidates.filter(p => p > 0 && p <= SERP_MAX_UNIT_PRICE);
  if (valid.length === 0) return null;
  const band = valid.filter(p => p >= SERP_PREFERRED_MIN && p <= SERP_PREFERRED_MAX);
  if (band.length > 0) return Math.round(Math.min(...band) * 100) / 100;
  return Math.round(Math.min(...valid) * 100) / 100;
}

function buildSerpUrl(engine, query, apiKey) {
  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", engine);
  url.searchParams.set("q", query);
  url.searchParams.set("api_key", apiKey);
  return url.toString();
}

function redactSerpUrl(urlString) {
  return String(urlString).replace(/api_key=[^&]+/i, "api_key=***REDACTED***");
}

/**
 * Mirrors lib/priceLookup.ts lookupViaSerpApi: shopping → organic wholesale.
 */
async function runFinalLookupStrategy(productName, apiKey) {
  const name = String(productName).trim();
  console.log(`\n${"=".repeat(60)}`);
  console.log("FINAL LOOKUP STRATEGY (matches lib/priceLookup.ts)");
  console.log("Product:", name);
  console.log("=".repeat(60));

  // Step 1: google_shopping, q = productName
  const url1 = buildSerpUrl("google_shopping", name, apiKey);
  console.log("\n--- Step 1: google_shopping ---");
  console.log("URL:", redactSerpUrl(url1));

  const res1 = await fetch(url1);
  const data1 = await res1.json();

  if (data1.error) {
    console.log("Error:", data1.error);
  } else {
    const shopping = data1.shopping_results || [];
    console.log("shopping_results count:", shopping.length);

    if (shopping.length >= 2) {
      const rows = [];
      for (const r of shopping) {
        let n = null;
        if (r.extracted_price != null && Number.isFinite(Number(r.extracted_price))) {
          n = Number(r.extracted_price);
        } else {
          n = parsePriceString(r.price);
        }
        if (n != null && n > 0 && n <= SERP_MAX_UNIT_PRICE) {
          rows.push({ price: n, link: r.link, title: r.title });
        }
      }
      console.log("After filter (price <= $50):", rows.length, "candidates");
      rows.slice(0, 3).forEach((r, i) => {
        console.log(`  ${i + 1}. ${r.title} — $${r.price}`);
      });

      const picked = pickPreferredWholesaleUnitPrice(rows.map(x => x.price));
      if (picked != null) {
        const winner = rows.find(x => x.price === picked) || rows[0];
        console.log("\n✅ Step 1 WINS — cost:", picked, "(preferred band $5–$30 when possible)");
        console.log("   Source link:", winner.link || "—");
        return { cost: picked, step: 1, link: winner.link };
      }
      console.log("Step 1: no valid price ≤ $50 after filter → try step 2");
    } else {
      console.log("Step 1: skip (need ≥ 2 shopping results, got", shopping.length + ")");
    }
  }

  // Step 2: google organic
  const q2 = `${name} wholesale price`;
  const url2 = buildSerpUrl("google", q2, apiKey);
  console.log("\n--- Step 2: google (organic snippets) ---");
  console.log("Query:", q2);
  console.log("URL:", redactSerpUrl(url2));

  const res2 = await fetch(url2);
  const data2 = await res2.json();

  if (data2.error) {
    console.log("Error:", data2.error);
    console.log("\n❌ No SerpApi cost (step 2 error)");
    return { cost: null, step: null, link: null };
  }

  const organic = data2.organic_results || [];
  console.log("organic_results count:", organic.length);

  const tagged = [];
  for (const r of organic) {
    const blob = `${r.title || ""} ${r.snippet || ""}`;
    const found = pricesFromDollarMatches(blob);
    for (const p of found) {
      tagged.push({ price: p, link: r.link, title: r.title, snippet: r.snippet });
    }
  }

  console.log("Snippet price tokens (≤ $50):", tagged.length);
  tagged.slice(0, 6).forEach((t, i) => {
    console.log(`  ${i + 1}. $${t.price} — ${(t.title || "").slice(0, 60)}`);
  });

  const picked2 = pickPreferredWholesaleUnitPrice(tagged.map(t => t.price));
  if (picked2 != null) {
    const w = tagged.find(t => t.price === picked2);
    console.log("\n✅ Step 2 WINS — cost:", picked2, "(preferred band $5–$30 when possible)");
    console.log("   Source link:", w?.link || "—");
    return { cost: picked2, step: 2, link: w?.link };
  }

  console.log("\n❌ No SerpApi cost after step 2");
  return { cost: null, step: null, link: null };
}

async function main() {
  const key = process.env.SERPAPI_KEY;
  if (!key) {
    console.log("❌ SERPAPI_KEY missing");
    process.exit(1);
  }

  const demoName = "Breeze Pro Disposable Vape Banana Mint";
  const result = await runFinalLookupStrategy(demoName, key);

  console.log(`\n${"=".repeat(60)}`);
  console.log("SUMMARY");
  console.log("=".repeat(60));
  console.log("Product:", demoName);
  if (result.cost != null) {
    console.log("Final cost:", `$${result.cost}`, "· step:", result.step);
  } else {
    console.log("Final cost: (none from SerpApi — app would try Barcode / 5star)");
  }
  console.log("");
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
