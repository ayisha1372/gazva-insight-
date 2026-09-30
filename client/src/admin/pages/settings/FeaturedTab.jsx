import { useEffect, useState } from 'react';
import { api } from '../../../api.js';
import { useToast } from '../../components/Toast.jsx';
import Modal from '../../components/Modal.jsx';

const SIZES = [
  { value: 'lead', label: 'Lead (large)' },
  { value: 'wide', label: 'Wide' },
  { value: 'normal', label: 'Normal' },
];

export default function FeaturedTab() {
  const [items, setItems] = useState(null);
  const [saving, setSaving] = useState(false);
  const [picking, setPicking] = useState(false);
  const [published, setPublished] = useState([]);
  const toast = useToast();

  const load = () => api.get('/admin/site/home-featured').then((d) => setItems(d.items)).catch(() => toast('Could not load.', 'error'));
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openPicker = () => {
    api.get('/admin/articles?status=published&limit=100').then((d) => setPublished(d.items));
    setPicking(true);
  };

  const add = (a) => {
    if (items.some((i) => i.article_id === a.id)) return;
    setItems([...items, { article_id: a.id, title: a.title, image: a.image, category_name: a.category_name, size: 'normal' }]);
    setPicking(false);
  };
  const remove = (id) => setItems(items.filter((i) => i.article_id !== id));
  const setSize = (id, size) => setItems(items.map((i) => (i.article_id === id ? { ...i, size } : i)));
  const move = (index, dir) => {
    const next = [...items];
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j], next[index]];
    setItems(next);
  };

  const save = async () => {
    setSaving(true);
    try {
      await api.put('/admin/site/home-featured', { items: items.map((i) => ({ article_id: i.article_id, size: i.size })) });
      toast('Homepage layout saved.');
    } catch (err) { toast(err.message, 'error'); }
    finally { setSaving(false); }
  };

  if (!items) return <div className="spinner" />;

  return (
    <div className="admin-card admin-card__pad" style={{ maxWidth: 640 }}>
      <p className="afield__hint" style={{ marginBottom: 16 }}>
        These articles appear in the "Explore Every Category" mosaic on the homepage, in this order. "Lead" is the large first card.
      </p>

      {items.length === 0 && <p style={{ color: 'var(--ink-soft)', marginBottom: 16 }}>No featured articles yet.</p>}

      <div className="reorder-list" style={{ marginBottom: 16 }}>
        {items.map((i, idx) => (
          <div className="reorder-row" key={i.article_id}>
            <div className="reorder-row__handle">
              <button onClick={() => move(idx, -1)} disabled={idx === 0}>▲</button>
              <button onClick={() => move(idx, 1)} disabled={idx === items.length - 1}>▼</button>
            </div>
            <img src={i.image || ''} alt="" className="admin-table__thumb" onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{i.title}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--ink-muted)' }}>{i.category_name}</div>
            </div>
            <select className="aselect" style={{ width: 140 }} value={i.size} onChange={(e) => setSize(i.article_id, e.target.value)}>
              {SIZES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <button className="abtn abtn-ghost abtn-icon" onClick={() => remove(i.article_id)} aria-label="Remove">✕</button>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button type="button" className="abtn abtn-outline" onClick={openPicker} disabled={items.length >= 12}>Add article</button>
        <button type="button" className="abtn abtn-primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save layout'}</button>
      </div>

      {picking && (
        <Modal title="Choose a published article" wide onClose={() => setPicking(false)}>
          {published.length === 0 && <p style={{ color: 'var(--ink-soft)' }}>No published articles yet.</p>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {published.filter((a) => !items.some((i) => i.article_id === a.id)).map((a) => (
              <button key={a.id} className="admin-link-btn" style={{ padding: '10px 8px' }} onClick={() => add(a)}>
                <img src={a.image || ''} alt="" className="admin-table__thumb" style={{ width: 34, height: 34 }} onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} />
                {a.title} <span style={{ color: 'var(--ink-muted)', marginLeft: 'auto' }}>{a.category_name}</span>
              </button>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}
