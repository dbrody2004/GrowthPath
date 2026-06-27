import type { UserDto } from '@growthpath/shared';
import { apiFetch } from './api.js';
import { getToken } from './token.js';

export class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export { clearToken, getToken, setToken } from './token.js';

export interface LoginResponse {
  token: string;
  user: UserDto;
}

export interface MeResponse {
  user: UserDto;
}

export async function loginRequest(email: string, password: string): Promise<LoginResponse> {
  return apiFetch<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
    skipAuth: true,
  });
}

export async function logoutRequest(): Promise<void> {
  await apiFetch<{ ok: boolean }>('/api/auth/logout', { method: 'POST' });
}

export async function changePasswordRequest(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  await apiFetch<{ ok: boolean }>('/api/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

export async function getMeRequest(): Promise<MeResponse> {
  return apiFetch<MeResponse>('/api/auth/me');
}

export function hasStoredToken(): boolean {
  return getToken() != null;
}
