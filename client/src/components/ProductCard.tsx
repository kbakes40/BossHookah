// ProductCard Component - Neo-Brutalism meets Luxury Retail
// Features: Product image, badge, price, quick view button

import { Product } from "@/lib/products";
import { Link } from "wouter";
import { Button } from "./ui/button";
import { useState } from "react";
import ProductQuickView from "./ProductQuickView";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [showQuickView, setShowQuickView] = useState(false);

  return (
    <>
    <div className="group relative">
      <Link href={`/product/${product.id}`} className="block">
          {/* Product Image Container */}
          <div className="relative bg-secondary brutalist-border overflow-hidden aspect-square mb-4">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            
            {/* Badge */}
            {product.badge && (
              <div className="absolute top-4 left-4 bg-foreground text-background px-3 py-1 text-xs font-bold">
                {product.badge}
              </div>
            )}

            {/* Out of Stock Overlay */}
            {!product.inStock && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                <span className="bg-foreground text-background px-4 py-2 font-bold text-sm">
                  SOLD OUT
                </span>
              </div>
            )}

            {/* Quick View Button - Shows on Hover */}
            <div className="absolute inset-x-0 bottom-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
              <Button 
                className="w-full brutalist-border bg-background text-foreground hover:bg-primary hover:text-primary-foreground"
                onClick={(e) => {
                  e.preventDefault();
                  setShowQuickView(true);
                }}
              >
                QUICK VIEW
              </Button>
            </div>
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
    </div>
    <ProductQuickView 
      product={product}
      open={showQuickView}
      onClose={() => setShowQuickView(false)}
    />
    </>
  );
}
