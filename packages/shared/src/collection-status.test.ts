import { describe, expect, it } from 'vitest';
import {
  deriveScanStatusFromCollection,
  mergeCollectionStatus,
  sourcesNeedingRetry,
  toCollectionDiagnostics,
  emptySourceResult,
} from './collection-status.js';

describe('deriveScanStatusFromCollection', () => {
  it('returns complete when all sources ok', () => {
    const result = deriveScanStatusFromCollection([
      emptySourceResult('pagespeed', 'ok', 'Desktop performance 72'),
      emptySourceResult('whois', 'ok', 'example.com · 5.0y', { affectsScore: false }),
    ]);
    expect(result.status).toBe('complete');
    expect(result.partialReasons).toEqual([]);
  });

  it('returns partial when PageSpeed missing', () => {
    const result = deriveScanStatusFromCollection([
      emptySourceResult('pagespeed', 'missing', 'PageSpeed data unavailable'),
      emptySourceResult('gbp', 'ok', 'Profile loaded'),
    ]);
    expect(result.status).toBe('partial');
    expect(result.partialReasons[0]).toContain('PageSpeed');
  });

  it('returns failed when critical SERP missing', () => {
    const result = deriveScanStatusFromCollection([
      emptySourceResult('serp', 'missing', 'No SERP keyword data collected'),
      emptySourceResult('gbp', 'ok', 'Profile loaded'),
    ]);
    expect(result.status).toBe('failed');
  });
});

describe('sourcesNeedingRetry', () => {
  it('lists recoverable non-ok sources', () => {
    const sources = [
      emptySourceResult('pagespeed', 'missing', 'missing psi'),
      emptySourceResult('gbp', 'ok', 'ok'),
      emptySourceResult('whois', 'partial', 'partial', { recoverable: false }),
    ];
    expect(sourcesNeedingRetry(sources)).toEqual(['pagespeed']);
  });
});

describe('mergeCollectionStatus', () => {
  it('overlays updated sources onto prior rows', () => {
    const prior = [emptySourceResult('pagespeed', 'missing', 'old')];
    const updated = [emptySourceResult('pagespeed', 'ok', 'new')];
    const merged = mergeCollectionStatus(prior, updated);
    expect(merged).toHaveLength(1);
    expect(merged[0]?.detail).toBe('new');
  });
});

describe('toCollectionDiagnostics', () => {
  it('maps source rows to report appendix shape', () => {
    const rows = toCollectionDiagnostics([
      emptySourceResult('html', 'error', 'Fetch failed'),
    ]);
    expect(rows[0]).toEqual({
      source: 'Homepage HTML',
      status: 'error',
      detail: 'Fetch failed',
    });
  });
});
