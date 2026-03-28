import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { ArrowRight, Clock, Flame, Search, Sparkles, Tag, X } from "lucide-react";
import { Input as TextInput } from "@/components/ui/input";
import type { Product } from "@/lib/products";
import { useShopCurrency } from "@/contexts/CurrencyContext";
import {
  categoryLabel,
  highlightParts,
  matchingBrands,
  matchingCategories,
  popularProducts,
  QUICK_CATEGORY_CHIPS,
  rankProductsByQuery,
  readRecentSearches,
  rememberSearch,
  SEARCH_BRANDS_PREVIEW,
  SEARCH_CATEGORIES_PREVIEW,
  SEARCH_DEBOUNCE_MS,
  SEARCH_PRODUCTS_PREVIEW,
  TRENDING_SEARCH_TERMS,
} from "@/lib/storefrontSearch";

function HighlightedText({ text, query }: { text: string; query: string }) {
  const parts = highlightParts(text, query);
  return (
    <>
      {parts.map((p, i) =>
        p.hit ? (
          <mark key={i} className="bg-primary/25 text-foreground font-semibold px-0.5 rounded-sm">
            {p.text}
          </mark>
        ) : (
          <span key={i}>{p.text}</span>
        )
      )}
    </>
  );
}

type Variant = "desktop" | "mobile";

type Props = {
  variant: Variant;
  catalog: Product[];
  query: string;
  onQueryChange: (q: string) => void;
  onClose: () => void;
  autoFocus?: boolean;
};

export default function PredictiveSearch({
  variant,
  catalog,
  query,
  onQueryChange,
  onClose,
  autoFocus,
}: Props) {
  const [, setLocation] = useLocation();
  const { formatUsd } = useShopCurrency();
  const [debounced, setDebounced] = useState("");
  const [recent, setRecent] = useState<string[]>([]);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [desktopOpen, setDesktopOpen] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(query.trim()), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [query]);

  useEffect(() => {
    setRecent(readRecentSearches());
  }, []);

  useEffect(() => {
    if (variant !== "desktop" || !desktopOpen) return;
    const close = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setDesktopOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [desktopOpen, variant]);

  const rankedPreview = useMemo(() => {
    if (!debounced) return [];
    return rankProductsByQuery(catalog, debounced, SEARCH_PRODUCTS_PREVIEW + 1);
  }, [catalog, debounced]);

  const brandMatches = useMemo(
    () => (debounced ? matchingBrands(catalog, debounced, SEARCH_BRANDS_PREVIEW) : []),
    [catalog, debounced]
  );
  const categoryMatches = useMemo(
    () => (debounced ? matchingCategories(debounced, SEARCH_CATEGORIES_PREVIEW) : []),
    [debounced]
  );

  const popular = useMemo(() => popularProducts(catalog, 6), [catalog]);

  const showTyping = debounced.length > 0;
  const previewRows = rankedPreview.slice(0, SEARCH_PRODUCTS_PREVIEW);
  const hasMoreProducts = rankedPreview.length > SEARCH_PRODUCTS_PREVIEW;

  const goSearch = (q: string) => {
    const t = q.trim();
    if (!t) return;
    rememberSearch(t);
    setRecent(readRecentSearches());
    setLocation(`/search?q=${encodeURIComponent(t)}`);
    onQueryChange("");
    onClose();
  };

  const goProduct = (p: Product) => {
    rememberSearch(p.name);
    setRecent(readRecentSearches());
    setLocation(`/product/${p.id}`);
    onQueryChange("");
    onClose();
  };

  const suggestionChips = (items: string[], icon: ReactNode) =>
    items.length > 0 ? (
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {icon}
          Suggestions
        </div>
        <div className="flex flex-wrap gap-2">
          {items.map(s => (
            <button
              key={s}
              type="button"
              onMouseDown={e => e.preventDefault()}
              onClick={() => goSearch(s)}
              className="text-left px-3 py-2 text-xs font-semibold brutalist-border bg-secondary/80 hover:bg-secondary active:scale-[0.98] transition-transform"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    ) : null;

  const panelInner = (
    <div
      className={
        variant === "desktop"
          ? "border-3 border-border brutalist-shadow bg-background"
          : "bg-background min-h-0 flex flex-col flex-1"
      }
    >
      {/* Quick category chips */}
      <div className="px-3 pt-3 pb-2 border-b-3 border-border/80 bg-secondary/40">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Shop fast</p>
        <div className="flex flex-wrap gap-2">
          {QUICK_CATEGORY_CHIPS.map(c => (
            <Link
              key={c.href}
              href={c.href}
              onMouseDown={e => e.preventDefault()}
              onClick={() => {
                onClose();
                onQueryChange("");
              }}
              className="px-3 py-1.5 text-xs font-bold brutalist-border bg-background hover:bg-primary/10 transition-colors"
            >
              {c.label}
            </Link>
          ))}
        </div>
      </div>

      <div className={variant === "mobile" ? "flex-1 min-h-0 overflow-y-auto overscroll-contain" : "max-h-[min(70vh,540px)] overflow-y-auto overscroll-contain"}>
        {!showTyping ? (
          <div className="p-3 space-y-6">
            {recent.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  Recent
                </div>
                <div className="flex flex-wrap gap-2">
                  {recent.map(s => (
                    <button
                      key={s}
                      type="button"
                      onMouseDown={e => e.preventDefault()}
                      onClick={() => goSearch(s)}
                      className="px-3 py-2 text-xs font-semibold brutalist-border bg-background hover:bg-secondary"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {suggestionChips(
              TRENDING_SEARCH_TERMS,
              <Flame className="w-3.5 h-3.5 text-orange-500" />
            )}

            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                <Tag className="w-3.5 h-3.5" />
                Top categories
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {QUICK_CATEGORY_CHIPS.map(c => (
                  <Link
                    key={c.href}
                    href={c.href}
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => {
                      onClose();
                      onQueryChange("");
                    }}
                    className="px-3 py-3 text-xs font-bold brutalist-border bg-background hover:bg-primary/10 flex items-center justify-between gap-2"
                  >
                    {c.label}
                    <ArrowRight className="w-3.5 h-3.5 shrink-0 opacity-60" />
                  </Link>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                Popular products
              </div>
              <div className="space-y-1.5">
                {popular.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => goProduct(p)}
                    className="w-full flex gap-3 p-2 text-left brutalist-border bg-background hover:bg-secondary/90 transition-colors"
                  >
                    <div className="w-14 h-14 shrink-0 border-2 border-border bg-secondary overflow-hidden">
                      <img src={p.image} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold truncate">
                        {categoryLabel(p.category)}
                      </p>
                      <p className="text-xs font-bold line-clamp-2 leading-snug">{p.name}</p>
                      <p className="text-xs font-black text-primary mt-0.5 tabular-nums">
                        {formatUsd(p.salePrice ?? p.price)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3 space-y-4">
            {previewRows.length === 0 && brandMatches.length === 0 && categoryMatches.length === 0 ? (
              <div className="space-y-4 py-2">
                <p className="text-sm font-black uppercase">No direct matches</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Try a shorter keyword, check spelling, or browse a category below.
                </p>
                {suggestionChips(
                  [...TRENDING_SEARCH_TERMS.slice(0, 4), ...QUICK_CATEGORY_CHIPS.map(c => c.label.toLowerCase())],
                  <Search className="w-3.5 h-3.5" />
                )}
                <div className="flex flex-wrap gap-2">
                  {QUICK_CATEGORY_CHIPS.map(c => (
                    <Link
                      key={c.href}
                      href={c.href}
                      onMouseDown={e => e.preventDefault()}
                      onClick={() => {
                        onClose();
                        onQueryChange("");
                      }}
                      className="px-3 py-2 text-xs font-bold brutalist-border bg-secondary/80"
                    >
                      {c.label}
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {categoryMatches.length > 0 && (
                  <section>
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                      Categories
                    </h3>
                    <div className="space-y-1">
                      {categoryMatches.map(c => (
                        <Link
                          key={c.id}
                          href={c.href}
                          onMouseDown={e => e.preventDefault()}
                          onClick={() => {
                            onClose();
                            onQueryChange("");
                          }}
                          className="flex items-center justify-between px-3 py-2.5 brutalist-border bg-background hover:bg-secondary text-sm font-bold"
                        >
                          <HighlightedText text={c.name} query={debounced} />
                          <ArrowRight className="w-4 h-4 opacity-50 shrink-0" />
                        </Link>
                      ))}
                    </div>
                  </section>
                )}

                {brandMatches.length > 0 && (
                  <section>
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                      Brands
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {brandMatches.map(b => (
                        <button
                          key={b}
                          type="button"
                          onMouseDown={e => e.preventDefault()}
                          onClick={() => goSearch(b)}
                          className="px-3 py-2 text-xs font-bold brutalist-border bg-secondary/80 hover:bg-secondary"
                        >
                          <HighlightedText text={b} query={debounced} />
                        </button>
                      ))}
                    </div>
                  </section>
                )}

                {previewRows.length > 0 && (
                  <section>
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                      Products
                    </h3>
                    <div className="space-y-1.5">
                      {previewRows.map(({ product: p }) => (
                        <button
                          key={p.id}
                          type="button"
                          onMouseDown={e => e.preventDefault()}
                          onClick={() => goProduct(p)}
                          className="w-full flex gap-3 p-2.5 text-left brutalist-border bg-background hover:bg-secondary/90 transition-colors min-h-[72px]"
                        >
                          <div className="w-16 h-16 shrink-0 border-2 border-border bg-secondary overflow-hidden">
                            <img src={p.image} alt="" className="w-full h-full object-cover" />
                          </div>
                          <div className="min-w-0 flex-1 flex flex-col justify-center">
                            <p className="text-[10px] text-muted-foreground uppercase font-bold truncate">
                              {categoryLabel(p.category)}
                            </p>
                            <p className="text-sm font-bold line-clamp-2 leading-tight">
                              <HighlightedText text={p.name} query={debounced} />
                            </p>
                            <p className="text-sm font-black text-primary tabular-nums mt-0.5">
                              {formatUsd(p.salePrice ?? p.price)}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </section>
                )}

                {hasMoreProducts && (
                  <button
                    type="button"
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => goSearch(debounced)}
                    className="w-full py-3 px-4 text-sm font-black uppercase brutalist-border bg-primary text-primary-foreground hover:opacity-95 flex items-center justify-center gap-2"
                  >
                    View all results
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );

  if (variant === "mobile") {
    return (
      <div ref={wrapRef} className="flex flex-col h-full min-h-0 bg-background">
        <div className="shrink-0 flex items-center gap-2 p-3 border-b-3 border-border bg-background z-20">
          <button
            type="button"
            aria-label="Close search"
            onClick={onClose}
            className="p-2 -ml-1 brutalist-border bg-background shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
          <form
            className="flex-1 min-w-0"
            onSubmit={e => {
              e.preventDefault();
              goSearch(query);
            }}
          >
            <TextInput
              type="search"
              placeholder="Search products, brands, SKUs…"
              className="w-full brutalist-border h-11 text-base"
              value={query}
              onChange={e => onQueryChange(e.target.value)}
              autoFocus={autoFocus}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
          </form>
        </div>
        {panelInner}
      </div>
    );
  }

  /* desktop */
  return (
    <div ref={wrapRef} className="relative w-full">
      <form
        onSubmit={e => {
          e.preventDefault();
          goSearch(query);
        }}
        className="relative w-full"
      >
        <TextInput
          type="search"
          placeholder="Search products, brands, SKUs…"
          className="w-full brutalist-border pr-10"
          value={query}
          onChange={e => onQueryChange(e.target.value)}
          onFocus={() => {
            setRecent(readRecentSearches());
            setDesktopOpen(true);
          }}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
        />
        <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2" aria-label="Search">
          <Search className="h-5 w-5 text-muted-foreground" />
        </button>
      </form>
      {desktopOpen ? <div className="absolute left-0 right-0 top-full z-[60] mt-1">{panelInner}</div> : null}
    </div>
  );
}
