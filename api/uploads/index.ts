import { json, bad, genId, guard } from '../../lib/util.js';
import { db } from '../../lib/db.js';
import { putObject, type Bucket } from '../../lib/storage.js';

const MAX_BYTES = 50 * 1024 * 1024;

/**
 * Accept one uploaded file and write it to storage.
 *
 * One file per request, deliberately: `formData()` buffers the whole body in
 * memory, so a 26-file batch in a single request could hold well over a
 * gigabyte at once. The client posts files concurrently instead, which caps
 * peak memory, gives per-file progress, and lets one failure retry alone.
 *
 * Replaces the presigned-URL flow, which existed only to get around Vercel's
 * 4.5 MB request-body cap. Same-origin uploads need no preflight and no
 * signature, and report a real status when they fail.
 *
 * Keys are generated here. A client-supplied key would let an admin write
 * anywhere under the media root.
 */
export async function POST(request: Request): Promise<Response> {
  const denied = await guard(request);
  if (denied) return denied;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return bad('Expected a multipart form body');
  }

  const kindRaw = String(form.get('kind') || '');
  const kind: Bucket | null =
    kindRaw === 'sermons' ? 'sermons' : kindRaw === 'gallery' ? 'gallery' : null;
  if (!kind) return bad('kind must be "gallery" or "sermons"');

  const file = form.get('file');
  if (!(file instanceof File)) return bad('No file provided');

  const filename = file.name.trim();
  if (!filename) return bad('File name required');
  if (file.size <= 0) return bad(`${filename} is empty`);
  if (file.size > MAX_BYTES) return bad(`File ${filename} exceeds 50MB`);

  const contentType = file.type || '';
  const isImage = contentType.startsWith('image/');
  const isVideo = contentType.startsWith('video/');
  const isAudio = contentType.startsWith('audio/');
  const allowed = kind === 'gallery' ? (isImage || isVideo) : (isAudio || isVideo);
  if (!allowed) return bad(`Unsupported type for ${filename}`);

  /* The key carries its bucket as the first segment, exactly as the R2 keys
     did, so migrated rows and new ones share one shape and the commit
     handlers' existing key regexes still match. */
  let key: string;
  const id = genId();
  const ext = (filename.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin';

  if (kind === 'gallery') {
    const category = String(form.get('category') || '').trim();
    if (!category) return bad('Category required');
    /* Validated against the DB so the path segment can never be
       attacker-controlled. */
    const cat = await db()
      .prepare('SELECT slug FROM gallery_categories WHERE slug = ?')
      .bind(category).first<{ slug: string }>();
    if (!cat) return bad('Unknown category', 400);
    key = `gallery/${cat.slug}/${id}.${ext}`;
  } else {
    key = `sermons/${id}.${ext}`;
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  await putObject(kind, key, bytes, contentType);

  return json({
    ok: true,
    upload: {
      key,
      filename,
      type: isImage ? 'image' : isVideo ? 'video' : 'audio'
    }
  });
}
