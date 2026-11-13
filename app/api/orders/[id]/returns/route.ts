import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminDb = createAdminClient();

    // Verify order ownership or admin
    const { data: order } = await (adminDb.from("orders") as any)
      .select("id, user_id")
      .eq("id", id)
      .single();

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.user_id !== user.id) {
      // Check if user is admin
      const { data: profile } = await (adminDb.from("profiles") as any)
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const { data: returns, error: fetchErr } = await (adminDb.from("order_returns") as any)
      .select("*")
      .eq("order_id", id)
      .order("created_at", { ascending: false });

    if (fetchErr) {
      console.error("[GET /api/orders/[id]/returns] fetch error:", fetchErr);
      return NextResponse.json({ error: "Failed to fetch returns" }, { status: 500 });
    }

    return NextResponse.json({ returns: returns || [] });
  } catch (err: unknown) {
    console.error("[GET /api/orders/[id]/returns] unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const {
      type,
      orderItemId,
      productName,
      originalSize,
      requestedSize,
      reason,
      customerNotes,
    } = body;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Please log in to submit a request." }, { status: 401 });
    }

    if (!type || (type !== "return" && type !== "exchange")) {
      return NextResponse.json({ error: "Invalid type. Must be 'return' or 'exchange'." }, { status: 400 });
    }

    if (!reason || typeof reason !== "string" || !reason.trim()) {
      return NextResponse.json({ error: "A valid reason is required." }, { status: 400 });
    }

    if (type === "exchange" && (!requestedSize || !requestedSize.trim())) {
      return NextResponse.json({ error: "Please select your replacement size for exchange." }, { status: 400 });
    }

    const adminDb = createAdminClient();

    // 1. Fetch order and verify ownership & status
    const { data: order, error: orderErr } = await (adminDb.from("orders") as any)
      .select("id, user_id, status, notes")
      .eq("id", id)
      .single();

    if (orderErr || !order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    if (order.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized access to this order." }, { status: 403 });
    }

    if (order.status !== "delivered") {
      return NextResponse.json(
        { error: "Returns and exchanges can only be requested once the order has been delivered." },
        { status: 400 }
      );
    }

    // 2. Check for active/pending request
    const { data: existingActive } = await (adminDb.from("order_returns") as any)
      .select("id, status, type")
      .eq("order_id", id)
      .in("status", ["requested", "approved", "picked_up"]);

    if (existingActive && existingActive.length > 0) {
      return NextResponse.json(
        {
          error: `An active ${existingActive[0].type} request (status: ${existingActive[0].status}) already exists for this order.`,
        },
        { status: 400 }
      );
    }

    // 3. Insert into order_returns
    const { data: createdReturn, error: insertErr } = await (adminDb.from("order_returns") as any)
      .insert({
        order_id: id,
        order_item_id: orderItemId || null,
        user_id: user.id,
        type,
        status: "requested",
        product_name: productName || "Apparel Item",
        original_size: originalSize || null,
        requested_size: type === "exchange" ? requestedSize : null,
        reason: reason.trim(),
        customer_notes: customerNotes?.trim() || null,
      })
      .select()
      .single();

    if (insertErr) {
      console.error("[POST /api/orders/[id]/returns] Insert error:", insertErr);
      return NextResponse.json({ error: "Failed to record return request in database." }, { status: 500 });
    }

    return NextResponse.json(
      {
        success: true,
        message: `Your ${type} request has been submitted successfully. Our team will review and update you shortly.`,
        returnRequest: createdReturn,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    console.error("[POST /api/orders/[id]/returns] unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

