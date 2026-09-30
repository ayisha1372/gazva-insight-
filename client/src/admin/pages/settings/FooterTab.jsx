import { useEffect, useState } from 'react';
import { api } from '../../../api.js';
import { useToast } from '../../components/Toast.jsx';
import { useSite } from '../../../context/SiteContext.jsx';

export default function FooterTab() {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const { reload } = useSite();

  useEffect(() => { api.get('/admin/site/settings').then((s) => setForm(s.footer)); }, []);
  if (!form) return <div className="spinner" />;

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try { await api.put('/admin/site/settings/footer', form); toast('Saved.'); reload(); }
    catch (err) { toast(err.message, 'error'); }
    finally { setSaving(false); }
  };

  const field = (key, label, isTextarea) => (
    <div className="afield">
      <label htmlFor={`f-${key}`}>{label}</label>
      {isTextarea
        ? <textarea id={`f-${key}`} className="atextarea" style={{ minHeight: 70 }} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
        : <input id={`f-${key}`} className="ainput" value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />}
    </div>
  );

  return (
    <form className="admin-card admin-card__pad" onSubmit={save} style={{ maxWidth: 480 }}>
      {field('subline', 'Subline (under the site name)')}
      {field('tagline', 'Tagline', true)}
      {field('copyright', 'Copyright line')}
      {field('powered_by', '"Powered by" credit')}
      <button className="abtn abtn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
    </form>
  );
}
