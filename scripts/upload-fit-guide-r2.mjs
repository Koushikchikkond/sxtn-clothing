import fs from "fs";
import path from "path";
import sharp from "sharp";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const sourceImagePath = "C:/Users/91886/.gemini/antigravity/brain/6431d858-359c-4f0b-94d6-8b9e922fe657/.user_uploaded/media_1794653639519_638ca54a.jpg";

if (!fs.existsSync(sourceImagePath)) {
  console.error("Source image not found:", sourceImagePath);
  process.exit(1);
}

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim().replace(/^["']|["']$/g, "");
const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim().replace(/^["']|["']$/g, "");
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim().replace(/^["']|["']$/g, "");
const bucket = process.env.R2_BUCKET_NAME?.trim().replace(/^["']|["']$/g, "");
const publicUrl = process.env.R2_PUBLIC_URL?.trim().replace(/^["']|["']$/g, "").replace(/\/+$/, "");

if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
  console.error("Missing R2 environment variables!");
  process.exit(1);
}

const client = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

async function main() {
  const originalMetadata = await sharp(sourceImagePath).metadata();
  console.log("Original Image Metadata:", {
    format: originalMetadata.format,
    width: originalMetadata.width,
    height: originalMetadata.height,
    size: fs.statSync(sourceImagePath).size,
  });

  // Optimize image: resize to max width 800px (clean, crisp, small pixel size), convert to WebP with quality 85
  const optimizedWebpBuffer = await sharp(sourceImagePath)
    .resize({ width: 800, withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer();

  console.log("Optimized WebP size:", optimizedWebpBuffer.length, "bytes (~" + Math.round(optimizedWebpBuffer.length / 1024) + " KB)");

  // Also create optimized jpg
  const optimizedJpgBuffer = await sharp(sourceImagePath)
    .resize({ width: 800, withoutEnlargement: true })
    .jpeg({ quality: 85, mozjpeg: true })
    .toBuffer();

  // Save to public directory as static fallback
  const publicDir = path.resolve("public/images");
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  fs.writeFileSync(path.join(publicDir, "fit-guide.webp"), optimizedWebpBuffer);
  fs.writeFileSync(path.join(publicDir, "fit-guide.jpg"), optimizedJpgBuffer);
  console.log("Saved local copy to public/images/fit-guide.webp and fit-guide.jpg");

  // Upload WebP to R2
  const r2KeyWebp = "site/fit-guide-boxy-vs-regular.webp";
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: r2KeyWebp,
      Body: optimizedWebpBuffer,
      ContentType: "image/webp",
      CacheControl: "public, max-age=31536000, immutable",
    })
  );
  console.log(`Uploaded to R2: ${publicUrl}/${r2KeyWebp}`);

  // Upload JPG to R2
  const r2KeyJpg = "site/fit-guide-boxy-vs-regular.jpg";
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: r2KeyJpg,
      Body: optimizedJpgBuffer,
      ContentType: "image/jpeg",
      CacheControl: "public, max-age=31536000, immutable",
    })
  );
  console.log(`Uploaded to R2: ${publicUrl}/${r2KeyJpg}`);
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
