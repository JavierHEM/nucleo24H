import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "@/lib/env";

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET = env.R2_BUCKET_NAME;

/** Genera URL firmada para PUT directo desde el browser (válida 5 min) */
export async function getPresignedUploadUrl({
  key,
  contentType,
  maxSizeMb = 10,
}: {
  key: string;
  contentType: string;
  maxSizeMb?: number;
}): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
    ContentLength: maxSizeMb * 1024 * 1024,
  });

  return getSignedUrl(r2, command, { expiresIn: 300 });
}

/** URL pública del objeto */
export function getPublicUrl(key: string): string {
  return `${env.R2_PUBLIC_URL}/${key}`;
}

/** Eliminar objeto */
export async function deleteObject(key: string): Promise<void> {
  await r2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

/** Genera clave única para un documento de un tenant */
export function buildDocKey({
  tenantId,
  filename,
}: {
  tenantId: string;
  filename: string;
}): string {
  const ext = filename.split(".").pop() ?? "bin";
  const slug = filename
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .slice(0, 40);
  const ts = Date.now();
  return `docs/${tenantId}/${ts}-${slug}.${ext}`;
}
