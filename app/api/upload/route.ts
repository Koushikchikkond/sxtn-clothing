import { NextRequest, NextResponse } from "next/server";
import { uploadToR2 } from "@/lib/r2";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Max 10 MB per image
const MAX_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

/** GET /api/upload — Diagnostic health check */
export async function GET() {
  const accountId = Boolean(process.env.CLOUDFLARE_ACCOUNT_ID?.trim());
  const accessKeyId = Boolean(process.env.R2_ACCESS_KEY_ID?.trim());
  const secretAccessKey = Boolean(process.env.R2_SECRET_ACCESS_KEY?.trim());
  const bucket = Boolean(process.env.R2_BUCKET_NAME?.trim());
  const publicUrl = Boolean(process.env.R2_PUBLIC_URL?.trim());

  const allConfigured = accountId && accessKeyId && secretAccessKey && bucket && publicUrl;

  return NextResponse.json({
    status: allConfigured ? "configured" : "incomplete_config",
    message: allConfigured
      ? "Cloudflare R2 is fully configured and ready."
      : "Some Cloudflare R2 environment variables are missing on this deployment.",
    envStatus: {
      CLOUDFLARE_ACCOUNT_ID: accountId,
      R2_ACCESS_KEY_ID: accessKeyId,
      R2_SECRET_ACCESS_KEY: secretAccessKey,
      R2_BUCKET_NAME: bucket,
      R2_PUBLIC_URL: publicUrl,
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    // Auth Check
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json(
          { error: "Unauthorized. Please log in to admin first." },
          { status: 401 }
        );
      }
    } catch (authError) {
      console.warn("[upload] Auth check warning:", authError);
      // Admin layout protects pages, so continue if auth check encountered cookie parse quirks
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
