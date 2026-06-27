import type { CollectionStatus } from './report.js';

/** Canonical source identifiers tracked during scan collection. */
export type CollectionSourceId =
  | 'gbp'
  | 'gbp_posts'
  | 'moz'
  | 'moz_competitors'
  | 'trade_area'
  | 'serp'
  | 'local_finder'
  | 'whois'
  | 'html'
  | 'content_depth'
  | 'pagespeed'
  | 'psi_accessibility'
  | 'competitor_agg';

export type CollectionOutcomeStatus = CollectionStatus | 'skipped';

export type CollectionErrorKind =
  | 'transient'
  | 'validation'
  | 'vendor'
  | 'timeout'
  | 'unknown';

export interface SourceCollectionResult {
  sourceId: CollectionSourceId;
  label: string;
  status: CollectionOutcomeStatus;
  /** Customer-safe summary shown in partial banners and report appendix. */
  detail: string;
  /** Operator/debug detail (API + status panel). */
  operatorDetail?: string;
  errorKind?: CollectionErrorKind;
  recoverable?: boolean;
  retryCount?: number;
  durationMs?: number;
  cost?: number;
  attemptedAt?: string;
  /** When true, a non-ok status may change category scores. */
  affectsScore?: boolean;
}

export interface CollectionRunMetadata {
  sources: SourceCollectionResult[];
  startedAt: string;
  completedAt: string;
  totalDurationMs: number;
}

export const COLLECTION_SOURCE_LABELS: Record<CollectionSourceId, string> = {
  gbp: 'Google Business Profile',
  gbp_posts: 'GBP post activity',
  moz: 'Moz / Domain metrics',
  moz_competitors: 'Moz competitor enrichment',
  trade_area: 'Trade area / origins',
  serp: 'SERP / Map Pack',
  local_finder: 'Local Finder',
  whois: 'WHOIS',
  html: 'Homepage HTML',
  content_depth: 'Content depth crawl',
  pagespeed: 'PageSpeed Insights',
  psi_accessibility: 'PSI accessibility (mobile)',
  competitor_agg: 'Competitor aggregation',
};

/** Sources whose failure should fail the entire scan (not partial). */
export const CRITICAL_COLLECTION_SOURCES: CollectionSourceId[] = [
  'gbp',
  'serp',
  'trade_area',
];
