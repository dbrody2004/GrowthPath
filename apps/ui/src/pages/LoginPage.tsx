import { FormEvent, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';

function isSafeRedirectPath(path: unknown): path is string {
  if (typeof path !== 'string') return false;
  if (!path.startsWith('/') || path.startsWith('//')) return false;
  let decoded: string;
  try {
    decoded = decodeURIComponent(path);
  } catch {
    return false;
  }
  if (decoded.startsWith('//')) return false;
  if (/[\\:]/.test(decoded.slice(1))) return false;
  return true;
}

export function LoginPage() {
  const { login, status } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const from = (location.state as { from?: string } | null)?.from;
  const redirectTo = isSafeRedirectPath(from) && from !== '/login' ? from : '/';

  if (status === 'authenticated') {
    return <Navigate to={redirectTo} replace />;
  }

  if (status === 'loading') {
    return (
      <div className="login-page">
        <section className="card auth-loading">
          <p className="muted">Checking session…</p>
        </section>
      </div>
    );
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await login(email, password);
      navigate(redirectTo, { replace: true });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Login failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <section className="card login-card">
        <h2>Sign in</h2>
        <p className="muted">Use your GrowthPath operator account to access scans and reports.</p>

        <form className="login-form" onSubmit={handleSubmit}>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
        </label>

        {error && <p className="form-error">{error}</p>}

        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
        </form>
      </section>
    </div>
  );
}
