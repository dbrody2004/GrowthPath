import { describe, expect, it } from 'vitest';
import type { AuditData } from '@growthpath/shared';
import { calculateScores } from './calculate-scores.js';
import { identifyPrimaryCompetitor } from './identify-primary-competitor.js';
import { kitchen747AuditData } from './kitchen747.fixture.js';

const baseAudit: AuditData = {
  business: 'Kitchen 747',
  url: 'https://www.kitchen747.com',
  city: 'Roseville CA 95747',
  vertical: 'Food & Beverage',
  biz_type: 'Restaurant',
  scan_date: '2025-01-01',
  engine: 'test',
  owner_services: ['burgers'],
  keywords: [{ keyword: 'burgers near me', service: 'burgers', type: 'near_me' }],
  trade_area: {
    biz_lat: 0,
    biz_lng: 0,
    biz_county: 'Placer',
    biz_address: 'Roseville, CA',
    home_zcta: '95747',
    near_me_origins: [],
    city_origins: [],
    origins: [],
  },
  gbp: {
    name: 'Kitchen 747',
    rating: 4.4,
    review_count: 679,
    address: 'Roseville, CA',
    phone: '(916) 555-7470',
    hours: true,
    website: 'https://www.kitchen747.com',
    primary_type: 'restaurant',
    primary_category: 'restaurant',
    types: ['restaurant'],
    secondary_categories: [],
    cid: null,
    place_id: null,
    photo_count: 100,
    reviews_last_30: 10,
    reviews_w1: 10,
    reviews_w2: 5,
    reviews_w3: 5,
    last_review_days_ago: 3,
    owner_response_rate: 0.1,
  },
  gbp_posts: { post_count: 0, last_post_days_ago: null, last_post_date: null, posts: [] },
  moz: {
    client: { domain: 'kitchen747.com', da: 15, referring_domains: 66 },
    competitors: [{ domain: 'goldfieldtradingpost.com', da: 35, referring_domains: 120 }],
  },
  serp: {
    'burgers near me': {
      service: 'burgers',
      type: 'near_me',
      origins: {
        z0: {
          name: 'Westpark',
          dist_mi: 0.5,
          pop: 10000,
          pos: 2,
          top3: [
            {
              rank: 1,
              title: 'Goldfield Trading Post',
              domain: 'goldfieldtradingpost.com',
              rating: 4.5,
              review_count: 672,
              category: 'restaurant',
            },
          ],
        },
      },
    },
  },
  local_finder: {},
  labs_data: { all_3pack_keywords: [], near_miss_keywords: [], total_3pack_count: 0 },
  whois: { domain: 'kitchen747.com', age_years: 5, https: true },
  html: {},
  content_depth: {
    service_pages: {},
    city_keyword_cooccurrence: {},
    internal_links_crawled: 0,
    pages_spot_checked: 0,
    sitemap_url: null,
    sitemap_url_count: 0,
  },
  pagespeed: { performance: 50 },
  psi_accessibility: {},
  crux: {},
};

describe('identifyPrimaryCompetitor', () => {
  it('enriches primary competitor with Moz metrics when domain matches', () => {
    const intel = identifyPrimaryCompetitor(
      baseAudit,
      {
        'burgers near me': {
          home_pos: 2,
          best_pos: 2,
          maps_pts: 40,
          lf_best: null,
          lf_pts: 0,
          total: 40,
          type: 'near_me',
          service: 'burgers',
        },
      },
      679,
      15,
      4.4,
    );

    expect(intel?.name).toBe('Goldfield Trading Post');
    expect(intel?.da).toBe(35);
    expect(intel?.referring_domains).toBe(120);
    expect(intel?.why_winning).toContain('Domain authority');
    expect(intel?.deltas.length).toBeGreaterThan(0);
    expect(intel?.surface_matrix.length).toBe(1);
    expect(intel?.counter_moves.length).toBeGreaterThan(0);
    expect(intel?.action_callout).toBeTruthy();
    expect(intel?.client.name).toBe('Kitchen 747');
  });

  it('returns null when no near-me competitor data exists', () => {
    const intel = identifyPrimaryCompetitor({ ...baseAudit, serp: {} }, {}, 679, 15, 4.4);
    expect(intel).toBeNull();
  });
});

describe('calculateScores competitor deliverable', () => {
  it('attaches enriched competitor intel and leaderboard for Kitchen 747', () => {
    const scores = calculateScores(kitchen747AuditData);

    expect(scores.competitor_intel).not.toBeNull();
    expect(scores.competitor_intel?.deltas.length).toBeGreaterThan(0);
    expect(scores.competitor_intel?.surface_matrix.length).toBeGreaterThan(0);
    expect(scores.competitor_leaderboard?.length).toBeGreaterThan(0);
    expect(scores.competitor_leaderboard?.some((row) => row.is_client)).toBe(true);
  });
});
