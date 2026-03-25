/**
 * Maps Supabase `bh_products` rows → storefront `Product` shape (incl. catalog SKU grouping).
 */
import type { Product, ProductVariant } from "../client/src/lib/products";
import { supabaseAdmin } from "./_core/supabaseAdmin";

export type BhProductRow = Record<string, unknown>;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(id: string): boolean {
  return UUID_RE.test(id.trim());
}

function pushCatalogRow(map: Map<string, BhProductRow[]>, key: string, row: BhProductRow) {
  if (!map.has(key)) map.set(key, []);
  map.get(key)!.push(row);
}

/** Parse `catalog:parent` / `catalog:parent:variant` / other SKUs. */
function catalogKeyFromSku(sku: string): string | null {
  const m = /^catalog:([^:]+)(?::(.+))?$/.exec(sku.trim());
  return m ? m[1] : null;
}

function weightLbFromRows(rows: BhProductRow[]): number | undefined {
  for (const r of rows) {
    const w = r.weight_lb;
    if (w != null && Number(w) > 0) return Number(w);
  }
  return undefined;
}

function extractVariantLabel(fullName: string): string {
  const idx = fullName.indexOf(" — ");
  if (idx === -1) return fullName.trim();
  return fullName.slice(idx + 3).trim();
}

function baseTitleFromName(fullName: string): string {
  const idx = fullName.indexOf(" — ");
  if (idx === -1) return fullName.trim();
  return fullName.slice(0, idx).trim();
}

/** Storefront-only fixes for catalog keys; keep in sync with migrations when possible. */
function applyCatalogStorefrontOverride(product: Product, catalogKey: string): Product {
  if (catalogKey !== "6") return product;
  return {
    ...product,
    price: 0.01,
    salePrice: undefined,
    badge: undefined,
  };
}

function mergeCatalogGroup(key: string, rows: BhProductRow[]): Product {
  const variantRows = rows.filter(r => /^catalog:[^:]+:.+/.test(String(r.sku ?? "")));
  const baseRows = rows.filter(r => String(r.sku ?? "") === `catalog:${key}`);
  const base = baseRows[0];
  const first = rows[0];
  const name = base
    ? String(base.name ?? "")
    : baseTitleFromName(String(variantRows[0]?.name ?? first?.name ?? ""));

  const variants: ProductVariant[] = variantRows.map(r => {
    const sku = String(r.sku ?? "");
    const m = /^catalog:[^:]+:(.+)$/.exec(sku);
    const vid = m ? m[1] : "";
    return {
      id: vid,
      name: extractVariantLabel(String(r.name ?? "")),
      description: r.description ? String(r.description) : undefined,
      image: r.image_url ? String(r.image_url) : undefined,
    };
  });

  variants.sort((a, b) => a.name.localeCompare(b.name));

  const src = base || variantRows[0] || first;
  const descRow = [base, ...variantRows].find(r => r?.description);
  const wLb = weightLbFromRows(rows);

  return applyCatalogStorefrontOverride(
    {
      id: key,
      name,
      brand: String(src.brand ?? ""),
      price: Number(src.price) || 0,
      salePrice: src.sale_price != null ? Number(src.sale_price) : undefined,
      category: String(src.category ?? ""),
      image: String(
        (base?.image_url ?? variantRows[0]?.image_url ?? src.image_url ?? "") || ""
      ),
      badge: src.badge ? String(src.badge) : undefined,
      inStock: rows.some(r => r.in_stock !== false),
      featured: rows.some(r => r.featured === true),
      trending: rows.some(r => r.trending === true),
      description: descRow?.description ? String(descRow.description) : undefined,
      variants: variants.length > 0 ? variants : undefined,
      ...(wLb != null ? { weightLb: wLb } : {}),
    },
    key
  );
}

export function mapNonCatalogRow(row: BhProductRow): Product {
  const w =
    row.weight_lb != null && Number(row.weight_lb) > 0 ? Number(row.weight_lb) : undefined;
  return {
    id: String(row.id ?? ""),
    name: String(row.name ?? ""),
    brand: String(row.brand ?? ""),
    price: Number(row.price) || 0,
    salePrice: row.sale_price != null ? Number(row.sale_price) : undefined,
    category: String(row.category ?? ""),
    image: String(row.image_url ?? ""),
    badge: row.badge ? String(row.badge) : undefined,
    inStock: row.in_stock !== false,
    featured: Boolean(row.featured),
    trending: Boolean(row.trending),
    description: row.description ? String(row.description) : undefined,
    ...(w != null ? { weightLb: w } : {}),
  };
}

export function groupBhProductRowsToStorefrontProducts(rows: BhProductRow[]): Product[] {
  const catalogGroups = new Map<string, BhProductRow[]>();
  const nonCatalog: BhProductRow[] = [];

  for (const row of rows) {
    const sku = String(row.sku ?? "").trim();
    const key = catalogKeyFromSku(sku);
    if (key) {
      pushCatalogRow(catalogGroups, key, row);
    } else {
      nonCatalog.push(row);
    }
  }

  const catalogProducts = Array.from(catalogGroups.entries()).map(([k, rs]) =>
    mergeCatalogGroup(k, rs)
  );
  const singles = nonCatalog.map(mapNonCatalogRow);
  return [...catalogProducts, ...singles].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
  );
}

export async function fetchAllBhProductRows(): Promise<BhProductRow[]> {
  const { data, error } = await supabaseAdmin
    .from("bh_products")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as BhProductRow[];
}

async function loadCatalogGroupByKey(key: string): Promise<Product | null> {
  const prefix = `catalog:${key}`;
  const { data: rowsLike, error: e1 } = await supabaseAdmin
    .from("bh_products")
    .select("*")
    .ilike("sku", `${prefix}:%`);

  const { data: baseRow, error: e2 } = await supabaseAdmin
    .from("bh_products")
    .select("*")
    .eq("sku", prefix)
    .maybeSingle();

  if (e1) throw new Error(e1.message);
  if (e2) throw new Error(e2.message);

  const byId = new Map<string, BhProductRow>();
  for (const r of rowsLike ?? []) {
    byId.set(String((r as BhProductRow).id), r as BhProductRow);
  }
  if (baseRow) {
    const br = baseRow as BhProductRow;
    byId.set(String(br.id), br);
  }

  const merged = Array.from(byId.values());
  if (merged.length === 0) return null;
  return mergeCatalogGroup(key, merged);
}

export async function getStorefrontProductById(id: string): Promise<Product | null> {
  const trimmed = id.trim();
  if (!trimmed) return null;

  if (isUuid(trimmed)) {
    const { data: row, error } = await supabaseAdmin
      .from("bh_products")
      .select("*")
      .eq("id", trimmed)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!row) return null;

    const r = row as BhProductRow;
    const sku = String(r.sku ?? "").trim();
    const key = catalogKeyFromSku(sku);
    if (key) {
      return loadCatalogGroupByKey(key);
    }
    return mapNonCatalogRow(r);
  }

  return loadCatalogGroupByKey(trimmed);
}
