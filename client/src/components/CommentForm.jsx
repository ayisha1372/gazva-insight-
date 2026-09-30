import { useState } from 'react';
import { api, ApiError } from '../api.js';

const initial = { name: '', email: '', message: '', website: '' };

export default function CommentForm({ articleId }) {
  const [form, setForm] = useState(initial);
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('Posting your comment...');
    setFieldErrors({});
    try {
      await api.post('/comments', { ...form, article_id: articleId });
      setStatus('success');
      setMessage('Thank you. Your comment has been submitted for review.');
      setForm(initial);
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof ApiError ? err.message : 'Could not post your comment. Check your connection and try again.');
      if (err instanceof ApiError && err.fields) setFieldErrors(err.fields);
    }
  };

  return (
    <section className="comments-section">
      <h3>Leave your comment</h3>
      <div className="comment-form">
        <form onSubmit={submit} noValidate>
          <div className="comment-form-row">
            <div className="form-field">
              <label htmlFor="comment-name">Name</label>
              <input id="comment-name" name="name" type="text" required autoComplete="name" value={form.name} onChange={set('name')} />
              {fieldErrors.name && <p className="field-error">{fieldErrors.name}</p>}
            </div>
            <div className="form-field">
              <label htmlFor="comment-email">Email</label>
              <input id="comment-email" name="email" type="email" required autoComplete="email" value={form.email} onChange={set('email')} />
              {fieldErrors.email && <p className="field-error">{fieldErrors.email}</p>}
            </div>
          </div>
          <div className="form-field">
            <label htmlFor="comment-message">Comment</label>
            <textarea id="comment-message" name="message" required value={form.message} onChange={set('message')} />
          </div>
          <input type="text" name="website" value={form.website} onChange={set('website')} tabIndex={-1} autoComplete="off" style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }} aria-hidden="true" />
          <button type="submit" className="btn btn-primary" disabled={status === 'loading'}>
            {status === 'loading' ? 'Posting…' : 'Post comment'}
          </button>
          <div className={`form-status${status ? ' is-visible' : ''}${status === 'success' ? ' is-success' : ''}${status === 'error' ? ' is-error' : ''}${status === 'loading' ? ' is-loading' : ''}`} role="status">
            {message}
          </div>
        </form>
      </div>
    </section>
  );
}
