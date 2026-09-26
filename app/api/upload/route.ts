import { NextRequest, NextResponse } from "next/server";
import { uploadToR2 } from "@/lib/r2";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const maxDuration = 30; // 30 seconds for image upload processing

// Max 10 MB per image
const MAX_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

export async function POST(req: NextRequest) {
  try {
    // Only allow authenticated users
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please log in to admin first." }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const productSlug = formData.get("productSlug") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid image type (${file.type}). Only JPEG, PNG, WebP, and AVIF are allowed.` },
        { status: 400 }
      );
    }
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: "File too large — maximum upload size is 10 MB" },
        { status: 400 }
      );
    }

    // Build a unique key: products/<slug>/<uuid>.<ext>
    const dotIdx = file.name.lastIndexOf(".");
    const ext = dotIdx !== -1 ? file.name.slice(dotIdx).toLowerCase() : ".jpg";
    const uuid = crypto.randomUUID();
    const folder = productSlug ? `products/${productSlug}` : "uploads";
    const key = `${folder}/${uuid}${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const publicUrl = await uploadToR2(key, buffer, file.type);

    return NextResponse.json({ url: publicUrl, key });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal upload error";
    console.error("[upload] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
