import { useEffect, useState } from 'react';
import { api } from '../../api.js';
import { useToast } from '../components/Toast.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import { useConfirm } from '../hooks/useConfirm.js';

const TABS = [
  { key: '', label: 'All' },
  { key: 'contact', label: 'Contact form' },
  { key: 'question', label: 'Questions' },
  { key: 'comment', label: 'Comments' },
];
const PAGE_SIZE = 20;

const fmt = (iso) => new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const initials = (name) => (name || '?').split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

export default function Messages() {
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ items: [], total: 0, summary: {} });
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const { confirm, dialogProps } = useConfirm();

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: PAGE_SIZE });
    if (type) params.set('type', type);
    if (status) params.set('status', status);
    if (q) params.set('q', q);
    api.get(`/admin/messages?${params}`).then(setData).catch(() => toast('Could not load messages.', 'error')).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [type, status, page]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { const t = setTimeout(() => { setPage(1); load(); }, 300); return () => clearTimeout(t); }, [q]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleRead = async (m) => {
    try { await api.patch(`/admin/messages/${m.id}`, { is_read: !m.is_read }); load(); } catch (err) { toast(err.message, 'error'); }
  };

  const remove = async (m) => {
    const ok = await confirm({ title: 'Delete message', message: `Delete this message from ${m.name}?`, confirmLabel: 'Delete', danger: true });
    if (!ok) return;
    try { await api.del(`/admin/messages/${m.id}`); toast('Message deleted.'); load(); } catch (err) { toast(err.message, 'error'); }
  };

  const markAllRead = async () => {
    try { await api.post('/admin/messages/mark-all-read', type ? { type } : {}); load(); } catch (err) { toast(err.message, 'error'); }
  };

  const totalUnread = Object.values(data.summary).reduce((s, v) => s + (v.unread || 0), 0);
  const totalPages = Math.max(1, Math.ceil(data.total / PAGE_SIZE));

  return (
    <>
      <div className="admin-header">
        <div>
          <h1>Messages</h1>
          <p>Contact form submissions, questions and article comments from visitors.</p>
        </div>
        <div className="admin-header__actions">
          {totalUnread > 0 && <button className="abtn abtn-outline" onClick={markAllRead}>Mark all as read</button>}
        </div>
      </div>

      <div className="message-tabs">
        {TABS.map((t) => {
          const count = t.key ? data.summary[t.key]?.unread : totalUnread;
          return (
            <button key={t.key} className={type === t.key ? 'is-active' : ''} onClick={() => { setType(t.key); setPage(1); }}>
              {t.label} {!!count && <span className="message-tabs__count">{count}</span>}
            </button>
          );
        })}
      </div>

      <div className="admin-toolbar">
        <input className="ainput" placeholder="Search name, email or message…" value={q} onChange={(e) => setQ(e.target.value)} style={{ minWidth: 260 }} />
        <select className="aselect" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All</option>
          <option value="unread">Unread</option>
          <option value="read">Read</option>
        </select>
      </div>

      <div className="admin-card">
        {loading ? (
          <div className="admin-page-loading"><div className="spinner" /></div>
        ) : data.items.length === 0 ? (
          <div className="admin-empty">No messages match these filters.</div>
        ) : (
          data.items.map((m) => (
            <div key={m.id} className={`message-row${m.is_read ? '' : ' is-unread'}`}>
              <div className="message-row__avatar">{initials(m.name)}</div>
              <div className="message-row__main">
                <div className="message-row__top">
                  <span className="message-row__name">{m.name}</span>
                  <span className={`badge badge-neutral`}>{m.type}</span>
                  <span className="message-row__time">{fmt(m.created_at)}</span>
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--ink-muted)' }}>
                  <a href={`mailto:${m.email}`}>{m.email}</a>{m.phone ? ` · ${m.phone}` : ''}
                </div>
                {m.subject && <div className="message-row__subject">{m.subject}{m.category ? ` — ${m.category}` : ''}</div>}
                {m.article_title && <div className="message-row__meta">On: {m.article_title}</div>}
                <div className="message-row__body">{m.message}</div>
                <div className="admin-table__actions" style={{ justifyContent: 'flex-start', marginTop: 10 }}>
                  <button className="abtn abtn-outline abtn-sm" onClick={() => toggleRead(m)}>{m.is_read ? 'Mark unread' : 'Mark read'}</button>
                  <button className="abtn abtn-danger abtn-sm" onClick={() => remove(m)}>Delete</button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="admin-pagination">
          <button className="abtn abtn-outline abtn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
          <span>Page {page} of {totalPages}</span>
          <button className="abtn abtn-outline abtn-sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      )}

      <ConfirmDialog {...dialogProps} />
    </>
  );
}
