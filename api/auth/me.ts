import { json, requireAdmin } from '../../lib/util.js';

export async function GET(request: Request): Promise<Response> {
  const user = await requireAdmin(request);
  if (!user) return json({ authenticated: false }, { status: 401 });
  return json({ authenticated: true, username: user.sub });
}
