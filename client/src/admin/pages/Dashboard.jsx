import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api.js';

const timeAgo = (iso) => {
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

export default function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => { api.get('/admin/dashboard').then(setData).catch(() => {}); }, []);

  if (!data) return <div className="admin-page-loading"><div className="spinner" /></div>;
  const { counts, recentArticles, recentMessages, byCategory } = data;
  const maxCat = Math.max(1, ...byCategory.map((c) => c.n));

  return (
    <>
      <div className="admin-header">
        <div>
          <h1>Dashboard</h1>
          <p>An overview of your content and recent activity.</p>
        </div>
        <div className="admin-header__actions">
          <Link to="/admin/articles/new" className="abtn abtn-primary">New article</Link>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card"><div className="stat-card__label">Published</div><div className="stat-card__value">{counts.published}</div></div>
        <div className="stat-card"><div className="stat-card__label">Drafts</div><div className="stat-card__value">{counts.drafts}</div></div>
        <div className="stat-card"><div className="stat-card__label">Categories</div><div className="stat-card__value">{counts.categories}</div></div>
        <div className="stat-card"><div className="stat-card__label">Media files</div><div className="stat-card__value">{counts.media}</div></div>
        <div className="stat-card">
          <div className="stat-card__label">Unread messages</div>
          <div className={`stat-card__value${counts.unread > 0 ? ' is-warn' : ''}`}>{counts.unread}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 20 }} className="dash-grid">
        <div className="admin-card admin-card__pad">
          <h2 style={{ fontSize: '1rem', marginBottom: 14 }}>Articles per category</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {byCategory.map((c) => (
              <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 130, fontSize: '0.85rem', color: 'var(--ink-soft)', flexShrink: 0 }}>{c.name}</span>
                <div style={{ flex: 1, background: 'var(--paper)', borderRadius: 6, height: 10, overflow: 'hidden' }}>
                  <div style={{ width: `${(c.n / maxCat) * 100}%`, background: 'var(--primary-gradient)', height: '100%' }} />
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, width: 20, textAlign: 'right' }}>{c.n}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="admin-card admin-card__pad">
          <h2 style={{ fontSize: '1rem', marginBottom: 14 }}>Recently updated</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {recentArticles.length === 0 && <p style={{ color: 'var(--ink-soft)', fontSize: '0.88rem' }}>No articles yet.</p>}
            {recentArticles.map((a) => (
              <Link key={a.id} to={`/admin/articles/${a.id}`} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: '0.86rem' }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</span>
                <span className={`badge badge-${a.status}`} style={{ flexShrink: 0 }}>{a.status}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="admin-card admin-card__pad" style={{ marginTop: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h2 style={{ fontSize: '1rem' }}>Recent messages</h2>
          <Link to="/admin/messages" className="abtn abtn-outline abtn-sm">View all</Link>
        </div>
        {recentMessages.length === 0 && <p style={{ color: 'var(--ink-soft)', fontSize: '0.88rem' }}>No messages yet.</p>}
        {recentMessages.map((m) => (
          <div key={m.id} style={{ display: 'flex', gap: 10, padding: '10px 0', borderTop: '1px solid var(--line)', fontSize: '0.87rem' }}>
            {!m.is_read && <span className="badge badge-unread" style={{ flexShrink: 0 }}>New</span>}
            <span style={{ fontWeight: 700, flexShrink: 0 }}>{m.name}</span>
            <span style={{ color: 'var(--ink-soft)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
              {m.subject || m.message}
            </span>
            <span style={{ color: 'var(--ink-muted)', flexShrink: 0 }}>{timeAgo(m.created_at)}</span>
          </div>
        ))}
      </div>
    </>
  );
}
