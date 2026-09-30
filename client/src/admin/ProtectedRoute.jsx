import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext.jsx';

export default function ProtectedRoute() {
  const { admin, checking } = useAdminAuth();
  const location = useLocation();

  if (checking) return <div className="admin-page-loading"><div className="spinner" /></div>;
  if (!admin) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}
