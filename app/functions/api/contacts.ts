import { Env, json, bad } from '../lib/util';

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const url = new URL(ctx.request.url);
  const limit = parseInt(url.searchParams.get('limit') || '100', 10);
  const { results } = await ctx.env.DB.prepare(
    `SELECT * FROM contact_submissions ORDER BY submitted_at DESC LIMIT ?`
  ).bind(limit).all();
  return json(results || []);
};

export const onRequestDelete: PagesFunction<Env> = async (ctx) => {
  const url = new URL(ctx.request.url);
  const id = url.searchParams.get('id');
  if (!id) return bad('Missing id');
  await ctx.env.DB.prepare('DELETE FROM contact_submissions WHERE id = ?').bind(id).run();
  return json({ ok: true });
};
