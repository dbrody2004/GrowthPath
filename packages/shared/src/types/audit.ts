export type KeywordType = 'near_me' | 'city' | 'unknown';

export interface KeywordEntry {
  keyword: string;
  service: string;
  type: KeywordType;
}

export interface Origin {
  zcta: string;
  lat: number;
  lng: number;
  dist_mi: number;
  pop: number;
  bearing?: number;
  name: string;
  band?: string;
  sector?: string;
  zoom_override?: string;
}

export interface TradeArea {
  biz_lat: number;
  biz_lng: number;
  biz_county: string | null;
  biz_address: string;
  home_zcta: string | null;
  near_me_origins: Origin[];
  city_origins: Origin[];
  origins: Origin[];
  near_me_cumul_pop?: number;
  nm_stop_reason?: string;
  _ring_info?: Record<string, [number, number]>;
}

export interface CompetitorEntry {
  rank: number;
  title: string;
  domain: string;
  rating: number | null;
  review_count: number | null;
  category?: string;
}

export interface SerpOriginData {
  name: string;
  dist_mi: number;
  pop: number;
  pos: number | null;
  top3: CompetitorEntry[];
  top20?: CompetitorEntry[];
  zoom?: string;
}

export interface SerpKeywordData {
  service: string;
  type: KeywordType;
  origins: Record<string, SerpOriginData>;
}

export type SerpData = Record<string, SerpKeywordData>;
export type LocalFinderData = SerpData;

export interface GbpData {
  name: string;
  rating: number | null;
  review_count: number | null;
  address: string;
  phone: string;
  hours: boolean;
  website: string;
  primary_type: string;
  primary_category: string;
  types: string[];
  secondary_categories: string[];
  cid: string | null;
  place_id: string | null;
  photo_count: number | null;
  reviews_last_30: number | null;
  reviews_w1: number | null;
  reviews_w2: number | null;
  reviews_w3: number | null;
  last_review_days_ago: number | null;
  owner_response_rate: number | null;
}

export interface GbpPosts {
  post_count: number;
  last_post_days_ago: number | null;
  last_post_date: string | null;
  posts: Array<{ type: string | null; summary: string; dt: string | null }>;
}

export interface MozClientMetrics {
  domain: string;
  da: number | null;
  referring_domains: number | null;
  external_pages?: number | null;
  spam_score?: number | null;
}

export interface MozData {
  client: MozClientMetrics;
  competitors: MozClientMetrics[];
}

export interface WhoisData {
  domain: string;
  age_years: number | null;
  created?: string;
  registrar?: string;
  https: boolean;
}

export interface HtmlData {
  ga4?: boolean;
  gtm?: boolean;
  facebook_pixel?: boolean;
  clarity?: boolean;
  booking_platforms?: string[];
  all_detected_platforms?: string[];
  booking_detected?: boolean;
  booking_path_type?: 'named_platform' | 'generic_booking' | 'quote_form' | 'contact_form_only' | 'none';
  booking_detection_method?: string | null;
  booking_internal_slug?: string | null;
  excluded_booking_platforms?: string[];
  booking_evidence?: string[];
  fetch_attempts?: number;
  lead_capture_platforms?: string[];
  click_to_call?: boolean;
  title_text?: string;
  title_length?: number;
  h1_count?: number;
  h1_multiple_flag?: boolean;
  meta_desc?: string;
  meta_desc_missing?: boolean;
  schema_types?: string[];
  viewport?: boolean;
  viewport_exists?: boolean;
  viewport_has_width_device?: boolean;
  viewport_blocks_zoom?: boolean;
  responsive_score?: number;
  has_media_queries?: boolean;
  has_responsive_markers?: boolean;
  has_responsive_images?: boolean;
  has_mobile_nav?: boolean;
  webp?: boolean;
  webp_by_extension?: boolean;
  webp_by_picture?: boolean;
  webp_by_css?: boolean;
  video_autoplay?: boolean;
  alt_text_total_images?: number;
  alt_text_with_alt?: number;
  social_links?: string[];
  css_framework?: string;
  html_fetch_error?: boolean;
  html_fetch_status?: number;
  [key: string]: unknown;
}

export interface ContentDepth {
  service_pages: Record<string, { found: boolean; url: string | null }>;
  city_keyword_cooccurrence: Record<string, { found: boolean; url: string | null }>;
  internal_links_crawled: number;
  pages_spot_checked: number;
  sitemap_url: string | null;
  sitemap_url_count: number;
}

export interface PageSpeedData {
  performance: number | null;
  accessibility?: number | null;
  best_practices?: number | null;
  seo_score?: number | null;
  ttfb_ms?: number | null;
  tbt_ms?: number | null;
  unused_js_kib?: number | null;
  unused_css_kib?: number | null;
  cls?: number | null;
  webp_by_extension?: boolean;
  webp_by_picture?: boolean;
  webp_by_css?: boolean;
}

export interface PsiAccessibility {
  psi_a11y_viewport?: number | null;
  psi_a11y_target_size?: number | null;
  psi_a11y_color_contrast?: number | null;
}

export interface LabsDataStub {
  all_3pack_keywords: unknown[];
  near_miss_keywords: unknown[];
  total_3pack_count: number;
}

export interface CompetitorAggEntry {
  domain: string;
  name: string;
  url?: string;
  appearances: number;
  maps_appearances: number;
  lf_appearances: number;
  avg_rank: number;
  vis_score: number;
  category: string;
  rating: number | null;
  review_count: number | null;
}

import type { PortalPresentation } from './presentation.js';

export interface AuditData {
  business: string;
  url: string;
  city: string;
  vertical: string;
  biz_type: string;
  scan_date: string;
  engine: string;
  gbp_category_confirmed?: boolean;
  gbp_category_mismatch?: boolean;
  gbp_primary_category?: string | null;
  owner_services: string[];
  keywords: KeywordEntry[];
  trade_area: TradeArea;
  gbp: GbpData;
  gbp_posts: GbpPosts;
  moz: MozData;
  serp: SerpData;
  local_finder: LocalFinderData;
  labs_data: LabsDataStub;
  whois: WhoisData;
  html: HtmlData;
  content_depth: ContentDepth;
  pagespeed: PageSpeedData;
  psi_accessibility: PsiAccessibility;
  crux: Record<string, never>;
  competitor_agg?: Record<string, CompetitorAggEntry[]>;
  total_cost?: number;
  /** Per-source collection outcomes captured at scan time. */
  collection_status?: import('./collection.js').SourceCollectionResult[];
  collection_metadata?: import('./collection.js').CollectionRunMetadata;
  /** Portal / demo presentation layer (GA4, GSC, rich action plan). */
  presentation?: PortalPresentation;
}
