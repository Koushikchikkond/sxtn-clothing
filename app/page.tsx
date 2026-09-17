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

        <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-5xl mx-auto mt-20">
          <h1 className="font-display text-7xl md:text-9xl lg:text-[12rem] leading-none tracking-tighter uppercase mb-6 drop-shadow-2xl">
            SXTN
          </h1>
          <p className="text-lg md:text-xl font-light tracking-wide max-w-xl mx-auto mb-10 text-white/90">
            Define your uniform. Unapologetic streetwear for the modern era.
          </p>
          <Link
            href="/collections/all"
            className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-white px-8 py-4 text-black transition-transform hover:scale-105 active:scale-95"
          >
            <span className="font-medium uppercase tracking-widest text-sm relative z-10">
              Explore Collection
            </span>
            <ArrowRight className="h-4 w-4 relative z-10 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </section>

      {/* ─── Marquee Section ─────────────────────────────────────── */}
      <section className="py-6 border-y border-white/10 bg-black overflow-hidden flex whitespace-nowrap">
        <div className="animate-marquee flex items-center gap-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-8">
              <span className="font-display text-4xl tracking-widest uppercase">
                NEW ARRIVALS
              </span>
              <span className="text-white/50 text-2xl">✦</span>
              <span className="font-display text-4xl tracking-widest uppercase text-white/50">
                LIMITED EDITION
              </span>
              <span className="text-white/50 text-2xl">✦</span>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Latest Drops (Live from Supabase) ───────────────────── */}
      <section className="py-24 px-4 sm:px-6 lg:px-12 w-full mx-auto">
        <div className="flex items-end justify-between mb-12">
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
          <div className="py-24 flex flex-col items-center justify-center border border-white/10 text-center gap-4">
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
            {products.map((product) => {
              const cover = [...(product.product_images ?? [])]
                .sort((a, b) => a.position - b.position)[0];

              return (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  className="group flex flex-col gap-3 md:gap-4"
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
                  <div className="flex flex-col gap-0.5 md:gap-1">
                    <h3 className="font-medium tracking-widest uppercase text-xs md:text-sm">
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="font-display tracking-widest text-sm md:text-base">
                        ₹{product.price.toLocaleString("en-IN")}
                      </p>
                      {product.compare_at_price && (
                        <p className="text-white/30 text-xs line-through">
                          ₹{product.compare_at_price.toLocaleString("en-IN")}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <Link
          href="/collections/all"
          className="md:hidden mt-12 flex items-center justify-center gap-2 text-sm uppercase tracking-widest text-white/70 hover:text-white transition-colors border border-white/20 py-4 rounded-full"
        >
          View All Drops <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      {/* Spacer for mobile bottom nav */}
      <div className="h-24 md:hidden" />
    </div>
  );
}
