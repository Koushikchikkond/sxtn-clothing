import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendOrderConfirmationEmail, sendPaymentFailedEmail } from "@/lib/email/resend";

export const runtime = "nodejs";

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
        const { data: existingOrder, error: fetchError } = await (supabase.from("orders") as any)
          .select("*, order_items(*)")
          .eq("razorpay_order_id", orderId)
          .maybeSingle();

        if (fetchError) {
          console.error(
            "[Razorpay Webhook] Error fetching order:",
            fetchError
          );
        }

        const order = existingOrder;

        if (order) {
          // If not already marked as paid, update it and send confirmation
          if (order.status !== "paid" && order.status !== "confirmed") {
            const { error: updateError } = await (supabase.from("orders") as any)
              .update({
                status: "paid",
                razorpay_payment_id: paymentId || order.razorpay_payment_id,
                updated_at: new Date().toISOString(),
              })
              .eq("id", order.id);

            if (updateError) {
              console.error(
                "[Razorpay Webhook] Error updating order status:",
                updateError
              );
            } else {
              console.log(
                `[Razorpay Webhook] Order ${order.id} marked as paid via webhook`
              );

              // Trigger order confirmation email if customer email exists
              // NOTE: Must await — Vercel serverless kills fire-and-forget on function return
              const customerEmail =
                order.guest_email || (order.shipping_address as any)?.email;
              if (customerEmail) {
                const emailResult = await sendOrderConfirmationEmail({
                  to: customerEmail,
                  orderId: order.id,
                  total: order.total,
                  subtotal: order.subtotal,
                  shippingFee: order.shipping_fee,
                  paymentId: paymentId || order.razorpay_payment_id || undefined,
                  items: (order.order_items || []).map((it: any) => ({
                    name: it.product_name,
                    size: it.size,
                    color: it.color,
                    quantity: it.quantity,
                    price: it.unit_price,
                  })),
                  address: order.shipping_address || {},
                }).catch((emailErr) => {
                  console.warn("[Razorpay Webhook] Confirmation email error:", emailErr);
                  return { success: false };
                });
                console.log(`[Razorpay Webhook] Confirmation email result:`, emailResult);
              }
            }
          }
        }
      }
    } else if (event === "payment.failed") {
      const paymentEntity = eventData.payload?.payment?.entity;
      const customerEmail = paymentEntity?.email;
      const orderId = paymentEntity?.order_id;
      const amount = paymentEntity?.amount ? paymentEntity.amount / 100 : undefined;

      console.warn(`[Razorpay Webhook] Payment failed for order ${orderId}:`, paymentEntity?.error_description);

      if (customerEmail) {
        // NOTE: Must await — Vercel serverless kills fire-and-forget on function return
        const failedEmailResult = await sendPaymentFailedEmail({
          to: customerEmail,
          orderId: orderId || undefined,
          total: amount,
        }).catch((err) => {
          console.warn("[Razorpay Webhook] Payment failed email error:", err);
          return { success: false };
        });
        console.log(`[Razorpay Webhook] Payment failed email result:`, failedEmailResult);
      }
    } else if (event === "refund.processed" || event === "refund.created") {
      const refundEntity = eventData.payload?.refund?.entity;
      const paymentId = refundEntity?.payment_id;
      const refundId = refundEntity?.id;
      const refundAmount = refundEntity?.amount ? refundEntity.amount / 100 : 0;

      console.log(`[Razorpay Webhook] Refund ${event} received for payment ${paymentId}: ₹${refundAmount}`);

      if (paymentId) {
        const { data: order } = await (supabase.from("orders") as any)
          .select("id, notes, status")
          .eq("razorpay_payment_id", paymentId)
          .maybeSingle();

        if (order) {
          const noteText = `Razorpay Refund Settled: ₹${refundAmount} (ID: ${refundId})`;
          await (supabase.from("orders") as any)
            .update({
              status: "cancelled",
              notes: order.notes ? `${order.notes} | ${noteText}` : noteText,
              updated_at: new Date().toISOString(),
            })
            .eq("id", order.id);
          console.log(`[Razorpay Webhook] Order ${order.id} updated with refund: ${refundId}`);
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
