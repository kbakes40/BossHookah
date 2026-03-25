-- Unit cost (USD) for margin / profitability reporting; null until set in admin
ALTER TABLE public.bh_products ADD COLUMN IF NOT EXISTS cost numeric;

COMMENT ON COLUMN public.bh_products.cost IS 'Wholesale or landed unit cost in USD; used for profit reporting';
