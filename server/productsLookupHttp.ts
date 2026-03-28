import type { Express, Request, Response } from "express";
import { getTrpcUserFromExpressRequest } from "./_core/context";
import { supabaseAdmin } from "./_core/supabaseAdmin";
import { parseBhProductCost } from "./_core/supabaseMappers";
import { lookupProductCost, wholesaleCacheKey } from "../lib/priceLookup";

async function requireAdmin(req: Request, res: Response): Promise<boolean> {
  const user = await getTrpcUserFromExpressRequest(req);
  if (!user || user.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return false;
  }
  return true;
}

/** POST /api/products/lookup-cost — body: { productName, sku, forceRefresh? } */
export async function handleProductLookupCostPost(req: Request, res: Response): Promise<void> {
  if (!(await requireAdmin(req, res))) return;
  try {
    const body = req.body as { productName?: string; sku?: string; forceRefresh?: boolean };
    const productName = String(body.productName ?? "").trim();
    const sku = String(body.sku ?? "").trim();
    if (!productName || !sku) {
      res.status(400).json({ error: "productName and sku are required" });
      return;
    }
    const { data: row, error: fe } = await supabaseAdmin
      .from("bh_products")
      .select("*")
      .eq("sku", sku)
      .maybeSingle();
    if (fe || !row) {
      res.status(404).json({ error: fe?.message ?? "Product not found for sku" });
      return;
    }
    const r = row as Record<string, unknown>;
    const productId = String(r.id ?? "");
    const existing = parseBhProductCost(r.cost);
    if (existing != null && !body.forceRefresh) {
      res.json({
        success: true,
        skipped: true,
        cost: existing,
        source: String(r.cost_source_name ?? ""),
        sourceUrl: (r.cost_source_url as string) ?? undefined,
        cached: false,
      });
      return;
    }
    const cacheSku = wholesaleCacheKey((r.sku as string | null) ?? null, productId);
    const result = await lookupProductCost(
      {
        productName: String(r.name ?? productName),
        sku: (r.sku as string | null) ?? sku,
        productId,
        brand: String(r.brand ?? ""),
        category: String(r.category ?? ""),
        retailUsd: Number(r.price) || 0,
        cacheSku,
      },
      body.forceRefresh === true
    );
    if (result.cost != null) {
      const now = new Date().toISOString();
      await supabaseAdmin
        .from("bh_products")
        .update({
          cost: result.cost,
          cost_source_name: result.source,
          cost_source_url: result.sourceUrl ?? null,
          cost_is_auto_filled: true,
          cost_match_confidence: "exact",
          cost_needs_review: false,
          cost_suggested_usd: null,
          updated_at: now,
        })
        .eq("id", productId);
    }
    res.json({
      success: true,
      cost: result.cost,
      source: result.source,
      sourceUrl: result.sourceUrl,
      cached: result.cached === true,
    });
  } catch (e) {
    console.error("[PriceLookup]", "http_post", e);
    res.status(500).json({ error: e instanceof Error ? e.message : "Internal error" });
  }
}

/** GET /api/products/lookup-cost?skus=a,b,c */
export async function handleProductLookupCostGet(req: Request, res: Response): Promise<void> {
  if (!(await requireAdmin(req, res))) return;
  try {
    const raw = String(req.query.skus ?? "").trim();
    if (!raw) {
      res.status(400).json({ error: "skus query param required" });
      return;
    }
    const skuList = raw
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);
    const results: Array<Record<string, unknown>> = [];
    for (const sku of skuList) {
      const { data: row, error: fe } = await supabaseAdmin.from("bh_products").select("*").eq("sku", sku).maybeSingle();
      if (fe || !row) {
        results.push({ sku, success: false, error: "not found" });
        await delay(500);
        continue;
      }
      const r = row as Record<string, unknown>;
      const productId = String(r.id ?? "");
      const cacheSku = wholesaleCacheKey((r.sku as string | null) ?? null, productId);
      const result = await lookupProductCost({
        productName: String(r.name ?? ""),
        sku: (r.sku as string | null) ?? sku,
        productId,
        brand: String(r.brand ?? ""),
        category: String(r.category ?? ""),
        retailUsd: Number(r.price) || 0,
        cacheSku,
      });
      if (result.cost != null) {
        const now = new Date().toISOString();
        await supabaseAdmin
          .from("bh_products")
          .update({
            cost: result.cost,
            cost_source_name: result.source,
            cost_source_url: result.sourceUrl ?? null,
            cost_is_auto_filled: true,
            cost_match_confidence: "exact",
            cost_needs_review: false,
            cost_suggested_usd: null,
            updated_at: now,
          })
          .eq("id", productId);
      }
      results.push({
        sku,
        success: true,
        cost: result.cost,
        source: result.source,
        sourceUrl: result.sourceUrl,
        cached: result.cached === true,
      });
      await delay(500);
    }
    res.json({ results });
  } catch (e) {
    console.error("[PriceLookup]", "http_get", e);
    res.status(500).json({ error: e instanceof Error ? e.message : "Internal error" });
  }
}

function delay(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

export function registerProductsLookupRoutes(app: Express): void {
  app.post("/api/products/lookup-cost", (req, res) => void handleProductLookupCostPost(req, res));
  app.get("/api/products/lookup-cost", (req, res) => void handleProductLookupCostGet(req, res));
}
