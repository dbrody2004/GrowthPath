import type { CollectionSourceId } from '@growthpath/shared';
import type { ScanCredentials } from './index.js';

export interface ScanSourceCapability {
  sourceId: CollectionSourceId | 'mock_mode';
  label: string;
  liveCapable: boolean;
  reason?: string;
}

export interface ScanPreflightResult {
  mockMode: boolean;
  sources: ScanSourceCapability[];
  /** True when required credentials exist and mock mode is off. */
  readyForLive: boolean;
}

function hasCredential(value: string | undefined): boolean {
  return Boolean(value && value.trim().length > 0);
}

/** Report which scan sources can run live with the current credentials. */
export function preflightScanCredentials(
  env: Partial<ScanCredentials & { SCAN_MOCK?: boolean | string }>,
): ScanPreflightResult {
  const mockMode =
    typeof env.SCAN_MOCK === 'boolean'
      ? env.SCAN_MOCK
      : ['1', 'true', 'yes', 'on'].includes(String(env.SCAN_MOCK ?? '').toLowerCase());

  const googleOk = hasCredential(env.GOOGLE_API_KEY);
  const dfsOk = hasCredential(env.DFS_LOGIN) && hasCredential(env.DFS_PASSWORD);
  const mozOk = hasCredential(env.MOZ_API_KEY);
  const censusOk = hasCredential(env.CENSUS_API_KEY);

  const requiredReason = (label: string) =>
    mockMode ? 'SCAN_MOCK enabled' : !googleOk || !dfsOk ? `${label} requires GOOGLE_API_KEY and DFS credentials` : undefined;

  const optionalReason = (present: boolean, label: string) =>
    mockMode ? 'SCAN_MOCK enabled' : present ? undefined : `${label} optional — live enrichment limited`;

  const sources: ScanSourceCapability[] = [
    { sourceId: 'mock_mode', label: 'Mock scan mode', liveCapable: !mockMode, reason: mockMode ? 'SCAN_MOCK=1' : undefined },
    { sourceId: 'gbp', label: 'Google Business Profile', liveCapable: !mockMode && googleOk && dfsOk, reason: requiredReason('GBP') },
    { sourceId: 'gbp_posts', label: 'GBP posts', liveCapable: !mockMode && googleOk && dfsOk, reason: requiredReason('GBP posts') },
    { sourceId: 'moz', label: 'Moz domain metrics', liveCapable: !mockMode && mozOk, reason: optionalReason(mozOk, 'Moz') },
    { sourceId: 'moz_competitors', label: 'Moz competitor metrics', liveCapable: !mockMode && mozOk, reason: optionalReason(mozOk, 'Moz competitors') },
    { sourceId: 'trade_area', label: 'Trade area / gazetteer', liveCapable: !mockMode && googleOk, reason: mockMode ? 'SCAN_MOCK enabled' : !googleOk ? 'Requires GOOGLE_API_KEY' : optionalReason(censusOk, 'Census gazetteer') },
    { sourceId: 'serp', label: 'SERP map rankings', liveCapable: !mockMode && googleOk && dfsOk, reason: requiredReason('SERP') },
    { sourceId: 'local_finder', label: 'Local Finder rankings', liveCapable: !mockMode && googleOk && dfsOk, reason: requiredReason('Local Finder') },
    { sourceId: 'whois', label: 'WHOIS / domain age', liveCapable: !mockMode, reason: mockMode ? 'SCAN_MOCK enabled' : undefined },
    { sourceId: 'html', label: 'Homepage HTML', liveCapable: !mockMode, reason: mockMode ? 'SCAN_MOCK enabled' : undefined },
    { sourceId: 'content_depth', label: 'Content depth crawl', liveCapable: !mockMode, reason: mockMode ? 'SCAN_MOCK enabled' : undefined },
    { sourceId: 'pagespeed', label: 'PageSpeed Insights', liveCapable: !mockMode && googleOk, reason: mockMode ? 'SCAN_MOCK enabled' : !googleOk ? 'Requires GOOGLE_API_KEY' : undefined },
    { sourceId: 'psi_accessibility', label: 'PSI accessibility', liveCapable: !mockMode && googleOk, reason: mockMode ? 'SCAN_MOCK enabled' : !googleOk ? 'Requires GOOGLE_API_KEY' : undefined },
    { sourceId: 'competitor_agg', label: 'Competitor aggregation', liveCapable: !mockMode && googleOk && dfsOk, reason: requiredReason('Competitor aggregation') },
  ];

  return {
    mockMode,
    sources,
    readyForLive: !mockMode && googleOk && dfsOk,
  };
}
