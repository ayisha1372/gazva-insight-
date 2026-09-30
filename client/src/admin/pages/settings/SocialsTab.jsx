import { useEffect, useState } from 'react';
import { api, ApiError } from '../../../api.js';
import { useToast } from '../../components/Toast.jsx';
import { useSite } from '../../../context/SiteContext.jsx';

export default function SocialsTab() {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const toast = useToast();
  const { reload } = useSite();

  useEffect(() => { api.get('/admin/site/settings').then((s) => setForm(s.socials)); }, []);
  if (!form) return <div className="spinner" />;

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try { await api.put('/admin/site/settings/socials', form); toast('Saved.'); reload(); }
    catch (err) {
      if (err instanceof ApiError && err.fields) setErrors(err.fields);
      toast(err.message, 'error');
    } finally { setSaving(false); }
  };

  const field = (key, label, placeholder) => (
    <div className="afield">
      <label htmlFor={`s-${key}`}>{label}</label>
      <input id={`s-${key}`} className={`ainput${errors[key] ? ' has-error' : ''}`} placeholder={placeholder} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
      {errors[key] && <p className="afield__error">{errors[key]}</p>}
    </div>
  );

  return (
    <form className="admin-card admin-card__pad" onSubmit={save} style={{ maxWidth: 480 }}>
      {field('instagram', 'Instagram URL', 'https://www.instagram.com/…')}
      {field('facebook', 'Facebook URL', 'https://www.facebook.com/…')}
      {field('whatsapp', 'WhatsApp link', 'https://wa.me/91…')}
      <p className="afield__hint" style={{ marginBottom: 16 }}>Leave a field blank to hide that icon.</p>
      <button className="abtn abtn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
    </form>
  );
}
