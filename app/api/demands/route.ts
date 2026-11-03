import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth-guard";

const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const runtime = "nodejs";

/**
 * POST /api/demands
 * Public endpoint: Customers submit a demand / "Notify Me" request for an out-of-stock item.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { productId, variantId, size, email } = body;

    if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    if (!productId || typeof productId !== "string" || !UUID_REGEX.test(productId)) {
      return NextResponse.json(
        { error: "Invalid product identifier." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanSize = typeof size === "string" ? size.trim().slice(0, 20) : null;
    const cleanVariantId =
      variantId && typeof variantId === "string" && UUID_REGEX.test(variantId)
        ? variantId
        : null;

    const supabase = createAdminClient();

    // Check if duplicate pending demand already exists to avoid spamming
    const { data: existing } = await (supabase.from("product_demands") as any)
      .select("id")
      .eq("product_id", productId)
      .eq("email", cleanEmail)
      .eq("status", "pending")
      .maybeSingle();

    if (existing) {
      return NextResponse.json({
        ok: true,
        message: "You are already on the notification list for this item.",
      });
    }

    const { error: insertErr } = await (supabase.from("product_demands") as any).insert({
      product_id: productId,
      variant_id: cleanVariantId,
      size: cleanSize,
      email: cleanEmail,
      status: "pending",
    });

    if (insertErr) {
      console.error("[Demands] Insert error:", insertErr);
      return NextResponse.json(
        { error: "Failed to record your notification request." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Notification set! We'll email you as soon as this item is back.",
    });
  } catch (err: unknown) {
    console.error("[Demands] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/demands
 * Admin endpoint: Update demand status (e.g. mark notified)
 */
export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.isAdmin) return auth.errorResponse!;

    const body = await req.json().catch(() => null);
    const { id, status } = body || {};

    if (!id || !["pending", "notified"].includes(status)) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { error } = await (supabase.from("product_demands") as any)
      .update({ status })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/demands?id=...
 * Admin endpoint: Remove a demand entry
 */
export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.isAdmin) return auth.errorResponse!;

    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing demand id" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { error } = await (supabase.from("product_demands") as any)
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

