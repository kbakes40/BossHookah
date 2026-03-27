/**
 * Admin inventory cost lookup: Google Programmable Search when configured,
 * plus direct search on approved hosts (Shopify suggest.json) as fallback.
 * Env: optional GOOGLE_CSE_API_KEY + GOOGLE_CSE_CX; COST_LOOKUP_SITES (comma hosts, default 5starhookah.com).
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

/** Approved retail hosts for direct lookup (always non-empty default). */
export function getCostLookupApprovedSites(): string[] {
  const raw = readEnv("COST_LOOKUP_SITES") || "5starhookah.com";
  const sites = raw
    .split(",")
    .map(s => s.trim().toLowerCase().replace(/^www\./, ""))
    .filter(Boolean);
  return sites.length ? sites : ["5starhookah.com"];
}

export function getCostLookupCseConfig(): { apiKey: string; cx: string; sites: string[] } | null {
  const apiKey = readEnv("GOOGLE_CSE_API_KEY");
  const cx = readEnv("GOOGLE_CSE_CX");
  if (!apiKey || !cx) return null;
  const sites = getCostLookupApprovedSites();
  return { apiKey, cx, sites };
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

/** Alias for direct-site matching (same normalization as title scoring). */
export function normalizeProductTitleForMatching(name: string, brand: string): string {
  return normalizeProductTitle(name, brand);
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
  const aUniq = Array.from(A);
  for (let i = 0; i < aUniq.length; i += 1) {
    if (B.has(aUniq[i])) inter += 1;
  }
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

/** Strip tags and collect $ prices and common JSON price fields from HTML. */
export function extractPriceFromHtml(html: string): number[] {
  const fromRaw = extractUsdPrices(html);
  const plain = stripHtmlToText(html);
  const fromPlain = extractUsdPrices(plain);
  const jsonPrices: number[] = [];
  const reJson = /"price(?:_min)?"\s*:\s*"(\d+\.?\d*)"/g;
  let mj: RegExpExecArray | null;
  while ((mj = reJson.exec(html)) !== null) {
    const n = Number(mj[1]);
    if (Number.isFinite(n) && n > 0 && n < 50000) jsonPrices.push(n);
  }
  const merged = fromRaw.concat(fromPlain).concat(jsonPrices);
  return Array.from(new Set(merged)).sort((a, b) => a - b);
}

function stripHtmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function pickCandidatePrice(prices: number[], retailUsd: number): number | null {
  if (!prices.length) return null;
  const sorted = Array.from(new Set(prices)).sort((a, b) => a - b);
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

type ShopifySuggestProduct = {
  title?: string;
  url?: string;
  body?: string;
  price?: string;
  price_min?: string;
  vendor?: string;
  handle?: string;
  tags?: string[];
};

function shopifySuggestProductsToItems(host: string, products: ShopifySuggestProduct[]): CseItem[] {
  const h = host.replace(/^www\./, "");
  const base = `https://${h}`;
  return products
    .map(p => {
      const path = p.url || "";
      const link = path.startsWith("http") ? path : new URL(path, base).href;
      const priceStr = (p.price_min ?? p.price ?? "").trim();
      const bodyPlain = p.body ? stripHtmlToText(p.body) : "";
      const tagStr = (p.tags ?? []).join(" ");
      const snippet = [
        p.vendor,
        priceStr ? `$${priceStr}` : "",
        bodyPlain.slice(0, 400),
        tagStr,
        p.handle,
      ]
        .filter(Boolean)
        .join(" ");
      return { title: String(p.title ?? ""), link, snippet };
    })
    .filter(i => i.title && i.link);
}

/** Parse Shopify `/search/suggest.json` body into generic CSE-shaped items. */
export function parseApprovedSiteResults(jsonText: string, host: string): CseItem[] {
  let data: { resources?: { results?: { products?: ShopifySuggestProduct[] } } };
  try {
    data = JSON.parse(jsonText) as typeof data;
  } catch {
    return [];
  }
  const products = data?.resources?.results?.products ?? [];
  return shopifySuggestProductsToItems(host, products);
}

/** Direct Shopify Ajax suggest (no Google). */
export async function searchApprovedSiteDirectly(
  host: string,
  product: CostLookupProductInput,
  skuClean: string | null
): Promise<CseItem[]> {
  const h = host.replace(/^www\./, "");
  const queries = buildDirectSearchQueries(product, skuClean);
  const seen = new Set<string>();
  const out: CseItem[] = [];

  for (const q of queries) {
    const url = new URL(`https://${h}/search/suggest.json`);
    url.searchParams.set("q", q);
    url.searchParams.set("resources[type]", "product");
    url.searchParams.set("resources[limit]", "10");

    let text: string;
    try {
      const res = await fetch(url.toString(), {
        method: "GET",
        headers: {
          Accept: "application/json",
          "User-Agent": "BossHookah-InventoryCostLookup/1.0",
        },
      });
      if (!res.ok) continue;
      text = await res.text();
    } catch {
      continue;
    }

    const items = parseApprovedSiteResults(text, h);
    for (const it of items) {
      if (seen.has(it.link)) continue;
      seen.add(it.link);
      out.push(it);
    }
    if (out.length >= 14) break;
    await sleep(200);
  }

  return out;
}

function buildDirectSearchQueries(product: CostLookupProductInput, skuClean: string | null): string[] {
  const brand = product.brand.trim();
  const core = normalizeProductTitle(product.name, brand);
  const full = `${brand} ${core}`.replace(/\s+/g, " ").trim();
  const q: string[] = [];
  if (skuClean) q.push(skuClean);
  if (full) q.push(full);
  if (core && core !== full) q.push(core);
  const rawName = product.name.replace(/\s+/g, " ").trim();
  if (rawName && rawName !== full && rawName !== core) q.push(rawName);
  return Array.from(new Set(q)).slice(0, 6);
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
    brandTok.length === 0 ||
    brandTok.some(t => item.title.toLowerCase().includes(t) || item.snippet.toLowerCase().includes(t));
  if (!brandHit) return null;

  const titleOnlyTok = tokenize(item.title);
  const snippetLiteTok = tokenize(item.title + " " + item.snippet.slice(0, 320));
  const jac = Math.max(jaccard(nameTok, titleOnlyTok), jaccard(nameTok, snippetLiteTok));
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
  return Array.from(new Set(q)).slice(0, 6);
}

/** Public: run online lookup (no DB). Google first when configured; then direct approved sites. */
export async function lookupProductCostOnline(
  product: CostLookupProductInput,
  retailUsd: number
): Promise<CostLookupResult> {
  const checkedAt = new Date().toISOString();
  const sites = getCostLookupApprovedSites();
  if (!sites.length) {
    return {
      confidence: "none",
      costUsd: null,
      suggestedUsd: null,
      sourceUrl: null,
      sourceName: null,
      checkedAt,
      note: "No approved lookup sites (set COST_LOOKUP_SITES).",
    };
  }

  const skuClean = cleanSkuForLookup(product.sku);
  let best: {
    confidence: CostMatchConfidence;
    price: number;
    item: CseItem;
  } | null = null;

  const rank = { exact: 4, likely: 3, review: 2, none: 0 };
  let provider: "google" | "direct-site" | "none" = "none";

  const cse = getCostLookupCseConfig();
  if (cse) {
    for (const site of sites) {
      const queries = buildQueries(product, site, skuClean);
      for (const query of queries) {
        let items: CseItem[] = [];
        try {
          items = await googleCseSearch(cse.apiKey, cse.cx, query);
        } catch (e) {
          console.warn("[costLookup] search failed", query, e);
        }
        for (const item of items) {
          if (!sites.some(s => hostName(item.link).endsWith(s))) continue;
          const scored = scoreItem(product, item, retailUsd, skuClean);
          if (!scored || scored.price == null) continue;
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
    if (best) provider = "google";
  }

  if (!best) {
    for (const site of sites) {
      try {
        const items = await searchApprovedSiteDirectly(site, product, skuClean);
        for (const item of items) {
          if (!sites.some(s => hostName(item.link).endsWith(s))) continue;
          const scored = scoreItem(product, item, retailUsd, skuClean);
          if (!scored || scored.price == null) continue;
          if (!best || rank[scored.confidence] > rank[best.confidence]) {
            best = { confidence: scored.confidence, price: scored.price, item };
            if (best.confidence === "exact") break;
          }
        }
      } catch (e) {
        console.warn("[costLookup] direct-site failed", site, e);
      }
      if (best?.confidence === "exact") break;
      await sleep(200);
    }
    if (best) provider = "direct-site";
  }

  console.info(`[costLookup] provider=${provider}`);

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
  return new Promise(r => setTimeout(r));
}
