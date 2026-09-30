import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '../api.js';

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [checking, setChecking] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { admin } = await api.get('/admin/auth/me');
      setAdmin(admin);
    } catch {
      setAdmin(null);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const login = async (email, password) => {
    const { admin } = await api.post('/admin/auth/login', { email, password });
    setAdmin(admin);
  };
  const logout = async () => {
    await api.post('/admin/auth/logout').catch(() => {});
    setAdmin(null);
  };

  return <AdminAuthContext.Provider value={{ admin, checking, login, logout, setAdmin, refresh }}>{children}</AdminAuthContext.Provider>;
}

export const useAdminAuth = () => useContext(AdminAuthContext);
