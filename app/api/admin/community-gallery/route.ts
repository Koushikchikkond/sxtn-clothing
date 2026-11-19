import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getCommunityGallery,
  saveCommunityGallery,
  CommunityGalleryItem,
} from "@/lib/community-gallery";
import { requireAdmin } from "@/lib/auth-guard";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    const gallery = await getCommunityGallery(supabase);
    return NextResponse.json({ gallery });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load community gallery";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.isAdmin) {
      return auth.errorResponse!;
    }
    const supabase = await createClient();

    const body = await req.json();
    const { title, subtitle, hashtag, items: rawItems } = body;

    let items: CommunityGalleryItem[] = [];

    if (Array.isArray(rawItems)) {
      items = rawItems
        .filter((it) => it && typeof it === "object")
        .map((it, idx) => {
          const item = it as Record<string, unknown>;
          return {
            id: typeof item.id === "string" && item.id ? item.id : String(idx + 1),
            image_url: typeof item.image_url === "string" ? item.image_url.trim() : "",
            customer_name: typeof item.customer_name === "string" ? item.customer_name.trim() : "",
            tshirt_name: typeof item.tshirt_name === "string" ? item.tshirt_name.trim() : "",
            caption: typeof item.caption === "string" ? item.caption.trim() : undefined,
            created_at: typeof item.created_at === "string" ? item.created_at : undefined,
          };
        });
    }

    // Check if user submitted card items with missing image URLs
    const missingImage = items.find((it) => !it.image_url);
    if (missingImage) {
      return NextResponse.json(
        { error: "Please upload or provide an image URL for every customer photo before saving." },
        { status: 400 }
      );
    }

    const payload = {
      title: typeof title === "string" && title.trim() ? title.trim() : "WORN BY YOU",
      subtitle:
        typeof subtitle === "string"
          ? subtitle.trim()
          : "Tag @6xtn.in on Instagram to be featured on our official showcase",
      hashtag: typeof hashtag === "string" ? hashtag.trim() : "#6XTN #STREETWEAR",
      items,
    };

    const result = await saveCommunityGallery(payload, supabase);

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Save failed" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      gallery: payload,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("[community-gallery api] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
