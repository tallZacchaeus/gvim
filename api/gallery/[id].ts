import { json, bad, guard, pathParam } from '../../lib/util';
import { db } from '../../lib/db';
import { deleteObject } from '../../lib/r2';

export async function DELETE(request: Request): Promise<Response> {
  const denied = await guard(request);
  if (denied) return denied;

  const id = pathParam(request, 'id');
  if (!id) return bad('Missing id');
  const row = await db().prepare('SELECT file_path FROM gallery WHERE id = ?')
    .bind(id).first<{ file_path: string }>();
  if (!row) return bad('Not found', 404);
  await deleteObject('gallery', row.file_path).catch(() => {});
  await db().prepare('DELETE FROM gallery WHERE id = ?').bind(id).run();
  return json({ ok: true });
}
