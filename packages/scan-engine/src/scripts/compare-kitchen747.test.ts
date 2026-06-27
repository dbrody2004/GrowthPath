import { describe, expect, it } from 'vitest';
import type { AuditData } from '@growthpath/shared';
import { kitchen747AuditData } from '../fixtures/kitchen747.fixture.js';
import { diffAuditData, normalizeAuditForCompare } from './compare-kitchen747.js';

describe('diffAuditData', () => {
  it('reports no structural diffs when comparing fixture to itself', () => {
    const expected = normalizeAuditForCompare(kitchen747AuditData);
    const entries = diffAuditData(expected, expected);
    const structural = entries.filter((e) => !e.volatile);
    expect(structural).toEqual([]);
  });

  it('flags missing gbp.name as structural', () => {
    const expected = normalizeAuditForCompare(kitchen747AuditData);
    const live = {
      ...expected,
      gbp: { ...expected.gbp, name: '' },
    } as AuditData;
    const entries = diffAuditData(expected, live);
    expect(entries.some((e) => e.path === 'gbp.name' && !e.volatile)).toBe(true);
  });

  it('treats review_count drift as non-structural', () => {
    const expected = normalizeAuditForCompare(kitchen747AuditData);
    const live = {
      ...expected,
      gbp: { ...expected.gbp, review_count: 999 },
    } as AuditData;
    const entries = diffAuditData(expected, live);
    const structural = entries.filter((e) => !e.volatile);
    expect(structural.some((e) => e.path === 'gbp.review_count')).toBe(false);
  });
});
