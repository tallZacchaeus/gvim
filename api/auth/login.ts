import { json, bad, signJwt, verifyPassword, env } from '../../lib/util';

export async function POST(request: Request): Promise<Response> {
  const body = await request.json().catch(() => null) as { username?: string; password?: string } | null;
  if (!body?.username || !body?.password) return bad('Missing credentials');
  if (body.username !== env('ADMIN_USERNAME')) return bad('Invalid credentials', 401);
  const ok = await verifyPassword(body.password, env('ADMIN_PASSWORD_HASH'));
  if (!ok) return bad('Invalid credentials', 401);

  const token = await signJwt({ sub: body.username, role: 'admin' }, env('JWT_SECRET'));
  return json({ ok: true, username: body.username }, {
    headers: {
      'Set-Cookie': `gvim_admin=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${60 * 60 * 8}`
    }
  });
}
