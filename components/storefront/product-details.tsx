"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Product, ProductImage, ProductVariant } from "@/types/database.types";
import { cn } from "@/lib/utils";

interface ProductDetailsProps {
  product: Product;
  images: ProductImage[];
  variants: ProductVariant[];
}

export function ProductDetails({ product, images, variants }: ProductDetailsProps) {
  const [activeImage, setActiveImage] = useState(images[0]);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [sizeError, setSizeError] = useState(false);
  const [added, setAdded] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Only access Zustand store after client hydration to prevent mismatch
  useEffect(() => { setMounted(true); }, []);

  // Extract unique sizes from variants
  const sizes = Array.from(new Set(variants.map((v) => v.size)));

  // Find the selected variant based on size
  const selectedVariant = selectedSize
    ? variants.find((v) => v.size === selectedSize)
    : null;

  // Determine current price (variant might have price override)
  const currentPrice = selectedVariant?.price_override ?? product.price;
  const isOutOfStock = !!(selectedSize && (!selectedVariant || selectedVariant.stock <= 0));

  async function handleAddToCart() {
    if (!selectedSize || !selectedVariant) {
      setSizeError(true);
      setTimeout(() => setSizeError(false), 2000);
      return;
    }

    if (!mounted) return;

    const { useCartStore } = await import("@/lib/stores/cart.store");
    const addItem = useCartStore.getState().addItem;

    // Call addItem once per qty unit so the store's increment logic works correctly
    for (let i = 0; i < qty; i++) {
      addItem({
        variantId: selectedVariant.id,
        productId: product.id,
        productSlug: product.slug,
        name: product.name,
        imageUrl: images[0]?.url ?? "",
        price: currentPrice,
        size: selectedSize,
        color: selectedVariant.color,
      });
    }

    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16">

      {/* ── Image Gallery ──────────────────────────────────────────── */}
      <div className="flex flex-col-reverse md:flex-row gap-4">
        {/* Thumbnails */}
        <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-visible no-scrollbar pb-2 md:pb-0">
          {images.map((img) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActiveImage(img)}
              className={cn(
                "relative shrink-0 w-20 h-24 bg-sxtn-gray-900 border transition-all touch-manipulation",
                activeImage?.id === img.id
                  ? "border-white"
                  : "border-transparent"
              )}
            >
              <Image
                src={img.url}
                alt={img.alt_text || product.name}
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>

        {/* Main Image */}
        <div className="relative flex-1 aspect-[3/4] bg-sxtn-gray-900 overflow-hidden rounded-lg">
          {activeImage ? (
            <Image
              src={activeImage.url}
              alt={activeImage.alt_text || product.name}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-sxtn-gray-500 font-display tracking-widest">
              NO IMAGE
            </div>
          )}
        </div>
      </div>

      {/* ── Product Info ────────────────────────────────────────────── */}
      <div className="flex flex-col pt-4 md:pt-10">
        <h1 className="font-display text-4xl lg:text-5xl uppercase tracking-widest text-sxtn-white mb-4">
          {product.name}
        </h1>

        <div className="flex items-center gap-4 mb-8">
          <span className="text-xl text-sxtn-white">
            ₹{currentPrice.toLocaleString("en-IN")}
          </span>
          {product.compare_at_price && (
            <span className="text-lg text-sxtn-gray-600 line-through">
              ₹{product.compare_at_price.toLocaleString("en-IN")}
            </span>
          )}
        </div>

        <div className="text-sm text-sxtn-gray-300 mb-10 leading-relaxed">
          <p>{product.description}</p>
        </div>

        {/* Size Selector */}
        <div className="mb-10">
          <div className="mb-4">
            <span className="text-xs uppercase tracking-widest text-sxtn-gray-400">
              Select Size
            </span>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {sizes.map((size) => {
              const variant = variants.find((v) => v.size === size);
              const isOOS = !variant || variant.stock <= 0;

              return (
                <button
                  key={size}
                  type="button"
                  disabled={isOOS}
                  onClick={() => {
                    if (!isOOS) setSelectedSize(size);
                  }}
                  style={{ WebkitTapHighlightColor: "transparent" }}
                  className={cn(
                    "h-14 border text-sm font-display uppercase tracking-widest touch-manipulation select-none",
                    isOOS
                      ? "opacity-30 cursor-not-allowed border-white/20 text-white/50"
                      : selectedSize === size
                      ? "border-white bg-white text-black"
                      : "border-white/20 text-white"
                  )}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>

        {/* Size error */}
        {sizeError && (
          <p className="text-amber-400 text-xs text-center py-2 mb-3 bg-amber-400/10">
            Please select a size first
          </p>
        )}

        {/* Quantity Selector */}
        <div className="mb-5">
          <span className="text-xs uppercase tracking-widest text-sxtn-gray-400 block mb-3">
            Quantity
          </span>
          <div className="inline-flex items-center border border-white/20">
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="h-12 w-12 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5 transition-colors text-lg touch-manipulation select-none"
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span className="h-12 w-12 flex items-center justify-center font-display text-white text-base select-none">
              {qty}
            </span>
            <button
              type="button"
              onClick={() => setQty((q) => Math.min(10, q + 1))}
              className="h-12 w-12 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5 transition-colors text-lg touch-manipulation select-none"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
        </div>

        {/* Add to Cart */}
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          style={{ WebkitTapHighlightColor: "transparent" }}
          className={cn(
            "w-full h-14 flex items-center justify-center font-display tracking-widest uppercase touch-manipulation transition-colors duration-200",
            isOutOfStock
              ? "bg-white/10 text-white/40 cursor-not-allowed"
              : added
              ? "bg-green-500/20 text-green-400 border border-green-500/30"
              : "bg-white text-black"
          )}
        >
          {isOutOfStock ? "Out of Stock" : added ? "✓ Added to Cart" : "Add to Cart"}
        </button>

        {/* Info Blocks */}
        <div className="mt-12 space-y-8 border-t border-white/10 pt-8">
          {/* Shipping / Returns */}
          <div className="space-y-6">
            <div>
              <h4 className="text-xs uppercase tracking-widest text-white mb-2">Shipping</h4>
              <p className="text-sm text-sxtn-gray-400">
                Free shipping on all prepaid orders. Ships within 2–3 business days.
              </p>
            </div>
            <div>
              <h4 className="text-xs uppercase tracking-widest text-white mb-2">Returns</h4>
              <p className="text-sm text-sxtn-gray-400">7-day hassle-free returns and exchanges.</p>
            </div>
          </div>

          {/* Features */}
          {product.features && product.features.length > 0 && (
            <div className="border-t border-white/10 pt-6">
              <h4 className="text-xs uppercase tracking-widest text-white mb-4">Features</h4>
              <ul className="space-y-2">
                {product.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-sxtn-gray-300">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-white/40 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Composition & Wash Care */}
          {product.wash_care && product.wash_care.length > 0 && (
            <div className="border-t border-white/10 pt-6">
              <h4 className="text-xs uppercase tracking-widest text-white mb-4">Composition &amp; Wash Care</h4>
              <ul className="space-y-2">
                {product.wash_care.map((w, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-sxtn-gray-300">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-white/40 shrink-0" />
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
