export const TRADE_AREA_MIN_POP = 250;
export const NM_CITY_SPLIT_MI = 5.0;
export const MAX_SERP_WORKERS = 6;
export const MAPS_DEPTH = 20;
export const LF_DEPTH = 20;
export const TOP_N_COMPETITORS = 5;

export const TRADE_AREA_TIER_CONFIG = {
  basic: {
    near_me_cap: 5,
    city_target: 5,
    city_bands: [[5.0, 7.5], [7.5, 10.0]] as [number, number][],
    max_mi: 10.0,
  },
  advanced_premium: {
    near_me_cap: 5,
    city_target: 15,
    city_bands: [[5.0, 9.0], [9.0, 13.0], [13.0, 16.0], [16.0, 20.0]] as [number, number][],
    max_mi: 20.0,
  },
} as const;

export type ScanTierKey = keyof typeof TRADE_AREA_TIER_CONFIG;

/** Platform / aggregator domains excluded from Moz competitor enrichment */
export const AGGREGATOR_DOMAIN_ROOTS = [
  'yelp.com',
  'facebook.com',
  'instagram.com',
  'tripadvisor.com',
  'google.com',
  'maps.google.com',
  'bbb.org',
  'yellowpages.com',
  'foursquare.com',
  'linkedin.com',
  'twitter.com',
  'x.com',
  'tiktok.com',
  'pinterest.com',
  'mapquest.com',
  'opencorporates.com',
  'chamberofcommerce.com',
  'manta.com',
  'angi.com',
  'homeadvisor.com',
  'thumbtack.com',
  'opentable.com',
  'resy.com',
  'grubhub.com',
  'doordash.com',
  'ubereats.com',
] as const;

export const DFS_REVIEWS_POLL_TIMEOUT_MS = 120_000;
export const DFS_REVIEWS_POLL_INTERVAL_MS = 5_000;
export const DFS_GBP_POSTS_POLL_TIMEOUT_MS = 20_000;
export const DFS_GBP_POSTS_POLL_INTERVAL_MS = 2_000;

export const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  Connection: 'keep-alive',
  'Upgrade-Insecure-Requests': '1',
} as const;
