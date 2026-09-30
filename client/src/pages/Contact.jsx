import { useEffect, useState } from 'react';
import { api, ApiError } from '../api.js';
import { useSite } from '../context/SiteContext.jsx';
import { useDocumentMeta } from '../hooks/useDocumentMeta.js';
import { LoadingBlock } from '../components/StateBlock.jsx';
import NotFound from './NotFound.jsx';

const MapPinIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
  </svg>
);
const MailIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
  </svg>
);
const PhoneIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.24h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7a2 2 0 0 1 1.72 2.02z" />
  </svg>
);
const ClockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);
const SendIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);
const CheckIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const InstagramIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="2" width="20" height="20" rx="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);
const FacebookIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);
const WhatsAppIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M20.52 3.48A11.82 11.82 0 0 0 12.07 0C5.5 0 .15 5.35.15 11.92c0 2.1.55 4.15 1.59 5.96L0 24l6.29-1.65a11.9 11.9 0 0 0 5.78 1.47h.01C18.65 23.82 24 18.47 24 11.9c0-3.18-1.24-6.17-3.48-8.42ZM12.08 21.8h-.01a9.86 9.86 0 0 1-5.02-1.37l-.36-.21-3.73.98 1-3.64-.24-.37a9.83 9.83 0 0 1-1.52-5.27c0-5.44 4.43-9.87 9.88-9.87a9.8 9.8 0 0 1 6.98 2.89 9.8 9.8 0 0 1 2.89 6.98c0 5.44-4.43 9.88-9.87 9.88Zm5.42-7.4c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.95 1.17-.17.2-.35.22-.65.07-.3-.15-1.27-.47-2.42-1.49-.89-.8-1.49-1.79-1.67-2.09-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.05 1.02-1.05 2.49s1.07 2.89 1.22 3.09c.15.2 2.1 3.2 5.08 4.48.71.31 1.27.49 1.7.63.72.23 1.38.2 1.9.12.58-.09 1.77-.72 2.02-1.42.25-.69.25-1.29.17-1.42-.08-.12-.28-.2-.58-.35Z" />
  </svg>
);

const initial = { firstName: '', lastName: '', email: '', phone: '', subject: '', message: '', website: '' };

export default function Contact() {
  const { site } = useSite();
  const [page, setPage] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [form, setForm] = useState(initial);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    api.get('/pages/contact').then(setPage).catch(() => setNotFound(true));
  }, []);
  useDocumentMeta(page?.meta_title, page?.meta_description);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    setFieldErrors({});
    try {
      await api.post('/contact', form);
      setSent(true);
    } catch (err) {
      setErrorMsg(err instanceof ApiError ? err.message : 'Network error. Please try again.');
      if (err instanceof ApiError && err.fields) setFieldErrors(err.fields);
    } finally {
      setSubmitting(false);
    }
  };

  if (notFound) return <NotFound />;
  if (!page) return <LoadingBlock label="Loading" />;

  const c = site.contact;
  const s = site.socials;

  return (
    <>
      <div className="page-banner">
        <div className="page-banner__inner">
          <span className="eyebrow cat-general">{page.eyebrow}</span>
          <h1>{page.title}</h1>
          <p>{page.description}</p>
        </div>
      </div>

      <section className="contact-section">
        <div className="contact-wrap">
          <div className="contact-info">
            <div className="contact-info-card">
              <div className="cic-icon"><MapPinIcon /></div>
              <div>
                <p className="cic-label">Visit Us</p>
                <p className="cic-value">{c.address_title}</p>
                <p className="cic-sub">{c.address}</p>
              </div>
            </div>

            <div className="contact-info-card">
              <div className="cic-icon"><MailIcon /></div>
              <div>
                <p className="cic-label">Email Us</p>
                {c.emails.map((e, i) => (
                  i === 0
                    ? <a key={i} className="cic-value" href={`mailto:${e.mailto}`}>{e.label}</a>
                    : <p key={i} className="cic-sub"><a href={`mailto:${e.mailto}`}>{e.label}</a></p>
                ))}
              </div>
            </div>

            <div className="contact-info-card">
              <div className="cic-icon"><PhoneIcon /></div>
              <div>
                <p className="cic-label">Call Us</p>
                <a className="cic-value" href={c.phone_href || '#'}>{c.phone_label}</a>
              </div>
            </div>

            <div className="contact-info-card">
              <div className="cic-icon"><ClockIcon /></div>
              <div style={{ width: '100%' }}>
                <p className="cic-label">Office Hours</p>
                <div className="cic-hours">
                  {c.hours.map((h, i) => (
                    <span key={i} style={{ display: 'contents' }}>
                      <span className="cic-day">{h.day}</span><span className="cic-time">{h.time}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="contact-social-row">
              {s.instagram && <a href={s.instagram} className="contact-social-btn" target="_blank" rel="noopener noreferrer"><InstagramIcon /></a>}
              {s.facebook && <a href={s.facebook} className="contact-social-btn" target="_blank" rel="noopener noreferrer"><FacebookIcon /></a>}
              {s.whatsapp && <a href={s.whatsapp} className="contact-social-btn" target="_blank" rel="noopener noreferrer"><WhatsAppIcon /></a>}
            </div>
          </div>

          <div className="contact-form-wrap">
            {!sent ? (
              <div id="formContent">
                <p className="contact-form-title">Send a Message</p>
                <p className="contact-form-sub">We'd love to hear from you. Share your thoughts, questions, or suggestions, and we'll respond as soon as possible.</p>

                <form onSubmit={submit} noValidate>
                  <div className="cf-row">
                    <div className="cf-group">
                      <label htmlFor="firstName">First Name</label>
                      <input type="text" id="firstName" name="firstName" placeholder="Your first name" required value={form.firstName} onChange={set('firstName')} />
                      {fieldErrors.firstName && <p className="field-error">{fieldErrors.firstName}</p>}
                    </div>
                    <div className="cf-group">
                      <label htmlFor="lastName">Last Name</label>
                      <input type="text" id="lastName" name="lastName" placeholder="Your last name" value={form.lastName} onChange={set('lastName')} />
                    </div>
                  </div>
                  <div className="cf-group">
                    <label htmlFor="email">Email Address</label>
                    <input type="email" id="email" name="email" placeholder="your@email.com" required value={form.email} onChange={set('email')} />
                    {fieldErrors.email && <p className="field-error">{fieldErrors.email}</p>}
                  </div>
                  <div className="cf-group">
                    <label htmlFor="phone">Phone Number</label>
                    <input type="tel" id="phone" name="phone" placeholder="+91 00000 00000" value={form.phone} onChange={set('phone')} />
                  </div>
                  <div className="cf-group">
                    <label htmlFor="subject">Subject</label>
                    <input type="text" id="subject" name="subject" placeholder="Subject of your message" required value={form.subject} onChange={set('subject')} />
                    {fieldErrors.subject && <p className="field-error">{fieldErrors.subject}</p>}
                  </div>
                  <div className="cf-group">
                    <label htmlFor="message">Message</label>
                    <textarea id="message" name="message" placeholder="Write your message here…" required value={form.message} onChange={set('message')} />
                    {fieldErrors.message && <p className="field-error">{fieldErrors.message}</p>}
                  </div>
                  <input type="text" name="website" value={form.website} onChange={set('website')} tabIndex={-1} autoComplete="off" style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }} aria-hidden="true" />
                  {errorMsg && <p className="field-error" style={{ marginBottom: 12 }}>{errorMsg}</p>}
                  <button type="submit" className="cf-submit" disabled={submitting}>
                    {submitting ? 'Sending…' : 'Send Message'} <SendIcon />
                  </button>
                </form>
              </div>
            ) : (
              <div className="cf-success is-visible">
                <div className="cf-success-icon"><CheckIcon /></div>
                <p className="cf-success-title">Message Sent!</p>
                <p className="cf-success-text">Jazakallahu Khairan for reaching out.<br />We'll get back to you within 48 hours.</p>
                <button onClick={() => { setSent(false); setForm(initial); }} className="cf-reset-btn">Send Another Message</button>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
