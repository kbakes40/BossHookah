// Product Detail Page - Neo-Brutalism meets Luxury Retail
// Features: Image gallery, product info, add to cart, related products

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRoute, Link } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { getProductById as staticGetProductById, type Product } from "@/lib/products";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Heart, Share2, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/contexts/CartContext";
import { trpc } from "@/lib/trpc";
import { useStorefrontCatalog } from "@/hooks/useStorefrontCatalog";
import { useShopCurrency } from "@/contexts/CurrencyContext";
import { FREE_SHIPPING_THRESHOLD_USD } from "@shared/shipping";

const DEFAULT_DOC_TITLE = "Boss Hookah Wholesale - Premium Shisha, Vapes & Charcoal";
const DEFAULT_META_DESC =
  "Shop premium hookahs, shisha tobacco, vapes, charcoal and accessories at Boss Hookah Wholesale.";
const DEFAULT_OG_IMAGE_PATH = "/android-chrome-512x512.png";

const PRODUCT_DESCRIPTION_FALLBACK =
  "Experience premium quality with this carefully crafted product. Designed for enthusiasts who demand the best, featuring superior materials and expert craftsmanship. Perfect for both beginners and experienced users.";

function toAbsoluteUrl(src: string): string {
  const s = src?.trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://www.bosshookah.site";
  return s.startsWith("/") ? `${origin}${s}` : `${origin}/${s}`;
}

function setMetaProperty(property: string, content: string) {
  let el = document.head.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("property", property);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setMetaName(name: string, content: string) {
  let el = document.head.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("name", name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function restoreDefaultPageMeta(origin: string) {
  document.title = DEFAULT_DOC_TITLE;
  const ogImg = `${origin}${DEFAULT_OG_IMAGE_PATH}`;
  setMetaProperty("og:type", "website");
  setMetaProperty("og:url", `${origin}/`);
  setMetaProperty("og:title", DEFAULT_DOC_TITLE);
  setMetaProperty("og:description", DEFAULT_META_DESC);
  setMetaProperty("og:image", ogImg);
  setMetaProperty("twitter:card", "summary_large_image");
  setMetaProperty("twitter:url", `${origin}/`);
  setMetaProperty("twitter:title", DEFAULT_DOC_TITLE);
  setMetaProperty("twitter:description", DEFAULT_META_DESC);
  setMetaProperty("twitter:image", ogImg);
  setMetaName("description", DEFAULT_META_DESC);
}

export default function ProductDetail() {
  const [, params] = useRoute("/product/:id");
  const productId = params?.id || "";
  const productQuery = trpc.store.getProduct.useQuery(
    { id: productId },
    { enabled: Boolean(productId) }
  );

  const product: Product | null | undefined =
    productQuery.error
      ? staticGetProductById(productId) ?? null
      : productQuery.isLoading
        ? undefined
        : productQuery.data ?? null;

  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState("");
  const [shareOpen, setShareOpen] = useState(false);
  const { addToCart } = useCart();
  const { products: catalog } = useStorefrontCatalog();
  const { formatUsd } = useShopCurrency();

  const resolvedProduct = product !== undefined && product !== null ? product : null;

  const galleryPrimaryImage = useMemo(() => {
    if (!resolvedProduct) return "";
    const v = resolvedProduct.variants?.find(x => x.id === selectedVariant);
    return (v?.image || resolvedProduct.image || "").trim();
  }, [resolvedProduct, selectedVariant]);

  const sharePageUrl = useMemo(() => {
    if (typeof window === "undefined" || !productId) return "";
    try {
      const u = new URL(`${window.location.origin}/product/${encodeURIComponent(productId)}`);
      if (selectedVariant) u.searchParams.set("variant", selectedVariant);
      return u.toString();
    } catch {
      return "";
    }
  }, [productId, selectedVariant]);

  const shareDescriptionPlain = useMemo(() => {
    if (!resolvedProduct) return "";
    const v = resolvedProduct.variants?.find(x => x.id === selectedVariant);
    if (v?.description?.trim()) return v.description.trim();
    if (resolvedProduct.description?.trim()) return resolvedProduct.description.trim();
    return PRODUCT_DESCRIPTION_FALLBACK;
  }, [resolvedProduct, selectedVariant]);

  const absoluteShareImage = useMemo(
    () => (galleryPrimaryImage ? toAbsoluteUrl(galleryPrimaryImage) : ""),
    [galleryPrimaryImage]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!resolvedProduct) return;

    const origin = window.location.origin;
    const title = `${resolvedProduct.name} | Boss Hookah Wholesale`;
    const desc = shareDescriptionPlain.slice(0, 500);

    document.title = title;
    setMetaProperty("og:type", "website");
    setMetaProperty("og:url", sharePageUrl || window.location.href);
    setMetaProperty("og:title", resolvedProduct.name);
    setMetaProperty("og:description", desc);
    const ogImage = absoluteShareImage || `${origin}${DEFAULT_OG_IMAGE_PATH}`;
    setMetaProperty("og:image", ogImage);
    setMetaProperty("twitter:card", "summary_large_image");
    setMetaProperty("twitter:title", resolvedProduct.name);
    setMetaProperty("twitter:description", desc);
    setMetaProperty("twitter:image", ogImage);
    setMetaName("description", desc);

    return () => {
      restoreDefaultPageMeta(origin);
    };
  }, [
    absoluteShareImage,
    resolvedProduct,
    shareDescriptionPlain,
    sharePageUrl,
  ]);

  useEffect(() => {
    if (product?.variants?.length) {
      setSelectedVariant(product.variants[0]!.id);
    } else {
      setSelectedVariant("");
    }
    setSelectedImage(0);
  }, [product?.id, product?.variants]);

  const relatedProducts = useMemo(
    () =>
      product
        ? catalog.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4)
        : [],
    [catalog, product]
  );

  const shareProductNative = useCallback(async () => {
    if (!resolvedProduct || !sharePageUrl) return;
    const title = resolvedProduct.name;
    const body = shareDescriptionPlain;
    const textBlock = `${body}\n\n${sharePageUrl}`;
    try {
      if (typeof navigator.share === "function") {
        if (absoluteShareImage) {
          try {
            const res = await fetch(absoluteShareImage, { mode: "cors" });
            if (res.ok) {
              const blob = await res.blob();
              const file = new File([blob], "product.jpg", { type: blob.type || "image/jpeg" });
              const withFiles: ShareData = { title, text: body, files: [file] };
              if (navigator.canShare?.(withFiles)) {
                await navigator.share(withFiles);
                toast.success("Shared");
                setShareOpen(false);
                return;
              }
            }
          } catch {
            /* CORS or unsupported — fall through */
          }
        }
        await navigator.share({ title, text: textBlock, url: sharePageUrl });
        toast.success("Shared");
        setShareOpen(false);
        return;
      }
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
    }
    try {
      await navigator.clipboard.writeText(textBlock);
      toast.success("Copied title, description, and link");
    } catch {
      toast.error("Could not share or copy");
    }
    setShareOpen(false);
  }, [
    absoluteShareImage,
    resolvedProduct,
    shareDescriptionPlain,
    sharePageUrl,
  ]);

  const copyShareAll = useCallback(async () => {
    if (!resolvedProduct || !sharePageUrl) return;
    const textBlock = `${resolvedProduct.name}\n\n${shareDescriptionPlain}\n\n${sharePageUrl}`;
    try {
      await navigator.clipboard.writeText(textBlock);
      toast.success("Copied to clipboard");
      setShareOpen(false);
    } catch {
      toast.error("Copy failed");
    }
  }, [resolvedProduct, shareDescriptionPlain, sharePageUrl]);

  if (product === undefined) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Loading product…</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-display font-black mb-4">Product Not Found</h1>
            <Link href="/">
              <a className="text-primary hover:underline">Return to Home</a>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Get current variant image or use product default image
  const currentVariant = product.variants?.find(v => v.id === selectedVariant);
  const currentImage = galleryPrimaryImage || currentVariant?.image || product.image;
  const images = [currentImage]; // Use variant-specific image

  const handleAddToCart = () => {
    if (product) {
      // Pass selected variant ID to cart
      addToCart(product, quantity, selectedVariant || undefined);

      // Build toast message with variant name if applicable
      const variantName = selectedVariant
        ? product.variants?.find(v => v.id === selectedVariant)?.name
        : null;
      const itemName = variantName ? `${product.name} - ${variantName}` : product.name;

      toast.success(`Added ${quantity} × ${itemName} to cart`);

      // Haptic vibration feedback
      if ("vibrate" in navigator) {
        navigator.vibrate(50); // 50ms vibration
      }
    }
  };

  const displayDescription = product.description?.trim() || PRODUCT_DESCRIPTION_FALLBACK;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="max-w-md border-3 border-border brutalist-shadow bg-background">
          <DialogHeader>
            <DialogTitle className="font-display font-black">Share this product</DialogTitle>
            <DialogDescription>
              Your device may attach the image when sharing. The text below is included in the message.
            </DialogDescription>
          </DialogHeader>
          <div className="brutalist-border overflow-hidden bg-secondary">
            <img
              src={currentImage}
              alt=""
              className="w-full max-h-56 object-cover object-center"
            />
          </div>
          <div className="space-y-2">
            <p className="font-bold text-sm leading-snug line-clamp-2">{product.name}</p>
            <p className="text-sm text-muted-foreground max-h-36 overflow-y-auto leading-relaxed whitespace-pre-wrap border border-border/60 p-3 bg-muted/30">
              {shareDescriptionPlain}
            </p>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:justify-end">
            <Button type="button" variant="outline" className="brutalist-border font-bold" onClick={() => void copyShareAll()}>
              Copy text & link
            </Button>
            <Button type="button" className="brutalist-border brutalist-shadow font-bold" onClick={() => void shareProductNative()}>
              Share…
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <main className="flex-1 py-8">
        <div className="container">
          {/* Breadcrumb */}
          <div className="mb-6 text-sm">
            <Link href="/" className="hover:text-primary">
              Home
            </Link>
            <span className="mx-2">/</span>
            <span>{product.name}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
            {/* Image Gallery */}
            <div>
              <div className="bg-secondary brutalist-border aspect-square mb-4 overflow-hidden">
                <img src={currentImage} alt={product.name} className="w-full h-full object-cover" />
              </div>
              <div className="grid grid-cols-4 gap-4">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`aspect-square brutalist-border overflow-hidden ${
                      selectedImage === idx ? "border-primary" : ""
                    }`}
                  >
                    <img src={img} alt={`View ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Product Info */}
            <div>
              <p className="text-sm text-muted-foreground uppercase tracking-wide mb-2">{product.brand}</p>
              <h1 className="text-4xl font-display font-black mb-4">{product.name}</h1>

              {/* Price */}
              <div className="mb-6">
                {product.salePrice ? (
                  <div className="flex items-center gap-3">
                    <span className="text-3xl price-tag font-black text-primary">
                      {formatUsd(product.salePrice)}
                    </span>
                    <span className="text-xl price-tag line-through text-muted-foreground">
                      {formatUsd(product.price)}
                    </span>
                  </div>
                ) : (
                  <span className="text-3xl price-tag font-black">{formatUsd(product.price)}</span>
                )}
              </div>

              {/* Stock Status */}
              <div className="mb-6">
                {product.inStock ? (
                  <div className="flex items-center gap-2 text-primary">
                    <div className="w-3 h-3 bg-primary"></div>
                    <span className="font-semibold">In Stock</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-destructive">
                    <div className="w-3 h-3 bg-destructive"></div>
                    <span className="font-semibold">Sold Out</span>
                  </div>
                )}
              </div>

              {/* Flavor Variant Selector */}
              {product.variants && product.variants.length > 0 && (
                <div className="mb-6">
                  <label className="block font-semibold mb-3">Select Flavor</label>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.map(variant => (
                      <button
                        key={variant.id}
                        onClick={() => {
                          setSelectedVariant(variant.id);
                          setSelectedImage(0); // Reset to first image when variant changes
                        }}
                        className={`px-4 py-2.5 brutalist-border font-semibold transition-all duration-150 hover:translate-x-0.5 hover:translate-y-0.5 ${
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

              {/* Shipping Notice */}
              <div className="bg-secondary brutalist-border p-4 mb-6">
                <p className="text-sm font-semibold">
                  Spend {formatUsd(FREE_SHIPPING_THRESHOLD_USD)} to FREE SHIPPING Use Code{" "}
                  <span className="text-primary">FREESHIP</span>
                </p>
              </div>

              {/* Quantity Selector */}
              <div className="mb-6">
                <label className="block font-semibold mb-2">Quantity</label>
                <div className="flex items-center gap-4">
                  <div className="flex items-center brutalist-border">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 flex items-center justify-center hover:bg-secondary"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      onChange={e => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-16 h-10 text-center border-x-3 border-border [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-10 h-10 flex items-center justify-center hover:bg-secondary"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 mb-6">
                <Button
                  onClick={handleAddToCart}
                  disabled={!product.inStock}
                  className="flex-1 brutalist-border brutalist-shadow bg-primary text-primary-foreground hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all duration-150 h-12 text-lg font-bold"
                >
                  {product.inStock ? "ADD TO CART" : "SOLD OUT"}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="brutalist-border h-12 w-12"
                  onClick={() => toast.success("Added to wishlist")}
                >
                  <Heart className="h-5 w-5" />
                </Button>
              </div>

              {/* Share */}
              <Button
                variant="ghost"
                className="w-full justify-start"
                type="button"
                onClick={() => setShareOpen(true)}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>

              {/* Product Description */}
              <div className="mt-8 pt-8 border-t-3 border-border">
                <h3 className="font-display font-bold text-lg mb-4">Product Description</h3>
                <p className="text-muted-foreground leading-relaxed">{displayDescription}</p>
              </div>

              {/* Disclaimer */}
              {product.category === "shisha" && (
                <div className="mt-6 bg-muted brutalist-border p-4">
                  <p className="text-xs text-muted-foreground">
                    This product is excluded from all discounts and promotions.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <section className="py-16 border-t-3 border-border">
              <h2 className="text-3xl font-display font-black mb-8">YOU MAY ALSO LIKE</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {relatedProducts.map(p => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
