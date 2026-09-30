import { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ToastProvider } from './components/Toast.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';
import AdminLayout from './AdminLayout.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import ArticlesList from './pages/ArticlesList.jsx';
import ArticleEditor from './pages/ArticleEditor.jsx';
import Categories from './pages/Categories.jsx';
import Media from './pages/Media.jsx';
import Messages from './pages/Messages.jsx';
import Settings from './pages/Settings.jsx';
import Account from './pages/Account.jsx';
import { useAdminAuth } from '../context/AdminAuthContext.jsx';
import { api } from '../api.js';

function LayoutWithBadge() {
  const { admin } = useAdminAuth();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!admin) return;
    let cancelled = false;
    const poll = () => api.get('/admin/dashboard').then((d) => !cancelled && setUnread(d.counts.unread)).catch(() => {});
    poll();
    const id = setInterval(poll, 60_000);
    return () => { cancelled = true; clearInterval(id); };
  }, [admin]);

  return <AdminLayout unreadCount={unread} />;
}

export default function AdminApp() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="login" element={<Login />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<LayoutWithBadge />}>
            <Route index element={<Dashboard />} />
            <Route path="articles" element={<ArticlesList />} />
            <Route path="articles/:id" element={<ArticleEditor />} />
            <Route path="categories" element={<Categories />} />
            <Route path="media" element={<Media />} />
            <Route path="messages" element={<Messages />} />
            <Route path="settings" element={<Settings />} />
            <Route path="account" element={<Account />} />
          </Route>
        </Route>
      </Routes>
    </ToastProvider>
  );
}
