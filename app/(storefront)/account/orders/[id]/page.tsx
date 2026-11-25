import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import React from "react";
import type { Order, OrderItem, OrderReturn, OrderReview } from "@/types/database.types";
import { CustomerOrderActions } from "@/components/account/customer-order-actions";
import { CustomerOrderRating } from "@/components/account/customer-order-rating";
import { AlertCircle, LogIn, Sparkles } from "lucide-react";

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
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ rate?: string }>;
}) {
  const { id } = await params;
  const sParams = searchParams ? await searchParams : {};
  const isRateMode = sParams.rate === "true";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Use adminDb to bypass strict RLS that hides orders where user_id is null (e.g. guest checkout)
  const adminDb = createAdminClient();
  const { data: orderRaw, error: orderErr } = await (adminDb.from("orders") as any)
    .select("*")
    .eq("id", id)
    .maybeSingle();

  // If order does not exist or was never confirmed/paid, return 404
  if (orderErr || !orderRaw || orderRaw.status === "pending") {
    notFound();
  }

  const order = orderRaw as unknown as Order;
  const orderEmail = (order.guest_email || (order.shipping_address as any)?.email)?.trim().toLowerCase();
  const userEmail = user?.email?.trim().toLowerCase();

  // Auto-claim order if authenticated user's email matches order's email
  let isOwner = false;
  if (user) {
    if (order.user_id === user.id) {
      isOwner = true;
    } else if (orderEmail && userEmail && orderEmail === userEmail) {
      isOwner = true;
      try {
        await (adminDb.from("orders") as any).update({ user_id: user.id }).eq("id", id);
        order.user_id = user.id;
      } catch (linkErr) {
        console.warn("[OrderDetailPage] Auto-claim notice:", linkErr);
      }
    }
  }

  // If user is logged in with an account that doesn't match this order and order is not delivered:
  if (user && !isOwner && order.status !== "delivered") {
    return (
      <div className="pt-28 pb-24 px-4 sm:px-6 lg:px-8 max-w-xl mx-auto min-h-screen text-center">
        <div className="p-8 border border-white/10 bg-[#0a0a0a]">
          <AlertCircle className="w-10 h-10 text-amber-400 mx-auto mb-4" />
          <h1 className="font-display text-2xl uppercase tracking-wider text-white mb-2">
            Different Account Detected
          </h1>
          <p className="text-white/60 text-sm mb-6 leading-relaxed">
            You are currently signed in as <strong>{user.email}</strong>, but this order was placed under a different address ({orderEmail ? `${orderEmail.slice(0, 3)}***@${orderEmail.split("@")[1]}` : "another email"}).
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href={`/login?next=${encodeURIComponent(`/account/orders/${id}${isRateMode ? "?rate=true" : ""}`)}`}
              className="w-full bg-white text-black py-3 rounded text-xs font-bold uppercase tracking-widest hover:bg-white/90 transition-colors"
            >
              Sign In with Order Email
            </Link>
            <Link
              href="/account/orders"
              className="text-xs uppercase tracking-widest text-white/40 hover:text-white"
            >
              Back to My Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // If user is not logged in and order is NOT delivered: redirect to login with full return URL
  if (!user && order.status !== "delivered") {
    redirect(`/login?next=${encodeURIComponent(`/account/orders/${id}${isRateMode ? "?rate=true" : ""}`)}`);
  }

  // Fetch items via adminDb so guest orders show pieces correctly
  const { data: itemsRaw } = await (adminDb.from("order_items") as any)
    .select("*")
    .eq("order_id", id);

  const items = (itemsRaw as unknown as OrderItem[]) ?? [];

  // Fetch available sizes & stock for exchange validation
  const variantIds = items.map((i) => i.variant_id).filter(Boolean) as string[];
  const productNames = items.map((i) => i.product_name).filter(Boolean);

  let productIds: string[] = [];
  if (variantIds.length > 0) {
    const { data: currentVariants } = await (adminDb.from("product_variants") as any)
      .select("id, product_id")
      .in("id", variantIds);

    productIds = (currentVariants || []).map((v: any) => v.product_id).filter(Boolean);
  }

  // Fetch all variants for matching products
  const { data: matchedProducts } = await (adminDb.from("products") as any)
    .select("id, name, product_variants(id, size, stock)")
    .or(
      productIds.length > 0
        ? `id.in.(${productIds.join(",")}),name.in.(${productNames.map((n) => `"${n.replace(/"/g, "")}"`).join(",")})`
        : `name.in.(${productNames.map((n) => `"${n.replace(/"/g, "")}"`).join(",")})`
    );

  const itemsWithVariants = items.map((item) => {
    let variants: Array<{ size: string; stock: number }> = [];
    const foundProduct = (matchedProducts || []).find(
      (p: any) => p.name?.toLowerCase() === item.product_name?.toLowerCase()
    );

    if (foundProduct && foundProduct.product_variants) {
      variants = (foundProduct.product_variants as any[]).map((v) => ({
        size: String(v.size),
        stock: Number(v.stock) || 0,
      }));
    }

    return {
      ...item,
      availableVariants: variants,
    };
  });

  const { data: returnsRaw } = await (adminDb.from("order_returns") as any)
    .select("*")
    .eq("order_id", id)
    .order("created_at", { ascending: false });

  const existingReturns = (returnsRaw as unknown as OrderReturn[]) ?? [];

  let existingReview: OrderReview | null = null;
  if (order.status === "delivered") {
    try {
      const { data: revData } = await (adminDb.from("order_reviews") as any)
        .select("*")
        .eq("order_id", id)
        .maybeSingle();
      existingReview = (revData as unknown as OrderReview) ?? null;
    } catch {
      existingReview = null;
    }
  }

  const address = order.shipping_address as Record<string, string> | null;
  const currentStep = STATUS_STEPS.indexOf(order.status);

  const customerName =
    address?.full_name ||
    address?.fullName ||
    user?.user_metadata?.full_name ||
    "Verified Customer";
  const customerCity = address?.city || "India";
  const customerState = address?.state || "";
  const primaryProductName = productNames.length > 0 ? productNames.join(", ") : undefined;

  return (
    <div className="pt-28 pb-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto min-h-screen">
      {/* Unauthenticated notification banner for delivered guest orders */}
      {!user && (
        <div className="mb-6 p-4 bg-zinc-900 border border-white/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-white/80">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Viewing delivered order <strong>#{order.id.slice(0, 8).toUpperCase()}</strong>. Rate your drop below or sign in to save it to your account.
            </span>
          </div>
          <Link
            href={`/login?next=${encodeURIComponent(`/account/orders/${id}${isRateMode ? "?rate=true" : ""}`)}`}
            className="inline-flex items-center gap-1.5 shrink-0 bg-white text-black px-3.5 py-1.5 font-bold uppercase tracking-wider text-[11px] hover:bg-white/90 transition-colors"
          >
            <LogIn className="w-3.5 h-3.5" />
            Sign In with Google
          </Link>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
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

      {/* Customer Cancellation / Tracking / Reason Banners */}
      <CustomerOrderActions
        orderId={order.id}
        status={order.status}
        notes={order.notes}
        total={order.total}
        awbNumber={(order as any).awb_number}
        courierName={(order as any).courier_name}
        trackingUrl={(order as any).tracking_url}
        items={itemsWithVariants}
        existingReturns={existingReturns}
        orderUpdatedAt={order.updated_at}
      />

      {/* 5-Star Customer Rating & Feedback for Delivered Orders */}
      {order.status === "delivered" && (
        <CustomerOrderRating
          orderId={order.id}
          status={order.status}
          initialReview={existingReview}
          customerName={customerName}
          customerCity={customerCity}
          customerState={customerState}
          productName={primaryProductName}
        />
      )}

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
                  INR {(item.unit_price * item.quantity).toLocaleString("en-IN")}
                </p>
              </li>
            ))}
          </ul>
          <div className="mt-4 pt-4 border-t border-white/10 space-y-2 text-sm">
            <div className="flex justify-between text-white/40">
              <span>Subtotal</span>
              <span>INR {order.subtotal.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between text-white/40">
              <span>Delivery</span>
              <span>{order.shipping_fee === 0 ? "FREE" : `INR ${order.shipping_fee.toLocaleString("en-IN")}`}</span>
            </div>
            {order.total - order.subtotal - order.shipping_fee > 0 && (
              <div className="flex justify-between text-white/40">
                <span>Packaging</span>
                <span>INR {(order.total - order.subtotal - order.shipping_fee).toLocaleString("en-IN")}</span>
              </div>
            )}
            <div className="flex justify-between text-white font-bold pt-2 border-t border-white/10">
              <span>Total</span>
              <span>INR {order.total.toLocaleString("en-IN")}</span>
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
              <p className="text-white font-medium">
                {address.full_name || address.fullName || "Recipient"}
              </p>
              {(address.email || order.guest_email) && (
                <p className="text-white/60 text-xs">
                  {address.email || order.guest_email}
                </p>
              )}
              <p>{address.line1}</p>
              {address.line2 && <p>{address.line2}</p>}
              <p>
                {address.city}, {address.state} — {address.pincode}
              </p>
              <p className="pt-1">Primary: {address.phone}</p>
              {(address.secondaryPhone || address.secondary_phone) && (
                <p>Secondary: {address.secondaryPhone || address.secondary_phone}</p>
              )}
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
