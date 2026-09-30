import { useEffect, useState } from 'react';
import { api } from '../../../api.js';
import { useToast } from '../../components/Toast.jsx';
import { useSite } from '../../../context/SiteContext.jsx';

export default function ContactInfoTab() {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const { reload } = useSite();

  useEffect(() => { api.get('/admin/site/settings').then((s) => setForm(s.contact)); }, []);
  if (!form) return <div className="spinner" />;

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try { await api.put('/admin/site/settings/contact', form); toast('Saved.'); reload(); }
    catch (err) { toast(err.message, 'error'); }
    finally { setSaving(false); }
  };

  const setEmail = (i, key, val) => {
    const emails = [...form.emails];
    emails[i] = { ...emails[i], [key]: val };
    setForm({ ...form, emails });
  };
  const setHour = (i, key, val) => {
    const hours = [...form.hours];
    hours[i] = { ...hours[i], [key]: val };
    setForm({ ...form, hours });
  };

  return (
    <form className="admin-card admin-card__pad" onSubmit={save} style={{ maxWidth: 520 }}>
      <div className="afield">
        <label htmlFor="ci-title">Address title</label>
        <input id="ci-title" className="ainput" value={form.address_title} onChange={(e) => setForm({ ...form, address_title: e.target.value })} />
      </div>
      <div className="afield">
        <label htmlFor="ci-address">Address</label>
        <textarea id="ci-address" className="atextarea" style={{ minHeight: 70 }} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
      </div>

      <div className="afield">
        <label>Email addresses</label>
        {form.emails.map((e, i) => (
          <div className="aform-row" key={i} style={{ marginBottom: 8 }}>
            <input className="ainput" placeholder="Displayed label" value={e.label} onChange={(ev) => setEmail(i, 'label', ev.target.value)} />
            <input className="ainput" placeholder="Actual mailto address" value={e.mailto} onChange={(ev) => setEmail(i, 'mailto', ev.target.value)} />
          </div>
        ))}
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <button type="button" className="abtn abtn-outline abtn-sm" onClick={() => setForm({ ...form, emails: [...form.emails, { label: '', mailto: '' }] })}>Add email</button>
          {form.emails.length > 0 && (
            <button type="button" className="abtn abtn-ghost abtn-sm" onClick={() => setForm({ ...form, emails: form.emails.slice(0, -1) })}>Remove last</button>
          )}
        </div>
      </div>

      <div className="afield">
        <label htmlFor="ci-phone-label">Phone (displayed)</label>
        <input id="ci-phone-label" className="ainput" value={form.phone_label} onChange={(e) => setForm({ ...form, phone_label: e.target.value })} />
      </div>
      <div className="afield">
        <label htmlFor="ci-phone-href">Phone link (tel:… or # to disable)</label>
        <input id="ci-phone-href" className="ainput" value={form.phone_href} onChange={(e) => setForm({ ...form, phone_href: e.target.value })} />
      </div>

      <div className="afield">
        <label>Office hours</label>
        {form.hours.map((h, i) => (
          <div className="aform-row" key={i} style={{ marginBottom: 8 }}>
            <input className="ainput" placeholder="Day(s)" value={h.day} onChange={(ev) => setHour(i, 'day', ev.target.value)} />
            <input className="ainput" placeholder="Time" value={h.time} onChange={(ev) => setHour(i, 'time', ev.target.value)} />
          </div>
        ))}
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <button type="button" className="abtn abtn-outline abtn-sm" onClick={() => setForm({ ...form, hours: [...form.hours, { day: '', time: '' }] })}>Add row</button>
          {form.hours.length > 0 && (
            <button type="button" className="abtn abtn-ghost abtn-sm" onClick={() => setForm({ ...form, hours: form.hours.slice(0, -1) })}>Remove last</button>
          )}
        </div>
      </div>

      <button className="abtn abtn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
    </form>
  );
}
