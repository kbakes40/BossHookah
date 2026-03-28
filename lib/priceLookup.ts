/**
 * Multi-source wholesale cost lookup (server-side).
 * SerpApi: (1) google_shopping `{productName}` → (2) google organic `{productName} wholesale price` →
 * Barcode Lookup → 5starhookah (existing direct/CSE flow).
 */
import { supabaseAdmin } from "../server/_core/supabaseAdmin";
import { lookupProductCostOnline } from "../server/costLookupService";

export type CostResult = {
  cost: number | null;
  source: string;
  sourceUrl?: string;
  cached?: boolean;
};

export type LookupSource = "serpapi" | "barcode" | "5star" | "none";

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** Ignore retail/case listings; cap unit wholesale hints. */
const SERP_MAX_UNIT_PRICE = 50;
/** Prefer per-unit wholesale band (vape/disposables). */
const SERP_PREFERRED_MIN = 5;
const SERP_PREFERRED_MAX = 30;

/**
 * From dollar strings in organic snippets (e.g. "$9.85", "$98.50") parse amounts, drop above cap.
 */
function pricesFromDollarMatches(text: string): number[] {
  const re = /\$[\d,]+\.?\d*/g;
  const out: number[] = [];
  let m: RegExpExecArray | null;
  const s = String(text);
  re.lastIndex = 0;
  while ((m = re.exec(s)) !== null) {
    const n = parsePriceString(m[0]);
    if (n != null && n > 0 && n <= SERP_MAX_UNIT_PRICE) out.push(n);
  }
  return out;
}

/** Prefer prices in [5, 30] when any exist; else lowest in (0, 50]. */
export function pickPreferredWholesaleUnitPrice(candidates: number[]): number | null {
  const valid = candidates.filter(p => p > 0 && p <= SERP_MAX_UNIT_PRICE);
  if (valid.length === 0) return null;
  const band = valid.filter(p => p >= SERP_PREFERRED_MIN && p <= SERP_PREFERRED_MAX);
  if (band.length > 0) return Math.round(Math.min(...band) * 100) / 100;
  return Math.round(Math.min(...valid) * 100) / 100;
}

function readEnv(name: string): string {
  return (process.env[name] ?? "").trim();
}

function parsePriceString(raw: string | undefined | null): number | null {
  if (raw == null || raw === "") return null;
  const cleaned = String(raw).replace(/[^\d.]/g, "");
  const n = Number(cleaned);
  if (!Number.isFinite(n) || n <= 0 || n >= 50000) return null;
  return Math.round(n * 100) / 100;
}

/** Stable cache row key: real SKU or synthetic per-product id. */
export function wholesaleCacheKey(sku: string | null | undefined, productId: string): string {
  const s = sku?.trim();
  if (s) return s;
  return `__id__:${productId}`;
}

export async function checkCache(cacheSku: string): Promise<CostResult | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from("product_cost_cache")
      .select("cost, source, source_url, fetched_at")
      .eq("sku", cacheSku)
      .maybeSingle();
    if (error) {
      console.error("[PriceLookup]", "cache_read", error.message);
      return null;
    }
    if (!data) return null;
    const fetched = data.fetched_at ? new Date(String(data.fetched_at)).getTime() : 0;
    if (!fetched || Date.now() - fetched > CACHE_TTL_MS) return null;
    const cost =
      data.cost != null && data.cost !== ""
        ? Number(data.cost)
        : null;
    if (cost == null || !Number.isFinite(cost)) return null;
    return {
      cost,
      source: String(data.source ?? "cache"),
      sourceUrl: data.source_url ? String(data.source_url) : undefined,
      cached: true,
    };
  } catch (e) {
    console.error("[PriceLookup]", "checkCache", e);
    return null;
  }
}

export async function saveToCache(cacheSku: string, result: CostResult): Promise<void> {
  if (result.cost == null) return;
  try {
    const row = {
      sku: cacheSku,
      cost: result.cost,
      source: result.source,
      source_url: result.sourceUrl ?? null,
      fetched_at: new Date().toISOString(),
    };
    const { error } = await supabaseAdmin.from("product_cost_cache").upsert(row, { onConflict: "sku" });
    if (error) console.error("[PriceLookup]", "cache_write", error.message);
  } catch (e) {
    console.error("[PriceLookup]", "saveToCache", e);
  }
}

async function serpApiFetchJson(url: string): Promise<{ ok: boolean; data: Record<string, unknown> }> {
  const res = await fetch(url, { method: "GET" });
  if (!res.ok) {
    console.error("[PriceLookup]", "serpapi", "http", res.status);
    return { ok: false, data: {} };
  }
  const data = (await res.json()) as Record<string, unknown>;
  return { ok: true, data };
}

/**
 * SerpApi two-step: google_shopping (product name only) → google organic "wholesale price" snippets.
 * Never uses a price &gt; $50; prefers $5–$30 when possible.
 */
export async function lookupViaSerpApi(productName: string): Promise<CostResult> {
  const key = readEnv("SERPAPI_KEY");
  if (!key) return { cost: null, source: "serpapi_failed" };
  const name = productName.trim();
  if (!name) return { cost: null, source: "serpapi_failed" };

  try {
    // —— Step 1: Google Shopping — query is product name only ——
    const urlShop = new URL("https://serpapi.com/search.json");
    urlShop.searchParams.set("engine", "google_shopping");
    urlShop.searchParams.set("q", name);
    urlShop.searchParams.set("api_key", key);

    const shopRes = await serpApiFetchJson(urlShop.toString());
    if (shopRes.ok) {
      const err = shopRes.data.error;
      if (err) {
        console.error("[PriceLookup]", "serpapi", "step1_google_shopping", "api_error", err);
      } else {
        const shoppingRaw = shopRes.data.shopping_results as
          | Array<{ price?: string; extracted_price?: number; link?: string; title?: string }>
          | undefined;
        const shopping = shoppingRaw ?? [];

        if (shopping.length >= 2) {
          const rows: Array<{ price: number; link?: string }> = [];
          for (const r of shopping) {
            let n: number | null = null;
            if (r.extracted_price != null && Number.isFinite(Number(r.extracted_price))) {
              n = Number(r.extracted_price);
            } else {
              n = parsePriceString(r.price);
            }
            if (n != null && n > 0 && n <= SERP_MAX_UNIT_PRICE) {
              rows.push({ price: n, link: r.link });
            }
          }
          const picked = pickPreferredWholesaleUnitPrice(rows.map(x => x.price));
          if (picked != null) {
            const winner = rows.find(x => x.price === picked) ?? rows[0];
            console.log(
              "[PriceLookup]",
              "serpapi",
              "step1_google_shopping",
              "picked",
              picked,
              "shopping_rows",
              shopping.length,
              "valid_under_cap",
              rows.length
            );
            return {
              cost: picked,
              source: "Google Shopping (SerpApi step 1)",
              sourceUrl: winner?.link,
            };
          }
          console.log(
            "[PriceLookup]",
            "serpapi",
            "step1_google_shopping",
            "skip",
            "no_valid_price_under_cap",
            "shopping_rows",
            shopping.length
          );
        } else {
          console.log(
            "[PriceLookup]",
            "serpapi",
            "step1_google_shopping",
            "skip",
            "need_at_least_2_results",
            "got",
            shopping.length
          );
        }
      }
    }

    // —— Step 2: Google organic — "{name} wholesale price" ——
    const urlOrg = new URL("https://serpapi.com/search.json");
    urlOrg.searchParams.set("engine", "google");
    urlOrg.searchParams.set("q", `${name} wholesale price`);
    urlOrg.searchParams.set("api_key", key);

    const orgRes = await serpApiFetchJson(urlOrg.toString());
    if (!orgRes.ok) return { cost: null, source: "serpapi_failed" };

    const orgErr = orgRes.data.error;
    if (orgErr) {
      console.error("[PriceLookup]", "serpapi", "step2_google_organic", "api_error", orgErr);
      return { cost: null, source: "serpapi_failed" };
    }

    const organicRaw = orgRes.data.organic_results as
      | Array<{ title?: string; snippet?: string; link?: string }>
      | undefined;
    const organic = organicRaw ?? [];

    const tagged: Array<{ price: number; link?: string }> = [];
    for (const r of organic) {
      const blob = `${r.title ?? ""} ${r.snippet ?? ""}`;
      for (const p of pricesFromDollarMatches(blob)) {
        tagged.push({ price: p, link: r.link });
      }
    }

    const picked2 = pickPreferredWholesaleUnitPrice(tagged.map(t => t.price));
    if (picked2 != null) {
      const w = tagged.find(t => t.price === picked2);
      console.log(
        "[PriceLookup]",
        "serpapi",
        "step2_google_organic",
        "picked",
        picked2,
        "organic_rows",
        organic.length,
        "snippet_prices",
        tagged.length
      );
      return {
        cost: picked2,
        source: "Google Search organic (SerpApi step 2)",
        sourceUrl: w?.link,
      };
    }

    console.log("[PriceLookup]", "serpapi", "step2_google_organic", "no_usable_snippet_prices");
    return { cost: null, source: "serpapi_failed" };
  } catch (e) {
    console.error("[PriceLookup]", "serpapi", e);
    return { cost: null, source: "serpapi_failed" };
  }
}

export async function lookupViaBarcode(productName: string): Promise<CostResult> {
  const key = readEnv("BARCODE_LOOKUP_KEY");
  if (!key) return { cost: null, source: "barcode_failed" };
  try {
    const url = new URL("https://api.barcodelookup.com/v3/products");
    url.searchParams.set("title", productName);
    url.searchParams.set("key", key);
    url.searchParams.set("formatted", "y");
    const res = await fetch(url.toString(), { method: "GET" });
    if (!res.ok) {
      console.error("[PriceLookup]", "barcode", res.status);
      return { cost: null, source: "barcode_failed" };
    }
    const data = (await res.json()) as {
      products?: Array<{
        stores?: Array<{ store_price?: string; price?: number; product_url?: string; url?: string }>;
      }>;
    };
    const products = data.products ?? [];
    let lowest: number | null = null;
    let urlOut: string | undefined;
    for (const p of products) {
      for (const s of p.stores ?? []) {
        let n: number | null = null;
        if (typeof s.price === "number" && Number.isFinite(s.price)) n = s.price;
        else n = parsePriceString(s.store_price);
        if (n != null && (lowest == null || n < lowest)) {
          lowest = n;
          urlOut = s.product_url ?? s.url;
        }
      }
    }
    if (lowest == null) return { cost: null, source: "barcode_failed" };
    return {
      cost: lowest,
      source: "Barcode Lookup",
      sourceUrl: urlOut,
    };
  } catch (e) {
    console.error("[PriceLookup]", "barcode", e);
    return { cost: null, source: "barcode_failed" };
  }
}

export async function lookupVia5Star(
  productName: string,
  sku: string | null,
  ctx: { brand: string; category: string; retailUsd: number; id: string }
): Promise<CostResult> {
  try {
    const r = await lookupProductCostOnline(
      {
        id: ctx.id,
        name: productName,
        brand: ctx.brand,
        category: ctx.category,
        sku,
      },
      ctx.retailUsd
    );
    const price =
      r.costUsd ??
      (r.confidence === "likely" || r.confidence === "review" ? r.suggestedUsd : null);
    if (price == null || !Number.isFinite(price))
      return { cost: null, source: "5star_failed" };
    return {
      cost: price,
      source: r.sourceName ?? "5starhookah.com",
      sourceUrl: r.sourceUrl ?? undefined,
    };
  } catch (e) {
    console.error("[PriceLookup]", "5star", e);
    return { cost: null, source: "5star_failed" };
  }
}

export type LookupProductCostInput = {
  productName: string;
  sku: string | null;
  productId: string;
  brand: string;
  category: string;
  retailUsd: number;
  /** Normalized cache row key (see wholesaleCacheKey). */
  cacheSku: string;
};

export async function lookupProductCost(
  input: LookupProductCostInput,
  forceRefresh = false
): Promise<CostResult & { lookupSource?: LookupSource }> {
  const { productName, sku, productId, brand, category, retailUsd, cacheSku } = input;
  try {
    if (!forceRefresh) {
      const hit = await checkCache(cacheSku);
      if (hit?.cost != null) return { ...hit, lookupSource: "none" };
    }

    let r = await lookupViaSerpApi(productName);
    if (r.cost != null) {
      await saveToCache(cacheSku, r);
      return { ...r, lookupSource: "serpapi" };
    }

    r = await lookupViaBarcode(productName);
    if (r.cost != null) {
      await saveToCache(cacheSku, r);
      return { ...r, lookupSource: "barcode" };
    }

    r = await lookupVia5Star(productName, sku, { brand, category, retailUsd, id: productId });
    if (r.cost != null) {
      await saveToCache(cacheSku, r);
      return { ...r, lookupSource: "5star" };
    }

    return { cost: null, source: "none", lookupSource: "none" };
  } catch (e) {
    console.error("[PriceLookup]", "lookupProductCost", e);
    return { cost: null, source: "none", lookupSource: "none" };
  }
}
