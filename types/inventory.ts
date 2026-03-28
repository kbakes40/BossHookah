/**
 * Inventory / wholesale cost types (Boss Hookah admin).
 * Duplicated from shared intent; prefer `@shared/inventory` in app code when the alias is available.
 */
export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  stock: number;
  price: number;
  cost: number | null;
  costSource?: string;
  costSourceUrl?: string;
  costFetchedAt?: string;
}

export interface CostResult {
  cost: number | null;
  source: string;
  sourceUrl?: string;
  cached?: boolean;
}
