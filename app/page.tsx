import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Product, ProductImage } from "@/types/database.types";

type ProductWithCover = Product & { product_images: ProductImage[] };

export default async function Home() {
  const supabase = await createClient();

  const { data: productsRaw } = await supabase
    .from("products")
    .select(`
      id, name, slug, price, compare_at_price,
      product_images ( id, url, position )
    `)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(8);

  const products = (productsRaw as unknown as ProductWithCover[]) ?? [];

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      {/* ─── Hero Section ────────────────────────────────────────── */}
      <section className="relative h-screen w-full flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=3000&auto=format&fit=crop"
            alt="SXTN Hero"
            fill
            className="object-cover opacity-50"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black" />
        </div>


      </section>



      {/* ─── Latest Drops (Live from Supabase) ───────────────────── */}
      <section className="py-24 w-full mx-auto">
        <div className="flex items-end justify-between mb-12 px-4 sm:px-6 lg:px-12">
          <h2 className="font-display text-5xl md:text-7xl uppercase tracking-wide">
            Latest Drops
          </h2>
          <Link
            href="/collections/all"
            className="hidden md:flex items-center gap-2 text-sm uppercase tracking-widest text-white/70 hover:text-white transition-colors"
          >
            View All <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {products.length === 0 ? (
          /* Empty state — shown when no products are in Supabase yet */
          <div className="mx-4 sm:mx-6 lg:mx-12 py-24 flex flex-col items-center justify-center border border-white/10 text-center gap-4">
            <ShoppingBag className="w-12 h-12 text-white/20" />
            <p className="text-white/40 text-sm uppercase tracking-widest">
              No products yet. Add your first drop in the admin panel.
            </p>
            <Link
              href="/admin/products/new"
              className="mt-2 text-xs uppercase tracking-widest text-white border-b border-white/30 hover:border-white pb-0.5 transition-colors"
            >
              Add Product →
            </Link>
          </div>
        ) : (
          <div className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-1 gap-y-10 md:gap-y-12 px-0">
            {products.map((product) => {
              const cover = [...(product.product_images ?? [])]
                .sort((a, b) => a.position - b.position)[0];

              return (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  className="group flex flex-col gap-3"
                >
                  <div className="relative aspect-[3/4] w-full overflow-hidden bg-zinc-900">
                    {cover ? (
                      <Image
                        src={cover.url}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="w-10 h-10 text-white/20" />
                      </div>
                    )}
                    {product.compare_at_price && (
                      <span className="absolute top-3 left-3 bg-white text-black text-xs font-bold uppercase tracking-widest px-2 py-1">
                        Sale
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 px-2 pt-2 pb-1">
                    <h3 className="font-display font-bold tracking-tight uppercase text-base sm:text-lg md:text-xl text-white leading-snug">
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-2.5 mt-1">
                      <p className="font-display font-bold tracking-tight text-base sm:text-lg md:text-xl text-white">
                        INR {product.price.toLocaleString("en-IN")}
                      </p>
                      {product.compare_at_price && (
                        <p className="text-xs sm:text-sm text-white/40 line-through">
                          INR {product.compare_at_price.toLocaleString("en-IN")}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <div className="px-4">
          <Link
            href="/collections/all"
            className="md:hidden mt-12 flex items-center justify-center gap-2 text-sm uppercase tracking-widest text-white/70 hover:text-white transition-colors border border-white/20 py-4 rounded-full"
          >
            View All Drops <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Spacer for mobile bottom nav */}
      <div className="h-24 md:hidden" />
    </div>
  );
}
