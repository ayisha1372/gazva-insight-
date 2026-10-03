import { useEffect, useRef, useState } from 'react';
import { api } from '../../api.js';
import { useToast } from '../components/Toast.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import { useConfirm } from '../hooks/useConfirm.js';
import Modal from '../components/Modal.jsx';

const API_BASE = import.meta.env.VITE_API_URL;

const PAGE_SIZE = 24;

export default function Media() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [selected, setSelected] = useState(null);
  const [altDraft, setAltDraft] = useState('');
  const toast = useToast();
  const { confirm, dialogProps } = useConfirm();
  const fileInput = useRef(null);

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: PAGE_SIZE });
    if (q) params.set('q', q);
    api.get(`/admin/media?${params}`)
      .then((d) => { setItems(d.items); setTotal(d.total); })
      .catch(() => toast('Could not load media.', 'error'))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [page]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { const t = setTimeout(() => { setPage(1); load(); }, 300); return () => clearTimeout(t); }, [q]); // eslint-disable-line react-hooks/exhaustive-deps

  const upload = async (files) => {
    if (!files?.length) return;
    setUploading(true);
    const fd = new FormData();
    for (const f of files) fd.append('files', f);
    try {
      const d = await api.upload('/admin/media', fd);
      toast(`Uploaded ${d.items.length} image${d.items.length === 1 ? '' : 's'}.`);
      if (d.rejected?.length) toast(`${d.rejected.length} file(s) weren't valid images and were skipped.`, 'error');
      setPage(1); load();
    } catch (err) { toast(err.message, 'error'); }
    finally { setUploading(false); }
  };

  const saveAlt = async () => {
    try {
      await api.patch(`/admin/media/${selected.id}`, { alt: altDraft });
      toast('Alt text updated.');
      setSelected(null); load();
    } catch (err) { toast(err.message, 'error'); }
  };

  const remove = async (item, force = false) => {
    if (!force) {
      const ok = await confirm({ title: 'Delete image', message: `Delete "${item.original_name}"?`, confirmLabel: 'Delete', danger: true });
      if (!ok) return;
    }
    try {
      await api.del(`/admin/media/${item.id}${force ? '?force=true' : ''}`);
      toast('Image deleted.');
      setSelected(null); load();
    } catch (err) {
      if (err.status === 409) {
        const ok = await confirm({ title: 'Image is in use', message: `${err.message} Delete it anyway?`, confirmLabel: 'Delete anyway', danger: true });
        if (ok) return remove(item, true);
      } else {
        toast(err.message, 'error');
      }
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <div className="admin-header">
        <div>
          <h1>Media library</h1>
          <p>{total} image{total === 1 ? '' : 's'}. Used by articles, pages and site settings.</p>
        </div>
        <div className="admin-header__actions">
          <button className="abtn abtn-primary" onClick={() => fileInput.current.click()} disabled={uploading}>
            {uploading ? 'Uploading…' : 'Upload images'}
          </button>
          <input ref={fileInput} type="file" accept="image/png,image/jpeg,image/gif,image/webp" multiple hidden onChange={(e) => upload(e.target.files)} />
        </div>
      </div>

      <div
        className={`media-dropzone${dragging ? ' is-active' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); upload(e.dataTransfer.files); }}
      >
        Drag and drop images here to upload
      </div>

      <div className="admin-toolbar">
        <input className="ainput" placeholder="Search by filename…" value={q} onChange={(e) => setQ(e.target.value)} style={{ minWidth: 240 }} />
      </div>

      {loading ? (
        <div className="admin-page-loading"><div className="spinner" /></div>
      ) : items.length === 0 ? (
        <div className="admin-empty">No images yet — upload one above.</div>
      ) : (
        <div className="media-grid">
          {items.map((m) => (
            <button key={m.id} className="media-tile" onClick={() => { setSelected(m); setAltDraft(m.alt); }}>
              <img
  src={`${API_BASE}${m.url}`}
  alt={m.alt || m.original_name}
  loading="lazy"
/>
              <div className="media-tile__name">{m.original_name}</div>
            </button>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="admin-pagination">
          <button className="abtn abtn-outline abtn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
          <span>Page {page} of {totalPages}</span>
          <button className="abtn abtn-outline abtn-sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      )}

      {selected && (
        <Modal
          title={selected.original_name}
          onClose={() => setSelected(null)}
          footer={
            <>
              <button className="abtn abtn-danger" onClick={() => remove(selected)}>Delete</button>
              <button className="abtn abtn-primary" onClick={saveAlt}>Save alt text</button>
            </>
          }
        >
         <img
  src={`${API_BASE}${selected.url}`}
  alt={selected.alt}
  style={{ width: '100%', borderRadius: 8, marginBottom: 16, background: 'var(--paper)' }}
/>
          <div className="afield">
            <label htmlFor="alt-text">Alt text</label>
            <input id="alt-text" className="ainput" value={altDraft} onChange={(e) => setAltDraft(e.target.value)} placeholder="Describe this image for accessibility" />
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--ink-muted)' }}>
            {selected.size ? `${Math.round(selected.size / 1024)} KB` : ''} &middot; {selected.mime} &middot; used in {selected.used_in} place{selected.used_in === 1 ? '' : 's'}
          </div>
        </Modal>
      )}

      <ConfirmDialog {...dialogProps} />
    </>
  );
}
