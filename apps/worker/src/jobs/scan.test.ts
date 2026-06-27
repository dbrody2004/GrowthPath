import { describe, expect, it, vi } from 'vitest';
import { deriveScanStatusFromCollection } from '@growthpath/shared';
import { handleScanJob } from './scan.js';

const mockUpdateScanStatus = vi.fn();
const mockSaveScanResult = vi.fn();
const mockGetScanById = vi.fn();
const mockGetBusinessById = vi.fn();
const mockGetScanResult = vi.fn();
const mockClaimScan = vi.fn().mockResolvedValue({ _id: 'scan-1' });
const mockRunScan = vi.fn();
const mockCalculateScores = vi.fn();

vi.mock('@growthpath/data', () => ({
  getScanById: (...args: unknown[]) => mockGetScanById(...args),
  getBusinessById: (...args: unknown[]) => mockGetBusinessById(...args),
  getScanResult: (...args: unknown[]) => mockGetScanResult(...args),
  updateScanStatus: (...args: unknown[]) => mockUpdateScanStatus(...args),
  saveScanResult: (...args: unknown[]) => mockSaveScanResult(...args),
  claimScan: (...args: unknown[]) => mockClaimScan(...args),
}));

vi.mock('@growthpath/scan-engine', () => ({
  runScan: (...args: unknown[]) => mockRunScan(...args),
}));

vi.mock('@growthpath/scoring-engine', () => ({
  calculateScores: (...args: unknown[]) => mockCalculateScores(...args),
}));

describe('handleScanJob', () => {
  it('marks scan partial from collection status not only PageSpeed heuristic', async () => {
    mockGetScanById.mockResolvedValue({
      _id: 'scan-1',
      businessId: 'biz-1',
    });
    mockGetBusinessById.mockResolvedValue({
      bizName: 'Test',
      bizAddress: '1 Main',
      bizDomain: 'example.com',
      bizCity: 'City',
      bizVertical: 'Service',
      bizType: 'Plumber',
      verticalKey: 'home_trade',
      bizTier: 'Basic',
      scanTier: 'basic',
      ownerServices: ['plumbing'],
    });
    mockRunScan.mockResolvedValue({
      total_cost: 1,
      collection_status: [
        {
          sourceId: 'gbp',
          label: 'Google Business Profile',
          status: 'ok',
          detail: 'loaded',
        },
        {
          sourceId: 'pagespeed',
          label: 'PageSpeed Insights',
          status: 'missing',
          detail: 'PageSpeed data unavailable',
          affectsScore: true,
        },
      ],
    });
    mockCalculateScores.mockReturnValue({ p1: 40, p2: 30, profile: 'Test', categories: {} });

    await handleScanJob(
      { type: 'scan', scanId: 'scan-1' },
      { NODE_ENV: 'test' } as never,
      { info: vi.fn(), error: vi.fn() } as never,
    );

    expect(mockUpdateScanStatus).toHaveBeenCalledWith(
      'scan-1',
      expect.objectContaining({
        status: 'partial',
        partialReasons: expect.arrayContaining([
          expect.stringContaining('PageSpeed'),
        ]),
      }),
    );
  });

  it('marks scan failed on job error', async () => {
    mockGetScanById.mockResolvedValue({
      _id: 'scan-2',
      businessId: 'biz-1',
    });
    mockGetBusinessById.mockResolvedValue({
      bizName: 'Test',
      bizAddress: '1 Main',
      bizDomain: 'example.com',
      bizCity: 'City',
      bizVertical: 'Service',
      bizType: 'Plumber',
      verticalKey: 'home_trade',
      bizTier: 'Basic',
      scanTier: 'basic',
      ownerServices: ['plumbing'],
    });
    mockRunScan.mockRejectedValue(new Error('boom'));

    await handleScanJob(
      { type: 'scan', scanId: 'scan-2' },
      { NODE_ENV: 'test' } as never,
      { info: vi.fn(), error: vi.fn() } as never,
    );

    expect(mockUpdateScanStatus).toHaveBeenCalledWith(
      'scan-2',
      expect.objectContaining({ status: 'failed', error: 'boom' }),
    );
  });
});

describe('deriveScanStatusFromCollection integration', () => {
  it('fails when trade area missing', () => {
    const { status } = deriveScanStatusFromCollection([
      {
        sourceId: 'trade_area',
        label: 'Trade area / origins',
        status: 'missing',
        detail: 'Trade area origins missing',
      },
    ]);
    expect(status).toBe('failed');
  });
});
