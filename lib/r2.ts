import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function cleanEnv(val: string | undefined): string {
  if (!val) return "";
  return val.trim().replace(/^["']|["']$/g, "");
}

function getR2Config() {
  const accountId = cleanEnv(process.env.CLOUDFLARE_ACCOUNT_ID);
  const accessKeyId = cleanEnv(process.env.R2_ACCESS_KEY_ID);
  const secretAccessKey = cleanEnv(process.env.R2_SECRET_ACCESS_KEY);
  const bucket = cleanEnv(process.env.R2_BUCKET_NAME);
  const publicUrl = cleanEnv(process.env.R2_PUBLIC_URL).replace(/\/+$/, "");

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
    const missing: string[] = [];
    if (!accountId) missing.push("CLOUDFLARE_ACCOUNT_ID");
    if (!accessKeyId) missing.push("R2_ACCESS_KEY_ID");
    if (!secretAccessKey) missing.push("R2_SECRET_ACCESS_KEY");
    if (!bucket) missing.push("R2_BUCKET_NAME");

    throw new Error(
      `Cloudflare R2 is not fully configured. Missing variables in Vercel: ${missing.join(", ")}. Please add them in Vercel Settings and Redeploy.`
    );
  }

  const client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  return {
    client,
    bucket,
    publicUrl,
  };
}

/** Upload a file buffer directly to R2 */
export async function uploadToR2(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string
): Promise<string> {
  const { client, bucket, publicUrl } = getR2Config();
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    })
  );
  return `${publicUrl}/${key}`;
}

/** Delete a file from R2 by key */
export async function deleteFromR2(key: string): Promise<void> {
  const { client, bucket } = getR2Config();
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

/** Generate a short-lived presigned URL for client-side direct upload */
export async function getUploadPresignedUrl(
  key: string,
  contentType: string,
  expiresIn = 300 // 5 minutes
): Promise<string> {
  const { client, bucket } = getR2Config();
  return getSignedUrl(
    client,
    new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType }),
    { expiresIn }
  );
}
