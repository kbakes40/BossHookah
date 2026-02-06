// ProductCard Component - Neo-Brutalism meets Luxury Retail
// Features: Product image, price display, visible variant selector

import { Product } from "@/lib/products";
import { Link } from "wouter";
import { useState } from "react";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [selectedVariant, setSelectedVariant] = useState(
    product.variants?.[0]?.id || ""
  );

  // Get selected variant name for display
  const selectedVariantName = product.variants?.find(v => v.id === selectedVariant)?.name || "";

  return (
    <div className="group relative">
      <Link href={`/product/${product.id}`} className="block">
          {/* Product Image Container */}
          <div className="relative bg-secondary brutalist-border overflow-hidden aspect-square mb-4">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />

            {/* Out of Stock Overlay */}
            {!product.inStock && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                <span className="bg-foreground text-background px-4 py-2 font-bold text-sm">
                  SOLD OUT
                </span>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">{product.brand}</p>
            <h3 className="font-semibold text-sm line-clamp-2 min-h-[2.5rem]">{product.name}</h3>
            
            {/* Price */}
            <div className="flex items-center gap-2">
              {product.salePrice ? (
                <>
                  <span className="price-tag text-muted-foreground line-through text-sm">
                    ${product.price.toFixed(2)}
                  </span>
                  <span className="price-tag text-primary font-bold">
                    ${product.salePrice.toFixed(2)}
                  </span>
                </>
              ) : (
                <span className="price-tag font-bold">
                  ${product.price.toFixed(2)} USD
                </span>
              )}
            </div>
          </div>
      </Link>
      
      {/* Variant Selector - Visible buttons outside the link */}
      {product.variants && product.variants.length > 0 && (
        <div className="mt-3 space-y-2" onClick={(e) => e.stopPropagation()}>
          <p className="text-xs font-bold uppercase text-muted-foreground">Select Flavor:</p>
          <div className="flex flex-wrap gap-1.5">
            {product.variants.map((variant) => (
              <button
                key={variant.id}
                onClick={(e) => {
                  e.preventDefault();
                  setSelectedVariant(variant.id);
                }}
                className={`text-xs px-2.5 py-1.5 brutalist-border font-semibold transition-all duration-150 hover:translate-x-0.5 hover:translate-y-0.5 ${
                  selectedVariant === variant.id
                    ? "bg-primary text-primary-foreground brutalist-shadow"
                    : "bg-background hover:bg-secondary"
                }`}
                title={variant.description}
              >
                {variant.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
