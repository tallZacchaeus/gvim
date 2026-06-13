import { Env, json, bad } from '../../lib/util';

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const { results } = await ctx.env.DB.prepare(
    'SELECT slug, label FROM gallery_categories ORDER BY label ASC'
  ).all();
  return json(results || []);
};

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  const body = await ctx.request.json().catch(() => null) as { slug?: string; label?: string } | null;
  if (!body?.slug || !body?.label) return bad('Missing slug or label');
  const slug = body.slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  if (!slug) return bad('Invalid slug');
  await ctx.env.DB.prepare(
    'INSERT OR IGNORE INTO gallery_categories (slug, label) VALUES (?, ?)'
  ).bind(slug, body.label).run();
  return json({ ok: true, slug });
};
