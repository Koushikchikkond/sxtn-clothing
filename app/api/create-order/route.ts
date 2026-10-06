import { NextRequest, NextResponse } from "next/server";
import {
  createRazorpayOrder,
  calculateVerifiedCartTotal,
  getRazorpayCredentials,
} from "@/lib/razorpay";

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
    const { amount, currency = "INR", receipt, notes, items } = body;

    let targetAmountInPaise = 0;

    // Security Anti-Tampering Check:
    // If the request supplies cart items, recalculate the genuine total from the database
    // to prevent users from manipulating prices in Developer Tools.
    if (items && Array.isArray(items) && items.length > 0) {
      const verified = await calculateVerifiedCartTotal(items);
      targetAmountInPaise = Math.round(verified.total * 100);
    } else if (typeof amount === "number") {
      targetAmountInPaise = Math.round(amount);
    } else if (typeof body.total === "number") {
      // If client sent total in rupees:
      targetAmountInPaise = Math.round(body.total * 100);
    }

    // Minimum order amount requirement: 100 paise (₹1.00)
    if (!targetAmountInPaise || targetAmountInPaise < 100) {
      return NextResponse.json(
        { error: "Invalid amount. Minimum amount is 100 paise (₹1.00)." },
        { status: 400 }
      );
    }

    const order = await createRazorpayOrder({
      amount: targetAmountInPaise,
      currency,
      receipt: receipt || `rcpt_${Date.now()}`,
      notes,
    });

    return NextResponse.json({
      order_id: order.order_id,
      orderId: order.orderId,
      amount: order.amount,
      currency: order.currency,
      key_id: credentials.keyId,
      keyId: credentials.keyId,
    });
  } catch (err: unknown) {
    console.error("[POST /api/create-order] Error:", err);
    const message = err instanceof Error ? err.message : "Failed to create order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
