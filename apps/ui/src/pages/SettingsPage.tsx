import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { changePasswordRequest } from '../lib/auth.js';

export function SettingsPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await changePasswordRequest(currentPassword, newPassword);
      await logout();
      navigate('/login', { replace: true });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to change password');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="card form-card settings-card">
      <h2>Settings</h2>

      <h3 className="settings-section-title">Change password</h3>
      <p className="muted">Enter your current password and choose a new one. You will be signed out after saving.</p>

      <form className="settings-form" onSubmit={handleSubmit}>
        <label>
          Current password
          <input
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
        <label>
          New password
          <input
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />
        </label>

        {error && <p className="form-error">{error}</p>}

        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? 'Saving…' : 'Change password'}
        </button>
      </form>
    </section>
  );
}
