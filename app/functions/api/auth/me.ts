import { Env, json, requireAdmin } from '../../lib/util';

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const user = await requireAdmin(ctx.request, ctx.env);
  if (!user) return json({ authenticated: false }, { status: 401 });
  return json({ authenticated: true, username: user.sub });
};
