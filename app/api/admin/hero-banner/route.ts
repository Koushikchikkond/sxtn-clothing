import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getHeroBanner, saveHeroBanner } from "@/lib/hero-banner";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    const banner = await getHeroBanner(supabase);
    return NextResponse.json({ banner });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load hero banner";
    return NextResponse.json({ error: message }, { status: 500 });
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

    if (!profile || (profile as { role?: string }).role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    // ── Parse Payload ─────────────────────────────────────────
    const body = await req.json();
    const { desktop_url, mobile_url, alt_text, slides: rawSlides } = body;

    let slides: Array<{
      id: string;
      desktop_url: string;
      mobile_url: string;
      alt_text?: string;
    }> = [];

    if (Array.isArray(rawSlides)) {
      slides = rawSlides
        .filter((s) => s && typeof s === "object")
        .map((s, idx) => {
          const item = s as Record<string, unknown>;
          const d = typeof item.desktop_url === "string" ? item.desktop_url.trim() : "";
          const m = typeof item.mobile_url === "string" ? item.mobile_url.trim() : "";
          return {
            id: typeof item.id === "string" && item.id ? item.id : String(idx + 1),
            desktop_url: d || m,
            mobile_url: m || d,
            alt_text: typeof item.alt_text === "string" ? item.alt_text : undefined,
          };
        })
        .filter((s) => s.desktop_url || s.mobile_url);
    }

    const primaryDesktop =
      slides[0]?.desktop_url ||
      (typeof desktop_url === "string" ? desktop_url.trim() : "");
    const primaryMobile =
      slides[0]?.mobile_url ||
      (typeof mobile_url === "string" ? mobile_url.trim() : "");

    if (!primaryDesktop && !primaryMobile && slides.length === 0) {
      return NextResponse.json(
        { error: "At least one valid banner slide with a desktop or mobile image is required." },
        { status: 400 }
      );
    }

    if (slides.length === 0) {
      slides = [
        {
          id: "1",
          desktop_url: primaryDesktop || primaryMobile,
          mobile_url: primaryMobile || primaryDesktop,
          alt_text: alt_text || "6XTN Hero",
        },
      ];
    }

    const payload = {
      desktop_url: primaryDesktop || primaryMobile,
      mobile_url: primaryMobile || primaryDesktop,
      alt_text: alt_text || "6XTN Hero",
      slides,
    };

    const result = await saveHeroBanner(payload, supabase);

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Save failed" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      banner: payload,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("[hero-banner api] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
