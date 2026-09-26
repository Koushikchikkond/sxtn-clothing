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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16 items-start">

      {/* ── Image Gallery ──────────────────────────────────────────── */}
      <div className="flex flex-col-reverse md:flex-row gap-4 md:sticky md:top-24 w-full">
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
        <div className="relative flex-1 aspect-[3/4] bg-sxtn-gray-900 overflow-hidden">
          {activeImage ? (
            <Image
              src={activeImage.url}
              alt={activeImage.alt_text || product.name}
              fill
              priority
              className="object-contain"
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
        <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold uppercase tracking-tight text-white mb-4 leading-tight">
          {product.name}
        </h1>

        <div className="flex items-center gap-4 mb-8">
          <span className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight">
            INR {currentPrice.toLocaleString("en-IN")}
          </span>
          {product.compare_at_price && (
            <span className="text-base sm:text-lg text-white/40 line-through">
              INR {product.compare_at_price.toLocaleString("en-IN")}
            </span>
          )}
        </div>

        <div className="text-sm sm:text-base text-sxtn-gray-200 mb-10 leading-relaxed font-normal">
          <p>{product.description}</p>
        </div>

        {/* Size Selector */}
        <div className="mb-10">
          <div className="mb-4">
            <span className="text-xs sm:text-sm font-bold uppercase tracking-widest text-white/60">
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
                    "h-14 border text-sm sm:text-base font-display font-bold uppercase tracking-wider touch-manipulation select-none",
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
          <p className="text-amber-400 text-xs sm:text-sm text-center py-2 mb-3 bg-amber-400/10">
            Please select a size first
          </p>
        )}

        {/* Quantity Selector */}
        <div className="mb-5">
          <span className="text-xs sm:text-sm font-bold uppercase tracking-widest text-white/60 block mb-3">
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
            <span className="h-12 w-12 flex items-center justify-center font-display font-bold text-white text-base sm:text-lg select-none">
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
            "w-full h-14 flex items-center justify-center font-display font-bold text-base sm:text-lg tracking-widest uppercase touch-manipulation transition-colors duration-200",
            isOutOfStock
              ? "bg-white/10 text-white/40 cursor-not-allowed"
              : added
              ? "bg-green-500/20 text-green-400 border border-green-500/30"
              : "bg-white text-black hover:bg-white/90"
          )}
        >
          {isOutOfStock ? "Out of Stock" : added ? "✓ Added to Cart" : "Add to Cart"}
        </button>

        <div className="mt-12 space-y-8 border-t border-white/10 pt-8">

          {/* Features */}
          {product.features && product.features.length > 0 && (
            <div className="border-t border-white/10 pt-6">
              <h4 className="font-display text-sm font-bold uppercase tracking-widest text-white mb-4">Features</h4>
              <ul className="space-y-2.5">
                {product.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm sm:text-base text-sxtn-gray-200 leading-relaxed">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-white/60 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Composition & Wash Care */}
          {product.wash_care && product.wash_care.length > 0 && (
            <div className="border-t border-white/10 pt-6">
              <h4 className="font-display text-sm font-bold uppercase tracking-widest text-white mb-4">Composition &amp; Wash Care</h4>
              <ul className="space-y-2.5">
                {product.wash_care.map((w, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm sm:text-base text-sxtn-gray-200 leading-relaxed">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-white/60 shrink-0" />
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Size Chart (Universal) */}
          <div className="border-t border-white/10 pt-6">
            <h4 className="font-display text-sm font-bold uppercase tracking-widest text-white mb-4">Size Guide</h4>
            
            <div className="overflow-x-auto border border-white/10 rounded-sm">
              <table className="w-full text-sm sm:text-base text-left whitespace-nowrap">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="px-4 py-3 font-display uppercase tracking-widest text-white font-normal border-r border-white/10">Size (Inches)</th>
                    <th className="px-4 py-3 font-display uppercase tracking-widest text-white font-normal text-center border-r border-white/10">S</th>
                    <th className="px-4 py-3 font-display uppercase tracking-widest text-white font-normal text-center border-r border-white/10">M</th>
                    <th className="px-4 py-3 font-display uppercase tracking-widest text-white font-normal text-center border-r border-white/10">L</th>
                    <th className="px-4 py-3 font-display uppercase tracking-widest text-white font-normal text-center border-r border-white/10">XL</th>
                    <th className="px-4 py-3 font-display uppercase tracking-widest text-white font-normal text-center">2XL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  <tr className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 font-medium text-white border-r border-white/10">Chest</td>
                    <td className="px-4 py-3 text-sxtn-gray-300 text-center border-r border-white/10">46</td>
                    <td className="px-4 py-3 text-sxtn-gray-300 text-center border-r border-white/10">48</td>
                    <td className="px-4 py-3 text-sxtn-gray-300 text-center border-r border-white/10">50</td>
                    <td className="px-4 py-3 text-sxtn-gray-300 text-center border-r border-white/10">52</td>
                    <td className="px-4 py-3 text-sxtn-gray-300 text-center">54</td>
                  </tr>
                  <tr className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 font-medium text-white border-r border-white/10">Length</td>
                    <td className="px-4 py-3 text-sxtn-gray-300 text-center border-r border-white/10">24</td>
                    <td className="px-4 py-3 text-sxtn-gray-300 text-center border-r border-white/10">25</td>
                    <td className="px-4 py-3 text-sxtn-gray-300 text-center border-r border-white/10">26</td>
                    <td className="px-4 py-3 text-sxtn-gray-300 text-center border-r border-white/10">27</td>
                    <td className="px-4 py-3 text-sxtn-gray-300 text-center">28</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-sxtn-gray-400 uppercase tracking-wider text-center">
              All in inches, expect tolerance by +/- 1in
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
