import { useState } from 'react';
import { api, ApiError } from '../../api.js';
import { useAdminAuth } from '../../context/AdminAuthContext.jsx';
import { useToast } from '../components/Toast.jsx';

export default function Account() {
  const { admin, setAdmin } = useAdminAuth();
  const toast = useToast();
  const [name, setName] = useState(admin?.name || '');
  const [savingName, setSavingName] = useState(false);

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [savingPw, setSavingPw] = useState(false);
  const [pwError, setPwError] = useState('');

  const saveName = async (e) => {
    e.preventDefault();
    setSavingName(true);
    try {
      const { admin: updated } = await api.patch('/admin/auth/me', { name });
      setAdmin(updated);
      toast('Name updated.');
    } catch (err) { toast(err.message, 'error'); }
    finally { setSavingName(false); }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setSavingPw(true);
    setPwError('');
    try {
      await api.post('/admin/auth/change-password', { current, next });
      toast('Password changed. Other signed-in devices have been signed out.');
      setCurrent(''); setNext('');
    } catch (err) {
      setPwError(err instanceof ApiError ? err.message : 'Could not change password.');
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <>
      <div className="admin-header">
        <div>
          <h1>Account settings</h1>
          <p>Manage your admin profile and password.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 20, maxWidth: 480 }}>
        <form className="admin-card admin-card__pad" onSubmit={saveName}>
          <h2 style={{ fontSize: '1rem', marginBottom: 14 }}>Profile</h2>
          <div className="afield">
            <label htmlFor="acc-email">Email</label>
            <input id="acc-email" className="ainput" value={admin?.email || ''} disabled style={{ opacity: 0.6 }} />
          </div>
          <div className="afield" style={{ marginBottom: 16 }}>
            <label htmlFor="acc-name">Display name</label>
            <input id="acc-name" className="ainput" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <button className="abtn abtn-primary" disabled={savingName}>{savingName ? 'Saving…' : 'Save name'}</button>
        </form>

        <form className="admin-card admin-card__pad" onSubmit={changePassword}>
          <h2 style={{ fontSize: '1rem', marginBottom: 14 }}>Change password</h2>
          <div className="afield">
            <label htmlFor="acc-current">Current password</label>
            <input id="acc-current" type="password" className="ainput" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
          </div>
          <div className="afield" style={{ marginBottom: 16 }}>
            <label htmlFor="acc-next">New password</label>
            <input id="acc-next" type="password" className="ainput" autoComplete="new-password" minLength={10} value={next} onChange={(e) => setNext(e.target.value)} required />
            <p className="afield__hint">At least 10 characters. This will sign you out of any other devices.</p>
          </div>
          {pwError && <p className="afield__error" style={{ marginBottom: 14 }}>{pwError}</p>}
          <button className="abtn abtn-primary" disabled={savingPw}>{savingPw ? 'Changing…' : 'Change password'}</button>
        </form>
      </div>
    </>
  );
}
