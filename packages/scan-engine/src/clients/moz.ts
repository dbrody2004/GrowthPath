import type { MozClientMetrics } from '@growthpath/shared';
import pLimit from 'p-limit';

export interface MozClient {
  fetchMetrics(domain: string, index: number): Promise<MozClientMetrics>;
  fetchBulk(domains: string[]): Promise<MozClientMetrics[]>;
}

/** Resolve Moz auth headers for dashboard tokens vs legacy access_id:secret credentials. */
export function resolveMozAuthHeaders(apiKey: string): Record<string, string> {
  const trimmed = apiKey.trim();
  if (!trimmed) return {};

  // Legacy: MOZ_API_KEY is base64(access_id:secret) from moz.com/api/dashboard.
  // Moz JSON-RPC expects the blob as x-moz-token, not Basic auth.
  try {
    const decoded = Buffer.from(trimmed, 'base64').toString('utf8');
    if (/^[^\s:]+:[^\s]+$/.test(decoded)) {
      return { 'x-moz-token': trimmed };
    }
  } catch {
    // not base64 — fall through
  }

  // Legacy: raw access_id:secret pasted without encoding.
  if (/^[^\s:]+:[^\s]+$/.test(trimmed)) {
    return { 'x-moz-token': Buffer.from(trimmed).toString('base64') };
  }

  // Modern Moz API dashboard token.
  return { 'x-moz-token': trimmed };
}

export function createMozClient(apiKey: string, fetchFn: typeof fetch = fetch): MozClient {
  const limit = pLimit(6);
  const authHeaders = resolveMozAuthHeaders(apiKey);

  async function fetchOne(domain: string, index: number): Promise<MozClientMetrics> {
    if (!apiKey) {
      return { domain, da: null, referring_domains: null };
    }
    try {
      const r = await fetchFn('https://api.moz.com/jsonrpc', {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: `growthpath-${String(index).padStart(24, '0')}`,
          method: 'data.site.metrics.fetch',
          params: { data: { site_query: { query: domain, scope: 'domain' } } },
        }),
      });
      const data = (await r.json()) as {
        error?: { message?: string; code?: number; data?: { issue?: string } };
        result?: {
          site_metrics?: {
            domain_authority?: number;
            root_domains_to_root_domain?: number;
            external_pages_to_root_domain?: number;
            spam_score?: number;
          };
        };
      };
      if (data.error) {
        const issue = data.error.data?.issue ?? '';
        console.warn(
          `Moz API error for ${domain}: ${data.error.message ?? data.error.code}${issue ? ` (${issue})` : ''}`,
        );
        return { domain, da: null, referring_domains: null };
      }
      const result = data.result?.site_metrics ?? {};
      return {
        domain,
        da: result.domain_authority ?? null,
        referring_domains: result.root_domains_to_root_domain ?? null,
        external_pages: result.external_pages_to_root_domain ?? null,
        spam_score: result.spam_score ?? null,
      };
    } catch {
      return { domain, da: null, referring_domains: null };
    }
  }

  return {
    fetchMetrics: fetchOne,
    async fetchBulk(domains: string[]): Promise<MozClientMetrics[]> {
      if (!domains.length) return [];
      return Promise.all(domains.map((d, i) => limit(() => fetchOne(d, i))));
    },
  };
}
