import { useEffect, useState } from 'react';
import { api, ApiError } from '../../api.js';
import Modal from '../components/Modal.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import { useConfirm } from '../hooks/useConfirm.js';
import { useToast } from '../components/Toast.jsx';
import { useSite } from '../../context/SiteContext.jsx';

const emptyForm = { name: '', slug: '', color: '', banner_title: '', banner_description: '', meta_description: '', show_in_nav: true };

export default function Categories() {
  const [items, setItems] = useState(null);
  const [editing, setEditing] = useState(null); // null closed, {} for new, item for edit
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const { confirm, dialogProps } = useConfirm();
  const toast = useToast();
  const { reload: reloadSite } = useSite();

  const load = () => api.get('/admin/categories').then((d) => setItems(d.items)).catch(() => toast('Could not load categories.', 'error'));
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openNew = () => { setForm(emptyForm); setFieldErrors({}); setEditing({}); };
  const openEdit = (item) => {
    setForm({ name: item.name, slug: item.slug, color: item.color || '', banner_title: item.banner_title, banner_description: item.banner_description, meta_description: item.meta_description, show_in_nav: item.show_in_nav });
    setFieldErrors({});
    setEditing(item);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFieldErrors({});
    try {
      if (editing.id) await api.put(`/admin/categories/${editing.id}`, form);
      else await api.post('/admin/categories', form);
      toast(editing.id ? 'Category updated.' : 'Category created.');
      setEditing(null);
      await load();
      reloadSite();
    } catch (err) {
      if (err instanceof ApiError && err.fields) setFieldErrors(err.fields);
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item) => {
    const ok = await confirm({ title: 'Delete category', message: `Delete "${item.name}"? This can't be undone.`, confirmLabel: 'Delete', danger: true });
    if (!ok) return;
    try {
      await api.del(`/admin/categories/${item.id}`);
      toast('Category deleted.');
      load();
      reloadSite();
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const move = async (index, dir) => {
    const next = [...items];
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j], next[index]];
    setItems(next);
    try {
      await api.put('/admin/categories/reorder', { ids: next.map((c) => c.id) });
      reloadSite();
    } catch (err) {
      toast(err.message, 'error');
      load();
    }
  };

  if (!items) return <div className="admin-page-loading"><div className="spinner" /></div>;

  return (
    <>
      <div className="admin-header">
        <div>
          <h1>Categories</h1>
          <p>The 8 sections shown across the site's navigation and homepage. Drag order with the arrows below.</p>
        </div>
        <div className="admin-header__actions">
          <button className="abtn abtn-primary" onClick={openNew}>New category</button>
        </div>
      </div>

      <div className="reorder-list">
        {items.map((c, i) => (
          <div className="reorder-row" key={c.id}>
            <div className="reorder-row__handle">
              <button onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">▲</button>
              <button onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label="Move down">▼</button>
            </div>
            <span className="color-dot" style={{ background: c.color || 'var(--leaf)' }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700 }}>{c.name}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--ink-muted)' }}>/{c.slug} &middot; {c.article_count} article{c.article_count === 1 ? '' : 's'}</div>
            </div>
            {!c.show_in_nav && <span className="badge badge-neutral">Hidden from nav</span>}
            <div className="admin-table__actions">
              <button className="abtn abtn-outline abtn-sm" onClick={() => openEdit(c)}>Edit</button>
              <button className="abtn abtn-danger abtn-sm" onClick={() => remove(c)}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <Modal
          title={editing.id ? 'Edit category' : 'New category'}
          onClose={() => setEditing(null)}
          footer={
            <>
              <button className="abtn abtn-outline" onClick={() => setEditing(null)}>Cancel</button>
              <button className="abtn abtn-primary" form="category-form" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
            </>
          }
        >
          <form id="category-form" onSubmit={save} noValidate>
            <div className="afield">
              <label htmlFor="cat-name">Name</label>
              <input id="cat-name" className={`ainput${fieldErrors.name ? ' has-error' : ''}`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              {fieldErrors.name && <p className="afield__error">{fieldErrors.name}</p>}
            </div>
            <div className="afield">
              <label htmlFor="cat-slug">URL slug</label>
              <input id="cat-slug" className={`ainput${fieldErrors.slug ? ' has-error' : ''}`} placeholder="auto-generated from name if left blank" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
              {fieldErrors.slug && <p className="afield__error">{fieldErrors.slug}</p>}
            </div>
            <div className="afield">
              <label htmlFor="cat-color">Accent colour</label>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <input id="cat-color" type="color" value={form.color || '#1B7A6E'} onChange={(e) => setForm({ ...form, color: e.target.value })} style={{ width: 44, height: 38, padding: 2, border: '1px solid var(--line-strong)', borderRadius: 8 }} />
                <input className={`ainput${fieldErrors.color ? ' has-error' : ''}`} placeholder="Leave blank to use the site default" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
              </div>
              {fieldErrors.color && <p className="afield__error">{fieldErrors.color}</p>}
            </div>
            <div className="afield">
              <label htmlFor="cat-banner-title">Banner title</label>
              <input id="cat-banner-title" className="ainput" value={form.banner_title} onChange={(e) => setForm({ ...form, banner_title: e.target.value })} placeholder="Shown as the big heading on the category page" />
            </div>
            <div className="afield">
              <label htmlFor="cat-banner-desc">Banner description</label>
              <textarea id="cat-banner-desc" className="atextarea" value={form.banner_description} onChange={(e) => setForm({ ...form, banner_description: e.target.value })} style={{ minHeight: 70 }} />
            </div>
            <div className="afield">
              <label htmlFor="cat-meta">Meta description (SEO)</label>
              <textarea id="cat-meta" className="atextarea" value={form.meta_description} onChange={(e) => setForm({ ...form, meta_description: e.target.value })} style={{ minHeight: 60 }} />
            </div>
            <label className="acheck">
              <input type="checkbox" checked={form.show_in_nav} onChange={(e) => setForm({ ...form, show_in_nav: e.target.checked })} />
              Show in the navigation menu
            </label>
          </form>
        </Modal>
      )}

      <ConfirmDialog {...dialogProps} />
    </>
  );
}
