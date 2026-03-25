/**
 * One-time / repeatable import: storefront Product[] → Supabase `bh_products`.
 *
 * Source of truth in repo: `client/src/lib/products.ts` (+ charcoal/vape/wholesale modules).
 * Mapping matches `server/siteCatalogSync.ts` (used by Admin "Sync site catalog").
 *
 * Usage:
 *   pnpm exec tsx scripts/bh-catalog-import.ts --dry-run
 *   pnpm exec tsx scripts/bh-catalog-import.ts --export-json ./bh-catalog-rows.json
 *   pnpm exec tsx bh-catalog-import.ts --export-csv ./bh-catalog-rows.csv
 *   pnpm exec tsx scripts/bh-catalog-import.ts --input ./export.json --dry-run
 *   pnpm exec tsx scripts/bh-catalog-import.ts --apply --replace   # needs service role env
 *   pnpm exec tsx scripts/bh-catalog-import.ts --apply --merge
 *
 * Env (for --apply): `VITE_SUPABASE_URL` (or default from shared const) + `SUPABASE_SERVICE_ROLE_KEY`.
 * Optional: `VITE_SITE_ORIGIN` or `PUBLIC_SITE_URL` for relative `/images/…` URLs.
 *
 * Loads `.env` then `.env.local` from the repo root when present.
 *
 * External / live data: there is no Manus product API in this repo. If the catalog only exists
 * on a deployed site, export a JSON array of `Product` objects (same fields as `client/src/lib/products.ts`)
 * and pass `--input`. Alternatively, fetch the built `products` module or copy from your CMS export.
 */

import { config } from "dotenv";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Product } from "../client/src/lib/products";
import { siteProductsToBhRows, type BhProductInsert } from "../server/siteCatalogSync";
import { DEFAULT_SUPABASE_URL } from "../shared/const";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

config({ path: path.join(ROOT, ".env") });
config({ path: path.join(ROOT, ".env.local") });

const INSERT_CHUNK = 120;
const DELETE_CHUNK = 100;

function isProductArray(raw: unknown): raw is Product[] {
  return Array.isArray(raw) && raw.every(p => p && typeof p === "object" && "id" in p && "name" in p);
}

function csvEscape(s: string): string {
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function rowsToCsv(rows: BhProductInsert[]): string {
  const headers: (keyof BhProductInsert)[] = [
    "name",
    "brand",
    "category",
    "price",
    "sale_price",
    "stock",
    "low_stock_threshold",
    "sku",
    "badge",
    "in_stock",
    "image_url",
    "description",
    "featured",
    "trending",
    "weight_lb",
    "created_at",
    "updated_at",
  ];
  const lines = [
    headers.join(","),
    ...rows.map(r =>
      headers
        .map(h => {
          const v = r[h];
          if (v === null || v === undefined) return "";
          return csvEscape(String(v));
        })
        .join(",")
    ),
  ];
  return lines.join("\n");
}

async function deleteCatalogSkus(supabase: SupabaseClient): Promise<void> {
  const { data: rows, error: selErr } = await supabase.from("bh_products").select("id").like("sku", "catalog:%");
  if (selErr) throw new Error(selErr.message);
  const ids = (rows ?? []).map(r => String((r as { id: string }).id));
  for (let i = 0; i < ids.length; i += DELETE_CHUNK) {
    const slice = ids.slice(i, i + DELETE_CHUNK);
    const { error: delErr } = await supabase.from("bh_products").delete().in("id", slice);
    if (delErr) throw new Error(delErr.message);
  }
}

async function main(): Promise<void> {
  const {
    values: {
      "dry-run": dryRun,
      apply,
      replace,
      merge,
      input,
      "export-json": exportJson,
      "export-csv": exportCsv,
      "default-stock": defaultStockStr,
      origin,
    },
  } = parseArgs({
    options: {
      "dry-run": { type: "boolean", default: false },
      apply: { type: "boolean", default: false },
      replace: { type: "boolean", default: false },
      merge: { type: "boolean", default: false },
      input: { type: "string" },
      "export-json": { type: "string" },
      "export-csv": { type: "string" },
      "default-stock": { type: "string" },
      origin: { type: "string" },
    },
    allowPositionals: false,
  });

  const defaultStock = defaultStockStr != null ? Number(defaultStockStr) : undefined;
  if (defaultStockStr != null && (!Number.isInteger(defaultStock) || defaultStock! < 0)) {
    console.error("--default-stock must be a non-negative integer");
    process.exit(1);
  }

  let catalog: Product[] | undefined;
  if (input) {
    const abs = path.isAbsolute(input) ? input : path.join(ROOT, input);
    const raw = JSON.parse(readFileSync(abs, "utf8")) as unknown;
    const arr = Array.isArray(raw) ? raw : (raw as { products?: unknown }).products;
    if (!isProductArray(arr)) {
      console.error("--input must be a JSON file containing Product[] or { products: Product[] }");
      process.exit(1);
    }
    catalog = arr;
  }

  const rows = siteProductsToBhRows(catalog, {
    defaultStock: defaultStock ?? 50,
    origin: origin?.replace(/\/$/, ""),
  });

  console.log(`Rows to insert (flattened SKUs): ${rows.length}`);
  if (rows[0]) console.log("Sample row:", JSON.stringify(rows[0], null, 2));

  if (exportJson) {
    const out = path.isAbsolute(exportJson) ? exportJson : path.join(ROOT, exportJson);
    mkdirSync(path.dirname(out), { recursive: true });
    writeFileSync(out, JSON.stringify(rows, null, 2), "utf8");
    console.log(`Wrote ${rows.length} rows → ${out}`);
  }

  if (exportCsv) {
    const out = path.isAbsolute(exportCsv) ? exportCsv : path.join(ROOT, exportCsv);
    mkdirSync(path.dirname(out), { recursive: true });
    writeFileSync(out, rowsToCsv(rows), "utf8");
    console.log(`Wrote CSV ${rows.length} rows → ${out}`);
  }

  if (!apply) {
    if (!dryRun && !exportJson && !exportCsv) {
      console.log("No action (use --dry-run explicitly, or --export-json/--export-csv, or --apply).");
    }
    return;
  }

  if (replace === merge) {
    console.error("For --apply, specify exactly one of --replace or --merge");
    process.exit(1);
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL?.trim() || DEFAULT_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!supabaseUrl || !key) {
    console.error("Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for --apply");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  if (replace) {
    console.log("Deleting existing rows with sku LIKE catalog:% …");
    await deleteCatalogSkus(supabase);
  }

  for (let i = 0; i < rows.length; i += INSERT_CHUNK) {
    const batch = rows.slice(i, i + INSERT_CHUNK);
    if (replace) {
      const { error } = await supabase.from("bh_products").insert(batch);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase.from("bh_products").upsert(batch, {
        onConflict: "sku",
        ignoreDuplicates: true,
      });
      if (error) throw new Error(error.message);
    }
    console.log(`Inserted batch ${i / INSERT_CHUNK + 1} (${batch.length} rows)`);
  }

  console.log(`Done: ${replace ? "replace" : "merge"} ${rows.length} catalog SKUs.`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
