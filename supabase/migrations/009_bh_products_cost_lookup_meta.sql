-- Optional metadata for admin cost lookup (Google CSE / review workflow)
ALTER TABLE public.bh_products ADD COLUMN IF NOT EXISTS cost_source_url text;
ALTER TABLE public.bh_products ADD COLUMN IF NOT EXISTS cost_source_name text;
ALTER TABLE public.bh_products ADD COLUMN IF NOT EXISTS cost_match_confidence text;
ALTER TABLE public.bh_products ADD COLUMN IF NOT EXISTS cost_last_checked_at timestamptz;
ALTER TABLE public.bh_products ADD COLUMN IF NOT EXISTS cost_is_auto_filled boolean NOT NULL DEFAULT false;
ALTER TABLE public.bh_products ADD COLUMN IF NOT EXISTS cost_needs_review boolean NOT NULL DEFAULT false;
ALTER TABLE public.bh_products ADD COLUMN IF NOT EXISTS cost_suggested_usd numeric;

COMMENT ON COLUMN public.bh_products.cost_source_url IS 'Product page URL from last cost lookup';
COMMENT ON COLUMN public.bh_products.cost_source_name IS 'Hostname or label for cost_source_url';
COMMENT ON COLUMN public.bh_products.cost_match_confidence IS 'exact | likely | review | none';
COMMENT ON COLUMN public.bh_products.cost_suggested_usd IS 'Proposed cost when confidence is likely/review (not applied until admin confirms)';
