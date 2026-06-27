import { describe, expect, it } from 'vitest';
import { runScan } from './run-scan.js';

const mockCreds = {
  GOOGLE_API_KEY: 'test-google',
  CENSUS_API_KEY: 'test-census',
  DFS_LOGIN: 'test-login',
  DFS_PASSWORD: 'test-pass',
  MOZ_API_KEY: 'test-moz',
};

const mockIntake = {
  bizName: 'Kitchen 747',
  bizAddress: 'Roseville, CA',
  bizDomain: 'kitchen747.com',
  bizCity: 'Roseville CA 95747',
  bizVertical: 'Food & Beverage',
  bizType: 'Restaurant',
  verticalKey: 'restaurant',
  bizTier: 'Advanced' as const,
  scanTier: 'advanced_premium' as const,
  ownerServices: ['burgers', 'pizza', 'live music'],
};

describe('runScan MOCK mode', () => {
  it('returns kitchen747-like audit data without API calls', async () => {
    const audit = await runScan(mockIntake, mockCreds, { mock: true });

    expect(audit.business).toBe('Kitchen 747');
    expect(audit.url).toBe('https://www.kitchen747.com');
    expect(audit.keywords.length).toBeGreaterThan(0);
    expect(audit.serp['burgers near me']).toBeDefined();
    expect(audit.gbp.rating).toBe(4.4);
    expect(audit.total_cost).toBe(0);
    expect(audit.moz.client.da).toBe(15);
  });
});
