import type { AuditData, SerpOriginData } from '@growthpath/shared';

function serpOrigin(
  name: string,
  distMi: number,
  pos: number | null,
  _category = 'hamburger_restaurant',
): SerpOriginData {
  return {
    name,
    dist_mi: distMi,
    pop: 10000,
    pos,
    top3: pos
      ? [
          {
            rank: 1,
            title: 'Goldfield Trading Post',
            domain: 'goldfieldtradingpost.com',
            rating: 4.5,
            review_count: 672,
            category: 'hamburger_restaurant',
          },
          {
            rank: 2,
            title: 'Bunnbite Burger',
            domain: 'bunnbiteburger.com',
            rating: 4.8,
            review_count: 26,
            category: 'hamburger_restaurant',
          },
          {
            rank: 3,
            title: 'The Daily Nosh',
            domain: 'thedailynosh.com',
            rating: 4.7,
            review_count: 464,
            category: 'american_restaurant',
          },
        ]
      : [],
  };
}

function lfOrigin(name: string, distMi: number, pos: number | null): SerpOriginData {
  return {
    name,
    dist_mi: distMi,
    pop: 10000,
    pos,
    top3: [],
    top20: pos
      ? [
          {
            rank: pos,
            title: 'Kitchen 747',
            domain: 'kitchen747.com',
            rating: 4.4,
            review_count: 679,
          },
        ]
      : [],
  };
}

function nearMeOrigins(
  specs: Array<{ name: string; dist: number; maps: number | null; lf: number | null }>,
): { serp: Record<string, SerpOriginData>; lf: Record<string, SerpOriginData> } {
  const serp: Record<string, SerpOriginData> = {};
  const lf: Record<string, SerpOriginData> = {};
  for (const [i, spec] of specs.entries()) {
    const key = `z${i}`;
    serp[key] = serpOrigin(spec.name, spec.dist, spec.maps);
    lf[key] = lfOrigin(spec.name, spec.dist, spec.lf);
  }
  return { serp, lf };
}

function cityOrigins(
  specs: Array<{ name: string; dist: number; maps: number | null; lf: number | null }>,
): { serp: Record<string, SerpOriginData>; lf: Record<string, SerpOriginData> } {
  return nearMeOrigins(specs);
}

const nmNear = nearMeOrigins([
  { name: 'Westpark (0.51mi)', dist: 0.51, maps: 1, lf: 1 },
  { name: 'Westwood Village (3.87mi)', dist: 3.87, maps: 20, lf: null },
  { name: 'Diamond Oaks (4.41mi)', dist: 4.41, maps: null, lf: null },
]);

const pizzaNear = nearMeOrigins([
  { name: 'Westpark (0.51mi)', dist: 0.51, maps: 2, lf: 2 },
  { name: 'Westwood Village (3.87mi)', dist: 3.87, maps: null, lf: null },
  { name: 'Diamond Oaks (4.41mi)', dist: 4.41, maps: null, lf: null },
]);

const musicNear = nearMeOrigins([
  { name: 'Westpark (0.51mi)', dist: 0.51, maps: 4, lf: 5 },
  { name: 'Westwood Village (3.87mi)', dist: 3.87, maps: null, lf: null },
  { name: 'Diamond Oaks (4.41mi)', dist: 4.41, maps: null, lf: null },
]);

const burgersCity = cityOrigins([
  { name: 'Rocklin (5.97mi)', dist: 5.97, maps: 5, lf: 5 },
  { name: 'Sunrise Gardens (7.45mi)', dist: 7.45, maps: 4, lf: 4 },
  { name: 'Pleasant Grove (7.79mi)', dist: 7.79, maps: 4, lf: 3 },
  { name: 'Carmichael (10.18mi)', dist: 10.18, maps: null, lf: null },
  { name: 'Lincoln (10.93mi)', dist: 10.93, maps: null, lf: 5 },
  { name: 'North Sacramento (10.99mi)', dist: 10.99, maps: 3, lf: 3 },
  { name: 'Granite Bay (11.09mi)', dist: 11.09, maps: null, lf: 6 },
  { name: 'Newcastle (13.22mi)', dist: 13.22, maps: 10, lf: 5 },
  { name: 'Broadstone (14.48mi)', dist: 14.48, maps: 11, lf: 6 },
  { name: 'Downtown (14.81mi)', dist: 14.81, maps: 3, lf: null },
  { name: 'Pilot Hill (18.0mi)', dist: 18.0, maps: null, lf: 5 },
  { name: 'Woodland (18.45mi)', dist: 18.45, maps: 4, lf: 3 },
  { name: 'Wheatland (18.91mi)', dist: 18.91, maps: null, lf: null },
  { name: 'Sacramento (19.52mi)', dist: 19.52, maps: null, lf: null },
  { name: 'Roseville center (2.0mi)', dist: 2.0, maps: 4, lf: 4 },
]);

const pizzaCity = cityOrigins([
  { name: 'North Sacramento (10.99mi)', dist: 10.99, maps: 18, lf: 18 },
  ...Array.from({ length: 14 }, (_, i) => ({
    name: `City origin ${i + 1}`,
    dist: 8 + i,
    maps: null as number | null,
    lf: null as number | null,
  })),
]);

const musicCity = cityOrigins([
  { name: 'Pleasant Grove (7.79mi)', dist: 7.79, maps: null, lf: 7 },
  { name: 'Woodland (18.45mi)', dist: 18.45, maps: null, lf: 14 },
  { name: 'North Sacramento (10.99mi)', dist: 10.99, maps: null, lf: 8 },
  ...Array.from({ length: 12 }, (_, i) => ({
    name: `City origin ${i + 1}`,
    dist: 9 + i,
    maps: null as number | null,
    lf: null as number | null,
  })),
]);

export const kitchen747AuditData: AuditData = {
  business: 'Kitchen 747',
  url: 'https://www.kitchen747.com',
  city: 'Roseville CA 95747',
  vertical: 'Food & Beverage',
  biz_type: 'Restaurant',
  scan_date: '2025-01-15',
  engine: 'v4.69',
  owner_services: ['burgers', 'pizza', 'live music'],
  keywords: [
    { keyword: 'burgers near me', service: 'burgers', type: 'near_me' },
    { keyword: 'pizza near me', service: 'pizza', type: 'near_me' },
    { keyword: 'live music near me', service: 'live music', type: 'near_me' },
    { keyword: 'burgers roseville ca 95747', service: 'burgers', type: 'city' },
    { keyword: 'pizza roseville ca 95747', service: 'pizza', type: 'city' },
    { keyword: 'live music roseville ca 95747', service: 'live music', type: 'city' },
  ],
  trade_area: {
    biz_lat: 38.771156,
    biz_lng: -121.369908,
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
    photo_count: 845,
    reviews_last_30: 17,
    reviews_w1: 17,
    reviews_w2: 6,
    reviews_w3: 6,
    last_review_days_ago: 3,
    owner_response_rate: 0.11,
  },
  gbp_posts: {
    post_count: 1,
    last_post_days_ago: 1574,
    last_post_date: '2020-01-01',
    posts: [],
  },
  moz: {
    client: {
      domain: 'kitchen747.com',
      da: 15,
      referring_domains: 66,
    },
    competitors: [],
  },
  serp: {
    'burgers near me': { service: 'burgers', type: 'near_me', origins: nmNear.serp },
    'pizza near me': { service: 'pizza', type: 'near_me', origins: pizzaNear.serp },
    'live music near me': { service: 'live music', type: 'near_me', origins: musicNear.serp },
    'burgers roseville ca 95747': { service: 'burgers', type: 'city', origins: burgersCity.serp },
    'pizza roseville ca 95747': { service: 'pizza', type: 'city', origins: pizzaCity.serp },
    'live music roseville ca 95747': { service: 'live music', type: 'city', origins: musicCity.serp },
  },
  local_finder: {
    'burgers near me': { service: 'burgers', type: 'near_me', origins: nmNear.lf },
    'pizza near me': { service: 'pizza', type: 'near_me', origins: pizzaNear.lf },
    'live music near me': { service: 'live music', type: 'near_me', origins: musicNear.lf },
    'burgers roseville ca 95747': { service: 'burgers', type: 'city', origins: burgersCity.lf },
    'pizza roseville ca 95747': { service: 'pizza', type: 'city', origins: pizzaCity.lf },
    'live music roseville ca 95747': { service: 'live music', type: 'city', origins: musicCity.lf },
  },
  labs_data: {
    all_3pack_keywords: [],
    near_miss_keywords: [],
    total_3pack_count: 0,
  },
  whois: {
    domain: 'kitchen747.com',
    age_years: 7.6,
    https: true,
  },
  html: {
    title_text: 'Home | Kitchen747',
    title_length: 17,
    h1_count: 1,
    meta_desc_missing: true,
    schema_types: ['Organization', 'WebPage'],
    ga4: false,
    gtm: true,
    click_to_call: false,
    booking_path_type: 'named_platform',
    booking_platforms: ['toast'],
    viewport_exists: true,
    viewport_has_width_device: true,
    viewport_blocks_zoom: false,
    responsive_score: 4,
    has_media_queries: true,
    has_responsive_markers: true,
    has_responsive_images: true,
    has_mobile_nav: true,
    webp: false,
    webp_by_extension: false,
    webp_by_picture: false,
    webp_by_css: false,
  },
  content_depth: {
    service_pages: {
      burgers: { found: false, url: null },
      pizza: { found: false, url: null },
      'live music': { found: true, url: 'https://www.kitchen747.com/community-event/live-music' },
    },
    city_keyword_cooccurrence: {
      burgers: { found: false, url: null },
      pizza: { found: false, url: null },
      'live music': { found: false, url: null },
    },
    internal_links_crawled: 12,
    pages_spot_checked: 4,
    sitemap_url: null,
    sitemap_url_count: 0,
  },
  pagespeed: {
    performance: 38,
    ttfb_ms: 5,
    cls: 0.492,
    tbt_ms: 742,
    unused_js_kib: 162,
    unused_css_kib: 70,
  },
  psi_accessibility: {
    psi_a11y_target_size: 1.0,
    psi_a11y_color_contrast: 0.0,
  },
  crux: {},
};
