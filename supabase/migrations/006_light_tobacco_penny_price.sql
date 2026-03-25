-- Light Tobacco 100g (catalog id 6): penny price, clear sale
UPDATE public.bh_products
SET
  price = 0.01,
  sale_price = NULL,
  badge = NULL,
  updated_at = now()
WHERE sku = 'catalog:6'
   OR (name = 'Light Tobacco 100g' AND COALESCE(brand, '') = 'Smooth');
