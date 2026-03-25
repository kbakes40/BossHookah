-- Stable SKU for catalog sync from site (server uses sku like catalog:%)
CREATE UNIQUE INDEX IF NOT EXISTS bh_products_sku_unique ON public.bh_products (sku)
WHERE sku IS NOT NULL;
