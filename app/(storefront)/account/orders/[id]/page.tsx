import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import React from "react";
import type { Order, OrderItem } from "@/types/database.types";

const STATUS_COLOURS: Record<string, string> = {
  pending: "#f59e0b",
  paid: "#3b82f6",
  confirmed: "#8b5cf6",
  shipped: "#06b6d4",
  delivered: "#10b981",
  cancelled: "#ef4444",
};

const STATUS_STEPS = ["pending", "paid", "confirmed", "shipped", "delivered"];

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: orderRaw } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!orderRaw) notFound();
  const order = orderRaw as unknown as Order;

  const { data: itemsRaw } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", id);

  const items = (itemsRaw as unknown as OrderItem[]) ?? [];

  const address = order.shipping_address as Record<string, string> | null;
  const currentStep = STATUS_STEPS.indexOf(order.status);

  return (
    <div className="pt-28 pb-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto min-h-screen">
      {/* Header */}
      <div className="mb-10">
        <Link
          href="/account/orders"
          className="text-xs uppercase tracking-widest text-white/30 hover:text-white transition-colors"
        >
          ← Orders
        </Link>
        <div className="flex items-end justify-between mt-2">
          <h1 className="font-display text-4xl sm:text-5xl uppercase tracking-tight text-white">
            Order #{order.id.slice(0, 8).toUpperCase()}
          </h1>
          <span
            className="text-sm uppercase tracking-widest px-3 py-1.5"
            style={{
              color: STATUS_COLOURS[order.status] ?? "#fff",
              border: `1px solid ${STATUS_COLOURS[order.status] ?? "#fff"}`,
            }}
          >
            {order.status}
          </span>
        </div>
        <p className="text-white/30 text-sm mt-2">
          Placed on{" "}
          {new Date(order.created_at).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      {/* Progress Bar */}
      {order.status !== "cancelled" && (
        <div className="mb-10 border border-white/10 p-6">
          <p className="text-xs uppercase tracking-widest text-white/30 mb-5">Order Progress</p>
          <div className="flex items-center gap-0">
            {STATUS_STEPS.map((step, i) => (
              <React.Fragment key={step}>
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className="w-3 h-3 rounded-full border-2 transition-all"
                    style={{
                      background: i <= currentStep ? "#fff" : "transparent",
                      borderColor: i <= currentStep ? "#fff" : "#ffffff33",
                    }}
                  />
                  <span
                    className="text-xs uppercase tracking-widest"
                    style={{ color: i <= currentStep ? "#fff" : "#ffffff33" }}
                  >
                    {step}
                  </span>
                </div>
                {i < STATUS_STEPS.length - 1 && (
                  <div
                    className="flex-1 h-px mx-1 mb-4"
                    style={{ background: i < currentStep ? "#fff" : "#ffffff20" }}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Order Items */}
        <div className="md:col-span-2 border border-white/10 p-6">
          <h2 className="font-display text-xl uppercase tracking-tight text-white mb-4">
            Items
          </h2>
          <ul className="divide-y divide-white/10">
            {items?.map((item) => (
              <li key={item.id} className="py-4 flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-white font-medium">{item.product_name}</p>
                  <p className="text-white/30 text-xs mt-1 uppercase tracking-wide">
                    Size: {item.size ?? "—"}
                    {item.color ? ` · ${item.color}` : ""}
                  </p>
                  <p className="text-white/30 text-xs">Qty: {item.quantity}</p>
                </div>
                <p className="text-white font-medium whitespace-nowrap">
                  ₹{(item.unit_price * item.quantity).toLocaleString("en-IN")}
                </p>
              </li>
            ))}
          </ul>
          <div className="mt-4 pt-4 border-t border-white/10 space-y-2 text-sm">
            <div className="flex justify-between text-white/40">
              <span>Subtotal</span>
              <span>₹{order.subtotal.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between text-white/40">
              <span>Shipping</span>
              <span>₹{order.shipping_fee.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between text-white font-bold pt-2 border-t border-white/10">
              <span>Total</span>
              <span>₹{order.total.toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        <div className="border border-white/10 p-6">
          <h2 className="font-display text-xl uppercase tracking-tight text-white mb-4">
            Ship To
          </h2>
          {address ? (
            <div className="text-white/50 text-sm space-y-1 leading-relaxed">
              <p className="text-white font-medium">{address.full_name}</p>
              <p>{address.line1}</p>
              {address.line2 && <p>{address.line2}</p>}
              <p>
                {address.city}, {address.state} {address.pincode}
              </p>
              <p className="pt-1">{address.phone}</p>
            </div>
          ) : (
            <p className="text-white/30 text-sm">No address on record.</p>
          )}

          {order.razorpay_payment_id && (
            <div className="mt-6 pt-6 border-t border-white/10">
              <p className="text-xs uppercase tracking-widest text-white/30 mb-2">Payment</p>
              <p className="text-white/50 text-xs font-mono break-all">
                {order.razorpay_payment_id}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

