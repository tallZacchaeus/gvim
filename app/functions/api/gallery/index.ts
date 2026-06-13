import { Env, json, bad, genId } from '../../lib/util';

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const url = new URL(ctx.request.url);
  const category = url.searchParams.get('category');
  const limit = parseInt(url.searchParams.get('limit') || '0', 10);

  let q = 'SELECT * FROM gallery';
  const args: any[] = [];
  if (category && category !== 'all') { q += ' WHERE category = ?'; args.push(category); }
  q += ' ORDER BY created_at DESC';
  if (limit > 0) q += ` LIMIT ${limit}`;

  const { results } = await ctx.env.DB.prepare(q).bind(...args).all();
  const base = ctx.env.PUBLIC_GALLERY_BASE.replace(/\/$/, '');
  const items = (results || []).map((r: any) => ({
    ...r,
    url: `${base}/${r.file_path}`
  }));
  return json(items);
};

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  const form = await ctx.request.formData();
  const title = String(form.get('title') || '').trim();
  const description = String(form.get('description') || '').trim();
  const category = String(form.get('category') || '').trim();
  const itemDate = String(form.get('item_date') || '') || null;
  const files = form.getAll('files') as File[];

  if (!title || !category || files.length === 0) return bad('Missing fields');

  const inserted: any[] = [];
  for (const file of files) {
    if (!file || !(file instanceof File) || file.size === 0) continue;
    if (file.size > 50 * 1024 * 1024) return bad(`File ${file.name} exceeds 50MB`);
    const mime = file.type;
    const isImage = mime.startsWith('image/');
    const isVideo = mime.startsWith('video/');
    if (!isImage && !isVideo) return bad(`Unsupported type for ${file.name}`);

    const id = genId();
    const ext = (file.name.split('.').pop() || 'bin').toLowerCase();
    const key = `gallery/${category}/${id}.${ext}`;
    await ctx.env.GALLERY_BUCKET.put(key, file.stream(), {
      httpMetadata: { contentType: mime }
    });

    await ctx.env.DB.prepare(
      `INSERT INTO gallery (id, title, description, category, file_path, filename, type, item_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(id, title, description, category, key, file.name, isImage ? 'image' : 'video', itemDate).run();

    inserted.push({ id, key });
  }
  return json({ ok: true, count: inserted.length, items: inserted });
};
