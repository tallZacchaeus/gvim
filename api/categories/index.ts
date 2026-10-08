import { json, bad, guard } from '../../lib/util.js';
import { db } from '../../lib/db.js';

export async function GET(): Promise<Response> {
  const { results } = await db()
    .prepare('SELECT slug, label FROM gallery_categories ORDER BY label ASC')
    .all();
  return json(results || []);
}

export async function POST(request: Request): Promise<Response> {
  const denied = await guard(request);
  if (denied) return denied;

  const body = await request.json().catch(() => null) as { slug?: string; label?: string } | null;
  if (!body?.slug || !body?.label) return bad('Missing slug or label');
  const slug = body.slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  if (!slug) return bad('Invalid slug');
  await db()
    .prepare('INSERT OR IGNORE INTO gallery_categories (slug, label) VALUES (?, ?)')
    .bind(slug, body.label).run();
  return json({ ok: true, slug });
}

/** Delete by `?slug=` — see the note in api/gallery/index.ts. */
export async function DELETE(request: Request): Promise<Response> {
  const denied = await guard(request);
  if (denied) return denied;

  const slug = new URL(request.url).searchParams.get('slug');
  if (!slug) return bad('Missing slug');

  const inUse = await db()
    .prepare('SELECT COUNT(*) as c FROM gallery WHERE category = ?')
    .bind(slug).first<{ c: number }>();
  if (inUse && inUse.c > 0) return bad('Category in use', 409);

  await db().prepare('DELETE FROM gallery_categories WHERE slug = ?').bind(slug).run();
  return json({ ok: true });
}
