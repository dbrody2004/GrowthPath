import { describe, expect, it } from 'vitest';
import { fetchLocalFinder } from './localFinder.js';

describe('fetchLocalFinder client matching', () => {
  it('matches kitchen747 LF title to Kitchen 747 business name', async () => {
    const items = [
      {
        rank_group: 1,
        title: 'kitchen747',
        domain: '',
        rating: { value: 4.4, votes_count: 679 },
      },
      {
        rank_group: 2,
        title: 'Dog Haus Biergarten',
        domain: '',
        rating: { value: 4.6, votes_count: 520 },
      },
    ];

    const ctx = {
      dataforseo: {
        postLive: async () => ({
          cost: 0.002,
          tasks: [{ status_code: 20000, result: [{ items }] }],
        }),
      },
    } as never;

    const { localFinder } = await fetchLocalFinder(
      ctx,
      [{ keyword: 'burgers near me', service: 'burgers', type: 'near_me' }],
      {
        biz_lat: 38.77,
        biz_lng: -121.36,
        biz_county: 'Placer',
        biz_address: '2320 Pleasant Grove Blvd, Roseville, CA 95747',
        home_zcta: '95747',
        near_me_origins: [
          {
            zcta: '95747',
            lat: 38.778421,
            lng: -121.368829,
            dist_mi: 0.434,
            pop: 78987,
            name: 'Westpark',
          },
        ],
        city_origins: [],
        origins: [],
      },
      'Kitchen 747',
      'kitchen747.com',
      '2320 Pleasant Grove Blvd',
    );

    const origin = localFinder['burgers near me']?.origins['95747'];
    expect(origin?.pos).toBe(1);
  });
});
