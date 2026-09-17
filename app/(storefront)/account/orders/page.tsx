import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { Order } from "@/types/database.types";

type OrderRow = Pick<Order, "id" | "status" | "total" | "subtotal" | "shipping_fee" | "created_at">;

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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: ordersRaw } = await supabase
    .from("orders")
    .select("id, status, total, subtotal, shipping_fee, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const orders = (ordersRaw as unknown as OrderRow[]) ?? [];

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
        <ul className="space-y-3">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                href={`/account/orders/${order.id}`}
                className="flex items-center justify-between p-5 border border-white/10 hover:border-white/30 transition-colors group"
              >
                <div>
                  <p className="text-white font-mono font-medium">
                    #{order.id.slice(0, 8).toUpperCase()}
                  </p>
                  <p className="text-white/30 text-xs mt-1">
                    {new Date(order.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-6">
                  <span
                    className="text-xs uppercase tracking-widest px-2 py-1"
                    style={{
                      color: STATUS_COLOURS[order.status] ?? "#fff",
                      border: `1px solid ${STATUS_COLOURS[order.status] ?? "#fff"}33`,
                    }}
                  >
                    {order.status}
                  </span>
                  <div className="text-right">
                    <p className="text-white font-medium">
                      ₹{order.total.toLocaleString("en-IN")}
                    </p>
                    <p className="text-white/30 text-xs">
                      +₹{order.shipping_fee} shipping
                    </p>
                  </div>
                  <span className="text-white/20 group-hover:text-white/60 transition-colors text-lg">→</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
