import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendOrderStatusEmail } from "@/lib/email/resend";
import { createRazorpayRefund } from "@/lib/razorpay";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { status, trackingNumber, courierName, trackingUrl, reason, notes, autoRefund } = body;

    const validStatuses = ["pending", "paid", "confirmed", "shipped", "delivered", "cancelled"];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid order status." }, { status: 400 });
    }

    const supabase = createAdminClient();

    // 1. Fetch current order
    const { data: order, error: fetchErr } = await (supabase.from("orders") as any)
      .select("*, order_items(*)")
      .eq("id", id)
      .single();

    if (fetchErr || !order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    // Optional: Process automated Razorpay refund if cancelling a paid order
    let refundResult = null;
    let refundNote = "";
    if (status === "cancelled" && autoRefund && order.razorpay_payment_id) {
      try {
        refundResult = await createRazorpayRefund({
          paymentId: order.razorpay_payment_id,
          amount: Math.round(order.total * 100),
          notes: {
            orderId: order.id,
            reason: reason || "Admin cancelled order",
          },
        });
        refundNote = ` | Razorpay Refund: ${refundResult.id} (Status: ${refundResult.status})`;
      } catch (refundErr) {
        console.error("[POST /api/admin/orders/[id]/status] Auto-refund error:", refundErr);
        refundNote = ` | Auto-refund note: ${refundErr instanceof Error ? refundErr.message : "Refund API error"}`;
      }
    }

    // 2. Update order status in Supabase
    const updatePayload: Record<string, any> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === "cancelled") {
      const fullReason = (reason || notes || "Order cancelled") + refundNote;
      updatePayload.notes = `Cancelled: ${fullReason}${order.notes ? ` (Prev: ${order.notes})` : ""}`;
    } else if (trackingNumber || courierName) {
      updatePayload.notes = `Courier: ${courierName || "Standard"} | Tracking: ${trackingNumber || "N/A"}`;
    }

    const { error: updateErr } = await (supabase.from("orders") as any)
      .update(updatePayload)
      .eq("id", id);

    if (updateErr) {
      return NextResponse.json(
        { error: "Failed to update order status in database." },
        { status: 500 }
      );
    }

    // 3. Trigger transactional email via Resend if status is one of the notification milestones
    let emailResult = null;
    const customerEmail = order.guest_email || (order.shipping_address as any)?.email;
    const recipientName =
      (order.shipping_address as any)?.full_name ||
      (order.shipping_address as any)?.fullName ||
      "Customer";

    if (
      customerEmail &&
      ["confirmed", "shipped", "delivered", "cancelled"].includes(status)
    ) {
      emailResult = await sendOrderStatusEmail({
        to: customerEmail,
        orderId: order.id,
        status: status as "confirmed" | "shipped" | "delivered" | "cancelled",
        recipientName,
        trackingNumber: trackingNumber || null,
        courierName: courierName || null,
        trackingUrl: trackingUrl || null,
        reason: reason || null,
        notes: notes || null,
        total: order.total,
      });
    }

    return NextResponse.json({
      success: true,
      status,
      emailSent: !!emailResult?.success,
      emailResult,
    });
  } catch (err: unknown) {
    console.error("[POST /api/admin/orders/[id]/status] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
