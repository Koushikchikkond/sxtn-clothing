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
  // Sort images by position to ensure we get primary and secondary
  const sortedImages = [...(product.product_images || [])].sort(
    (a, b) => a.position - b.position
  );

  const primaryImage = sortedImages[0];
  const secondaryImage = sortedImages.length > 1 ? sortedImages[1] : null;

  // Stock evaluation
  const variants = product.product_variants || [];
  const isOutOfStock =
    variants.length > 0 && variants.every((v) => (v.stock ?? 0) <= 0);
  const availableSizes = variants.map((v) => v.size).filter(Boolean);

  return (
    <div className="group block relative">
      <Link href={`/products/${product.slug}`} prefetch={true} className="block">
        <div className="relative aspect-[3/4] mb-3 bg-sxtn-gray-900 overflow-hidden">
          {primaryImage ? (
            <>
              <Image
                src={primaryImage.url}
                alt={primaryImage.alt_text || product.name}
                fill
                className={`object-cover transition-transform duration-700 ease-out group-hover:scale-105 ${
                  isOutOfStock ? "opacity-60 grayscale-[40%]" : ""
                }`}
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              />
              {secondaryImage && !isOutOfStock && (
                <Image
                  src={secondaryImage.url}
                  alt={secondaryImage.alt_text || product.name}
                  fill
                  className="object-cover absolute inset-0 opacity-0 transition-all duration-500 ease-in-out group-hover:opacity-100 group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                />
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-sxtn-gray-500 font-display text-sm tracking-widest">
              NO IMAGE
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

          {/* Bookmark Wishlist Button (Top-Right) */}
          <WishlistButton
            productId={product.id}
            productName={product.name}
            className="absolute top-2.5 right-2.5"
            size="sm"
          />
        </div>

        <div className="pt-2 pb-1 px-2 space-y-1.5">
          <h3 className="font-display text-base sm:text-lg md:text-xl font-bold tracking-tight uppercase text-white leading-snug">
            {product.name}
          </h3>
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
