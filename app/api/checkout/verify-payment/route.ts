import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { TablesInsert } from "@/types/database.types";

/** HMAC-SHA256 using Web Crypto API (edge-compatible, no Node crypto module) */
async function hmacSha256(secret: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      items,
      subtotal,
      shippingFee,
      total,
      address,
    } = body;

    // 1. Verify Razorpay signature (Web Crypto — works on edge)
    const expectedSignature = await hmacSha256(
      process.env.RAZORPAY_KEY_SECRET!,
      `${razorpay_order_id}|${razorpay_payment_id}`
    );

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
    }

    // 2. Save order to Supabase
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const orderPayload: TablesInsert<"orders"> = {
      user_id:             user?.id ?? null,
      status:              "paid",
      subtotal,
      shipping_fee:        shippingFee,
      total,
      razorpay_order_id,
      razorpay_payment_id,
      shipping_address:    address,
    };

    const { data: order, error: orderError } = await supabase
      .from("orders")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .insert(orderPayload as any)
      .select("id")
      .single();

    if (orderError || !order) {
      console.error("[verify-payment] Order insert failed:", orderError);
      return NextResponse.json({ error: "Failed to save order" }, { status: 500 });
    }

    const orderItems: TablesInsert<"order_items">[] = items.map((item: {
      variantId: string;
      name:      string;
      size:      string;
      color:     string | null;
      price:     number;
      quantity:  number;
    }) => ({
      order_id:     (order as { id: string }).id,
      variant_id:   item.variantId,
      product_name: item.name,
      size:         item.size,
      color:        item.color,
      unit_price:   item.price,
      quantity:     item.quantity,
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await supabase.from("order_items").insert(orderItems as any);

    return NextResponse.json({ success: true, orderId: (order as { id: string }).id });
  } catch (err) {
    console.error("[verify-payment] Error:", err);
    return NextResponse.json({ error: "Payment verification failed" }, { status: 500 });
  }
}
