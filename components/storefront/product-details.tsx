"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Product, ProductImage, ProductVariant } from "@/types/database.types";
import { cn } from "@/lib/utils";
import { WishlistButton } from "@/components/storefront/wishlist-button";
import { NotifyMeModal } from "@/components/storefront/notify-me-modal";

interface ProductDetailsProps {
  product: Product;
  images: ProductImage[];
  variants: ProductVariant[];
}

export function ProductDetails({ product, images, variants }: ProductDetailsProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [sizeError, setSizeError] = useState(false);
  const [added, setAdded] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Touch swipe state
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);

  const hasMultipleImages = images && images.length > 1;
  const activeImage = (images && images[activeImageIndex]) || images?.[0];

  const handlePrevImage = useCallback((e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (!hasMultipleImages) return;
    setActiveImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }, [hasMultipleImages, images?.length]);

  const handleNextImage = useCallback((e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (!hasMultipleImages) return;
    setActiveImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }, [hasMultipleImages, images?.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null || touchStartY === null) return;
    const diffX = touchStartX - e.changedTouches[0].clientX;
    const diffY = touchStartY - e.changedTouches[0].clientY;

    // Must be predominantly horizontal gesture exceeding 40px
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 40) {
      if (diffX > 0) {
        handleNextImage();
      } else {
        handlePrevImage();
      }
    }
    setTouchStartX(null);
    setTouchStartY(null);
  };

  // Keyboard navigation (ArrowLeft / ArrowRight)
  useEffect(() => {
    if (!hasMultipleImages) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowLeft") handlePrevImage();
      if (e.key === "ArrowRight") handleNextImage();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasMultipleImages, handlePrevImage, handleNextImage]);

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

    // Client-side stock guard
    const availableStock = selectedVariant.stock ?? 0;
    if (availableStock <= 0) return;

    const { useCartStore } = await import("@/lib/stores/cart.store");
    const cartItems = useCartStore.getState().items;
    const existingInCart = cartItems.find((i) => i.variantId === selectedVariant.id);
    const currentInCart = existingInCart?.quantity ?? 0;

    // Cap requested qty to what's actually available beyond what's already in bag
    const canAdd = Math.max(0, availableStock - currentInCart);
    if (canAdd === 0) {
      setSizeError(true);
      setTimeout(() => setSizeError(false), 2000);
      return;
    }
    const effectiveQty = Math.min(qty, canAdd);

    const addItem = useCartStore.getState().addItem;
    for (let i = 0; i < effectiveQty; i++) {
      addItem({
        variantId: selectedVariant.id,
        productId: product.id,
        productSlug: product.slug,
        name: product.name,
        imageUrl: images[0]?.url ?? "",
        price: currentPrice,
        size: selectedSize,
        color: selectedVariant.color,
        stock: availableStock,
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
        {hasMultipleImages && (
          <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-visible no-scrollbar pb-2 md:pb-0">
            {images.map((img, idx) => (
              <button
                key={img.id}
                type="button"
                onClick={() => setActiveImageIndex(idx)}
                aria-label={`View image ${idx + 1}`}
                className={cn(
                  "relative shrink-0 w-20 h-24 bg-sxtn-gray-900 border transition-all touch-manipulation",
                  activeImageIndex === idx
                    ? "border-white"
                    : "border-transparent opacity-60 hover:opacity-100"
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
        )}

        {/* Main Image with Swipe & Slide Controls */}
        <div
          className="relative flex-1 aspect-[3/4] bg-sxtn-gray-900 overflow-hidden select-none"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {activeImage ? (
            <Image
              key={activeImage.id || activeImageIndex}
              src={activeImage.url}
              alt={activeImage.alt_text || product.name}
              fill
              priority
              className="object-contain transition-opacity duration-300"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-sxtn-gray-500 font-display tracking-widest">
              NO IMAGE
            </div>
          )}

          {/* Left and Right Slide Switching Buttons */}
          {hasMultipleImages && (
            <>
              <button
                type="button"
                onClick={handlePrevImage}
                aria-label="Previous image"
                className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-11 h-11 flex items-center justify-center bg-black/70 hover:bg-white text-white hover:text-black border border-white/20 hover:border-white transition-all backdrop-blur-sm touch-manipulation shadow-md group cursor-pointer"
              >
                <ChevronLeft className="w-6 h-6 transition-transform group-hover:-translate-x-0.5" />
              </button>

              <button
                type="button"
                onClick={handleNextImage}
                aria-label="Next image"
                className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-11 h-11 flex items-center justify-center bg-black/70 hover:bg-white text-white hover:text-black border border-white/20 hover:border-white transition-all backdrop-blur-sm touch-manipulation shadow-md group cursor-pointer"
              >
                <ChevronRight className="w-6 h-6 transition-transform group-hover:translate-x-0.5" />
              </button>

              {/* Slide Counter / Indicator */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 px-3 py-1 bg-black/70 backdrop-blur-sm border border-white/20 text-[11px] font-mono tracking-widest text-white/90 uppercase">
                {activeImageIndex + 1} / {images.length}
              </div>
            </>
          )}

          {/* Bookmark Wishlist Button (Top-Right) */}
          <WishlistButton
            productId={product.id}
            productName={product.name}
            className="absolute top-3 right-3 sm:top-5 sm:right-5 z-10"
            size="lg"
          />
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

        {/* Size / stock error */}
        {sizeError && (
          <p className="text-amber-400 text-xs sm:text-sm text-center py-2 mb-3 bg-amber-400/10">
            {!selectedSize
              ? "Please select a size first"
              : "Maximum available stock already in your bag"}
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
              onClick={() => {
                const maxQty = selectedVariant ? selectedVariant.stock : 10;
                setQty((q) => Math.min(maxQty, q + 1));
              }}
              disabled={selectedVariant ? qty >= selectedVariant.stock : false}
              className="h-12 w-12 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5 transition-colors text-lg touch-manipulation select-none disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
          {selectedVariant && selectedVariant.stock > 0 && selectedVariant.stock <= 5 && (
            <p className="text-amber-400 text-xs mt-2">
              Only {selectedVariant.stock} left in stock
            </p>
          )}
        </div>

        {/* Add to Bag */}
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
          {isOutOfStock ? "Out of Stock" : added ? "✓ Added to Bag" : "Add to Bag"}
        </button>

        {/* Notify Me when Out of Stock */}
        {isOutOfStock && (
          <div className="mt-3">
            <NotifyMeModal
              productId={product.id}
              productName={product.name}
              variantId={selectedVariant?.id}
              size={selectedSize}
              availableSizes={sizes}
              triggerClassName="w-full h-12 flex items-center justify-center gap-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 font-display text-xs font-bold uppercase tracking-widest transition-colors"
              buttonLabel={`Notify Me When ${selectedSize || "Item"} Is Back`}
            />
          </div>
        )}


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
