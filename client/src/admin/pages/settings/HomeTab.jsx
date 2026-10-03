import { useEffect, useState } from 'react';
import { api } from '../../../api.js';
import { useToast } from '../../components/Toast.jsx';
import { useSite } from '../../../context/SiteContext.jsx';

export default function HomeTab() {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const { reload } = useSite();

  useEffect(() => { api.get('/admin/site/settings').then((s) => setForm(s.home)); }, []);
  if (!form) return <div className="spinner" />;

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try { await api.put('/admin/site/settings/home', form); toast('Saved.'); reload(); }
    catch (err) { toast(err.message, 'error'); }
    finally { setSaving(false); }
  };

  const btn = (key, label) => (
    <div className="aform-row" style={{ marginBottom: 8 }}>
      <input className="ainput" placeholder={`${label} text`} value={form[key].label} onChange={(e) => setForm({ ...form, [key]: { ...form[key], label: e.target.value } })} />
      <input className="ainput" placeholder="Link (e.g. /al-ayn or /contact)" value={form[key].href} onChange={(e) => setForm({ ...form, [key]: { ...form[key], href: e.target.value } })} />
    </div>
  );

  return (
    <form className="admin-card admin-card__pad" onSubmit={save} style={{ maxWidth: 520 }}>
      <h3 style={{ fontSize: '0.9rem', marginBottom: 12 }}>Hero section</h3>
      <div className="aform-row">
        <div className="afield">
          <label htmlFor="h-title">Title</label>
          <input id="h-title" className="ainput" value={form.hero_title} onChange={(e) => setForm({ ...form, hero_title: e.target.value })} />
        </div>
        <div className="afield">
          <label htmlFor="h-accent">Accent word</label>
          <input id="h-accent" className="ainput" value={form.hero_title_accent} onChange={(e) => setForm({ ...form, hero_title_accent: e.target.value })} />
        </div>
      </div>
      <div className="afield">
        <label htmlFor="h-text">Hero text</label>
        <textarea id="h-text" className="atextarea" style={{ minHeight: 70 }} value={form.hero_text} onChange={(e) => setForm({ ...form, hero_text: e.target.value })} />
      </div>
      <div className="afield">
        <label>Primary button</label>
        {btn('primary_button', 'Primary button')}
      </div>
      <div className="afield">
        <label>Secondary button</label>
        {btn('secondary_button', 'Secondary button')}
      </div>

      <h3 style={{ fontSize: '0.9rem', margin: '20px 0 12px' }}>"Explore Every Category" section</h3>
      <div className="afield">
        <label htmlFor="h-sec-title">Section title</label>
        <input id="h-sec-title" className="ainput" value={form.section_title} onChange={(e) => setForm({ ...form, section_title: e.target.value })} />
      </div>
      <div className="afield">
        <label htmlFor="h-sec-desc">Section description</label>
        <textarea id="h-sec-desc" className="atextarea" style={{ minHeight: 60 }} value={form.section_description} onChange={(e) => setForm({ ...form, section_description: e.target.value })} />
      </div>
      <div className="afield">
        <label htmlFor="h-latest-count">Number of "latest" posts shown below the mosaic</label>
        <input id="h-latest-count" type="number" min={0} max={12} className="ainput" style={{ maxWidth: 100 }} value={form.latest_count} onChange={(e) => setForm({ ...form, latest_count: e.target.value })} />
        <p className="afield__hint">These are chosen automatically (most recent published articles not already featured below).</p>
      </div>

      <h3 style={{ fontSize: '0.9rem', margin: '20px 0 12px' }}>SEO</h3>
      <div className="afield">
        <label htmlFor="h-meta-title">Meta title</label>
        <input id="h-meta-title" className="ainput" value={form.meta_title} onChange={(e) => setForm({ ...form, meta_title: e.target.value })} />
      </div>
      <div className="afield">
        <label htmlFor="h-meta-desc">Meta description</label>
        <textarea id="h-meta-desc" className="atextarea" style={{ minHeight: 60 }} value={form.meta_description} onChange={(e) => setForm({ ...form, meta_description: e.target.value })} />
      </div>

      <button className="abtn abtn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
    </form>
  );
}
