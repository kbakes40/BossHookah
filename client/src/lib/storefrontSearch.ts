/**
 * Storefront product search: multi-field haystack, typo-tolerant token scoring, ranked results.
 * Runs client-side on the cached catalog from useStorefrontCatalog (no per-keypress network).
 */
import { categories } from "./products";
import type { Product } from "./products";

export const SEARCH_DEBOUNCE_MS = 260;
export const SEARCH_PRODUCTS_PREVIEW = 8;
export const SEARCH_BRANDS_PREVIEW = 6;
export const SEARCH_CATEGORIES_PREVIEW = 5;
export const RECENT_SEARCHES_KEY = "bosshookah_recent_searches_v1";
export const RECENT_SEARCHES_MAX = 8;

/** Quick nav — matches site routes in Header */
export const QUICK_CATEGORY_CHIPS: Array<{ label: string; href: string; categoryId: string }> = [
  { label: "Vapes", href: "/vapes", categoryId: "vapes" },
  { label: "Hookah", href: "/hookahs", categoryId: "hookahs" },
  { label: "Shisha", href: "/shisha", categoryId: "shisha" },
  { label: "Charcoal", href: "/charcoal", categoryId: "charcoal" },
  { label: "Accessories", href: "/accessories", categoryId: "accessories" },
];

/** Shown in empty state — tap runs search */
export const TRENDING_SEARCH_TERMS = [
  "breeze pro",
  "al fakher",
  "coco nara",
  "starbuzz",
  "disposable vape",
  "natural charcoal",
];

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  if (!m) return n;
  if (!n) return m;
  const dp = new Uint32Array(n + 1);
  for (let j = 0; j <= n; j++) dp[j] = j;
  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + cost);
      prev = tmp;
    }
  }
  return dp[n]!;
}

function tokenizeHaystack(hay: string): string[] {
  return hay
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(w => w.length > 0);
}

/** All searchable text for a product (name, brand, category, SKU dump, variants = flavors). */
export function buildProductHaystack(p: Product): string {
  const variantBits =
    p.variants?.map(v => `${v.name} ${v.description ?? ""}`.trim()).join(" \n ") ?? "";
  const specBits = p.specs?.join(" ") ?? "";
  return [
    p.name,
    p.brand,
    p.category,
    p.description ?? "",
    p.badge ?? "",
    p.searchText ?? "",
    specBits,
    variantBits,
  ]
    .join(" \n ")
    .toLowerCase();
}

/** Score one query token against haystack words (substring + fuzzy word match). */
function scoreTokenAgainstHaystack(qt: string, hayWords: string[], fullHay: string): number {
  let best = 0;
  if (fullHay.includes(qt)) best = Math.max(best, 320);
  for (const w of hayWords) {
    if (w === qt) {
      best = Math.max(best, 300);
      continue;
    }
    if (w.startsWith(qt) || qt.startsWith(w)) {
      best = Math.max(best, 220);
      continue;
    }
    if (w.includes(qt) || qt.includes(w)) {
      best = Math.max(best, 180);
      continue;
    }
    if (qt.length >= 3 && w.length >= 3) {
      const d = levenshtein(qt, w);
      const maxL = Math.max(qt.length, w.length);
      if (maxL <= 4 && d <= 1) best = Math.max(best, 140 - d * 25);
      else if (maxL >= 5 && d <= 2) best = Math.max(best, 110 - d * 28);
    }
  }
  return best;
}

/**
 * Higher = better match. Returns 0 if no usable match.
 * Fuzzy matching: Levenshtein on tokens; multi-field via buildProductHaystack.
 */
export function scoreProductForQuery(query: string, p: Product): number {
  const raw = query.trim().toLowerCase();
  if (!raw) return 0;
  const hay = buildProductHaystack(p);
  const hayWords = tokenizeHaystack(hay);
  const fullHay = hay;

  let score = 0;
  if (fullHay.includes(raw)) score += 450;

  const qTokens = raw.split(/\s+/).filter(t => t.length > 0);
  if (qTokens.length === 0) return score;

  let tokenSum = 0;
  for (const qt of qTokens) {
    tokenSum += scoreTokenAgainstHaystack(qt, hayWords, fullHay);
  }

  score += tokenSum;

  if (p.featured) score += 12;
  if (p.trending) score += 8;
  if (p.inStock) score += 4;

  const minTok = qTokens.length ? Math.min(...qTokens.map(t => scoreTokenAgainstHaystack(t, hayWords, fullHay))) : 0;
  if (qTokens.length > 1 && minTok < 45) score *= 0.45;
  else if (minTok === 0 && !fullHay.includes(raw)) return 0;

  return Math.round(score);
}

export type RankedProduct = { product: Product; score: number };

export function rankProductsByQuery(products: Product[], query: string, limit: number): RankedProduct[] {
  const q = query.trim();
  if (!q) return [];
  const scored: RankedProduct[] = [];
  for (const p of products) {
    const s = scoreProductForQuery(q, p);
    if (s > 0) scored.push({ product: p, score: s });
  }
  scored.sort((a, b) => b.score - a.score || a.product.name.localeCompare(b.product.name));
  return scored.slice(0, limit);
}

/** Full result list for /search page (no small preview cap on sort — caller passes limit). */
export function searchProductsAllRanked(products: Product[], query: string): RankedProduct[] {
  const q = query.trim();
  if (!q) return [];
  const scored: RankedProduct[] = [];
  for (const p of products) {
    const s = scoreProductForQuery(q, p);
    if (s > 0) scored.push({ product: p, score: s });
  }
  scored.sort((a, b) => b.score - a.score || a.product.name.localeCompare(b.product.name));
  return scored;
}

export function categoryLabel(categoryId: string): string {
  const c = categories.find(x => x.id === categoryId);
  return c?.name ?? categoryId;
}

export function categoryPath(categoryId: string): string {
  const known = QUICK_CATEGORY_CHIPS.find(c => c.categoryId === categoryId);
  if (known) return known.href;
  if (categoryId === "bowls") return "/bowls";
  return `/collections/${encodeURIComponent(categoryId)}`;
}

/** Brands whose name matches query (for suggestions list). */
export function matchingBrands(products: Product[], query: string, limit: number): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const brands = Array.from(
    new Set(products.map(p => p.brand).filter((b): b is string => Boolean(b && b.trim())))
  );
  const ranked = brands
    .map(b => {
      const bl = b.toLowerCase();
      let s = 0;
      if (bl.includes(q)) s += 200;
      else {
        const bw = tokenizeHaystack(bl);
        for (const w of bw) {
          s = Math.max(s, scoreTokenAgainstHaystack(q, [w], bl));
        }
      }
      return { b, s };
    })
    .filter(x => x.s >= 80)
    .sort((a, b) => b.s - a.s || a.b.localeCompare(b.b));
  return ranked.slice(0, limit).map(x => x.b);
}

/** Categories that match query (nav link). */
export function matchingCategories(query: string, limit: number): Array<{ id: string; name: string; href: string }> {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const out: Array<{ id: string; name: string; href: string; score: number }> = [];
  for (const c of categories) {
    const id = c.id.toLowerCase();
    const name = c.name.toLowerCase();
    let s = 0;
    if (name.includes(q) || id.includes(q)) s += 250;
    else {
      for (const w of tokenizeHaystack(`${c.name} ${c.id}`)) {
        s = Math.max(s, scoreTokenAgainstHaystack(q, [w], `${id} ${name}`));
      }
    }
    if (s >= 80) {
      out.push({ id: c.id, name: c.name, href: categoryPath(c.id), score: s });
    }
  }
  out.sort((a, b) => b.score - a.score);
  return out.slice(0, limit).map(({ id, name, href }) => ({ id, name, href }));
}

export function popularProducts(products: Product[], limit: number): Product[] {
  const copy = [...products];
  copy.sort((a, b) => {
    const af = Boolean(a.featured);
    const bf = Boolean(b.featured);
    if (af !== bf) return af ? -1 : 1;
    const at = Boolean(a.trending);
    const bt = Boolean(b.trending);
    if (at !== bt) return at ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  return copy.slice(0, limit);
}

export function readRecentSearches(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return [];
    return arr.filter((x): x is string => typeof x === "string").slice(0, RECENT_SEARCHES_MAX);
  } catch {
    return [];
  }
}

export function rememberSearch(query: string): void {
  const q = query.trim();
  if (q.length < 2) return;
  try {
    const prev = readRecentSearches().filter(x => x.toLowerCase() !== q.toLowerCase());
    const next = [q, ...prev].slice(0, RECENT_SEARCHES_MAX);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
  } catch {
    /* ignore quota */
  }
}

/** Highlight matching query tokens in text (for titles). */
export function highlightParts(text: string, query: string): Array<{ text: string; hit: boolean }> {
  const tokens = query
    .trim()
    .split(/\s+/)
    .map(t => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .filter(t => t.length >= 2);
  if (tokens.length === 0) return [{ text, hit: false }];
  const re = new RegExp(`(${tokens.join("|")})`, "gi");
  const parts: Array<{ text: string; hit: boolean }> = [];
  let last = 0;
  let m: RegExpExecArray | null;
  const r = new RegExp(re.source, re.flags);
  while ((m = r.exec(text)) !== null) {
    if (m.index > last) parts.push({ text: text.slice(last, m.index), hit: false });
    parts.push({ text: m[0], hit: true });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last), hit: false });
  if (parts.length === 0) return [{ text, hit: false }];
  return parts;
}
