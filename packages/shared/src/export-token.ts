import { createHmac, timingSafeEqual } from 'node:crypto';

const DEFAULT_TTL_MS = 15 * 60 * 1000;

export interface ExportTokenPayload {
  scanId: string;
  exp: number;
}

function signPayload(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

export function createExportToken(
  scanId: string,
  secret: string,
  ttlMs = DEFAULT_TTL_MS,
): string {
  const exp = Date.now() + ttlMs;
  const payload = `${scanId}.${exp}`;
  const sig = signPayload(payload, secret);
  return `${payload}.${sig}`;
}

export function verifyExportToken(
  token: string,
  scanId: string,
  secret: string,
): boolean {
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const [tokenScanId, expStr, sig] = parts;
  if (tokenScanId !== scanId) return false;

  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Date.now()) return false;

  const payload = `${tokenScanId}.${expStr}`;
  const expected = signPayload(payload, secret);
  try {
    return timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch {
    return false;
  }
}
