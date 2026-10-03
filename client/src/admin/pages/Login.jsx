import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext.jsx';
import { useSite } from '../../context/SiteContext.jsx';
import { ApiError } from '../../api.js';

const API_BASE = import.meta.env.VITE_API_URL;

export default function Login() {
  const { admin, checking, login } = useAdminAuth();
  const { site } = useSite();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!checking && admin) {
    const to = location.state?.from || '/admin';
    return <Navigate to={to} replace />;
  }

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      navigate(location.state?.from || '/admin', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Sign in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login">
      <div className="admin-login__card">
        <div className="admin-login__brand">
      <img
         src={`${API_BASE}${site.general.logo_url}`}
        alt={site.general.logo_alt} 
         width="36"
          height="36"
         style={{ borderRadius: 10 }}
/>          <span>{site.general.site_name}</span>
        </div>
        <h1>Admin sign in</h1>
        <p>Sign in to manage articles, categories, media and messages.</p>

        <form onSubmit={submit} noValidate>
          <div className="afield">
            <label htmlFor="email">Email</label>
            <input id="email" className="ainput" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="afield">
            <label htmlFor="password">Password</label>
            <input id="password" className="ainput" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {error && <p className="afield__error" style={{ marginBottom: 14 }}>{error}</p>}
          <button className="abtn abtn-primary" type="submit" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
