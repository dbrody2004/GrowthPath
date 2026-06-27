import { describe, expect, it } from 'vitest';
import { preflightScanCredentials } from './preflight-scan.js';

describe('preflightScanCredentials', () => {
  it('reports ready for live when required credentials exist and mock is off', () => {
    const result = preflightScanCredentials({
      GOOGLE_API_KEY: 'key',
      DFS_LOGIN: 'user',
      DFS_PASSWORD: 'pass',
      SCAN_MOCK: false,
    });

    expect(result.mockMode).toBe(false);
    expect(result.readyForLive).toBe(true);
    expect(result.sources.find((s) => s.sourceId === 'gbp')?.liveCapable).toBe(true);
  });

  it('marks optional Moz source unavailable without MOZ_API_KEY', () => {
    const result = preflightScanCredentials({
      GOOGLE_API_KEY: 'key',
      DFS_LOGIN: 'user',
      DFS_PASSWORD: 'pass',
      SCAN_MOCK: false,
    });

    expect(result.sources.find((s) => s.sourceId === 'moz')?.liveCapable).toBe(false);
  });
});
