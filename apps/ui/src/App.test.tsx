import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { AuthProvider } from './context/AuthContext';

vi.mock('./lib/auth.js', () => ({
  getToken: vi.fn(),
  getMeRequest: vi.fn(),
  loginRequest: vi.fn(),
  logoutRequest: vi.fn(),
  setToken: vi.fn(),
  clearToken: vi.fn(),
  UnauthorizedError: class UnauthorizedError extends Error {},
}));

vi.mock('./lib/scans.js', () => ({
  getSampleScan: vi.fn(),
}));

import { getMeRequest, getToken } from './lib/auth.js';
import { getSampleScan } from './lib/scans.js';

const mockUser = {
  id: 'user-1',
  email: 'admin@example.com',
  role: 'admin' as const,
  createdAt: '2026-01-01T00:00:00.000Z',
};

function renderApp(initialEntry = '/') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('App auth gating', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects unauthenticated users to login', async () => {
    vi.mocked(getToken).mockReturnValue(null);

    renderApp('/scans');

    expect(await screen.findByRole('heading', { level: 2, name: 'Sign in' })).toBeInTheDocument();
  });

  it('renders portal navigation when authenticated', async () => {
    vi.mocked(getToken).mockReturnValue('session-token');
    vi.mocked(getMeRequest).mockResolvedValue({ user: mockUser });
    vi.mocked(getSampleScan).mockResolvedValue(null);

    renderApp('/');

    expect(await screen.findByText('GrowthPath')).toBeInTheDocument();
    expect(screen.getByText('Scans')).toBeInTheDocument();
    expect(screen.getByText('Jobs')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.getByText('admin@example.com')).toBeInTheDocument();
  });
});
