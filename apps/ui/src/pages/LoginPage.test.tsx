import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RequireAuth } from '../components/RequireAuth.js';
import { AuthProvider } from '../context/AuthContext.js';
import { LoginPage } from './LoginPage.js';

vi.mock('../lib/auth.js', () => ({
  getToken: vi.fn(),
  getMeRequest: vi.fn(),
  loginRequest: vi.fn(),
  logoutRequest: vi.fn(),
  setToken: vi.fn(),
  clearToken: vi.fn(),
  UnauthorizedError: class UnauthorizedError extends Error {},
}));

import { getMeRequest, getToken, loginRequest } from '../lib/auth.js';

const mockUser = {
  id: 'user-1',
  email: 'admin@example.com',
  role: 'admin' as const,
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getToken).mockReturnValue(null);
  });

  it('shows the login form when unauthenticated', async () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { level: 2, name: 'Sign in' })).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  it('logs in and shows protected content', async () => {
    vi.mocked(loginRequest).mockResolvedValue({ token: 'session-token', user: mockUser });

    render(
      <MemoryRouter initialEntries={['/login']}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<RequireAuth />}>
              <Route path="/" element={<h2>Protected Dashboard</h2>} />
            </Route>
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'admin@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secret' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('heading', { level: 2, name: 'Protected Dashboard' })).toBeInTheDocument();
    await waitFor(() => {
      expect(loginRequest).toHaveBeenCalledWith('admin@example.com', 'secret');
    });
  });
});

describe('RequireAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects to login when no session exists', async () => {
    vi.mocked(getToken).mockReturnValue(null);

    render(
      <MemoryRouter initialEntries={['/scans']}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<h2>Sign in</h2>} />
            <Route element={<RequireAuth />}>
              <Route path="/scans" element={<h2>Scans</h2>} />
            </Route>
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { level: 2, name: 'Sign in' })).toBeInTheDocument();
  });

  it('renders protected routes for authenticated users', async () => {
    vi.mocked(getToken).mockReturnValue('session-token');
    vi.mocked(getMeRequest).mockResolvedValue({ user: mockUser });

    render(
      <MemoryRouter initialEntries={['/scans']}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<h2>Sign in</h2>} />
            <Route element={<RequireAuth />}>
              <Route path="/scans" element={<h2>Scans</h2>} />
            </Route>
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { level: 2, name: 'Scans' })).toBeInTheDocument();
  });
});
