-- One-off test price for PayPal checkout ($0.10). Revert in admin or a follow-up migration.
UPDATE public.bh_products
SET price = 0.10,
    updated_at = now()
WHERE sku = 'catalog:8';
