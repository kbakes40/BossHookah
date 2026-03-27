/**
 * Admin inventory cost lookup via Google Programmable Search (Custom Search JSON API).
 * Requires GOOGLE_CSE_API_KEY + GOOGLE_CSE_CX. Optional COST_LOOKUP_SITES (comma hosts, default 5starhookah.com).
 *
 * Conservative matching: prefers SKU, then strong title overlap; never returns "exact" without SKU or flavor alignment.
 */

export type CostMatchConfidence = "exact" | "likely" | "review" | "none";

export type CostLookupProductInput = {
  id: string;
  name: string;
  brand: string;
  category: string;
  sku: string | null;
};

export type CostLookupResult = {
  confidence: CostMatchConfidence;
  costUsd: number | null;
  /** When confidence is likely/review, same as costUsd for suggested apply */
  suggestedUsd: number | null;
  sourceUrl: string | null;
  sourceName: string | null;
  checkedAt: string;
  note?: string;
};

const STOPWORDS = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "new",
  "authentic",
  "official",
  "premium",
  "wholesale",
  "hookah",
  "shisha",
  "disposable",
  "vape",
  "tobacco",
  "pack",
  "box",
  "size",
]);

function readEnv(name: string): string {
  return (process.env[name] ?? "").trim();
}

export function getCostLookupCseConfig(): { apiKey: string; cx: string; sites: string[] } | null {
  const apiKey = readEnv("GOOGLE_CSE_API_KEY");
  const cx = readEnv("GOOGLE_CSE_CX");
  if (!apiKey || !cx) return null;
  const raw = readEnv("COST_LOOKUP_SITES") || "5starhookah.com";
  const sites = raw
    .split(",")
    .map(s => s.trim().toLowerCase().replace(/^www\./, ""))
    .filter(Boolean);
  return { apiKey, cx, sites: sites.length ? sites : ["5starhookah.com"] };
}

/** Strip internal catalog prefix for matching/search. */
export function cleanSkuForLookup(sku: string | null | undefined): string | null {
  if (sku == null || sku === "") return null;
  let s = sku.trim();
  if (s.toLowerCase().startsWith("catalog:")) s = s.slice("catalog:".length).trim();
  return s.length >= 4 ? s : s.length >= 1 ? s : null;
}

export function normalizeProductTitle(name: string, brand: string): string {
  let n = name.replace(/\s+/g, " ").trim();
  const b = brand.trim();
  if (b && new RegExp(`^${escapeRe(b)}\\s*[-–—]\\s*`, "i").test(n)) {
    n = n.replace(new RegExp(`^${escapeRe(b)}\\s*[-–—]\\s*`, "i"), "").trim();
  }
  return n;
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s.g]/g, " ")
    .split(/\s+/)
    .map(t => t.trim())
    .filter(t => t.length > 1 && !STOPWORDS.has(t));
}

/** Significant variant tokens (flavor, size) — longer tokens from title after removing brand. */
function variantTokens(name: string, brand: string): string[] {
  const core = normalizeProductTitle(name, brand);
  const tokens = tokenize(core);
  return tokens.filter(t => t.length >= 3 || /\d/.test(t));
}

function jaccard(a: string[], b: string[]): number {
  const A = new Set(a);
  const B = new Set(b);
  let inter = 0;
  for (const x of A) if (B.has(x)) inter += 1;
  const union = A.size + B.size - inter;
  return union === 0 ? 0 : inter / union;
}

const PRICE_RE = /\$(\d{1,4}(?:\.\d{1,2})?)\b/g;

export function extractUsdPrices(text: string): number[] {
  const out: number[] = [];
  let m: RegExpExecArray | null;
  const re = new RegExp(PRICE_RE.source, "g");
  while ((m = re.exec(text)) !== null) {
    const n = Number(m[1]);
    if (Number.isFinite(n) && n > 0 && n < 50000) out.push(n);
  }
  return out;
}

function pickCandidatePrice(prices: number[], retailUsd: number): number | null {
  if (!prices.length) return null;
  const sorted = [...new Set(prices)].sort((a, b) => a - b);
  const min = sorted[0];
  if (retailUsd > 0 && min > retailUsd * 1.08) return null;
  return min;
}

type CseItem = { title: string; link: string; snippet: string };

async function googleCseSearch(apiKey: string, cx: string, q: string): Promise<CseItem[]> {
  const url = new URL("https://www.googleapis.com/customsearch/v1");
  url.searchParams.set("key", apiKey);
  url.searchParams.set("cx", cx);
  url.searchParams.set("q", q);
  url.searchParams.set("num", "8");

  const res = await fetch(url.toString(), { method: "GET" });
  if (res.status === 429) {
    console.warn("[costLookup] Google CSE rate limited");
    return [];
  }
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    console.warn("[costLookup] Google CSE error", res.status, t.slice(0, 200));
    return [];
  }
  const data = (await res.json()) as {
    items?: Array<{ title?: string; link?: string; snippet?: string }>;
    error?: { message?: string };
  };
  if (data.error?.message) {
    console.warn("[costLookup] CSE API", data.error.message);
    return [];
  }
  const items = data.items ?? [];
  return items
    .filter(i => i.link && i.title)
    .map(i => ({
      title: String(i.title ?? ""),
      link: String(i.link ?? ""),
      snippet: String(i.snippet ?? ""),
    }));
}

function hostName(link: string): string {
  try {
    return new URL(link).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function skuMatch(skuClean: string | null, item: CseItem): boolean {
  if (!skuClean || skuClean.length < 4) return false;
  const h = `${item.link} ${item.title} ${item.snippet}`.toLowerCase();
  return h.includes(skuClean.toLowerCase());
}

function variantCoverage(variants: string[], item: CseItem): number {
  if (variants.length === 0) return 1;
  const h = `${item.title} ${item.snippet}`.toLowerCase();
  let ok = 0;
  for (const v of variants) {
    if (v.length >= 3 && h.includes(v.toLowerCase())) ok += 1;
  }
  return ok / variants.length;
}

function scoreItem(
  product: CostLookupProductInput,
  item: CseItem,
  retailUsd: number,
  skuClean: string | null
): { confidence: CostMatchConfidence; price: number | null } | null {
  const blob = `${item.title} ${item.snippet}`;
  const prices = extractUsdPrices(blob);
  const price = pickCandidatePrice(prices, retailUsd);
  if (price == null) return null;

  const brandTok = tokenize(product.brand);
  const nameTok = tokenize(normalizeProductTitle(product.name, product.brand));
  const titleTok = tokenize(item.title + " " + item.snippet);
  const brandHit =
    brandTok.length === 0 || brandTok.some(t => item.title.toLowerCase().includes(t) || item.snippet.toLowerCase().includes(t));
  if (!brandHit) return null;

  const jac = jaccard(nameTok, titleTok);
  const variants = variantTokens(product.name, product.brand);
  const cov = variantCoverage(variants, item);
  const hasSku = skuMatch(skuClean, item);

  if (hasSku && cov >= 0.66) {
    return { confidence: "exact", price };
  }
  if (hasSku && cov >= 0.33) {
    return { confidence: "likely", price };
  }
  if (jac >= 0.45 && cov >= 0.66) {
    return { confidence: "exact", price };
  }
  if (jac >= 0.38 && cov >= 0.5) {
    return { confidence: "likely", price };
  }
  if (jac >= 0.3 && cov >= 0.33) {
    return { confidence: "review", price };
  }
  if (jac >= 0.25 && price != null) {
    return { confidence: "review", price };
  }
  return null;
}

function buildQueries(product: CostLookupProductInput, site: string, skuClean: string | null): string[] {
  const brand = product.brand.trim();
  const full = `${brand} ${product.name}`.replace(/\s+/g, " ").trim();
  const core = normalizeProductTitle(product.name, brand);
  const q: string[] = [];
  if (skuClean) {
    q.push(`site:${site} "${skuClean}"`);
    q.push(`site:${site} ${skuClean} ${brand}`.trim());
  }
  q.push(`site:${site} ${full}`);
  if (core !== product.name) q.push(`site:${site} ${brand} ${core}`.trim());
  return [...new Set(q)].slice(0, 6);
}

/** Public: run online lookup (no DB). */
export async function lookupProductCostOnline(
  product: CostLookupProductInput,
  retailUsd: number
): Promise<CostLookupResult> {
  const checkedAt = new Date().toISOString();
  const cfg = getCostLookupCseConfig();
  if (!cfg) {
    return {
      confidence: "none",
      costUsd: null,
      suggestedUsd: null,
      sourceUrl: null,
      sourceName: null,
      checkedAt,
      note: "Set GOOGLE_CSE_API_KEY and GOOGLE_CSE_CX (Programmable Search) to enable lookups.",
    };
  }

  const skuClean = cleanSkuForLookup(product.sku);
  let best: {
    confidence: CostMatchConfidence;
    price: number;
    item: CseItem;
  } | null = null;

  const rank = { exact: 4, likely: 3, review: 2, none: 0 };

  for (const site of cfg.sites) {
    const queries = buildQueries(product, site, skuClean);
    for (const query of queries) {
      let items: CseItem[] = [];
      try {
        items = await googleCseSearch(cfg.apiKey, cfg.cx, query);
      } catch (e) {
        console.warn("[costLookup] search failed", query, e);
      }
      for (const item of items) {
        if (!cfg.sites.some(s => hostName(item.link).endsWith(s))) continue;
        const scored = scoreItem(product, item, retailUsd, skuClean);
        if (!scored) continue;
        if (!best || rank[scored.confidence] > rank[best.confidence]) {
          best = { confidence: scored.confidence, price: scored.price, item };
          if (best.confidence === "exact") break;
        }
      }
      if (best?.confidence === "exact") break;
      await sleep(350);
    }
    if (best?.confidence === "exact") break;
  }

  if (!best) {
    return {
      confidence: "none",
      costUsd: null,
      suggestedUsd: null,
      sourceUrl: null,
      sourceName: null,
      checkedAt,
      note: "No confident match on configured sites.",
    };
  }

  const sourceName = hostName(best.item.link);
  return {
    confidence: best.confidence,
    costUsd: best.confidence === "exact" ? best.price : null,
    suggestedUsd: best.confidence !== "exact" ? best.price : null,
    sourceUrl: best.item.link,
    sourceName: sourceName || null,
    checkedAt,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}
