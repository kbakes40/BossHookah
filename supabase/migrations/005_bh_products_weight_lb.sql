-- Optional per-product shipping weight (lb). Nullable = use catalog default in app.
ALTER TABLE public.bh_products
  ADD COLUMN IF NOT EXISTS weight_lb numeric;
