import { json, bad, genId, guard } from '../../lib/util.js';
import { db } from '../../lib/db.js';
import { objectExists, deleteObject, publicBase } from '../../lib/r2.js';

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const category = url.searchParams.get('category');
  const limitRaw = parseInt(url.searchParams.get('limit') || '0', 10);

  let q = 'SELECT * FROM gallery';
  const args: any[] = [];
  if (category && category !== 'all') { q += ' WHERE category = ?'; args.push(category); }
  q += ' ORDER BY created_at DESC';
  // Bound as a parameter rather than interpolated, and clamped to a sane ceiling.
  if (limitRaw > 0) { q += ' LIMIT ?'; args.push(Math.min(limitRaw, 500)); }

  const { results } = await db().prepare(q).bind(...args).all();
  const base = publicBase('gallery');
  const items = (results || []).map((r: any) => ({ ...r, url: `${base}/${r.file_path}` }));
  return json(items);
}

/**
 * Commit gallery items that the browser has already uploaded to R2 via
 * POST /api/uploads/presign. Metadata only — no file bytes cross this handler,
 * so the request stays small however large the media is.
 */
export async function POST(request: Request): Promise<Response> {
  const denied = await guard(request);
  if (denied) return denied;

  const body = await request.json().catch(() => null) as {
    title?: string; description?: string; category?: string; item_date?: string;
    files?: { key?: string; filename?: string; type?: string }[];
  } | null;

  const title = String(body?.title || '').trim();
  const description = String(body?.description || '').trim();
  const category = String(body?.category || '').trim();
  const itemDate = String(body?.item_date || '') || null;
  const files = Array.isArray(body?.files) ? body!.files! : [];

  if (!title || !category || files.length === 0) return bad('Missing fields');

  const cat = await db()
    .prepare('SELECT slug FROM gallery_categories WHERE slug = ?')
    .bind(category).first<{ slug: string }>();
  if (!cat) return bad('Unknown category');

  const inserted: { id: string; key: string }[] = [];
  for (const f of files) {
    const key = String(f?.key || '').trim();
    const filename = String(f?.filename || '').trim() || key.split('/').pop() || 'file';
    const type = f?.type === 'video' ? 'video' : 'image';

    // Only keys this API could have issued: gallery/<known-category>/<id>.<ext>
    if (!new RegExp(`^gallery/${cat.slug}/[a-f0-9]{16}\\.[a-z0-9]+$`).test(key)) {
      return bad(`Invalid upload key: ${key}`);
    }
    // Never record a row pointing at an object that is not really there.
    if (!(await objectExists('gallery', key))) {
      return bad(`Upload not found in storage: ${filename}`, 409);
    }

    const id = genId();
    try {
      await db().prepare(
        `INSERT INTO gallery (id, title, description, category, file_path, filename, type, item_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(id, title, description, cat.slug, key, filename, type, itemDate).run();
    } catch (err) {
      await deleteObject('gallery', key).catch(() => {});
      throw err;
    }
    inserted.push({ id, key });
  }

  return json({ ok: true, count: inserted.length, items: inserted });
}
