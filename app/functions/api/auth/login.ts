import { Env, json, bad, signJwt, verifyPassword } from '../../lib/util';

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  const body = await ctx.request.json().catch(() => null) as { username?: string; password?: string } | null;
  if (!body?.username || !body?.password) return bad('Missing credentials');
  if (body.username !== ctx.env.ADMIN_USERNAME) return bad('Invalid credentials', 401);
  const ok = await verifyPassword(body.password, ctx.env.ADMIN_PASSWORD_HASH);
  if (!ok) return bad('Invalid credentials', 401);

  const token = await signJwt({ sub: body.username, role: 'admin' }, ctx.env.JWT_SECRET);
  return json({ ok: true, username: body.username }, {
    headers: {
      'Set-Cookie': `gvim_admin=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${60*60*8}`
    }
  });
};
