import { Env, json, bad } from '../../lib/util';

export const onRequestDelete: PagesFunction<Env> = async (ctx) => {
  const slug = ctx.params.slug as string;
  if (!slug) return bad('Missing slug');
  const inUse = await ctx.env.DB.prepare('SELECT COUNT(*) as c FROM gallery WHERE category = ?').bind(slug).first<{ c: number }>();
  if (inUse && inUse.c > 0) return bad('Category in use', 409);
  await ctx.env.DB.prepare('DELETE FROM gallery_categories WHERE slug = ?').bind(slug).run();
  return json({ ok: true });
};
