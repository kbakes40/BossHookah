-- Stable SKU for catalog sync from site (server uses sku like catalog:%)
-- Full index (not partial) so PostgREST upsert(..., { onConflict: "sku" }) works reliably.
CREATE UNIQUE INDEX IF NOT EXISTS bh_products_sku_unique ON public.bh_products (sku);
