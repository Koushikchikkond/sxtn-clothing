import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { total } = body;

    if (!total || total <= 0) {
      return NextResponse.json({ error: "Invalid order total" }, { status: 400 });
    }

    const keyId     = process.env.RAZORPAY_KEY_ID!;
    const keySecret = process.env.RAZORPAY_KEY_SECRET!;

    // Encode credentials for Basic Auth (edge-compatible)
    const credentials = btoa(`${keyId}:${keySecret}`);

    // Call Razorpay REST API directly (no Node.js SDK needed)
    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${credentials}`,
      },
      body: JSON.stringify({
        amount:   Math.round(total * 100), // paise
        currency: "INR",
        receipt:  `sxtn_${Date.now()}`,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      console.error("[create-order] Razorpay error:", err);
      return NextResponse.json({ error: "Failed to create Razorpay order" }, { status: 500 });
    }

    const order = await response.json();

    return NextResponse.json({
      orderId:  order.id,
      amount:   order.amount,
      currency: order.currency,
      keyId,
    });
  } catch (err) {
    console.error("[create-order] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
