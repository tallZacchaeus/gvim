import { Env, json, bad } from '../../lib/util';

export const onRequestDelete: PagesFunction<Env> = async (ctx) => {
  const id = ctx.params.id as string;
  if (!id) return bad('Missing id');
  const row = await ctx.env.DB.prepare('SELECT file_path FROM sermons WHERE id = ?').bind(id).first<{ file_path: string }>();
  if (!row) return bad('Not found', 404);
  if (row.file_path) await ctx.env.SERMONS_BUCKET.delete(row.file_path).catch(() => {});
  await ctx.env.DB.prepare('DELETE FROM sermons WHERE id = ?').bind(id).run();
  return json({ ok: true });
};
