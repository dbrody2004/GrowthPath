import type { MozData, SerpData } from '@growthpath/shared';
import { AGGREGATOR_DOMAIN_ROOTS } from '../constants.js';
import type { ScanEngineContext } from '../types.js';
import { cleanDomain } from '../utils/geo.js';

export function isAggregatorDomain(domain: string): boolean {
  const clean = cleanDomain(domain);
  return AGGREGATOR_DOMAIN_ROOTS.some((root) => clean === root || clean.endsWith(`.${root}`));
}

export async function fetchMoz(
  ctx: ScanEngineContext,
  url: string,
  competitorDomains: string[] = [],
): Promise<MozData> {
  const clientDomain = url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  const client = await ctx.moz.fetchMetrics(clientDomain, 0);
  const competitors = competitorDomains.length
    ? await ctx.moz.fetchBulk(competitorDomains)
    : [];
  return { client, competitors };
}

export async function enrichCompetitors(
  ctx: ScanEngineContext,
  url: string,
  serp: SerpData,
  bizDomain: string,
): Promise<MozData> {
  const seen = new Set<string>();
  const compDomains: string[] = [];
  const cleanBiz = cleanDomain(bizDomain);

  for (const kwData of Object.values(serp)) {
    for (const od of Object.values(kwData.origins)) {
      for (const item of od.top3 ?? []) {
        const itemD = cleanDomain(item.domain ?? '');
        if (
          itemD &&
          !seen.has(itemD) &&
          !(itemD === cleanBiz || itemD.endsWith('.' + cleanBiz)) &&
          !isAggregatorDomain(itemD)
        ) {
          seen.add(itemD);
          compDomains.push(itemD);
        }
      }
    }
  }

  const moz = await fetchMoz(ctx, url, []);
  if (!compDomains.length) {
    return moz;
  }

  const compMetrics = await ctx.moz.fetchBulk(compDomains);
  moz.competitors = compMetrics;
  return moz;
}
