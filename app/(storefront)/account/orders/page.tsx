import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { claimUserOrdersByEmail } from "@/lib/orders";
import Link from "next/link";
import Image from "next/image";
import { Heart } from "lucide-react";
import type { Order } from "@/types/database.types";

interface OrderItemRow {
  id: string;
  product_name: string;
  variant_id: string | null;
  size: string | null;
  color: string | null;
  quantity: number;
}

type OrderRow = Pick<Order, "id" | "status" | "total" | "subtotal" | "shipping_fee" | "created_at"> & {
  guest_email?: string | null;
  order_items?: OrderItemRow[];
};

const STATUS_COLOURS: Record<string, string> = {
  pending: "#f59e0b",
  paid: "#3b82f6",
  confirmed: "#8b5cf6",
  shipped: "#06b6d4",
  delivered: "#10b981",
  cancelled: "#ef4444",
};

export default async function OrdersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/account/orders");

  const adminDb = createAdminClient();

  // Auto-claim any unlinked orders with user's email
  if (user.email) {
    try {
      await claimUserOrdersByEmail(user.id, user.email);
    } catch (claimErr) {
      console.warn("[OrdersPage] Auto-claim notice:", claimErr);
    }
  }

  const [ordersRes, productsRes, reviewsRes] = await Promise.all([
    (adminDb.from("orders") as any)
      .select(`
        id, status, total, subtotal, shipping_fee, created_at, guest_email,
        order_items (
          id, product_name, variant_id, size, color, quantity
        )
      `)
      .or(user.email ? `user_id.eq.${user.id},guest_email.ilike.${user.email.trim().toLowerCase()}` : `user_id.eq.${user.id}`)
      .neq("status", "pending")
      .order("created_at", { ascending: false }),
    (adminDb.from("products") as any)
      .select(`
        id, name,
        product_images ( url, position ),
        product_variants ( id )
      `),
    (adminDb.from("order_reviews") as any)
      .select("order_id, rating, comment"),
  ]);

  const orders = (ordersRes.data as unknown as OrderRow[]) ?? [];
  const reviewsData = (reviewsRes.data as Array<{ order_id: string; rating: number; comment?: string }>) || [];
  const reviewsByOrder = new Map(reviewsData.map((r) => [r.order_id, r]));

  // Map product names and variant IDs to primary product images
  const nameToImageMap: Record<string, string> = {};
  const variantToImageMap: Record<string, string> = {};

  if (Array.isArray(productsRes.data)) {
    productsRes.data.forEach((p: any) => {
      const sortedImages = Array.isArray(p.product_images)
        ? [...p.product_images].sort((a: any, b: any) => (a.position || 0) - (b.position || 0))
        : [];
      const primaryUrl = sortedImages[0]?.url;

      if (primaryUrl) {
        if (p.name) {
          nameToImageMap[p.name.trim().toLowerCase()] = primaryUrl;
        }
        if (Array.isArray(p.product_variants)) {
          p.product_variants.forEach((v: any) => {
            if (v.id) variantToImageMap[v.id] = primaryUrl;
          });
        }
      }
    });
  }

  function resolveItemImage(item: OrderItemRow): string | null {
    if (item.variant_id && variantToImageMap[item.variant_id]) {
      return variantToImageMap[item.variant_id];
    }
    if (item.product_name) {
      const key = item.product_name.trim().toLowerCase();
      if (nameToImageMap[key]) return nameToImageMap[key];

      for (const [catName, url] of Object.entries(nameToImageMap)) {
        if (key.includes(catName) || catName.includes(key)) {
          return url;
        }
      }
    }
    return null;
  }

  return (
    <div className="pt-28 pb-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto min-h-screen">
      <div className="mb-10 flex items-end justify-between">
        <div>
          <Link
            href="/account"
            className="text-xs uppercase tracking-widest text-white/30 hover:text-white transition-colors"
          >
            ← Account
          </Link>
          <h1 className="font-display text-5xl sm:text-6xl uppercase tracking-tight text-white mt-2">
            My Orders
          </h1>
        </div>
        <p className="text-white/30 text-sm">{orders?.length ?? 0} orders</p>
      </div>

      {!orders || orders.length === 0 ? (
        <div className="py-20 text-center border border-white/10">
          <p className="text-white/30 text-sm mb-4">You haven't placed any orders yet.</p>
          <Link
            href="/collections/all"
            className="inline-block text-xs uppercase tracking-widest text-white border-b border-white/40 pb-0.5 hover:border-white transition-colors"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {orders.map((order) => {
            const items = order.order_items || [];
            const itemImages = items
              .map((i) => resolveItemImage(i))
              .filter(Boolean) as string[];

            const productNames = items.map((i) => i.product_name).filter(Boolean);
            const productSummary =
              productNames.length > 0
                ? productNames.slice(0, 2).join(", ") +
                  (productNames.length > 2 ? ` +${productNames.length - 2} more` : "")
                : "6XTN Clothing";

            const existingReview = reviewsByOrder.get(order.id);

            return (
              <li key={order.id} className="overflow-hidden">
                <Link
                  href={`/account/orders/${order.id}`}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 border border-white/10 hover:border-white/30 transition-colors group gap-4 bg-[#0a0a0a]"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    {/* Small T-Shirt Icon / Image Thumbnail */}
                    <div className="relative shrink-0 flex items-center">
                      {itemImages.length > 0 ? (
                        <div className="flex items-center -space-x-3">
                          {itemImages.slice(0, 2).map((imgUrl, idx) => (
                            <div
                              key={idx}
                              className="relative w-12 h-14 sm:w-13 sm:h-15 bg-zinc-900 border border-white/20 overflow-hidden shrink-0 shadow-md"
                              style={{ zIndex: 10 - idx }}
                            >
                              <Image
                                src={imgUrl}
                                alt="Ordered piece"
                                fill
                                sizes="60px"
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                          ))}
                          {itemImages.length > 2 && (
                            <div
                              className="relative w-12 h-14 sm:w-13 sm:h-15 bg-zinc-800 border border-white/20 flex items-center justify-center text-[10px] font-mono text-white/70 font-bold shrink-0"
                              style={{ zIndex: 5 }}
                            >
                              +{itemImages.length - 2}
                            </div>
                          )}
                        </div>
                      ) : (
                        /* Minimalist T-Shirt SVG Icon Fallback */
                        <div className="w-12 h-14 sm:w-13 sm:h-15 bg-zinc-900 border border-white/10 flex items-center justify-center text-white/30 shrink-0">
                          <svg
                            className="w-6 h-6 text-white/40"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Order Reference, Item Summary & Date */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-white font-mono font-bold text-sm">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </p>
                        <span
                          className="text-[10px] uppercase font-mono tracking-widest px-2 py-0.5"
                          style={{
                            color: STATUS_COLOURS[order.status] ?? "#fff",
                            border: `1px solid ${STATUS_COLOURS[order.status] ?? "#fff"}33`,
                          }}
                        >
                          {order.status}
                        </span>
                      </div>

                      <p className="text-white/80 text-xs sm:text-sm font-medium mt-1 truncate max-w-[260px] sm:max-w-md">
                        {productSummary}
                      </p>

                      {items.some((i) => i.size) && (
                        <p className="text-white/50 text-xs font-mono mt-0.5">
                          {items
                            .map((i) => `${i.size ? `Size ${i.size}` : ""}${i.quantity > 1 ? ` × ${i.quantity}` : ""}`)
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      )}

                      <p className="text-white/30 text-xs mt-0.5 font-mono">
                        {new Date(order.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Price & Forward Link Arrow */}
                  <div className="flex items-center justify-between sm:justify-end gap-5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                    <div className="text-left sm:text-right">
                      <p className="text-white font-medium font-mono text-sm sm:text-base">
                        INR {order.total.toLocaleString("en-IN")}
                      </p>
                      <p className="text-white/30 text-[11px] font-mono">
                        {order.shipping_fee === 0 ? "FREE shipping" : `+INR ${order.shipping_fee} shipping`}
                      </p>
                    </div>
                    <span className="text-white/30 group-hover:text-white transition-colors text-lg">
                      →
                    </span>
                  </div>
                </Link>

                {/* Rating & Feedback Section Below Order for Delivered Orders */}
                {order.status === "delivered" && (
                  <div className="px-4 py-2.5 bg-zinc-950 border-x border-b border-white/10 flex items-center justify-between flex-wrap gap-2">
                    {existingReview ? (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-[#ff6d75] text-xs">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Heart
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i < existingReview.rating
                                  ? "fill-[#ff6d75] text-[#ff6d75]"
                                  : "text-zinc-600 fill-zinc-800/40"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-[11px] font-mono text-white/70">
                          {existingReview.rating}/5 Verified Rating
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-[#ff6d75]">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Heart
                              key={i}
                              className="w-3.5 h-3.5 fill-[#ff6d75] text-[#ff6d75]"
                            />
                          ))}
                        </div>
                        <span className="text-white/60 text-xs font-sans">
                          Rate this drop
                        </span>
                      </div>
                    )}

                    <Link
                      href={`/account/orders/${order.id}?rate=true`}
                      className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#ff6d75] hover:text-white underline transition-colors"
                    >
                      {existingReview ? "Edit Review" : "Rate Order & Feedback →"}
                    </Link>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
