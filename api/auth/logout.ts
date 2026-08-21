import { json } from '../../lib/util.js';

export async function POST(): Promise<Response> {
  return json({ ok: true }, {
    headers: { 'Set-Cookie': 'gvim_admin=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0' }
  });
}
