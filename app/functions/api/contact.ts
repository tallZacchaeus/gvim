import { Env, json, bad } from '../lib/util';

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  const ct = ctx.request.headers.get('content-type') || '';
  let body: any = {};
  if (ct.includes('application/json')) {
    body = await ctx.request.json().catch(() => ({}));
  } else {
    const form = await ctx.request.formData();
    body = Object.fromEntries(form.entries());
  }
  if (body.website) return json({ ok: true });

  const name = String(body.name || '').trim();
  const email = String(body.email || '').trim();
  const phone = String(body.phone || '').trim();
  const subject = String(body.subject || '').trim();
  const message = String(body.message || '').trim();
  const newsletter = body.newsletter ? 1 : 0;

  if (!name) return bad('Name required');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return bad('Valid email required');
  if (!subject) return bad('Subject required');
  if (message.length < 10) return bad('Message must be at least 10 characters');

  const ip = ctx.request.headers.get('CF-Connecting-IP') || '';
  await ctx.env.DB.prepare(
    `INSERT INTO contact_submissions (name, email, phone, subject, message, newsletter, ip_address)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).bind(name, email, phone, subject, message, newsletter, ip).run();

  return json({ ok: true });
};
