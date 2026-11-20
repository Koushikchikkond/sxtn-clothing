import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminDb = createAdminClient();
    const { data: review } = await (adminDb.from("order_reviews") as any)
      .select("*")
      .eq("order_id", orderId)
      .maybeSingle();

    return NextResponse.json({ review: review || null });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Please sign in to rate your order." }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body.rating !== "number") {
      return NextResponse.json({ error: "Invalid rating value." }, { status: 400 });
    }

    const rating = Math.max(1, Math.min(5, Math.round(body.rating)));
    const comment = typeof body.comment === "string" ? body.comment.trim() : "";

    const adminDb = createAdminClient();

    // Verify order exists, belongs to user, and is delivered
    const { data: order, error: orderErr } = await (adminDb.from("orders") as any)
      .select("id, user_id, status, shipping_address, order_items(product_name)")
      .eq("id", orderId)
      .maybeSingle();

    if (orderErr || !order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    if (order.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized for this order." }, { status: 403 });
    }

    if (order.status !== "delivered") {
      return NextResponse.json(
        { error: "You can rate an order after it has been delivered." },
        { status: 400 }
      );
    }

    const addr = (order.shipping_address as Record<string, any>) || {};
    const customerName =
      addr.full_name ||
      addr.fullName ||
      user.user_metadata?.full_name ||
      "Verified Customer";
    const customerCity = addr.city || "India";
    const customerState = addr.state || "";

    const productNames = Array.isArray(order.order_items)
      ? order.order_items.map((i: any) => i.product_name).filter(Boolean)
      : [];
    const productName = productNames.length > 0 ? productNames.join(", ") : "6XTN Piece";

    const payload = {
      order_id: orderId,
      user_id: user.id,
      customer_name: customerName,
      customer_city: customerCity,
      customer_state: customerState,
      rating,
      comment: comment || null,
      product_name: productName,
      is_approved: true,
      updated_at: new Date().toISOString(),
    };

    const { data: savedReview, error: saveErr } = await (adminDb.from("order_reviews") as any)
      .upsert(payload, { onConflict: "order_id" })
      .select()
      .single();

    if (saveErr) {
      console.error("[POST /api/orders/[id]/reviews] Database error:", saveErr);
      return NextResponse.json(
        { error: "Failed to save review to database." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, review: savedReview });
  } catch (err: unknown) {
    console.error("[POST /api/orders/[id]/reviews] Exception:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
