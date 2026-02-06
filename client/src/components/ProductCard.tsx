// ProductCard Component - Neo-Brutalism meets Luxury Retail
// Features: Product image, price display, variant selector

import { Product } from "@/lib/products";
import { Link } from "wouter";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [selectedVariant, setSelectedVariant] = useState(
    product.variants?.[0]?.id || ""
  );

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
            
            {/* Variant Selector */}
            {product.variants && product.variants.length > 0 && (
              <div className="py-2" onClick={(e) => e.preventDefault()}>
                <Select value={selectedVariant} onValueChange={setSelectedVariant}>
                  <SelectTrigger className="w-full brutalist-border bg-background">
                    <SelectValue placeholder="Select flavor" />
                  </SelectTrigger>
                  <SelectContent>
                    {product.variants.map((variant) => (
                      <SelectItem key={variant.id} value={variant.id}>
                        {variant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
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
  );
}
