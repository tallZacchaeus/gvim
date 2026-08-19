import { json, bad, genId, guard } from '../../lib/util';
import { db } from '../../lib/db';
import { objectExists, deleteObject, publicBase } from '../../lib/r2';

function extractYouTubeId(url: string): string {
  if (!url) return '';
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/);
  if (m) return m[1];
  if (/^[A-Za-z0-9_-]{11}$/.test(url)) return url;
  return '';
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const limitRaw = parseInt(url.searchParams.get('limit') || '0', 10);
  let q = 'SELECT * FROM sermons ORDER BY sermon_date DESC, created_at DESC';
  const args: any[] = [];
  if (limitRaw > 0) { q += ' LIMIT ?'; args.push(Math.min(limitRaw, 500)); }

  const { results } = await db().prepare(q).bind(...args).all();
  const base = publicBase('sermons');
  const items = (results || []).map((r: any) => ({
    ...r,
    url: r.file_path ? `${base}/${r.file_path}` : ''
  }));
  return json(items);
}

/**
 * Commit a sermon whose media (if any) was already uploaded to R2 via
 * POST /api/uploads/presign. Metadata only — see the gallery handler for why.
 */
export async function POST(request: Request): Promise<Response> {
  const denied = await guard(request);
  if (denied) return denied;

  const body = await request.json().catch(() => null) as {
    title?: string; speaker?: string; sermon_date?: string; scripture?: string;
    description?: string; youtube_url?: string; duration?: string;
    file?: { key?: string; filename?: string } | null;
  } | null;

  const title = String(body?.title || '').trim();
  if (!title) return bad('Title required');

  const speaker = String(body?.speaker || '').trim();
  const sermon_date = String(body?.sermon_date || '') || null;
  const scripture = String(body?.scripture || '').trim();
  const description = String(body?.description || '').trim();
  const duration = String(body?.duration || '').trim();
  const youtube_id = extractYouTubeId(String(body?.youtube_url || '').trim());

  let file_path = '';
  const key = String(body?.file?.key || '').trim();
  if (key) {
    if (!/^sermons\/[a-f0-9]{16}\.[a-z0-9]+$/.test(key)) return bad(`Invalid upload key: ${key}`);
    if (!(await objectExists('sermons', key))) return bad('Upload not found in storage', 409);
    file_path = key;
  }

  const id = genId();
  try {
    await db().prepare(
      `INSERT INTO sermons (id, title, speaker, sermon_date, scripture, description, youtube_id, file_path, duration)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(id, title, speaker, sermon_date, scripture, description, youtube_id, file_path, duration).run();
  } catch (err) {
    if (file_path) await deleteObject('sermons', file_path).catch(() => {});
    throw err;
  }

  return json({ ok: true, id });
}
