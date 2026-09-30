import { useEffect, useRef, useState } from 'react';
import { api } from '../../api.js';
import Modal from './Modal.jsx';
import { useToast } from './Toast.jsx';

/** Modal for choosing (or uploading) an image; onSelect receives { url, alt }. */
export default function MediaPicker({ onSelect, onClose }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const toast = useToast();
  const fileInput = useRef(null);

  const load = (query = '') => {
    setLoading(true);
    api.get(`/admin/media?limit=60${query ? `&q=${encodeURIComponent(query)}` : ''}`)
      .then((d) => setItems(d.items))
      .catch(() => toast('Could not load the media library.', 'error'))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const upload = async (files) => {
    if (!files?.length) return;
    setUploading(true);
    const fd = new FormData();
    for (const f of files) fd.append('files', f);
    try {
      const d = await api.upload('/admin/media', fd);
      setItems((prev) => [...d.items, ...prev]);
      if (d.rejected?.length) toast(`${d.rejected.length} file(s) weren't valid images and were skipped.`, 'error');
      if (d.items[0]) onSelect({ url: d.items[0].url, alt: d.items[0].alt });
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal title="Choose an image" wide onClose={onClose}>
      <div
        className={`media-dropzone${dragging ? ' is-active' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); upload(e.dataTransfer.files); }}
      >
        {uploading ? 'Uploading…' : (
          <>
            Drag an image here, or{' '}
            <button className="abtn abtn-outline abtn-sm" onClick={() => fileInput.current.click()} type="button">browse files</button>
            <div className="afield__hint">PNG, JPG, GIF or WebP</div>
          </>
        )}
        <input ref={fileInput} type="file" accept="image/png,image/jpeg,image/gif,image/webp" multiple hidden onChange={(e) => upload(e.target.files)} />
      </div>

      <input
        className="ainput" placeholder="Search images…" value={q}
        onChange={(e) => { setQ(e.target.value); load(e.target.value); }}
        style={{ marginBottom: 16 }}
      />

      {loading ? (
        <p style={{ color: 'var(--ink-soft)' }}>Loading…</p>
      ) : items.length === 0 ? (
        <p style={{ color: 'var(--ink-soft)' }}>No images yet — upload one above.</p>
      ) : (
        <div className="media-grid">
          {items.map((m) => (
            <button key={m.id} type="button" className="media-tile" onClick={() => onSelect({ url: m.url, alt: m.alt })}>
              <img src={m.url} alt={m.alt || m.original_name} loading="lazy" />
              <div className="media-tile__name">{m.original_name}</div>
            </button>
          ))}
        </div>
      )}
    </Modal>
  );
}
