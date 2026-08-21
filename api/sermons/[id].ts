import { json, bad, guard, pathParam } from '../../lib/util.js';
import { db } from '../../lib/db.js';
import { deleteObject } from '../../lib/r2.js';

export async function DELETE(request: Request): Promise<Response> {
  const denied = await guard(request);
  if (denied) return denied;

  const id = pathParam(request, 'id');
  if (!id) return bad('Missing id');
  const row = await db().prepare('SELECT file_path FROM sermons WHERE id = ?')
    .bind(id).first<{ file_path: string }>();
  if (!row) return bad('Not found', 404);
  if (row.file_path) await deleteObject('sermons', row.file_path).catch(() => {});
  await db().prepare('DELETE FROM sermons WHERE id = ?').bind(id).run();
  return json({ ok: true });
}
