import { json, bad, guard, pathParam } from '../../lib/util';
import { db } from '../../lib/db';

export async function DELETE(request: Request): Promise<Response> {
  const denied = await guard(request);
  if (denied) return denied;

  const slug = pathParam(request, 'slug');
  if (!slug) return bad('Missing slug');
  const inUse = await db()
    .prepare('SELECT COUNT(*) as c FROM gallery WHERE category = ?')
    .bind(slug).first<{ c: number }>();
  if (inUse && inUse.c > 0) return bad('Category in use', 409);
  await db().prepare('DELETE FROM gallery_categories WHERE slug = ?').bind(slug).run();
  return json({ ok: true });
}
