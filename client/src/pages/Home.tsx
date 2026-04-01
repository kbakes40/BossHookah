import { useState, useEffect, useMemo } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { useStorefrontCatalog } from "@/hooks/useStorefrontCatalog";
import { Link } from "wouter";
import { ChevronLeft, ChevronRight } from "lucide-react";

function ProductSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="bg-muted brutalist-border aspect-square mb-4" />
      <div className="space-y-2">
        <div className="h-3 w-16 bg-muted rounded" />
        <div className="h-4 w-full bg-muted rounded" />
        <div className="h-4 w-2/3 bg-muted rounded" />
        <div className="h-4 w-20 bg-muted rounded" />
      </div>
    </div>
  );
}

const TRENDING_SKELETON_COUNT = 6;
const FEATURED_SKELETON_COUNT = 6;

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { products: catalog, query: catalogQuery } = useStorefrontCatalog();

  const trendingProducts = useMemo(
    () => catalog.filter(p => p.trending),
    [catalog]
  );
  const featuredProducts = useMemo(
    () => catalog.filter(p => p.featured),
    [catalog]
  );

  const isFirstLoad = catalogQuery.isLoading && catalog.length === 0;

  useEffect(() => {
    document.title = "Boss Hookah Wholesale - Premium Shisha & Vapes";
  }, []);

  useEffect(() => {
    const load = () => {
      void import("@/pages/Collection");
      void import("@/pages/ProductDetail");
      void import("@/pages/SearchResults");
    };
    const ric = typeof window !== "undefined" ? window.requestIdleCallback : null;
    if (ric) {
      const id = ric(() => load(), { timeout: 2500 });
      return () => window.cancelIdleCallback?.(id);
    }
    const t = window.setTimeout(load, 400);
    return () => clearTimeout(t);
  }, []);

  const heroSlides = [
    {
      title: "PREMIUM TOBACCO",
      subtitle: "NOW AVAILABLE",
      description: "Experience bold new flavors crafted for enthusiasts",
      cta: "SHOP NOW",
      link: "/collections/shisha",
      bg: "linear-gradient(135deg, #10B981 0%, #059669 100%)"
    },
    {
      title: "LUXURY HOOKAHS",
      subtitle: "NEW COLLECTION",
      description: "Discover our curated selection of premium pieces",
      cta: "EXPLORE",
      link: "/collections/hookahs",
      bg: "linear-gradient(135deg, #0A0A0A 0%, #1F2937 100%)"
    },
    {
      title: "SNOOP DOGG COLLECTION",
      subtitle: "EXCLUSIVE FLAVORS",
      description: "Limited edition Al Fakher collaboration - 5 unique blends",
      cta: "GET YOURS",
      link: "/shisha/al-fakher",
      bg: "linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)"
    },
    {
      title: "WHOLESALE DEALS",
      subtitle: "BULK PRICING",
      description: "Stock up and save big on RoR Tobacco 1kg - 41 flavors",
      cta: "VIEW DEALS",
      link: "/wholesale",
      bg: "linear-gradient(135deg, #DC2626 0%, #991B1B 100%)"
    },
    {
      title: "STARBUZZ MINI",
      subtitle: "PORTABLE LUXURY",
      description: "Complete hookah sets in 9 stunning colors - Perfect for travel",
      cta: "SHOP COLORS",
      link: "/hookahs",
      bg: "linear-gradient(135deg, #0EA5E9 0%, #0369A1 100%)"
    }
  ];

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);

  useEffect(() => {
    const interval = setInterval(() => {
      nextSlide();
    }, 7000);
    return () => clearInterval(interval);
  }, [currentSlide]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Slider */}
        <section className="relative h-[600px] overflow-hidden">
          {heroSlides.map((slide, index) => (
            <Link
              key={index}
              href={slide.link}
              className={`absolute inset-0 transition-opacity duration-500 cursor-pointer ${
                index === currentSlide ? "opacity-100 z-10" : "opacity-0 pointer-events-none"
              }`}
              style={{ background: slide.bg }}
            >
              <div className="container h-full flex items-center">
                <div className="max-w-2xl text-white transition-transform duration-300 hover:scale-105">
                  <p className="text-sm font-bold mb-2 tracking-widest">{slide.subtitle}</p>
                  <h1 className="text-7xl font-display font-black mb-6 leading-none" style={{ textShadow: '0 0 8px rgba(255, 255, 255, 0.08), 0 0 15px rgba(255, 255, 255, 0.05)' }}>
                    {slide.title}
                  </h1>
                  <p className="text-xl mb-8 font-medium">{slide.description}</p>
                  <span className="inline-block bg-white text-foreground hover:bg-secondary brutalist-border brutalist-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all duration-150 font-bold text-lg px-8 py-3">
                    {slide.cta}
                  </span>
                </div>
              </div>
            </Link>
          ))}

          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white brutalist-border flex items-center justify-center hover:bg-primary hover:text-white transition-colors duration-150 z-20"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white brutalist-border flex items-center justify-center hover:bg-primary hover:text-white transition-colors duration-150 z-20"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {heroSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 border-2 border-white transition-colors duration-150 ${
                  index === currentSlide ? "bg-white" : "bg-transparent"
                }`}
              />
            ))}
          </div>
        </section>

        {/* Trending Products Carousel */}
        <section className="py-16 bg-secondary border-y-3 border-border">
          <div className="container">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-4xl font-display font-black">TRENDING</h2>
            </div>

            <div className="overflow-x-auto pb-4 -mx-4 px-4">
              <div className="flex gap-6" style={{ width: 'max-content' }}>
                {isFirstLoad && trendingProducts.length === 0
                  ? Array.from({ length: TRENDING_SKELETON_COUNT }, (_, i) => (
                      <div key={`skel-t-${i}`} className="w-64 flex-shrink-0">
                        <ProductSkeleton />
                      </div>
                    ))
                  : (
                    <>
                      {trendingProducts.map((product, idx) => (
                        <div key={product.id} className="w-64 flex-shrink-0">
                          <ProductCard product={product} priority={idx < 4} />
                        </div>
                      ))}
                      {trendingProducts.map((product) => (
                        <div key={`dup-${product.id}`} className="w-64 flex-shrink-0">
                          <ProductCard product={product} />
                        </div>
                      ))}
                    </>
                  )
                }
              </div>
            </div>
          </div>
        </section>

        {/* New Arrivals Grid */}
        <section className="py-16">
          <div className="container">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-4xl font-display font-black">NEW ARRIVALS</h2>
              <Link href="/collections/all" className="text-primary hover:underline font-bold">
                Show All →
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
              {isFirstLoad && featuredProducts.length === 0
                ? Array.from({ length: FEATURED_SKELETON_COUNT }, (_, i) => (
                    <ProductSkeleton key={`skel-f-${i}`} />
                  ))
                : featuredProducts.map((product, idx) => (
                    <ProductCard key={product.id} product={product} priority={idx < 6} />
                  ))
              }
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
