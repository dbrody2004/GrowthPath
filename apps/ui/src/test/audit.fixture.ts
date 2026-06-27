import type { AuditData, SerpOriginData } from '@growthpath/shared';

function origin(name: string, distMi: number, pos: number | null): SerpOriginData {
  return { name, dist_mi: distMi, pop: 10000, pos, top3: [] };
}

const burgersNearMeSerp = {
  z0: origin('Westpark (0.51mi)', 0.51, 1),
  z1: origin('Westwood Village (3.87mi)', 3.87, 20),
  z2: origin('Diamond Oaks (4.41mi)', 4.41, null),
};

const burgersNearMeLf = {
  z0: origin('Westpark (0.51mi)', 0.51, 1),
  z1: origin('Westwood Village (3.87mi)', 3.87, null),
  z2: origin('Diamond Oaks (4.41mi)', 4.41, null),
};

const pizzaNearMeSerp = {
  z0: origin('Westpark (0.51mi)', 0.51, 2),
  z1: origin('Westwood Village (3.87mi)', 3.87, null),
};

const pizzaNearMeLf = {
  z0: origin('Westpark (0.51mi)', 0.51, 2),
  z1: origin('Westwood Village (3.87mi)', 3.87, null),
};

export const sampleAuditFixture: AuditData = {
  business: 'Kitchen 747',
  url: 'https://www.kitchen747.com',
  city: 'Roseville CA 95747',
  vertical: 'Food & Beverage',
  biz_type: 'Restaurant',
  scan_date: '2025-01-15',
  engine: 'v4.69',
  owner_services: ['burgers', 'pizza'],
  keywords: [
    { keyword: 'burgers near me', service: 'burgers', type: 'near_me' },
    { keyword: 'pizza near me', service: 'pizza', type: 'near_me' },
  ],
  trade_area: {
    biz_lat: 38.77,
    biz_lng: -121.37,
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
  moz: { client: { domain: 'kitchen747.com', da: 15, referring_domains: 66 }, competitors: [] },
  serp: {
    'burgers near me': { service: 'burgers', type: 'near_me', origins: burgersNearMeSerp },
    'pizza near me': { service: 'pizza', type: 'near_me', origins: pizzaNearMeSerp },
  },
  local_finder: {
    'burgers near me': { service: 'burgers', type: 'near_me', origins: burgersNearMeLf },
    'pizza near me': { service: 'pizza', type: 'near_me', origins: pizzaNearMeLf },
  },
  labs_data: { all_3pack_keywords: [], near_miss_keywords: [], total_3pack_count: 0 },
  whois: { domain: 'kitchen747.com', age_years: 5, https: true },
  html: {
    booking_platforms: [],
    schema_types: [],
    title_text: 'Kitchen 747',
  },
  content_depth: {
    service_pages: {},
    city_keyword_cooccurrence: {},
    internal_links_crawled: 0,
    pages_spot_checked: 0,
    sitemap_url: null,
    sitemap_url_count: 0,
  },
  pagespeed: {
    performance: 55,
    accessibility: 80,
    cls: 0.1,
  },
  psi_accessibility: {},
  crux: {},
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

export const sampleOriginRows = [
  {
    key: 'z0',
    name: 'Westpark (0.51mi)',
    distMi: 0.51,
    pop: 10000,
    mapsPos: 1,
    lfPos: 1,
  },
  {
    key: 'z1',
    name: 'Westwood Village (3.87mi)',
    distMi: 3.87,
    pop: 10000,
    mapsPos: 20,
    lfPos: null,
  },
  {
    key: 'z2',
    name: 'Diamond Oaks (4.41mi)',
    distMi: 4.41,
    pop: 10000,
    mapsPos: null,
    lfPos: null,
  },
];
