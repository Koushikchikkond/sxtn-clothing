/**
 * app/api/admin/orders/[id]/fulfill/route.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Admin endpoint to push a paid order to Shiprocket.
 *
 * POST /api/admin/orders/:id/fulfill
 *
 * Steps:
 *   1. Fetch order from Supabase (must be in "paid" or "confirmed" status)
 *   2. Call Shiprocket createOrder + assignAWB + generatePickup
 *   3. Save Shiprocket IDs (order_id, shipment_id, awb, courier, tracking_url) to Supabase
 *   4. Update order status to "confirmed" (now in Shiprocket's hands)
 *   5. Send "confirmed" email to customer with tracking info
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { pushOrderToShiprocket, buildShiprocketPayload } from "@/lib/shiprocket";
import { requireAdmin } from "@/lib/auth-guard";

export const runtime = "nodejs";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if (!auth.isAdmin) {
      return auth.errorResponse!;
    }

    const { id } = await params;
    const supabase = createAdminClient();

    // ── 1. Fetch order ─────────────────────────────────────────────────────
    const { data: order, error: fetchErr } = await (supabase.from("orders") as any)
      .select("*, order_items(*)")
      .eq("id", id)
      .single();

    if (fetchErr || !order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    // Validate status — only push paid/confirmed orders
    if (!["paid", "confirmed"].includes(order.status)) {
      return NextResponse.json(
        {
          error: `Cannot push order to Shiprocket. Current status: "${order.status}". Must be "paid" or "confirmed".`,
        },
        { status: 400 }
      );
    }

    // Skip if already pushed to Shiprocket
    if (order.shiprocket_order_id) {
      return NextResponse.json(
        {
          error: "Order is already in Shiprocket.",
          shiprocketOrderId: order.shiprocket_order_id,
          awb: order.awb_number,
        },
        { status: 409 }
      );
    }

    // ── 2. Build Shiprocket payload & push (without auto-assigning courier) ─
    const payload = buildShiprocketPayload({
      id: order.id,
      created_at: order.created_at,
      subtotal: order.subtotal,
      shipping_fee: order.shipping_fee,
      total: order.total,
      shipping_address: order.shipping_address,
      guest_email: order.guest_email,
      order_items: order.order_items || [],
    });

    const { shiprocketOrderId, shipmentId } = await pushOrderToShiprocket(payload);

    // ── 3. Update Supabase with Shiprocket Order & Shipment IDs ────────────
    const { error: updateErr } = await (supabase.from("orders") as any)
      .update({
        status: "confirmed",
        shiprocket_order_id: String(shiprocketOrderId),
        shiprocket_shipment_id: String(shipmentId),
        notes: `Pushed to Shiprocket (SR #${shiprocketOrderId}, Shipment #${shipmentId}). Awaiting manual courier selection in Shiprocket Dashboard.${order.notes ? ` [Prev: ${order.notes}]` : ""}`,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateErr) {
      console.error("[Fulfill] DB update error after Shiprocket push:", updateErr);
      return NextResponse.json(
        { error: "Shiprocket order created but DB update failed.", shiprocketOrderId },
        { status: 500 }
      );
    }

    console.log(
      `[Fulfill] Order ${id} pushed to Shiprocket — Order ID: ${shiprocketOrderId}, Shipment ID: ${shipmentId}`
    );

    return NextResponse.json({
      success: true,
      message: `Order #${id.slice(0, 8).toUpperCase()} pushed to Shiprocket (SR #${shiprocketOrderId}). Select your preferred courier in Shiprocket dashboard to generate AWB.`,
      shiprocketOrderId,
      shipmentId,
    });
  } catch (err: unknown) {
    console.error("[Fulfill] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
