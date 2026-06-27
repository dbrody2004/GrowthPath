import { clearToken, getToken } from './token.js';

const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? '';

export class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

type ApiOptions = RequestInit & {
  token?: string | null;
  skipAuth?: boolean;
};

let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

export async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { token, skipAuth, headers, ...rest } = options;
  const sessionToken = skipAuth ? null : (token ?? getToken());
  const capturedToken = sessionToken;

  const response = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(sessionToken ? { 'x-session-token': sessionToken } : {}),
      ...headers,
    },
  });

  if (response.status === 401 && !skipAuth) {
    if (getToken() === capturedToken) {
      clearToken();
    }
    onUnauthorized?.();
    throw new UnauthorizedError();
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed (${response.status})`);
  }

  return response.json() as Promise<T>;
}

export async function getHealth(): Promise<{ status: string; service: string }> {
  return apiFetch('/health', { skipAuth: true });
}
