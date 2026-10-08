import { json, bad, clientIp } from '../lib/util.js';
import { db } from '../lib/db.js';
import { notifyContact } from '../lib/email.js';

export async function POST(request: Request): Promise<Response> {
  const ct = request.headers.get('content-type') || '';
  let body: any = {};
  if (ct.includes('application/json')) {
    body = await request.json().catch(() => ({}));
  } else {
    const form = await request.formData();
    body = Object.fromEntries(form.entries());
  }
  if (body.website) return json({ ok: true }); // honeypot

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

  await db().prepare(
    `INSERT INTO contact_submissions (name, email, phone, subject, message, newsletter, ip_address)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).bind(name, email, phone, subject, message, newsletter, clientIp(request)).run();

  /* Notify the church — strictly after the row is committed, and strictly
     best-effort. The enquiry is already safe in the database; a provider outage
     must not turn a successful submission into an error for the visitor. The
     awaited call is bounded by a timeout inside notifyContact, because an
     un-awaited promise can be killed when the function returns. */
  const notified = await notifyContact({
    name, email, phone, subject, message, newsletter: newsletter === 1
  });
  if (!notified.sent && notified.reason !== 'not-configured') {
    console.error('[contact] notification failed:', notified.reason, notified.detail ?? '');
  }

  return json({ ok: true });
}
