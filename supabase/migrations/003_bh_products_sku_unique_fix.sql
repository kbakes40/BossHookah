-- Fix catalog import: partial unique index breaks or complicates PostgREST upsert(onConflict: sku).
-- Run this if merge/import still errors with "no unique or exclusion constraint matching the ON CONFLICT specification".
DROP INDEX IF EXISTS bh_products_sku_unique;

CREATE UNIQUE INDEX IF NOT EXISTS bh_products_sku_unique ON public.bh_products (sku);
