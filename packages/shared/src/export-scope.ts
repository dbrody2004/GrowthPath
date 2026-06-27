/**
 * Client-shareable report scope.
 *
 * Included in print/PDF exports:
 * - Score header (P1, P2, profile)
 * - Overview: explanation, category cards, priority actions
 * - Client-safe appendix summary (collection status labels only)
 * - Rank map summary, competitor leaderboard/intel/comparison, keyword cards
 *
 * Excluded from client exports (operator-only):
 * - App sidebar, tabs, retry controls, collection operator table
 * - Signal availability matrix, triggered KB keys, operator diagnostics notes
 * - Scan IDs, retry lineage, internal error strings
 */

export const SHAREABLE_REPORT_SECTIONS = [
  'score_header',
  'overview_explanation',
  'category_scores',
  'priority_actions',
  'appendix_collection_summary',
  'appendix_remediation',
  'rank_map',
  'competitor_leaderboard',
  'competitor_intel',
  'competitor_comparison',
  'keywords',
] as const;

export type ShareableReportSection = (typeof SHAREABLE_REPORT_SECTIONS)[number];

export const OPERATOR_ONLY_SECTIONS = [
  'collection_operator_table',
  'signal_availability_matrix',
  'triggered_kb_keys',
  'scan_retry_controls',
  'scan_internal_ids',
] as const;

/** Appendix fields safe to show clients (high-level collection outcomes + remediation). */
export const CLIENT_APPENDIX_FIELDS = ['collectionStatus', 'remediation'] as const;

/** Appendix fields hidden from client exports. */
export const OPERATOR_APPENDIX_FIELDS = [
  'signalAvailability',
  'triggeredKbKeys',
  'notes',
] as const;

/**
 * Export strategy for this milestone:
 * - Primary: authenticated browser print (/scans/:id/print) — zero infra, no drift
 * - Secondary: queued server PDF (Playwright → print URL with signed token → S3)
 */
export const EXPORT_STRATEGY = {
  primary: 'browser_print',
  serverPdf: 'playwright_print_url',
} as const;
