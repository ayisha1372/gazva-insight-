import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api.js';
import { useToast } from '../components/Toast.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import { useConfirm } from '../hooks/useConfirm.js';
import { useSite } from '../../context/SiteContext.jsx';

const PAGE_SIZE = 15;

export default function ArticlesList() {
  const { site } = useSite();
  const [state, setState] = useState({ items: [], total: 0, loading: true });
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const toast = useToast();
  const { confirm, dialogProps } = useConfirm();

  const load = () => {
    setState((s) => ({ ...s, loading: true }));
    const params = new URLSearchParams({ page, limit: PAGE_SIZE });
    if (q) params.set('q', q);
    if (status) params.set('status', status);
    if (category) params.set('category', category);
    api.get(`/admin/articles?${params}`)
      .then((d) => setState({ items: d.items, total: d.total, loading: false }))
      .catch(() => { toast('Could not load articles.', 'error'); setState((s) => ({ ...s, loading: false })); });
  };

  useEffect(() => { load(); }, [page, status, category]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { const t = setTimeout(() => { setPage(1); load(); }, 300); return () => clearTimeout(t); }, [q]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleStatus = async (a) => {
    const next = a.status === 'published' ? 'draft' : 'published';
    try {
      await api.patch(`/admin/articles/${a.id}/status`, { status: next });
      toast(next === 'published' ? 'Article published.' : 'Moved back to draft.');
      load();
    } catch (err) { toast(err.message, 'error'); }
  };

  const remove = async (a) => {
    const ok = await confirm({ title: 'Delete article', message: `Delete "${a.title}"? This can't be undone.`, confirmLabel: 'Delete', danger: true });
    if (!ok) return;
    try { await api.del(`/admin/articles/${a.id}`); toast('Article deleted.'); load(); } catch (err) { toast(err.message, 'error'); }
  };

  const totalPages = Math.max(1, Math.ceil(state.total / PAGE_SIZE));

  return (
    <>
      <div className="admin-header">
        <div>
          <h1>Articles</h1>
          <p>{state.total} article{state.total === 1 ? '' : 's'} total.</p>
        </div>
        <div className="admin-header__actions">
          <Link to="/admin/articles/new" className="abtn abtn-primary">New article</Link>
        </div>
      </div>

      <div className="admin-toolbar">
        <input className="ainput" placeholder="Search title or author…" value={q} onChange={(e) => setQ(e.target.value)} style={{ minWidth: 220 }} />
        <select className="aselect" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
        <select className="aselect" value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}>
          <option value="">All categories</option>
          {site.categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
        </select>
      </div>

      <div className="admin-card">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>Article</th><th>Category</th><th>Status</th><th>Date</th><th></th></tr>
            </thead>
            <tbody>
              {state.loading && <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32, color: 'var(--ink-soft)' }}>Loading…</td></tr>}
              {!state.loading && state.items.length === 0 && <tr><td colSpan={5}><div className="admin-empty">No articles match these filters.</div></td></tr>}
              {!state.loading && state.items.map((a) => (
                <tr key={a.id}>
                  <td>
                    <div className="admin-table__row-flex">
                      <img className="admin-table__thumb" src={a.image || ''} alt="" onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} />
                      <div style={{ minWidth: 0 }}>
                        <div className="admin-table__title">{a.title}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--ink-muted)' }}>{a.author_name}</div>
                      </div>
                    </div>
                  </td>
                  <td>{a.category_name}</td>
                  <td>
                    <button className={`badge badge-${a.status}`} style={{ border: 'none', cursor: 'pointer' }} onClick={() => toggleStatus(a)} title="Click to toggle">
                      {a.status}
                    </button>
                  </td>
                  <td style={{ whiteSpace: 'nowrap', color: 'var(--ink-soft)', fontSize: '0.85rem' }}>{a.published_at}</td>
                  <td>
                    <div className="admin-table__actions">
                      <Link to={`/${a.category_slug}/${a.slug}?preview=1`} target="_blank" className="abtn abtn-ghost abtn-sm">Preview</Link>
                      <Link to={`/admin/articles/${a.id}`} className="abtn abtn-outline abtn-sm">Edit</Link>
                      <button className="abtn abtn-danger abtn-sm" onClick={() => remove(a)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
