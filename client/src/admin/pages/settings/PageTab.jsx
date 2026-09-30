import { useEffect, useState } from 'react';
import { api } from '../../../api.js';
import { useToast } from '../../components/Toast.jsx';
import RichEditor from '../../components/RichEditor.jsx';

export default function PageTab({ slug }) {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    setForm(null);
    api.get(`/admin/site/pages/${slug}`).then((d) => setForm(d.item));
  }, [slug]);
  if (!form) return <div className="spinner" />;

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { item } = await api.put(`/admin/site/pages/${slug}`, form);
      setForm(item);
      toast('Page saved.');
    } catch (err) { toast(err.message, 'error'); }
    finally { setSaving(false); }
  };

  return (
    <form className="admin-card admin-card__pad" onSubmit={save} style={{ maxWidth: 640 }}>
      <div className="afield">
        <label htmlFor="p-eyebrow">Banner eyebrow</label>
        <input id="p-eyebrow" className="ainput" value={form.eyebrow} onChange={(e) => setForm({ ...form, eyebrow: e.target.value })} />
      </div>
      <div className="afield">
        <label htmlFor="p-title">Banner title</label>
        <input id="p-title" className="ainput" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      </div>
      <div className="afield">
        <label htmlFor="p-desc">Banner description</label>
        <textarea id="p-desc" className="atextarea" style={{ minHeight: 70 }} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </div>
      {slug === 'about' && (
        <div className="afield">
          <label>Page body</label>
          <RichEditor value={form.body} onChange={(body) => setForm({ ...form, body })} />
        </div>
      )}
      <h3 style={{ fontSize: '0.9rem', margin: '20px 0 12px' }}>SEO</h3>
      <div className="afield">
        <label htmlFor="p-meta-title">Meta title</label>
        <input id="p-meta-title" className="ainput" value={form.meta_title} onChange={(e) => setForm({ ...form, meta_title: e.target.value })} />
      </div>
      <div className="afield">
        <label htmlFor="p-meta-desc">Meta description</label>
        <textarea id="p-meta-desc" className="atextarea" style={{ minHeight: 60 }} value={form.meta_description} onChange={(e) => setForm({ ...form, meta_description: e.target.value })} />
      </div>
      <button className="abtn abtn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
    </form>
  );
}
