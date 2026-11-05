"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Product, ProductImage } from "@/types/database.types";
import { WishlistButton } from "@/components/storefront/wishlist-button";
import { NotifyMeModal } from "@/components/storefront/notify-me-modal";

export type ProductWithImages = Product & {
  product_images: ProductImage[];
  product_variants?: Array<{ id: string; stock: number; size: string }>;
};

interface ProductCardProps {
  product: ProductWithImages;
}

export function ProductCard({ product }: ProductCardProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const swipedRef = useRef(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);

  // Sort images by position
  const sortedImages = [...(product.product_images || [])].sort(
    (a, b) => a.position - b.position
  );

  const primaryImage = sortedImages[0];
  const secondaryImage = sortedImages.length > 1 ? sortedImages[1] : null;
  const hasMultiple = sortedImages.length > 1;
  const currentImage = sortedImages[currentIdx] || sortedImages[0];

  // Stock evaluation
  const variants = product.product_variants || [];
  const isOutOfStock =
    variants.length > 0 && variants.every((v) => (v.stock ?? 0) <= 0);
  const availableSizes = variants.map((v) => v.size).filter(Boolean);

  const handleTouchStart = (e: React.TouchEvent) => {
    swipedRef.current = false;
    setTouchStartX(e.touches[0].clientX);
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null || touchStartY === null) return;
    const diffX = touchStartX - e.changedTouches[0].clientX;
    const diffY = touchStartY - e.changedTouches[0].clientY;

    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 35) {
      swipedRef.current = true;
      if (diffX > 0) {
        if (hasMultiple) {
          setCurrentIdx((prev) => (prev === sortedImages.length - 1 ? 0 : prev + 1));
        }
      } else {
        if (hasMultiple) {
          setCurrentIdx((prev) => (prev === 0 ? sortedImages.length - 1 : prev - 1));
        }
      }
    }
    setTouchStartX(null);
    setTouchStartY(null);
  };

  return (
    <div className="group block relative">
      <Link
        href={`/products/${product.slug}`}
        prefetch={true}
        onClick={(e) => {
          if (swipedRef.current) {
            e.preventDefault();
            swipedRef.current = false;
          }
        }}
        className="block"
      >
        <div
          className="relative aspect-[3/4] mb-3 bg-sxtn-gray-900 overflow-hidden select-none"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {primaryImage ? (
            <>
              {/* Primary Image: Scales subtly on hover, visible by default */}
              <Image
                src={currentIdx === 0 ? primaryImage.url : currentImage.url}
                alt={currentImage.alt_text || product.name}
                fill
                className={`object-cover transition-transform duration-700 ease-in-out group-hover:scale-105 ${
                  isOutOfStock ? "opacity-60 grayscale-[40%]" : ""
                }`}
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              />

              {/* Secondary Image: Smoothly fades in on hover, fades back on mouse leave */}
              {currentIdx === 0 && secondaryImage && !isOutOfStock && (
                <Image
                  src={secondaryImage.url}
                  alt={secondaryImage.alt_text || product.name}
                  fill
                  className="object-cover absolute inset-0 opacity-0 transition-all duration-700 ease-in-out group-hover:opacity-100 group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                />
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-sxtn-gray-500 font-display text-sm tracking-widest">
              NO IMAGE
            </div>
          )}

          {/* Dots Indicator */}
          {hasMultiple && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 px-2 py-0.5 bg-black/60 backdrop-blur-xs rounded-full border border-white/10 pointer-events-none">
              {sortedImages.map((_, i) => (
                <span
                  key={i}
                  className={`h-1 transition-all rounded-full ${
                    i === currentIdx ? "w-2.5 bg-white" : "w-1 bg-white/40"
                  }`}
                />
              ))}
            </div>
          )}

          {/* Badges */}
          {isOutOfStock ? (
            <div className="absolute top-3 left-3 bg-red-600 text-white px-2 py-1 text-[10px] font-bold uppercase tracking-widest z-10 shadow-lg">
              Out of Stock
            </div>
          ) : product.compare_at_price ? (
            <div className="absolute top-3 left-3 bg-white text-black px-2 py-1 text-[10px] font-bold uppercase tracking-widest z-10">
              Sale
            </div>
          ) : null}
        </div>

        <div className="pt-2 pb-1 px-2 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display text-base sm:text-lg md:text-xl font-bold tracking-tight uppercase text-white leading-snug">
              {product.name}
            </h3>
            <WishlistButton
              productId={product.id}
              productName={product.name}
              className="shrink-0 mt-0.5"
              size="sm"
            />
          </div>
          <div className="flex items-center gap-2.5">
            <span className="font-display text-base sm:text-lg md:text-xl font-bold text-white tracking-tight">
              INR {product.price.toLocaleString("en-IN")}
            </span>
            {product.compare_at_price && (
              <span className="text-xs sm:text-sm text-white/40 line-through">
                INR {product.compare_at_price.toLocaleString("en-IN")}
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Notify Me trigger if item is out of stock */}
      {isOutOfStock && (
        <div className="px-2 pt-2">
          <NotifyMeModal
            productId={product.id}
            productName={product.name}
            availableSizes={availableSizes}
            triggerClassName="w-full h-9 flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white text-white hover:text-black text-xs font-bold uppercase tracking-widest border border-white/20 transition-all rounded-none"
            buttonLabel="Notify Me"
          />
        </div>
      )}
    </div>
  );
}
