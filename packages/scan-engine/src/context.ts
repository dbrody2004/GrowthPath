import { createGoogleClient } from './clients/google.js';
import { createDataForSeoClient } from './clients/dataforseo.js';
import { createMozClient } from './clients/moz.js';
import { createCensusClient } from './clients/census.js';
import { createWhoisClient } from './services/whois.js';
import type { ScanCredentials } from './types.js';
import type { ScanEngineContext } from './types.js';

export function createScanContext(
  creds: ScanCredentials,
  overrides?: Partial<ScanEngineContext>,
): ScanEngineContext {
  const base: ScanEngineContext = {
    fetch: globalThis.fetch,
    google: createGoogleClient(creds.GOOGLE_API_KEY, globalThis.fetch),
    dataforseo: createDataForSeoClient(creds.DFS_LOGIN, creds.DFS_PASSWORD, globalThis.fetch),
    moz: createMozClient(creds.MOZ_API_KEY, globalThis.fetch),
    census: createCensusClient(creds.CENSUS_API_KEY, globalThis.fetch),
    whois: createWhoisClient(),
  };
  return { ...base, ...overrides };
}
