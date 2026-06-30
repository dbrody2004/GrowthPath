import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';

export function RequireAdmin() {
  const { user, status } = useAuth();

  if (status === 'loading') {
    return (
      <section className="card auth-loading">
        <p className="muted">Checking session…</p>
      </section>
    );
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
