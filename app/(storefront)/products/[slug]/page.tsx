import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { ProductDetails } from "@/components/storefront/product-details";
import { ShoppingBag } from "lucide-react";
import type { Product, ProductImage, ProductVariant } from "@/types/database.types";

type ProductWithRelations = Product & {
  product_images: ProductImage[];
  product_variants: ProductVariant[];
};

type SuggestionProduct = Pick<Product, "id" | "name" | "slug" | "price" | "compare_at_price"> & {
  product_images: Pick<ProductImage, "url" | "position">[];
};

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  // Fetch the main product
  const { data: product, error } = await supabase
    .from("products")
    .select(`
      *,
      product_images ( id, url, alt_text, position ),
      product_variants ( id, size, color, sku, stock, price_override )
    `)
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (error || !product) {
    console.error("Error fetching product:", error);
    notFound();
  }

  const typedProduct = product as unknown as ProductWithRelations;

  const sortedImages = [...(typedProduct.product_images || [])].sort(
    (a, b) => a.position - b.position
  );

  // Fetch suggestions — same category, exclude current product, max 4
  const { data: suggestionsRaw } = await supabase
    .from("products")
    .select(`
      id, name, slug, price, compare_at_price,
      product_images ( url, position )
    `)
    .eq("is_active", true)
    .eq("category_id", typedProduct.category_id ?? "")
    .neq("id", typedProduct.id)
    .limit(4);

  // If not enough from same category, fall back to latest products
  let suggestions = (suggestionsRaw as unknown as SuggestionProduct[]) ?? [];
  if (suggestions.length < 4) {
    const { data: fallbackRaw } = await supabase
      .from("products")
      .select(`
        id, name, slug, price, compare_at_price,
        product_images ( url, position )
      `)
      .eq("is_active", true)
      .neq("id", typedProduct.id)
      .order("created_at", { ascending: false })
      .limit(4);
    suggestions = (fallbackRaw as unknown as SuggestionProduct[]) ?? [];
  }

  return (
    <div className="min-h-screen">
      {/* ── Product Detail ────────────────────────── */}
      <div className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <ProductDetails
          product={typedProduct}
          images={sortedImages}
          variants={typedProduct.product_variants || []}
        />
      </div>

      {/* ── You May Also Like ─────────────────────── */}
      {suggestions.length > 0 && (
        <section className="py-20 px-4 sm:px-6 lg:px-12 border-t border-white/10">
          <div className="max-w-7xl mx-auto">
            <h2 className="font-display text-4xl md:text-5xl uppercase tracking-wide mb-10">
              You May Also Like
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
              {suggestions.map((s) => {
                const cover = [...(s.product_images ?? [])]
                  .sort((a, b) => a.position - b.position)[0];
                return (
                  <Link
                    key={s.id}
                    href={`/products/${s.slug}`}
                    className="group flex flex-col gap-3"
                  >
                    <div className="relative aspect-[3/4] w-full overflow-hidden bg-zinc-900">
                      {cover ? (
                        <Image
                          src={cover.url}
                          alt={s.name}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="w-8 h-8 text-white/20" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-white font-medium text-xs uppercase tracking-widest">
                        {s.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="font-display text-sm tracking-widest text-white">
                          ₹{s.price.toLocaleString("en-IN")}
                        </p>
                        {s.compare_at_price && (
                          <p className="text-white/30 text-xs line-through">
                            ₹{s.compare_at_price.toLocaleString("en-IN")}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
