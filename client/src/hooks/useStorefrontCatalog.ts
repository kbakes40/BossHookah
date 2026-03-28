import { trpc } from "@/lib/trpc";
import { products as staticCatalog } from "@/lib/products";

/**
 * Live catalog from Supabase `bh_products` via `store.listProducts`.
 * Uses bundled static `products` until the first successful fetch and on error
 * so pages never render an empty catalog while the network is slow.
 */
export function useStorefrontCatalog() {
  const query = trpc.store.listProducts.useQuery(undefined, {
    staleTime: 5 * 60_000,
    gcTime: 15 * 60_000,
  });

  const products = query.data ?? staticCatalog;

  return { products, query };
}
