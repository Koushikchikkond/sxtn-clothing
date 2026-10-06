/**
 * app/api/webhooks/shiprocket/route.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Shiprocket Webhook Handler
 *
 * Shiprocket sends POST requests to this URL when a shipment status changes.
 * We:
 *   1. Verify the webhook token (from SHIPROCKET_WEBHOOK_TOKEN env var)
 *   2. Map the Shiprocket status to our internal order status
 *   3. Update the Supabase orders table
 *   4. Trigger a transactional email to the customer via Resend
 *
 * Webhook events we care about:
 *   • PICKED UP          → no customer email (internal milestone)
 *   • IN TRANSIT         → no customer email (internal milestone)
 *   • OUT FOR DELIVERY   → "shipped" status email to customer
 *   • DELIVERED          → "delivered" status email to customer
 *   • UNDELIVERED / RTO  → support email / admin alert
 *
 * Setup:
 *   In Shiprocket Dashboard → Settings → API → Webhooks
 *   URL: https://your-domain.com/api/webhooks/shiprocket
 *   Token: set SHIPROCKET_WEBHOOK_TOKEN in your environment variables
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendOrderStatusEmail } from "@/lib/email/resend";

export const runtime = "nodejs";

// ── Shiprocket status codes → our order status mapping ───────────────────────
// Shiprocket sends a numeric "current_status_id" and a string "current_status"
// Reference: https://apidocs.shiprocket.in/#/Webhooks

const SR_STATUS_MAP: Record<
  number,
  { internalStatus: "shipped" | "delivered" | null; label: string }
> = {
  // Picked up
  7:   { internalStatus: null, label: "Picked Up" },
  // In Transit
  8:   { internalStatus: null, label: "In Transit" },
  // Out for Delivery
  17:  { internalStatus: "shipped", label: "Out for Delivery" },
  // Delivered
  9:   { internalStatus: "delivered", label: "Delivered" },
  // Undelivered
  10:  { internalStatus: null, label: "Undelivered" },
  // Cancelled
  16:  { internalStatus: null, label: "Cancelled by Courier" },
  // RTO Initiated
  48:  { internalStatus: null, label: "RTO Initiated" },
  // RTO Delivered (returned to origin)
  14:  { internalStatus: null, label: "RTO Delivered" },
};

export async function POST(req: NextRequest) {
  try {
    // ── 1. Token verification ──────────────────────────────────────────────
    // Shiprocket sends the webhook token in the Authorization header or as a
    // query parameter. We check both.
    const webhookToken = process.env.SHIPROCKET_WEBHOOK_TOKEN;

    if (webhookToken) {
      const authHeader = req.headers.get("authorization") || "";
      const queryToken = req.nextUrl.searchParams.get("token") || "";
      const receivedToken = authHeader.replace(/^Bearer\s+/i, "") || queryToken;

      if (receivedToken !== webhookToken) {
        console.warn("[Shiprocket Webhook] Invalid token received.");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    // ── 2. Parse payload ───────────────────────────────────────────────────
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    // Shiprocket webhook payload structure
    const {
      awb,                    // AWB number — our primary lookup key
      order_id: srOrderId,    // Shiprocket order ID
      current_status,         // Human-readable status string
      current_status_id,      // Numeric status ID
      etd,                    // Estimated delivery date
      // Additional fields sometimes present
      scans,                  // Activity scan history (array)
    } = body as {
      awb?: string;
      order_id?: string | number;
      current_status?: string;
      current_status_id?: number;
      etd?: string;
      scans?: Array<{ date: string; activity: string; location: string }>;
    };

    console.log(
      `[Shiprocket Webhook] Received event — AWB: ${awb}, Status: "${current_status}" (${current_status_id})`
    );

    if (!awb && !srOrderId) {
      console.warn("[Shiprocket Webhook] No AWB or order_id in payload, skipping.");
      return NextResponse.json({ received: true, skipped: true });
    }

    // ── 3. Look up internal order ──────────────────────────────────────────
    const supabase = createAdminClient();

    // Cast to any to avoid Supabase join type inference issues (same pattern as razorpay webhook)
    const baseQuery = (supabase.from("orders") as any).select("*, order_items(*)");

    // Prefer AWB lookup (most reliable); fall back to Shiprocket order ID
    const { data: order, error: fetchErr } = awb
      ? await baseQuery.eq("awb_number", awb).maybeSingle()
      : await baseQuery.eq("shiprocket_order_id", String(srOrderId)).maybeSingle();

    if (fetchErr) {
      console.error("[Shiprocket Webhook] DB fetch error:", fetchErr);
      return NextResponse.json({ error: "DB error" }, { status: 500 });
    }

    if (!order) {
      console.warn(
        `[Shiprocket Webhook] No matching order found for AWB: ${awb} / SR order: ${srOrderId}`
      );
      // Return 200 so Shiprocket doesn't retry — the order might not be ours
      return NextResponse.json({ received: true, skipped: "no_matching_order" });
    }

    // ── 4. Determine new status ────────────────────────────────────────────
    const mapped = current_status_id != null
      ? SR_STATUS_MAP[current_status_id]
      : null;

    const newInternalStatus = mapped?.internalStatus ?? null;
    const statusLabel = mapped?.label ?? current_status ?? "Unknown";

    // Build update payload — always update tracking info; conditionally update status
    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    // Only move the order forward (don't allow backward status changes)
    const STATUS_ORDER = ["pending", "paid", "confirmed", "shipped", "delivered", "cancelled"];
    const currentIdx = STATUS_ORDER.indexOf(order.status);
    const newIdx = newInternalStatus ? STATUS_ORDER.indexOf(newInternalStatus) : -1;

    if (newInternalStatus && newIdx > currentIdx) {
      updatePayload.status = newInternalStatus;
    }

    // Append a note about this tracking event
    const trackingNote = `[${new Date().toLocaleDateString("en-IN")}] Shiprocket: ${statusLabel}${etd ? ` (ETD: ${etd})` : ""}`;
    updatePayload.notes = order.notes
      ? `${order.notes} | ${trackingNote}`
      : trackingNote;

    // ── 5. Update Supabase ─────────────────────────────────────────────────
    const { error: updateErr } = await (supabase.from("orders") as any)
      .update(updatePayload)
      .eq("id", order.id);

    if (updateErr) {
      console.error("[Shiprocket Webhook] Failed to update order:", updateErr);
      return NextResponse.json({ error: "DB update error" }, { status: 500 });
    }

    console.log(
      `[Shiprocket Webhook] Order ${order.id} updated — Shiprocket status: "${statusLabel}"${newInternalStatus ? `, Internal status → "${newInternalStatus}"` : " (no status change)"}`
    );

    // ── 6. Send customer notification email ───────────────────────────────
    // Only send emails for statuses customers care about
    const customerEmail =
      order.guest_email || (order.shipping_address as any)?.email;
    const recipientName =
      (order.shipping_address as any)?.full_name ||
      (order.shipping_address as any)?.fullName ||
      "Customer";
    const trackingUrl = order.tracking_url || (awb ? `https://shiprocket.co/tracking/${awb}` : null);

    if (
      customerEmail &&
      newInternalStatus &&
      ["shipped", "delivered"].includes(newInternalStatus)
    ) {
      sendOrderStatusEmail({
        to: customerEmail,
        orderId: order.id,
        status: newInternalStatus as "shipped" | "delivered",
        recipientName,
        trackingNumber: awb || order.awb_number || null,
        courierName: order.courier_name || null,
        trackingUrl: trackingUrl || null,
        notes: statusLabel,
        total: order.total,
      }).catch((emailErr) => {
        console.warn("[Shiprocket Webhook] Email send error:", emailErr);
      });
    }

    return NextResponse.json({
      received: true,
      orderId: order.id,
      shiprocketStatus: statusLabel,
      internalStatus: newInternalStatus,
    });
  } catch (err: unknown) {
    console.error("[Shiprocket Webhook] Unhandled error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
