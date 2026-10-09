import { useState } from 'react';
import { api } from '../lib/api';
import { SITE, address, addressOneLine, officeHours } from '../data/site';
import PageHeader from '../components/site/PageHeader';

const subjects = [
  'General Inquiry', 'Prayer Request', 'Testimony', 'Ministry Involvement',
  'Counseling Request', 'Event Information', 'Volunteer Opportunities',
  'Pastoral Care', 'Other'
];

const MAP_SRC =
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2375.11420203308!2d-113.41212712326103!3d53.46641907232445!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x53a0198e69c5e943%3A0x4ce40c4e96f6e407!2s4511%2036%20Ave%20NW%2C%20Edmonton%2C%20AB%20T6L%203R9%2C%20Canada!5e0!3m2!1sen!2sng!4v1750483764377!5m2!1sen!2sng';

export default function Contact() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [data, setData] = useState({
    name: '', email: '', phone: '', subject: '', message: '', newsletter: false, website: ''
  });

  function set<K extends keyof typeof data>(k: K, v: typeof data[K]) {
    setData(d => ({ ...d, [k]: v }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!data.name.trim()) errs.name = 'Full name is required.';
    if (!data.email.trim()) errs.email = 'Email address is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) errs.email = 'Please enter a valid email.';
    if (!data.subject) errs.subject = 'Please select a subject.';
    if (data.message.trim().length < 10) errs.message = 'Message must be at least 10 characters.';
    setErrors(errs);
    if (Object.keys(errs).length) {
      /* Send focus to the first field that failed, so a keyboard or screen
         reader user is not left guessing where the problem is. */
      document.getElementById(Object.keys(errs)[0])?.focus();
      return;
    }

    setStatus('sending');
    try {
      await api.contact.send(data);
      setStatus('success');
      setData({ name: '', email: '', phone: '', subject: '', message: '', newsletter: false, website: '' });
    } catch { setStatus('error'); }
  }

  const err = (k: string) => errors[k]
    ? { 'aria-invalid': true as const, 'aria-describedby': `${k}-err` }
    : {};

  return (
    <>
      <PageHeader
        crumb="Contact"
        title="Contact us"
        lede="Questions, prayer requests or testimonies — we would love to hear from you."
      />

      <section className="p-section">
        <div className="p-container">
          {/* role=status, not alert: this is a result, announced politely. */}
          <div role="status" aria-live="polite">
            {status === 'success' && (
              <p className="p-note p-note--ok">
                Thank you. Your message has been sent and we will get back to you soon.
              </p>
            )}
            {status === 'error' && (
              <p className="p-note p-note--bad">
                Sorry, your message could not be sent. Please try again, or email{' '}
                <a className="p-break" href={`mailto:${SITE.email}`}>{SITE.email}</a>.
              </p>
            )}
          </div>

          <div className="p-contact">
            <div>
              <h2>Send us a message</h2>
              <form className="p-form" onSubmit={onSubmit} noValidate>
                {/* Honeypot: bots fill it, people never see it. */}
                <input
                  type="text" name="website" tabIndex={-1} autoComplete="off"
                  className="p-sr" aria-hidden="true"
                  value={data.website} onChange={e => set('website', e.target.value)}
                />

                <div className="p-field">
                  <label htmlFor="name">Full name <abbr title="required">*</abbr></label>
                  <input id="name" type="text" autoComplete="name" value={data.name}
                    onChange={e => set('name', e.target.value)} {...err('name')} />
                  {errors.name && <p className="p-field__err" id="name-err">{errors.name}</p>}
                </div>

                <div className="p-field">
                  <label htmlFor="email">Email address <abbr title="required">*</abbr></label>
                  <input id="email" type="email" autoComplete="email" value={data.email}
                    onChange={e => set('email', e.target.value)} {...err('email')} />
                  {errors.email && <p className="p-field__err" id="email-err">{errors.email}</p>}
                </div>

                <div className="p-field">
                  <label htmlFor="phone">Phone number</label>
                  <input id="phone" type="tel" autoComplete="tel" value={data.phone}
                    onChange={e => set('phone', e.target.value)} />
                </div>

                <div className="p-field">
                  <label htmlFor="subject">Subject <abbr title="required">*</abbr></label>
                  <select id="subject" value={data.subject}
                    onChange={e => set('subject', e.target.value)} {...err('subject')}>
                    <option value="">Please select a subject</option>
                    {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {errors.subject && <p className="p-field__err" id="subject-err">{errors.subject}</p>}
                </div>

                <div className="p-field">
                  <label htmlFor="message">Message <abbr title="required">*</abbr></label>
                  <textarea id="message" rows={6} value={data.message}
                    onChange={e => set('message', e.target.value)} {...err('message')} />
                  {errors.message && <p className="p-field__err" id="message-err">{errors.message}</p>}
                </div>

                <div className="p-check">
                  <input id="newsletter" type="checkbox" checked={data.newsletter}
                    onChange={e => set('newsletter', e.target.checked)} />
                  <label htmlFor="newsletter">Send me occasional news from GVIM</label>
                </div>

                <button type="submit" className="p-btn p-btn--primary" disabled={status === 'sending'}>
                  {status === 'sending' ? 'Sending…' : 'Send message'}
                </button>
              </form>
            </div>

            <div className="p-info">
              <h2>Get in touch</h2>

              <div className="p-info__block">
                <h3>Visit us</h3>
                <address className="p-info__addr">
                  {address.street}<br />
                  {address.city}, {address.region} {address.postal}<br />
                  {address.country}
                </address>
                <p>
                  <a className="p-link" href={`https://maps.google.com/maps?q=${encodeURIComponent(addressOneLine)}`}
                     target="_blank" rel="noopener noreferrer">Open in Google Maps</a>
                </p>
              </div>

              <div className="p-info__block">
                <h3>Call us</h3>
                <p><a href={`tel:${SITE.phone.replace(/[^+\d]/g, '')}`}>{SITE.phone}</a></p>
              </div>

              <div className="p-info__block">
                <h3>Email us</h3>
                <p><a className="p-break" href={`mailto:${SITE.email}`}>{SITE.email}</a></p>
              </div>

              <div className="p-info__block">
                <h3>Office hours</h3>
                <ul className="p-hours">
                  {officeHours.map(h => (
                    <li key={h.when}><span>{h.when}</span><span>{h.time}</span></li>
                  ))}
                </ul>
              </div>

              {/* Was a red alert box, which reads as an error rather than care. */}
              <div className="p-pastoral">
                <h3>Pastoral care</h3>
                <p>
                  If you need to speak with a pastor urgently, call{' '}
                  <a href={`tel:${SITE.phone.replace(/[^+\d]/g, '')}`}>{SITE.phone}</a> at any
                  hour and leave a message — someone will return your call.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="p-section p-section--tight p-section--surface">
        <div className="p-container">
          <div className="p-head"><h2>Find us</h2></div>
          <div className="p-map">
            <iframe
              src={MAP_SRC}
              title="Map showing God&rsquo;s Vessels International Ministry at 4511 36 Ave NW, Edmonton"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        </div>
      </section>
    </>
  );
}
