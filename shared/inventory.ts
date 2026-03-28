/** Shared inventory / wholesale lookup types (Boss Hookah admin). */

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
