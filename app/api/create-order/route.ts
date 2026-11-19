import { NextRequest, NextResponse } from "next/server";
import {
  createRazorpayOrder,
  calculateVerifiedCartTotal,
  getRazorpayCredentials,
} from "@/lib/razorpay";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { TablesInsert } from "@/types/database.types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    let credentials;
    try {
      credentials = getRazorpayCredentials();
    } catch (credErr: unknown) {
      const msg = credErr instanceof Error ? credErr.message : "Razorpay credentials not configured or unauthorized";
      console.error("[POST /api/create-order] Credentials error:", msg);
      return NextResponse.json(
        { error: msg },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { currency = "INR", receipt, notes, items, address } = body;

    // Security Anti-Tampering Requirement:
    // Every order must supply cart items so the server recalculates the genuine
    // database price and prevents client price manipulation.
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Cart items are required to create an order." },
        { status: 400 }
      );
    }

    const verified = await calculateVerifiedCartTotal(items);
    const targetAmountInPaise = Math.round(verified.total * 100);

    // Minimum order amount requirement: 100 paise (₹1.00)
    if (!targetAmountInPaise || targetAmountInPaise < 100) {
      return NextResponse.json(
        { error: "Invalid amount. Minimum amount is 100 paise (₹1.00)." },
        { status: 400 }
      );
    }

    const rzpOrder = await createRazorpayOrder({
      amount: targetAmountInPaise,
      currency,
      receipt: receipt || `rcpt_${Date.now()}`,
      notes,
    });

    // ── Pre-save a pending order row so the webhook can recover if the client drops ──
    // shortcut: stock is not decremented here — verify-payment / webhook handles it after capture
    try {
      const adminDb = createAdminClient();
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();

      const sanitizedEmail = (user?.email ?? address?.email ?? null)?.trim().toLowerCase() || null;
      const sanitizedAddress = address
        ? {
            ...address,
            email: address.email ? address.email.trim().toLowerCase() : undefined,
            packaging_fee: verified.packagingFee,
          }
        : null;

      const pendingOrderPayload: TablesInsert<"orders"> = {
        user_id: user?.id ?? null,
        guest_email: sanitizedEmail,
        status: "pending",
        subtotal: verified.subtotal,
        shipping_fee: verified.shippingFee,
        total: verified.total,
        razorpay_order_id: rzpOrder.orderId,
        razorpay_payment_id: null,
        shipping_address: sanitizedAddress,
      };

      const { data: pendingOrder } = await adminDb
        .from("orders")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .insert(pendingOrderPayload as any)
        .select("id")
        .single();

      if (pendingOrder) {
        const pendingItems: TablesInsert<"order_items">[] = verified.items.map((item) => ({
          order_id: (pendingOrder as { id: string }).id,
          variant_id: item.variantId,
          product_name: item.name,
          size: item.size,
          color: item.color,
          unit_price: item.price,
          quantity: item.quantity,
        }));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await adminDb.from("order_items").insert(pendingItems as any);
        console.log(`[POST /api/create-order] Pending order ${pendingOrder.id} saved for Razorpay order ${rzpOrder.orderId}`);
      }
    } catch (dbErr) {
      // Non-fatal: Razorpay order still created. Log and continue.
      // The webhook fallback will still work via razorpay_order_id lookup.
      console.error("[POST /api/create-order] Warning: could not pre-save pending order:", dbErr);
    }

    return NextResponse.json({
      order_id: rzpOrder.order_id,
      orderId: rzpOrder.orderId,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      key_id: credentials.keyId,
      keyId: credentials.keyId,
    });
  } catch (err: unknown) {
    console.error("[POST /api/create-order] Error:", err);
    const message = err instanceof Error ? err.message : "Failed to create order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
