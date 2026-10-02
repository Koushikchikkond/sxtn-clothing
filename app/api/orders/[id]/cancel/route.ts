import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendOrderStatusEmail } from "@/lib/email/resend";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { reason, notes } = body;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Please log in to cancel this order." }, { status: 401 });
    }

    const adminDb = createAdminClient();

    // 1. Fetch the order
    const { data: order, error: fetchErr } = await (adminDb.from("orders") as any)
      .select("*, order_items(*)")
      .eq("id", id)
      .single();

    if (fetchErr || !order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    // Verify ownership
    if (order.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized access to this order." }, { status: 403 });
    }

    // Check if status is cancellable
    if (order.status === "cancelled") {
      return NextResponse.json({ error: "This order is already cancelled." }, { status: 400 });
    }

    if (order.status === "shipped" || order.status === "delivered") {
      return NextResponse.json(
        {
          error:
            "This order has already been dispatched/delivered. Please contact support@6xtn.in for returns.",
        },
        { status: 400 }
      );
    }

    const cancellationReasonText = reason?.trim() || "Customer requested cancellation";
    const detailNotes = notes?.trim() ? ` — Note: ${notes.trim()}` : "";
    const updatedNotes = `Cancelled by Customer: ${cancellationReasonText}${detailNotes}${
      order.notes ? ` [Prev: ${order.notes}]` : ""
    }`;

    // 2. Update status in Supabase
    const { error: updateErr } = await (adminDb.from("orders") as any)
      .update({
        status: "cancelled",
        notes: updatedNotes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateErr) {
      console.error("[POST /api/orders/[id]/cancel] DB update error:", updateErr);
      return NextResponse.json(
        { error: "Failed to cancel order in database." },
        { status: 500 }
      );
    }

    // 3. Send email to customer via Resend from support@6xtn.in
    const customerEmail = user.email || order.guest_email || (order.shipping_address as any)?.email;
    const recipientName =
      (order.shipping_address as any)?.full_name ||
      (order.shipping_address as any)?.fullName ||
      user.email?.split("@")[0] ||
      "Customer";

    if (customerEmail) {
      await sendOrderStatusEmail({
        to: customerEmail,
        orderId: order.id,
        status: "cancelled",
        recipientName,
        reason: cancellationReasonText,
        notes: notes?.trim() || null,
        total: order.total,
      }).catch((emailErr) => {
        console.warn("[POST /api/orders/[id]/cancel] Notice: Email failed:", emailErr);
      });
    }

    return NextResponse.json({
      success: true,
      message: "Order cancelled successfully. A confirmation email has been sent to your inbox.",
    });
  } catch (err: unknown) {
    console.error("[POST /api/orders/[id]/cancel] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
