import { useState, useEffect, useMemo } from "react";
import { useLocation, Link } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { Product } from "@/lib/products";
import { useStorefrontCatalog } from "@/hooks/useStorefrontCatalog";
import { searchProductsAllRanked, QUICK_CATEGORY_CHIPS, TRENDING_SEARCH_TERMS } from "@/lib/storefrontSearch";

export default function SearchResults() {
  const [location] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const { products: catalog } = useStorefrontCatalog();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const query = params.get("q") || "";
    setSearchQuery(query);
  }, [location]);

  const ranked = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return searchProductsAllRanked(catalog, searchQuery);
  }, [catalog, searchQuery]);

  const searchResults: Product[] = ranked.map(r => r.product);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-16">
        <div className="container">
          <div className="mb-12">
            <h1 className="text-4xl font-display font-black mb-4">SEARCH RESULTS</h1>
            {searchQuery && (
              <p className="text-lg">
                {searchResults.length > 0 ? (
                  <>
                    Found <span className="font-bold">{searchResults.length}</span>{" "}
                    {searchResults.length === 1 ? "result" : "results"} for{" "}
                    <span className="font-bold">&ldquo;{searchQuery}&rdquo;</span>
                  </>
                ) : (
                  <>
                    No results found for <span className="font-bold">&ldquo;{searchQuery}&rdquo;</span>
                  </>
                )}
              </p>
            )}
            {!searchQuery && (
              <p className="text-lg text-muted-foreground">Enter a search term to find products</p>
            )}
          </div>

          {searchResults.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
              {searchResults.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {searchQuery && searchResults.length === 0 && (
            <div className="text-center py-12 max-w-xl mx-auto space-y-6">
              <h2 className="text-2xl font-display font-black">NO PRODUCTS FOUND</h2>
              <p className="text-muted-foreground">
                Try a shorter keyword, browse categories, or use one of these popular searches.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {TRENDING_SEARCH_TERMS.slice(0, 6).map(term => (
                  <Link
                    key={term}
                    href={`/search?q=${encodeURIComponent(term)}`}
                    className="brutalist-border bg-secondary hover:bg-secondary/80 px-4 py-2 text-sm font-bold"
                  >
                    {term}
                  </Link>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                {QUICK_CATEGORY_CHIPS.map(c => (
                  <Link
                    key={c.href}
                    href={c.href}
                    className="brutalist-border bg-background hover:bg-secondary px-6 py-3 font-bold transition-colors"
                  >
                    {c.label.toUpperCase()}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
