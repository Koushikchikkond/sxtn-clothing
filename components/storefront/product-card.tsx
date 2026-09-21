import Link from "next/link";
import Image from "next/image";
import { Product, ProductImage } from "@/types/database.types";

export type ProductWithImages = Product & {
  product_images: ProductImage[];
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

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="relative aspect-[3/4] mb-3 bg-sxtn-gray-900 overflow-hidden">
        {primaryImage ? (
          <>
            <Image
              src={primaryImage.url}
              alt={primaryImage.alt_text || product.name}
              fill
              className="object-cover transition-opacity duration-500 group-hover:opacity-0"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            />
            {secondaryImage && (
              <Image
                src={secondaryImage.url}
                alt={secondaryImage.alt_text || product.name}
                fill
                className="object-cover absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
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
        {product.compare_at_price && (
          <div className="absolute top-2 right-2 bg-white text-black px-2 py-1 text-[10px] font-bold uppercase tracking-widest z-10">
            Sale
          </div>
        )}
      </div>

      <div className="pt-2 pb-1 px-2 space-y-1.5">
        <h3 className="font-display text-base sm:text-lg md:text-xl font-bold tracking-tight uppercase text-white leading-snug">
          {product.name}
        </h3>
        <div className="flex items-center gap-2.5">
          <span className="font-display text-base sm:text-lg md:text-xl font-bold text-white tracking-tight">
            ₹{product.price.toLocaleString("en-IN")}
          </span>
          {product.compare_at_price && (
            <span className="text-xs sm:text-sm text-white/40 line-through">
              ₹{product.compare_at_price.toLocaleString("en-IN")}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
