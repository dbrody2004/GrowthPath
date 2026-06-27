import { describe, expect, it } from 'vitest';
import type { AuditData } from '@growthpath/shared';
import { buildCompetitorLeaderboard } from './build-competitor-leaderboard.js';
import { identifyPrimaryCompetitor } from './identify-primary-competitor.js';
import { kitchen747AuditData } from './kitchen747.fixture.js';

describe('buildCompetitorLeaderboard', () => {
  it('builds leaderboard rows from SERP when competitor_agg is absent', () => {
    const intel = identifyPrimaryCompetitor(
      kitchen747AuditData,
      {},
      kitchen747AuditData.gbp.review_count,
      kitchen747AuditData.moz.client.da,
      kitchen747AuditData.gbp.rating,
    );
    const rows = buildCompetitorLeaderboard(kitchen747AuditData, intel);

    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0]?.rank).toBe(1);
    expect(rows.some((row) => row.name.includes('Goldfield') || row.domain.includes('goldfield'))).toBe(
      true,
    );
  });

  it('marks client and primary rows from scores data', () => {
    const audit: AuditData = {
      ...kitchen747AuditData,
      competitor_agg: {
        'burgers near me': [
          {
            domain: 'goldfieldtradingpost.com',
            name: 'Goldfield Trading Post',
            appearances: 12,
            maps_appearances: 8,
            lf_appearances: 4,
            avg_rank: 2.1,
            vis_score: 88,
            category: 'restaurant',
            rating: 4.5,
            review_count: 672,
          },
          {
            domain: 'kitchen747.com',
            name: 'Kitchen 747',
            appearances: 6,
            maps_appearances: 4,
            lf_appearances: 2,
            avg_rank: 5.2,
            vis_score: 55,
            category: 'restaurant',
            rating: 4.4,
            review_count: 679,
          },
        ],
      },
    };

    const intel = identifyPrimaryCompetitor(
      audit,
      {},
      audit.gbp.review_count,
      audit.moz.client.da,
      audit.gbp.rating,
    );
    const rows = buildCompetitorLeaderboard(audit, intel);

    expect(rows.find((row) => row.is_client)?.name).toBe('Kitchen 747');
    expect(rows.find((row) => row.is_primary)?.domain).toContain('goldfield');
  });

  it('returns empty array when no SERP or agg data exists', () => {
    const audit: AuditData = {
      ...kitchen747AuditData,
      serp: {},
      local_finder: {},
      competitor_agg: {},
    };

    expect(buildCompetitorLeaderboard(audit, null)).toEqual([]);
  });
});
