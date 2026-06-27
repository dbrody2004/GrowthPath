import { describe, expect, it } from 'vitest';
import { deriveVisibilityBuckets, mergeNearMissSources } from './search-visibility-derivations.js';

describe('deriveVisibilityBuckets', () => {
  it('classifies 3-pack, city visibility, and near-miss ranks', () => {
    const buckets = deriveVisibilityBuckets({
      'burgers near me': {
        home_pos: 1,
        best_pos: 1,
        maps_pts: 50,
        lf_best: 1,
        lf_pts: 50,
        total: 100,
        type: 'near_me',
        service: 'burgers',
      },
      'live music near me': {
        home_pos: 4,
        best_pos: 4,
        maps_pts: 30,
        lf_best: 5,
        lf_pts: 25,
        total: 55,
        type: 'near_me',
        service: 'live music',
      },
      'burgers roseville ca 95747': {
        home_pos: 5,
        best_pos: 3,
        maps_pts: 50,
        lf_best: 3,
        lf_pts: 50,
        total: 100,
        type: 'city',
        service: 'burgers',
      },
      'pizza roseville ca 95747': {
        home_pos: null,
        best_pos: null,
        maps_pts: 0,
        lf_best: null,
        lf_pts: 0,
        total: 0,
        type: 'city',
        service: 'pizza',
      },
    });

    expect([...buckets.kw3pack].sort()).toEqual(['burgers near me', 'burgers roseville ca 95747']);
    expect([...buckets.kwCityVisible]).toEqual(['burgers roseville ca 95747']);
    expect(buckets.nearMiss).toEqual([{ keyword: 'live music near me', rank: 4 }]);
  });
});

describe('mergeNearMissSources', () => {
  it('prefers SERP-derived near-miss entries', () => {
    const merged = mergeNearMissSources([{ keyword: 'burgers near me', rank: 4 }], {
      all_3pack_keywords: [],
      near_miss_keywords: [{ keyword: 'labs keyword', rank: 5, volume: 900 }],
      total_3pack_count: 0,
    });
    expect(merged).toEqual([{ keyword: 'burgers near me', rank: 4 }]);
  });

  it('falls back to labs near-miss when SERP list is empty', () => {
    const merged = mergeNearMissSources([], {
      all_3pack_keywords: [],
      near_miss_keywords: [
        { keyword: 'low volume', rank: 6, volume: 50 },
        { keyword: 'high volume', rank: 5, volume: 900 },
      ],
      total_3pack_count: 0,
    });
    expect(merged[0]?.keyword).toBe('high volume');
  });
});
