import { mkdir, writeFile, unlink, access } from 'node:fs/promises';
import { dirname, join, normalize, sep } from 'node:path';
import { env } from './util.js';

export type Bucket = 'gallery' | 'sermons';

/**
 * Filesystem storage, behind the interface lib/r2.ts exposed.
 *
 * R2 existed because Vercel Functions have no durable disk. On the VPS the
 * media lives beside the app, nginx serves it directly, and the presigned-URL
 * dance disappears: the browser posts to our own origin, so there is no
 * preflight, no signature to expire, and a readable status when it fails.
 *
 * Layout: MEDIA_ROOT/<bucket-dir>/<key>, e.g.
 *   /var/lib/gvim/media/gallery/community/IMG_1315.jpg
 * Keys are unchanged from R2, so every stored file_path still resolves.
 */

function mediaRoot(): string {
  return env('MEDIA_ROOT');
}

/**
 * Resolve a key to an absolute path.
 *
 * Keys already carry their bucket as the first segment — `gallery/<cat>/<id>.jpg`,
 * `sermons/<id>.mp3` — because that is how they were stored in R2, where the
 * key sat inside a same-named bucket. So the root is joined directly and the
 * bucket argument is used to *verify* the prefix rather than to add one.
 *
 * Keys are generated server-side, but this is the only place a caller can
 * reach the filesystem, so it validates instead of trusting that to stay true.
 */
export function resolveKey(bucket: Bucket, key: string): string {
  if (!key || key.startsWith('/') || key.includes('\0')) {
    throw new Error('Invalid storage key');
  }
  if (!key.startsWith(`${bucket}/`)) {
    throw new Error(`Storage key ${JSON.stringify(key)} is not in bucket ${bucket}`);
  }
  const base = normalize(mediaRoot());
  const full = normalize(join(base, key));
  if (!full.startsWith(base + sep)) {
    throw new Error('Storage key escapes the media root');
  }
  return full;
}

/** Public base URL used to build the browser-facing `url` field on each record. */
export function publicBase(bucket: Bucket): string {
  const raw = bucket === 'gallery'
    ? env('PUBLIC_GALLERY_BASE')
    : env('PUBLIC_SERMONS_BASE');
  return raw.replace(/\/$/, '');
}

export async function putObject(
  bucket: Bucket, key: string, body: Uint8Array, _contentType: string
): Promise<void> {
  const full = resolveKey(bucket, key);
  await mkdir(dirname(full), { recursive: true });
  await writeFile(full, body);
}

export async function deleteObject(bucket: Bucket, key: string): Promise<void> {
  const full = resolveKey(bucket, key);
  try {
    await unlink(full);
  } catch (err) {
    /* Already gone is the desired end state, so treat it as success. Any
       other error is real and must surface. */
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
  }
}

/** True if the object is actually present on disk. */
export async function objectExists(bucket: Bucket, key: string): Promise<boolean> {
  try {
    await access(resolveKey(bucket, key));
    return true;
  } catch {
    return false;
  }
}
