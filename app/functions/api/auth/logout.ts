import { Env, json } from '../../lib/util';

export const onRequestPost: PagesFunction<Env> = async () => {
  return json({ ok: true }, {
    headers: { 'Set-Cookie': 'gvim_admin=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0' }
  });
};
