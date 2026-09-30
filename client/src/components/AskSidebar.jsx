import { useState } from 'react';
import { api, ApiError } from '../api.js';
import { useSite } from '../context/SiteContext.jsx';

const initial = { name: '', email: '', subject: '', category: '', question: '', website: '' };

export default function AskSidebar() {
  const { site } = useSite();
  const [form, setForm] = useState(initial);
  const [status, setStatus] = useState(null); // null | 'loading' | 'success' | 'error'
  const [message, setMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('Sending your question...');
    setFieldErrors({});
    try {
      await api.post('/questions', form);
      setStatus('success');
      setMessage('Thank you. Your question has been sent.');
      setForm(initial);
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof ApiError ? err.message : 'Could not send your question. Check your connection and try again.');
      if (err instanceof ApiError && err.fields) setFieldErrors(err.fields);
    }
  };

  return (
    <aside className="ask-sidebar" aria-label="Ask your question" id="askQuestionForm">
      <h3 className="ask-sidebar__title">Ask your question</h3>
      <p className="ask-sidebar__desc">
        Have a question about Islamic knowledge, contemporary issues, or any topic we cover? Send it to our editorial team—we&rsquo;d love to hear from you.
      </p>
      <form onSubmit={submit} noValidate>
        <div className="form-field">
          <label htmlFor="ask-name">Name</label>
          <input id="ask-name" name="name" type="text" placeholder="Your name" required autoComplete="name" value={form.name} onChange={set('name')} />
          {fieldErrors.name && <p className="field-error">{fieldErrors.name}</p>}
        </div>
        <div className="form-field">
          <label htmlFor="ask-email">Email</label>
          <input id="ask-email" name="email" type="email" placeholder="Your email address" required autoComplete="email" value={form.email} onChange={set('email')} />
          {fieldErrors.email && <p className="field-error">{fieldErrors.email}</p>}
        </div>
        <div className="form-field">
          <label htmlFor="ask-subject">Subject</label>
          <textarea id="ask-subject" name="subject" placeholder="Topic of your question" required value={form.subject} onChange={set('subject')} />
        </div>
        <div className="form-field">
          <label htmlFor="askq-category">Category</label>
          <select id="askq-category" name="category" required value={form.category} onChange={set('category')}>
            <option value="">Select a category</option>
            {site.categories.map((c) => (
              <option key={c.slug} value={c.name}>{c.name}</option>
            ))}
            <option value="Other">Other</option>
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="ask-question">Your question</label>
          <textarea id="ask-question" name="question" required value={form.question} onChange={set('question')} />
        </div>
        {/* Honeypot: hidden from real visitors, filled in only by bots; server silently discards it. */}
        <input type="text" name="website" value={form.website} onChange={set('website')} tabIndex={-1} autoComplete="off" style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }} aria-hidden="true" />
        <button type="submit" className="btn btn-primary btn-block" disabled={status === 'loading'}>
          {status === 'loading' ? 'Sending…' : 'Send question'}
        </button>
        <div className={`form-status${status ? ' is-visible' : ''}${status === 'success' ? ' is-success' : ''}${status === 'error' ? ' is-error' : ''}${status === 'loading' ? ' is-loading' : ''}`} role="status">
          {message}
        </div>
      </form>
    </aside>
  );
}
