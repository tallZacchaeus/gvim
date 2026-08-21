import { json, bad, guard } from '../lib/util.js';
import { db } from '../lib/db.js';

export async function GET(request: Request): Promise<Response> {
  const denied = await guard(request);
  if (denied) return denied;

  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get('limit') || '100', 10);
  const { results } = await db().prepare(
    'SELECT * FROM contact_submissions ORDER BY submitted_at DESC LIMIT ?'
  ).bind(limit).all();
  return json(results || []);
}

export async function DELETE(request: Request): Promise<Response> {
  const denied = await guard(request);
  if (denied) return denied;

  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) return bad('Missing id');
  await db().prepare('DELETE FROM contact_submissions WHERE id = ?').bind(id).run();
  return json({ ok: true });
}
