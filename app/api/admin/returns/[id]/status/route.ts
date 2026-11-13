import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth-guard";

export const runtime = "nodejs";

const VALID_STATUSES = ["requested", "approved", "rejected", "picked_up", "completed"];

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if (!auth.isAdmin) {
      return auth.errorResponse!;
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { status, adminNotes, returnAwb, returnCourier } = body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    const adminDb = createAdminClient();

    // 1. Fetch current return request
    const { data: currentReturn, error: fetchErr } = await (adminDb.from("order_returns") as any)
      .select("*, orders(id, user_id, guest_email, shipping_address)")
      .eq("id", id)
      .single();

    if (fetchErr || !currentReturn) {
      return NextResponse.json({ error: "Return request not found." }, { status: 404 });
    }

    // 2. Build update payload
    const updateData: Record<string, any> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (typeof adminNotes === "string") {
      updateData.admin_notes = adminNotes.trim() || null;
    }
    if (typeof returnAwb === "string") {
      updateData.return_awb = returnAwb.trim() || null;
    }
    if (typeof returnCourier === "string") {
      updateData.return_courier = returnCourier.trim() || null;
    }

    // 3. Update return record
    const { data: updatedReturn, error: updateErr } = await (adminDb.from("order_returns") as any)
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (updateErr) {
      console.error("[POST /api/admin/returns/[id]/status] Update error:", updateErr);
      return NextResponse.json(
        { error: "Failed to update return request status." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Return request marked as ${status}.`,
      returnRequest: updatedReturn,
    });
  } catch (err: unknown) {
    console.error("[POST /api/admin/returns/[id]/status] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

