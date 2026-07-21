import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function getR2() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET_NAME;
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
    return null;
  }
  const client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
  return { client, bucket };
}

export async function presignPut(
  key: string,
  contentType: string,
): Promise<string | null> {
  const r2 = getR2();
  if (!r2) return null;
  return getSignedUrl(r2.client, new PutObjectCommand({
    Bucket: r2.bucket,
    Key: key,
    ContentType: contentType,
  }), { expiresIn: 3600 });
}

export async function presignGet(key: string): Promise<string | null> {
  const r2 = getR2();
  if (!r2) return null;
  return getSignedUrl(r2.client, new GetObjectCommand({
    Bucket: r2.bucket,
    Key: key,
  }), { expiresIn: 86400 });
}

export async function deleteObject(key: string): Promise<void> {
  const r2 = getR2();
  if (!r2) return;
  await r2.client.send(new DeleteObjectCommand({ Bucket: r2.bucket, Key: key }));
}

/** Upload a buffer directly from the server (e.g. generated PDFs). */
export async function putObject(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string,
): Promise<void> {
  const r2 = getR2();
  if (!r2) throw new Error("R2 is not configured");
  await r2.client.send(
    new PutObjectCommand({
      Bucket: r2.bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
}

export function objectKey(
  purpose: "submission" | "resource" | "returned",
  userId: string,
  filename: string,
): string {
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
  const prefix = purpose === "returned" ? "returned" : `${purpose}s`;
  return `${prefix}/${userId}/${crypto.randomUUID()}-${safe}`;
}
