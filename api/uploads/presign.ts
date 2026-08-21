import { json, bad, genId, guard } from '../../lib/util.js';
import { db } from '../../lib/db.js';
import { presignPut, type Bucket } from '../../lib/r2.js';

const MAX_BYTES = 50 * 1024 * 1024;

interface FileReq { name?: string; type?: string; size?: number }

/**
 * Issue presigned PUT URLs so the browser uploads straight to R2.
 *
 * Relaying file bytes through a function means buffering them in memory and
 * holding the function open for the whole transfer, so uploads bypass the API
 * entirely. The client PUTs to the returned URL, then calls POST /api/gallery
 * or /api/sermons with the returned keys.
 *
 * Keys are always generated here — a client-supplied key would let an admin
 * write anywhere in the bucket, including over existing objects.
 */
export async function POST(request: Request): Promise<Response> {
  const denied = await guard(request);
  if (denied) return denied;

  const body = await request.json().catch(() => null) as
    { kind?: string; category?: string; files?: FileReq[] } | null;

  const kind = body?.kind === 'sermons' ? 'sermons' : body?.kind === 'gallery' ? 'gallery' : null;
  if (!kind) return bad('kind must be "gallery" or "sermons"');

  const files = Array.isArray(body?.files) ? body!.files! : [];
  if (files.length === 0) return bad('No files provided');
  if (files.length > 50) return bad('Too many files in one batch (max 50)');

  let prefix: string;
  if (kind === 'gallery') {
    const category = String(body?.category || '').trim();
    if (!category) return bad('Category required');
    // Validate against the DB so the key prefix can never be attacker-controlled.
    const cat = await db()
      .prepare('SELECT slug FROM gallery_categories WHERE slug = ?')
      .bind(category).first<{ slug: string }>();
    if (!cat) return bad('Unknown category', 400);
    prefix = `gallery/${cat.slug}`;
  } else {
    prefix = 'sermons';
  }

  const uploads = [];
  for (const f of files) {
    const filename = String(f?.name || '').trim();
    const contentType = String(f?.type || '').trim();
    const size = Number(f?.size || 0);

    if (!filename) return bad('File name required');
    if (!Number.isFinite(size) || size <= 0) return bad(`Invalid size for ${filename}`);
    if (size > MAX_BYTES) return bad(`File ${filename} exceeds 50MB`);

    const isImage = contentType.startsWith('image/');
    const isVideo = contentType.startsWith('video/');
    const isAudio = contentType.startsWith('audio/');
    const allowed = kind === 'gallery' ? (isImage || isVideo) : (isAudio || isVideo);
    if (!allowed) return bad(`Unsupported type for ${filename}`);

    const id = genId();
    const ext = (filename.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '');
    const key = `${prefix}/${id}.${ext || 'bin'}`;
    const url = await presignPut(kind as Bucket, key, contentType);

    uploads.push({
      key,
      url,
      filename,
      contentType,
      type: isImage ? 'image' : isVideo ? 'video' : 'audio'
    });
  }

  return json({ ok: true, uploads });
}
