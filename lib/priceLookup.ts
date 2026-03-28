/**
 * Multi-source wholesale cost lookup (server-side).
 * Order: SerpApi Google Shopping → Barcode Lookup → 5starhookah (existing direct/CSE flow).
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

export async function lookupViaSerpApi(productName: string): Promise<CostResult> {
  const key = readEnv("SERPAPI_KEY");
  if (!key) return { cost: null, source: "serpapi_failed" };
  try {
    const q = `${productName} wholesale`.trim();
    const url = new URL("https://serpapi.com/search.json");
    url.searchParams.set("engine", "google_shopping");
    url.searchParams.set("q", q);
    url.searchParams.set("api_key", key);
    const res = await fetch(url.toString(), { method: "GET" });
    if (!res.ok) {
      console.error("[PriceLookup]", "serpapi", res.status);
      return { cost: null, source: "serpapi_failed" };
    }
    const data = (await res.json()) as {
      shopping_results?: Array<{ price?: string; extracted_price?: number; link?: string; title?: string }>;
      error?: string;
    };
    if (data.error) {
      console.error("[PriceLookup]", "serpapi", data.error);
      return { cost: null, source: "serpapi_failed" };
    }
    const results = data.shopping_results ?? [];
    let lowest: number | null = null;
    let linkOut: string | undefined;
    for (const r of results) {
      let n: number | null = null;
      if (r.extracted_price != null && Number.isFinite(r.extracted_price)) {
        n = Number(r.extracted_price);
      } else {
        n = parsePriceString(r.price);
      }
      if (n != null && (lowest == null || n < lowest)) {
        lowest = n;
        linkOut = r.link;
      }
    }
    if (lowest == null) return { cost: null, source: "serpapi_failed" };
    return {
      cost: lowest,
      source: "Google Shopping",
      sourceUrl: linkOut,
    };
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
