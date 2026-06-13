import { useState } from 'react';
import { api } from '../lib/api';

const subjects = ['General Inquiry','Prayer Request','Testimony','Ministry Involvement','Counseling Request','Event Information','Volunteer Opportunities','Pastoral Care','Other'];

export default function Contact() {
  const [status, setStatus] = useState<'idle'|'sending'|'success'|'error'>('idle');
  const [errors, setErrors] = useState<Record<string,string>>({});
  const [data, setData] = useState({ name:'', email:'', phone:'', subject:'', message:'', newsletter:false, website:'' });

  function set<K extends keyof typeof data>(k: K, v: any) { setData(d => ({ ...d, [k]: v })); }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string,string> = {};
    if (!data.name.trim()) errs.name = 'Full name is required.';
    if (!data.email.trim()) errs.email = 'Email address is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) errs.email = 'Please enter a valid email.';
    if (!data.subject) errs.subject = 'Please select a subject.';
    if (data.message.trim().length < 10) errs.message = 'Message must be at least 10 characters.';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setStatus('sending');
    try {
      await api.contact.send(data);
      setStatus('success');
      setData({ name:'', email:'', phone:'', subject:'', message:'', newsletter:false, website:'' });
    } catch { setStatus('error'); }
  }

  return (
    <>
      <section className="page-header">
        <div className="container">
          <h1>Contact Us</h1>
          <p>We'd love to hear from you. Reach out with questions, prayer requests, or testimonies</p>
        </div>
      </section>

      <section className="contact-section">
        <div className="container">
          {status === 'success' && (
            <div className="alert alert-success" role="alert">
              <i className="fas fa-check-circle"></i> Thank you! Your message has been sent. We'll get back to you soon.
            </div>
          )}
          {status === 'error' && (
            <div className="alert alert-error" role="alert">
              <i className="fas fa-exclamation-circle"></i> Sorry, there was an issue sending your message. Please try again or email us directly.
            </div>
          )}

          <div className="contact-grid">
            <div className="contact-form-section">
              <h2>Send Us a Message</h2>
              <form className="contact-form" onSubmit={onSubmit} noValidate>
                <input type="text" name="website" value={data.website} onChange={e => set('website', e.target.value)} style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />

                <div className="form-group">
                  <label htmlFor="name">Full Name <span aria-hidden="true">*</span></label>
                  <input id="name" type="text" required autoComplete="name" value={data.name} onChange={e => set('name', e.target.value)} />
                  <span className="error-message" role="alert">{errors.name || ''}</span>
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email Address <span aria-hidden="true">*</span></label>
                  <input id="email" type="email" required autoComplete="email" value={data.email} onChange={e => set('email', e.target.value)} />
                  <span className="error-message" role="alert">{errors.email || ''}</span>
                </div>
                <div className="form-group">
                  <label htmlFor="phone">Phone Number</label>
                  <input id="phone" type="tel" autoComplete="tel" value={data.phone} onChange={e => set('phone', e.target.value)} />
                </div>
                <div className="form-group">
                  <label htmlFor="subject">Subject <span aria-hidden="true">*</span></label>
                  <select id="subject" required value={data.subject} onChange={e => set('subject', e.target.value)}>
                    <option value="">Please select a subject</option>
                    {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <span className="error-message" role="alert">{errors.subject || ''}</span>
                </div>
                <div className="form-group">
                  <label htmlFor="message">Message <span aria-hidden="true">*</span></label>
                  <textarea id="message" rows={6} required value={data.message} onChange={e => set('message', e.target.value)} placeholder="Share your message, prayer request, or testimony..." />
                  <span className="error-message" role="alert">{errors.message || ''}</span>
                </div>
                <div className="form-group">
                  <label className="checkbox-label">
                    <input type="checkbox" checked={data.newsletter} onChange={e => set('newsletter', e.target.checked)} />
                    <span>I would like to receive newsletters and updates from GVIM</span>
                  </label>
                </div>
                <button type="submit" className="btn btn-primary" disabled={status === 'sending'}>
                  {status === 'sending' ? <><i className="fas fa-spinner fa-spin"></i> Sending…</> : <><i className="fas fa-paper-plane"></i> Send Message</>}
                </button>
              </form>
            </div>

            <div className="contact-info-section">
              <h2>Get in Touch</h2>
              <div className="contact-info">
                <div className="info-item">
                  <div className="info-icon"><i className="fas fa-map-marker-alt"></i></div>
                  <div className="info-content">
                    <h4>Visit Us</h4>
                    <p>4511, 36 Ave NW<br />Edmonton, T6L 3R9<br />Alberta, Canada</p>
                    <a href="https://maps.google.com/maps?q=4511+36+Ave+NW+Edmonton+T6L+3R9" target="_blank" rel="noopener noreferrer" className="map-link">
                      <i className="fas fa-external-link-alt"></i> View on Google Maps
                    </a>
                  </div>
                </div>
                <div className="info-item">
                  <div className="info-icon"><i className="fas fa-phone"></i></div>
                  <div className="info-content">
                    <h4>Call Us</h4>
                    <p>Main: <a href="tel:+18252027450">+1 (825) 202-7450</a></p>
                    <p>Prayer Line: <a href="http://bit.ly/463cEXB" target="_blank" rel="noopener noreferrer">Join Prayer Line</a></p>
                  </div>
                </div>
                <div className="info-item">
                  <div className="info-icon"><i className="fas fa-envelope"></i></div>
                  <div className="info-content">
                    <h4>Email Us</h4>
                    <p><a href="mailto:godvesselsinternational@gmail.com">godvesselsinternational@gmail.com</a></p>
                  </div>
                </div>
                <div className="info-item">
                  <div className="info-icon"><i className="fas fa-clock"></i></div>
                  <div className="info-content">
                    <h4>Office Hours</h4>
                    <p>Monday – Friday: 9:00 AM – 5:00 PM</p>
                    <p>Saturday: 10:00 AM – 2:00 PM</p>
                    <p>Sunday: Available during services</p>
                  </div>
                </div>
              </div>
              <div className="emergency-contact">
                <h3><i className="fas fa-phone-alt"></i> Emergency Pastoral Care</h3>
                <p>For urgent pastoral care needs, please call:</p>
                <a href="tel:+18252027450" className="emergency-number"><i className="fas fa-phone"></i> +1 (825) 202-7450</a>
                <p><small>Available 24/7 for members in crisis</small></p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="map-section">
        <div className="container">
          <h2>Find Us</h2>
          <div className="map-container">
            <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2375.11420203308!2d-113.41212712326103!3d53.46641907232445!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x53a0198e69c5e943%3A0x4ce40c4e96f6e407!2s4511%2036%20Ave%20NW%2C%20Edmonton%2C%20AB%20T6L%203R9%2C%20Canada!5e0!3m2!1sen!2sng!4v1750483764377!5m2!1sen!2sng"
              width="100%" height={450} style={{ border: 0 }} allowFullScreen loading="lazy"
              referrerPolicy="no-referrer-when-downgrade" title="GVIM Location Map" />
          </div>
        </div>
      </section>
    </>
  );
}
