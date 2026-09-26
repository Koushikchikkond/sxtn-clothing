import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getHeroBanner, saveHeroBanner } from "@/lib/hero-banner";

export async function GET() {
  try {
    const banner = await getHeroBanner();
    return NextResponse.json({ banner });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to load hero banner" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // ── Check Admin Auth ──────────────────────────────────────
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || (profile as any).role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    // ── Parse Payload ─────────────────────────────────────────
    const body = await req.json();
    const { desktop_url, mobile_url, alt_text } = body;

    if (!desktop_url || !mobile_url) {
      return NextResponse.json(
        { error: "Both Desktop and Mobile banner images are required." },
        { status: 400 }
      );
    }

    const result = await saveHeroBanner({
      desktop_url,
      mobile_url,
      alt_text: alt_text || "SXTN Hero",
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Save failed" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      banner: { desktop_url, mobile_url, alt_text },
    });
  } catch (err: any) {
    console.error("[hero-banner api] Error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
