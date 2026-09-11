import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const DEFAULT_SIGNED_URL_TTL_SECONDS = 300; 

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name} env var. Check .env.local.`);
  }
  return value;
}

let _client: S3Client | null = null;

function getR2Client(): S3Client {
  if (typeof window !== "undefined") {
    throw new Error("R2 client must never be created in the browser.");
  }

  if (!_client) {
    const accountId = requireEnv("R2_ACCOUNT_ID");
    _client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: requireEnv("R2_ACCESS_KEY"),
        secretAccessKey: requireEnv("R2_SECRET_KEY"),
      },
    });
  }
  return _client;
}

function getBucketName(): string {
  return requireEnv("R2_BUCKET_NAME");
}

export async function getSignedOriginalUrl(
  path: string,
  ttlSeconds: number = DEFAULT_SIGNED_URL_TTL_SECONDS
): Promise<string> {
  const cleanPath = path.replace(/^\/+/, "");
  const fileName = cleanPath.split("/").pop() ?? "photo.jpg";

  const command = new GetObjectCommand({
    Bucket: getBucketName(),
    Key: `originals/${cleanPath}`,
    ResponseContentDisposition: `attachment; filename="${fileName}"`,
  });
  return getSignedUrl(getR2Client(), command, { expiresIn: ttlSeconds });
}

export async function uploadObject(
  key: string,
  body: Buffer,
  contentType: string
): Promise<void> {
  const cleanKey = key.replace(/^\/+/, "");
  const command = new PutObjectCommand({
    Bucket: getBucketName(),
    Key: cleanKey,
    Body: body,
    ContentType: contentType,
    CacheControl: "public, max-age=31536000, immutable",
  });
  await getR2Client().send(command);
}