-- Wholesale / multi-source cost cache (7-day freshness checked in app)
CREATE TABLE IF NOT EXISTS public.product_cost_cache (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  sku text UNIQUE NOT NULL,
  cost numeric(10, 2),
  source text,
  source_url text,
  fetched_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cost_cache_sku ON public.product_cost_cache (sku);
CREATE INDEX IF NOT EXISTS idx_cost_cache_fetched ON public.product_cost_cache (fetched_at);
