"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Heart, ShoppingBag } from "lucide-react";

interface WishlistProduct {
  product_id: string;
  created_at: string;
  products: {
    id: string;
    name: string;
    slug: string;
    price: number;
    compare_at_price: number | null;
    product_images: { url: string; position: number }[];
  } | null;
}

export default function WishlistPage() {
  const supabase = createClient();
  const router = useRouter();
  const [items, setItems] = useState<WishlistProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    const { data } = await supabase
      .from("wishlists")
      .select(`
        product_id,
        created_at,
        products (
          id, name, slug, price, compare_at_price,
          product_images ( url, position )
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setItems((data as unknown as WishlistProduct[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const removeFromWishlist = async (productId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("wishlists").delete().eq("user_id", user.id).eq("product_id", productId);
    setItems((prev) => prev.filter((i) => i.product_id !== productId));
  };

  return (
    <div className="pt-28 pb-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto min-h-screen">
      <div className="mb-10 flex items-end justify-between">
        <div>
          <Link href="/account" className="text-xs uppercase tracking-widest text-white/30 hover:text-white transition-colors">
            ← Account
          </Link>
          <h1 className="font-display text-5xl sm:text-6xl uppercase tracking-tight text-white mt-2">
            Wishlist
          </h1>
        </div>
        <p className="text-white/30 text-sm">{items.length} items</p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-white/30 text-sm">Loading…</div>
      ) : items.length === 0 ? (
        <div className="py-20 text-center border border-white/10">
          <Heart className="w-8 h-8 text-white/20 mx-auto mb-3" />
          <p className="text-white/30 text-sm mb-4">Your wishlist is empty.</p>
          <Link
            href="/collections/all"
            className="inline-block text-xs uppercase tracking-widest text-white border-b border-white/40 pb-0.5 hover:border-white transition-colors"
          >
            Explore Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-1 gap-y-10 md:gap-y-12">
          {items.map(({ product_id, products }) => {
            if (!products) return null;
            const coverImage = [...(products.product_images ?? [])]
              .sort((a, b) => a.position - b.position)[0];
            return (
              <div key={product_id} className="group relative">
                {/* Image */}
                <Link href={`/products/${products.slug}`} className="block relative aspect-[3/4] bg-zinc-900 overflow-hidden">
                  {coverImage ? (
                    <Image
                      src={coverImage.url}
                      alt={products.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag className="w-8 h-8 text-white/20" />
                    </div>
                  )}
                  {/* Remove button */}
                  <button
                    onClick={(e) => { e.preventDefault(); removeFromWishlist(product_id); }}
                    className="absolute top-3 right-3 p-2 bg-black/60 backdrop-blur-sm border border-white/20 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:border-red-500"
                    aria-label="Remove from wishlist"
                  >
                    <Heart className="w-3.5 h-3.5 fill-current" />
                  </button>
                </Link>
                {/* Info */}
                <div className="mt-2.5 space-y-1 px-2 pb-1">
                  <Link href={`/products/${products.slug}`} className="block">
                    <p className="font-display font-bold uppercase tracking-tight text-base sm:text-lg text-white truncate group-hover:underline underline-offset-2">
                      {products.name}
                    </p>
                  </Link>
                  <div className="flex items-center gap-2.5">
                    <span className="font-display font-bold text-base sm:text-lg text-white">
                      INR {products.price.toLocaleString("en-IN")}
                    </span>
                    {products.compare_at_price && (
                      <span className="text-xs sm:text-sm text-white/40 line-through">
                        INR {products.compare_at_price.toLocaleString("en-IN")}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
