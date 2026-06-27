import { describe, expect, it } from 'vitest';
import {
  keywordStats,
  originRows,
  proximityWall,
  rankBand,
  rankColor,
  RANK_COLORS,
  servicesFromKeywords,
} from './rankmap.js';
import { sampleAuditFixture, sampleOriginRows } from '../test/audit.fixture.js';

describe('rankBand', () => {
  it('maps positions to bands', () => {
    expect(rankBand(1)).toBe('top3');
    expect(rankBand(3)).toBe('top3');
    expect(rankBand(4)).toBe('lf');
    expect(rankBand(10)).toBe('lf');
    expect(rankBand(11)).toBe('deep');
    expect(rankBand(20)).toBe('deep');
    expect(rankBand(null)).toBe('none');
    expect(rankBand(21)).toBe('none');
  });
});

describe('rankColor', () => {
  it('returns legend colors by band', () => {
    expect(rankColor(1)).toBe(RANK_COLORS.top3);
    expect(rankColor(7)).toBe(RANK_COLORS.lf);
    expect(rankColor(15)).toBe(RANK_COLORS.deep);
    expect(rankColor(null)).toBe(RANK_COLORS.none);
  });
});

describe('servicesFromKeywords', () => {
  it('returns unique services in order', () => {
    expect(servicesFromKeywords(sampleAuditFixture.keywords)).toEqual(['burgers', 'pizza']);
  });
});

describe('originRows', () => {
  it('joins serp and local finder by origin key sorted by distance', () => {
    const rows = originRows(
      sampleAuditFixture.serp,
      sampleAuditFixture.local_finder,
      'burgers near me',
    );
    expect(rows).toHaveLength(3);
    expect(rows[0]?.name).toBe('Westpark (0.51mi)');
    expect(rows[0]?.mapsPos).toBe(1);
    expect(rows[0]?.lfPos).toBe(1);
    expect(rows[1]?.distMi).toBe(3.87);
  });
});

describe('keywordStats', () => {
  it('computes stats across both surfaces by default', () => {
    const stats = keywordStats(sampleOriginRows, 'both');
    expect(stats.top3Appearances).toBe(2);
    expect(stats.notRanked).toBe(3);
    expect(stats.total).toBe(6);
    expect(stats.avgRank).toBe(7.3);
  });

  it('respects surface filter', () => {
    const stats = keywordStats(sampleOriginRows, 'maps');
    expect(stats.total).toBe(3);
    expect(stats.top3Appearances).toBe(1);
  });
});

describe('proximityWall', () => {
  it('returns distance where ranking drops off', () => {
    expect(proximityWall(sampleOriginRows, 'both')).toBe(4.41);
  });

  it('returns null when always ranked or never ranked', () => {
    const alwaysRanked = sampleOriginRows.map((row) => ({ ...row, mapsPos: 2, lfPos: 2 }));
    expect(proximityWall(alwaysRanked, 'both')).toBeNull();
  });
});
