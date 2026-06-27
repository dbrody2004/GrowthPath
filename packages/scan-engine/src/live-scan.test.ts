import { describe, expect, it } from 'vitest';
import { loadWorkerEnv, preflightScanCredentials } from '@growthpath/config';
import { deriveScanStatusFromCollection, scanIntakeSchema } from '@growthpath/shared';
import { runScan } from './run-scan.js';

const liveEnabled = process.env.LIVE_SCAN_TEST === '1';

describe.skipIf(!liveEnabled)('live scan validation', () => {
  it('runs a basic-tier scan against stable fixture business with real vendors', async () => {
    const env = loadWorkerEnv();
    const preflight = preflightScanCredentials(env);
    expect(preflight.readyForLive).toBe(true);

    const intake = scanIntakeSchema.parse({
      bizName: 'Kitchen 747',
      bizAddress: '747 Main St, Roseville, CA 95747',
      bizDomain: 'kitchen747.com',
      bizCity: 'Roseville',
      bizVertical: 'Food & Beverage',
      bizType: 'Burger Restaurant',
      verticalKey: 'restaurant',
      bizTier: 'Basic',
      scanTier: 'advanced_premium',
      ownerServices: ['burgers', 'pizza', 'live music'],
    });

    const audit = await runScan(
      intake,
      {
        GOOGLE_API_KEY: env.GOOGLE_API_KEY,
        CENSUS_API_KEY: env.CENSUS_API_KEY,
        DFS_LOGIN: env.DFS_LOGIN,
        DFS_PASSWORD: env.DFS_PASSWORD,
        MOZ_API_KEY: env.MOZ_API_KEY,
      },
      { mock: false },
    );

    expect(audit.collection_status?.length).toBeGreaterThan(0);
    const { status } = deriveScanStatusFromCollection(audit.collection_status ?? []);
    expect(['complete', 'partial']).toContain(status);
  }, 120_000);
});

describe('live scan preflight', () => {
  it('reports mock mode when SCAN_MOCK is enabled', () => {
    const result = preflightScanCredentials({
      GOOGLE_API_KEY: 'key',
      DFS_LOGIN: 'user',
      DFS_PASSWORD: 'pass',
      SCAN_MOCK: true,
    });
    expect(result.mockMode).toBe(true);
    expect(result.readyForLive).toBe(false);
  });
});
