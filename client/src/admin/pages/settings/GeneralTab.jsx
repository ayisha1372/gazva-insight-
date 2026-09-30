import { useEffect, useState } from 'react';
import { api } from '../../../api.js';
import { useToast } from '../../components/Toast.jsx';
import ImageField from '../../components/ImageField.jsx';
import { useSite } from '../../../context/SiteContext.jsx';

export default function GeneralTab() {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const { reload } = useSite();

  useEffect(() => { api.get('/admin/site/settings').then((s) => setForm(s.general)); }, []);
  if (!form) return <div className="spinner" />;

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try { await api.put('/admin/site/settings/general', form); toast('Saved.'); reload(); }
    catch (err) { toast(err.message, 'error'); }
    finally { setSaving(false); }
  };

  return (
    <form className="admin-card admin-card__pad" onSubmit={save} style={{ maxWidth: 480 }}>
      <div className="afield">
        <label htmlFor="site-name">Site name</label>
        <input id="site-name" className="ainput" value={form.site_name} onChange={(e) => setForm({ ...form, site_name: e.target.value })} required />
      </div>
      <ImageField label="Logo" value={form.logo_url} onChange={(url) => setForm({ ...form, logo_url: url })} />
      <div className="afield">
        <label htmlFor="logo-alt">Logo alt text</label>
        <input id="logo-alt" className="ainput" value={form.logo_alt} onChange={(e) => setForm({ ...form, logo_alt: e.target.value })} />
      </div>
      <button className="abtn abtn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
    </form>
  );
}
