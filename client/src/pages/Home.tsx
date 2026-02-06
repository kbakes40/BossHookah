// Home Page - Neo-Brutalism meets Luxury Retail
// Design Philosophy: Bold typography, stark contrasts, emerald green accents, asymmetric layouts

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { getTrendingProducts, getFeaturedProducts } from "@/lib/products";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const trendingProducts = getTrendingProducts();
  const featuredProducts = getFeaturedProducts();

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
    }
  ];

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);

  // Auto-cycle slides every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      nextSlide();
    }, 5000);

    return () => clearInterval(interval);
  }, [currentSlide]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Slider */}
        <section className="relative h-[600px] overflow-hidden">
          {heroSlides.map((slide, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-500 ${
                index === currentSlide ? "opacity-100 z-10" : "opacity-0 pointer-events-none"
              }`}
              style={{ background: slide.bg }}
            >
              <div className="container h-full flex items-center">
                <div className="max-w-2xl text-white">
                  <p className="text-sm font-bold mb-2 tracking-widest">{slide.subtitle}</p>
                  <h1 className="text-7xl font-display font-black mb-6 leading-none">
                    {slide.title}
                  </h1>
                  <p className="text-xl mb-8 font-medium">{slide.description}</p>
                  <Link 
                    href={slide.link}
                    className="inline-block bg-white text-foreground hover:bg-secondary brutalist-border brutalist-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all duration-150 font-bold text-lg px-8 py-3"
                  >
                    {slide.cta}
                  </Link>
                </div>
              </div>
            </div>
          ))}

          {/* Slider Controls */}
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

          {/* Slide Indicators */}
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
                {trendingProducts.map((product) => (
                  <div key={product.id} className="w-64 flex-shrink-0">
                    <ProductCard product={product} />
                  </div>
                ))}
                {/* Duplicate for infinite scroll effect */}
                {trendingProducts.map((product) => (
                  <div key={`dup-${product.id}`} className="w-64 flex-shrink-0">
                    <ProductCard product={product} />
                  </div>
                ))}
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
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>


      </main>

      <Footer />
    </div>
  );
}
