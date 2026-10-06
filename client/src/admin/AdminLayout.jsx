import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext.jsx';
import { useSite } from '../context/SiteContext.jsx';
import {
  DashboardIcon, ArticleIcon, CategoryIcon, MediaIcon, MessageIcon, SettingsIcon, HomeIcon, LogoutIcon, MenuIcon, ExternalIcon,
} from './components/icons.jsx';
const API_BASE = import.meta.env.VITE_API_URL;
const NAV = [
  { to: '/admin', label: 'Dashboard', icon: DashboardIcon, end: true },
  { to: '/admin/articles', label: 'Articles', icon: ArticleIcon },
  { to: '/admin/categories', label: 'Categories', icon: CategoryIcon },
  { to: '/admin/media', label: 'Media', icon: MediaIcon },
  { to: '/admin/messages', label: 'Messages', icon: MessageIcon },
  { to: '/admin/settings', label: 'Settings', icon: SettingsIcon },
];

export default function AdminLayout({ unreadCount = 0 }) {
  const { admin, logout } = useAdminAuth();
  const { site } = useSite();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const doLogout = async () => {
    await logout();
    navigate('/admin/login', { replace: true });
  };

  const initials = (admin?.name || 'A').split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="admin">
      <div className="admin-topbar">
        <button className="admin-topbar__menu" onClick={() => setSidebarOpen(true)} aria-label="Open menu"><MenuIcon /></button>
        <span style={{ fontWeight: 800 }}>{site.general.site_name} Admin</span>
        <span />
      </div>

      <div className="admin-shell">
        <aside className={`admin-sidebar${sidebarOpen ? ' is-open' : ''}`}>
          <div className="admin-sidebar__brand">
            <img
  src={
    site.general.logo_url?.startsWith('http')
      ? site.general.logo_url
      : `${API_BASE}${site.general.logo_url}`
  }
  alt=""
  width="34"
  height="34"
/>
            <span>
              GAZVA Insight
              <small>Admin panel</small>
            </span>
          </div>

          <nav className="admin-nav">
            {NAV.map(({ to, label, icon: Icon, end }) => (
              <NavLink key={to} to={to} end={end} className={({ isActive }) => (isActive ? 'is-active' : '')} onClick={() => setSidebarOpen(false)}>
                <Icon />
                {label}
                {label === 'Messages' && unreadCount > 0 && <span className="admin-nav__badge">{unreadCount}</span>}
              </NavLink>
            ))}
            <a href="/" target="_blank" rel="noreferrer">
              <HomeIcon />
              View site
              <ExternalIcon />
            </a>
          </nav>

          <div className="admin-sidebar__footer">
            <div className="admin-sidebar__user">
              <div className="admin-sidebar__user-avatar">{initials}</div>
              <div style={{ minWidth: 0 }}>
                <div className="admin-sidebar__user-name">{admin?.name}</div>
                <div className="admin-sidebar__user-email">{admin?.email}</div>
              </div>
            </div>
            <NavLink to="/admin/account" className="admin-link-btn" onClick={() => setSidebarOpen(false)}>
              <SettingsIcon /> Account settings
            </NavLink>
            <button className="admin-link-btn" onClick={doLogout}>
              <LogoutIcon /> Sign out
            </button>
          </div>
        </aside>
        <div className="admin-sidebar__overlay" onClick={() => setSidebarOpen(false)} />

        <div className="admin-main">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
