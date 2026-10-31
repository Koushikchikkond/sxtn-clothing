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
    const { currency = "INR", receipt, notes, items } = body;

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
