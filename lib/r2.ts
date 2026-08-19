import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from './util';

/**
 * Cloudflare R2 access from Vercel.
 *
 * On Cloudflare Pages these were native bucket bindings (env.GALLERY_BUCKET.put).
 * Off-platform we use R2's S3-compatible API, which needs an R2 API token.
 * The buckets themselves are unchanged, so every already-uploaded file keeps working.
 */

export type Bucket = 'gallery' | 'sermons';

let client: S3Client | null = null;

function s3(): S3Client {
  if (client) return client;
  client = new S3Client({
    region: 'auto',
    endpoint: `https://${env('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env('R2_ACCESS_KEY_ID'),
      secretAccessKey: env('R2_SECRET_ACCESS_KEY')
    }
  });
  return client;
}

function bucketName(bucket: Bucket): string {
  return bucket === 'gallery'
    ? process.env.R2_GALLERY_BUCKET || 'gvim-gallery'
    : process.env.R2_SERMONS_BUCKET || 'gvim-sermons';
}

/** Public base URL used to build the browser-facing `url` field on each record. */
export function publicBase(bucket: Bucket): string {
  const raw = bucket === 'gallery'
    ? env('PUBLIC_GALLERY_BASE')
    : env('PUBLIC_SERMONS_BASE');
  return raw.replace(/\/$/, '');
}

export async function putObject(
  bucket: Bucket, key: string, body: Uint8Array, contentType: string
): Promise<void> {
  await s3().send(new PutObjectCommand({
    Bucket: bucketName(bucket),
    Key: key,
    Body: body,
    ContentType: contentType
  }));
}

export async function deleteObject(bucket: Bucket, key: string): Promise<void> {
  await s3().send(new DeleteObjectCommand({ Bucket: bucketName(bucket), Key: key }));
}

/** True if the object is actually present in the bucket. */
export async function objectExists(bucket: Bucket, key: string): Promise<boolean> {
  try {
    await s3().send(new HeadObjectCommand({ Bucket: bucketName(bucket), Key: key }));
    return true;
  } catch {
    return false;
  }
}

/**
 * Presigned PUT so the browser can upload straight to R2, rather than relaying
 * the bytes through a function that would have to buffer them and stay open for
 * the whole transfer.
 *
 * The browser must send exactly this Content-Type on the PUT or the signature
 * will not match. The bucket also needs a CORS rule allowing PUT from the site
 * origin — see R2_UPLOAD_SETUP.md.
 */
export async function presignPut(
  bucket: Bucket, key: string, contentType: string, expiresIn = 600
): Promise<string> {
  return getSignedUrl(s3(), new PutObjectCommand({
    Bucket: bucketName(bucket),
    Key: key,
    ContentType: contentType
  }), { expiresIn });
}
