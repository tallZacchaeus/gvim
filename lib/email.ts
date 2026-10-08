/**
 * Transactional email via Resend's REST API.
 *
 * Deliberately no SDK: one fetch call costs less than a dependency, and matches
 * how lib/r2.ts talks to its service.
 *
 * Notification is best-effort by design. The contact row is committed before
 * this runs, so a provider outage must never cost the church an enquiry — every
 * failure is swallowed and reported through the return value instead.
 */

const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const TIMEOUT_MS = 6000;

export interface ContactNotification {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  newsletter: boolean;
}

export type NotifyResult =
  | { sent: true }
  | { sent: false; reason: 'not-configured' | 'timeout' | 'error'; detail?: string };

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/**
 * Notify the church that an enquiry arrived.
 *
 * Returns rather than throws: the caller has already persisted the submission
 * and must respond 200 regardless of what happens here.
 */
export async function notifyContact(c: ContactNotification): Promise<NotifyResult> {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_NOTIFY_TO;
  // Optional feature: with no key configured the form still works, silently.
  if (!key || !to) return { sent: false, reason: 'not-configured' };

  const from = process.env.CONTACT_NOTIFY_FROM || 'GVIM Website <onboarding@resend.dev>';
  const safe = {
    name: escapeHtml(c.name),
    email: escapeHtml(c.email),
    phone: c.phone ? escapeHtml(c.phone) : '',
    subject: escapeHtml(c.subject),
    message: escapeHtml(c.message)
  };

  const html = `
    <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px">
      <h2 style="margin:0 0 4px;font-size:18px">New message from the website</h2>
      <p style="margin:0 0 16px;color:#555;font-size:14px">${safe.subject}</p>
      <table style="font-size:14px;border-collapse:collapse">
        <tr><td style="padding:4px 12px 4px 0;color:#777">From</td><td><strong>${safe.name}</strong></td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#777">Email</td><td><a href="mailto:${safe.email}">${safe.email}</a></td></tr>
        ${safe.phone ? `<tr><td style="padding:4px 12px 4px 0;color:#777">Phone</td><td>${safe.phone}</td></tr>` : ''}
        <tr><td style="padding:4px 12px 4px 0;color:#777">Newsletter</td><td>${c.newsletter ? 'Yes' : 'No'}</td></tr>
      </table>
      <div style="margin-top:16px;padding:12px;background:#f6f6f4;border-radius:8px;white-space:pre-wrap;font-size:14px">${safe.message}</div>
      <p style="margin-top:16px;font-size:12px;color:#888">
        Reply to this email to answer ${safe.name} directly.
      </p>
    </div>`.trim();

  const text = [
    `New message from the website`, ``,
    `Subject:    ${c.subject}`,
    `From:       ${c.name} <${c.email}>`,
    c.phone ? `Phone:      ${c.phone}` : '',
    `Newsletter: ${c.newsletter ? 'Yes' : 'No'}`, ``,
    c.message, ``,
    `Reply to this email to answer ${c.name} directly.`
  ].filter(Boolean).join('\n');

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        from,
        to: to.split(',').map(s => s.trim()).filter(Boolean),
        subject: `Website enquiry: ${c.subject}`,
        html,
        text,
        // Lets staff hit Reply and reach the enquirer, not the robot sender.
        reply_to: c.email
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS)
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      return { sent: false, reason: 'error', detail: `${res.status} ${detail.slice(0, 200)}` };
    }
    return { sent: true };
  } catch (err: any) {
    if (err?.name === 'TimeoutError' || err?.name === 'AbortError') {
      return { sent: false, reason: 'timeout' };
    }
    return { sent: false, reason: 'error', detail: String(err?.message || err).slice(0, 200) };
  }
}
