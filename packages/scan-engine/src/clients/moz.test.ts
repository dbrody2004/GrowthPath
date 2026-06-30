import { describe, expect, it } from 'vitest';
import { resolveMozAuthHeaders } from './moz.js';

describe('resolveMozAuthHeaders', () => {
  it('uses x-moz-token for base64-encoded legacy access_id:secret', () => {
    const legacy = Buffer.from('mozscape-unrNEvcOVo:secret-key-here').toString('base64');
    expect(resolveMozAuthHeaders(legacy)).toEqual({
      'x-moz-token': legacy,
    });
  });

  it('uses x-moz-token for raw access_id:secret', () => {
    const raw = 'mozscape-abc123:my-secret';
    expect(resolveMozAuthHeaders(raw)).toEqual({
      'x-moz-token': Buffer.from(raw).toString('base64'),
    });
  });

  it('uses x-moz-token for modern dashboard tokens', () => {
    const token = 'moz-token-abc123def456789012345678901234567890';
    expect(resolveMozAuthHeaders(token)).toEqual({ 'x-moz-token': token });
  });
});
