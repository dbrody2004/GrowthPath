import type { ScanCredentials as ConfigScanCredentials } from '@growthpath/config';
import type { GoogleClient } from './clients/google.js';
import type { DataForSeoClient } from './clients/dataforseo.js';
import type { MozClient } from './clients/moz.js';
import type { CensusClient } from './clients/census.js';
import type { WhoisClient } from './services/whois.js';

export type ScanCredentials = ConfigScanCredentials;

export interface ScanEngineContext {
  fetch: typeof fetch;
  google: GoogleClient;
  dataforseo: DataForSeoClient;
  moz: MozClient;
  census: CensusClient;
  whois: WhoisClient;
}

export interface ScanEngineOptions {
  /** Return kitchen747 fixture audit data without API calls */
  mock?: boolean;
  /** Pre-loaded gazetteer records (skips download) */
  gazetteer?: GazetteerRecord[];
  /** Injectable client overrides for tests */
  context?: Partial<ScanEngineContext>;
  /** Prior audit to merge when retrying selected sources */
  priorAudit?: import('@growthpath/shared').AuditData;
  /** When set, only re-collect these sources (plus dependent aggregates) */
  sourcesToRetry?: import('@growthpath/shared').CollectionSourceId[];
}

export interface GazetteerRecord {
  zcta: string;
  lat: number;
  lng: number;
}

export interface TradeAreaTierConfig {
  near_me_cap: number;
  city_target: number;
  city_bands: [number, number][];
  max_mi: number;
}
