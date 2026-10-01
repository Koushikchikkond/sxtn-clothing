import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.warn(
        "[Razorpay Webhook] RAZORPAY_WEBHOOK_SECRET is not configured. Webhook skipped."
      );
      return NextResponse.json(
        { error: "Webhook secret not configured on server" },
        { status: 500 }
      );
    }

    const signature = req.headers.get("x-razorpay-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing x-razorpay-signature header" },
        { status: 400 }
      );
    }

    // Read raw body for HMAC verification
    const rawBody = await req.text();

    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    // Timing-safe comparison to prevent side-channel timing attacks
    const sigA = Buffer.from(expectedSignature, "utf8");
    const sigB = Buffer.from(signature, "utf8");

    if (sigA.length !== sigB.length || !crypto.timingSafeEqual(sigA, sigB)) {
      console.error("[Razorpay Webhook] Invalid signature received");
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 400 }
      );
    }

    const eventData = JSON.parse(rawBody);
    const event = eventData.event;

    console.log(`[Razorpay Webhook] Verified event received: ${event}`);

    const supabase = createAdminClient();

    if (event === "order.paid" || event === "payment.captured") {
      const paymentEntity = eventData.payload?.payment?.entity;
      const orderEntity = eventData.payload?.order?.entity;

      const orderId = orderEntity?.id || paymentEntity?.order_id;
      const paymentId = paymentEntity?.id;

      if (orderId) {
        // Find existing order in Supabase
        const { data: existingOrder, error: fetchError } = await supabase
          .from("orders")
          .select("id, status, razorpay_payment_id")
          .eq("razorpay_order_id", orderId)
          .maybeSingle();

        if (fetchError) {
          console.error(
            "[Razorpay Webhook] Error fetching order:",
            fetchError
          );
        }

        if (existingOrder) {
          // If not already marked as paid, update it
          if (existingOrder.status !== "paid") {
            const { error: updateError } = await supabase
              .from("orders")
              .update({
                status: "paid",
                razorpay_payment_id: paymentId || existingOrder.razorpay_payment_id,
              })
              .eq("id", existingOrder.id);

            if (updateError) {
              console.error(
                "[Razorpay Webhook] Error updating order status:",
                updateError
              );
            } else {
              console.log(
                `[Razorpay Webhook] Order ${existingOrder.id} marked as paid via webhook`
              );
            }
          } else {
            console.log(
              `[Razorpay Webhook] Order ${existingOrder.id} was already marked as paid`
            );
          }
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: unknown) {
    console.error("[Razorpay Webhook] Error processing webhook:", err);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
