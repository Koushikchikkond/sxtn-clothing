import Link from "next/link";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getHeroBanner } from "@/lib/hero-banner";
import { HeroBannerSlider } from "@/components/storefront/hero-banner-slider";
import { ProductCard } from "@/components/storefront/product-card";
import type { Product, ProductImage } from "@/types/database.types";

type ProductWithCover = Product & {
  product_images: ProductImage[];
  product_variants?: Array<{ id: string; stock: number; size: string }>;
};

export default async function Home() {
  const supabase = await createClient();

  const [productsRes, heroBanner] = await Promise.all([
    supabase
      .from("products")
      .select(`
        id, name, slug, price, compare_at_price,
        product_images ( id, url, alt_text, position ),
        product_variants ( id, stock, size )
      `)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(8),
    getHeroBanner(),
  ]);

  const products = (productsRes.data as unknown as ProductWithCover[]) ?? [];

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      {/* ─── Hero Section with Multi-Image Loop ─────────────────── */}
      <HeroBannerSlider banner={heroBanner} />

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
          <div className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-0 gap-y-10 md:gap-y-12 px-0">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
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
