// ProductCard Component - Neo-Brutalism meets Luxury Retail
// Features: Product image, price display

import { Product } from "@/lib/products";
import { Link } from "wouter";
import { useShopCurrency } from "@/contexts/CurrencyContext";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { formatUsd } = useShopCurrency();

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
                    {formatUsd(product.price)}
                  </span>
                  <span className="price-tag text-primary font-bold">
                    {formatUsd(product.salePrice)}
                  </span>
                </>
              ) : (
                <span className="price-tag font-bold">{formatUsd(product.price)}</span>
              )}
            </div>
          </div>
      </Link>
    </div>
  );
}
