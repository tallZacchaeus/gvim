import { Env, json, bad, genId } from '../../lib/util';

function extractYouTubeId(url: string): string {
  if (!url) return '';
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/
  ];
  for (const p of patterns) { const m = url.match(p); if (m) return m[1]; }
  if (/^[A-Za-z0-9_-]{11}$/.test(url)) return url;
  return '';
}

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const url = new URL(ctx.request.url);
  const limit = parseInt(url.searchParams.get('limit') || '0', 10);
  let q = 'SELECT * FROM sermons ORDER BY sermon_date DESC, created_at DESC';
  if (limit > 0) q += ` LIMIT ${limit}`;
  const { results } = await ctx.env.DB.prepare(q).all();
  const base = ctx.env.PUBLIC_SERMONS_BASE.replace(/\/$/, '');
  const items = (results || []).map((r: any) => ({
    ...r,
    url: r.file_path ? `${base}/${r.file_path}` : ''
  }));
  return json(items);
};

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  const form = await ctx.request.formData();
  const title = String(form.get('title') || '').trim();
  const speaker = String(form.get('speaker') || '').trim();
  const sermon_date = String(form.get('sermon_date') || '') || null;
  const scripture = String(form.get('scripture') || '').trim();
  const description = String(form.get('description') || '').trim();
  const youtubeUrl = String(form.get('youtube_url') || '').trim();
  const duration = String(form.get('duration') || '').trim();
  const file = form.get('file') as File | null;

  if (!title) return bad('Title required');

  const youtube_id = extractYouTubeId(youtubeUrl);
  let file_path = '';
  if (file && file instanceof File && file.size > 0) {
    if (file.size > 50 * 1024 * 1024) return bad('File exceeds 50MB');
    const id = genId();
    const ext = (file.name.split('.').pop() || 'bin').toLowerCase();
    file_path = `sermons/${id}.${ext}`;
    await ctx.env.SERMONS_BUCKET.put(file_path, file.stream(), {
      httpMetadata: { contentType: file.type }
    });
  }

  const id = genId();
  await ctx.env.DB.prepare(
    `INSERT INTO sermons (id, title, speaker, sermon_date, scripture, description, youtube_id, file_path, duration)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, title, speaker, sermon_date, scripture, description, youtube_id, file_path, duration).run();

  return json({ ok: true, id });
};
