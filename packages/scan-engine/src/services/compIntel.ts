import type {
  CompetitorAggEntry,
  LocalFinderData,
  SerpData,
  TradeArea,
} from '@growthpath/shared';
import { TOP_N_COMPETITORS } from '../constants.js';
import { cleanDomain } from '../utils/geo.js';

function rankPoints(pos: number | null): number {
  if (pos == null) return 0;
  if (pos === 1) return 10;
  if (pos === 2) return 8;
  if (pos === 3) return 7;
  if (pos === 4) return 6;
  if (pos === 5) return 5;
  if (pos === 6) return 4;
  if (pos === 7) return 3;
  if (pos <= 10) return 2;
  if (pos <= 20) return 1;
  return 0;
}

export function visibilityScore(
  ranksList: Array<number | null>,
  nOrigins: number,
  nSurfaces = 2,
): number {
  const maxPts = nOrigins * nSurfaces * 10;
  if (maxPts === 0) return 0;
  const earned = ranksList.reduce<number>((sum, r) => sum + rankPoints(r), 0);
  return Math.round((earned / maxPts) * 1000) / 10;
}

interface DomainAgg {
  name: string;
  ranks: number[];
  maps_ranks: number[];
  lf_ranks: number[];
  maps_count: number;
  lf_count: number;
  url: string;
  category: string;
  rating: number | null;
  review_count: number | null;
}

export function aggregateCompetitors(
  mapsResults: SerpData,
  lfResults: LocalFinderData,
  originsData: TradeArea,
  bizDomain = '',
): { agg: Record<string, CompetitorAggEntry[]>; aggFull: Record<string, CompetitorAggEntry[]> } {
  const cleanBiz = cleanDomain(bizDomain);
  const nmOrigins =
    originsData.near_me_origins.length > 0
      ? originsData.near_me_origins
      : originsData.origins;
  const cityOrigins = originsData.city_origins;
  const allKws = new Set([...Object.keys(mapsResults), ...Object.keys(lfResults)]);
  const agg: Record<string, CompetitorAggEntry[]> = {};
  const aggFull: Record<string, CompetitorAggEntry[]> = {};

  for (const kw of allKws) {
    const kwType = mapsResults[kw]?.type ?? lfResults[kw]?.type ?? 'near_me';
    const nOrigins = kwType === 'near_me' ? nmOrigins.length : cityOrigins.length;
    const domainData: Record<string, DomainAgg> = {};

    const tally = (source: SerpData | LocalFinderData, countKey: 'maps_count' | 'lf_count') => {
      const kwData = source[kw];
      if (!kwData) return;
      for (const od of Object.values(kwData.origins)) {
        for (const item of od.top20 ?? od.top3 ?? []) {
          const dom = cleanDomain(item.domain ?? '');
          const key = dom || (item.title ?? '').trim().toLowerCase();
          if (!key) continue;
          if (dom && cleanBiz && (dom === cleanBiz || dom.endsWith('.' + cleanBiz) || cleanBiz.endsWith('.' + dom))) continue;
          if (!domainData[key]) {
            domainData[key] = {
              name: item.title ?? '',
              ranks: [],
              maps_ranks: [],
              lf_ranks: [],
              maps_count: 0,
              lf_count: 0,
              url: '',
              category: item.category ?? '',
              rating: item.rating ?? null,
              review_count: item.review_count ?? null,
            };
          }
          const rank = item.rank ?? 99;
          domainData[key].ranks.push(rank);
          if (countKey === 'maps_count') domainData[key].maps_ranks.push(rank);
          else domainData[key].lf_ranks.push(rank);
          domainData[key][countKey] += 1;
          if (item.title && !domainData[key].name) domainData[key].name = item.title;
          if (item.category && !domainData[key].category) domainData[key].category = item.category;
          if (item.rating != null && domainData[key].rating == null)
            domainData[key].rating = item.rating;
          if (item.review_count != null && domainData[key].review_count == null)
            domainData[key].review_count = item.review_count;
        }
      }
    };

    tally(mapsResults, 'maps_count');
    tally(lfResults, 'lf_count');

    const ranked: CompetitorAggEntry[] = [];
    for (const [dom, d] of Object.entries(domainData)) {
      const apps = d.maps_count + d.lf_count;
      const avgRank = d.ranks.length
        ? Math.round((d.ranks.reduce((a, b) => a + b, 0) / d.ranks.length) * 10) / 10
        : 99;

      const mapsSlotRanks: Array<number | null> = [];
      for (const zctaOd of Object.values(mapsResults[kw]?.origins ?? {})) {
        const found = (zctaOd.top20 ?? zctaOd.top3)?.find((i) => {
          const iDom = cleanDomain(i.domain ?? '');
          const iKey = iDom || (i.title ?? '').trim().toLowerCase();
          return iKey === dom;
        });
        mapsSlotRanks.push(found?.rank ?? null);
      }
      const lfSlotRanks: Array<number | null> = [];
      for (const zctaOd of Object.values(lfResults[kw]?.origins ?? {})) {
        const found = (zctaOd.top20 ?? zctaOd.top3)?.find((i) => {
          const iDom = cleanDomain(i.domain ?? '');
          const iKey = iDom || (i.title ?? '').trim().toLowerCase();
          return iKey === dom;
        });
        lfSlotRanks.push(found?.rank ?? null);
      }

      const vis = visibilityScore([...mapsSlotRanks, ...lfSlotRanks], nOrigins);
      ranked.push({
        domain: dom,
        name: d.name,
        appearances: apps,
        maps_appearances: d.maps_count,
        lf_appearances: d.lf_count,
        avg_rank: avgRank,
        vis_score: vis,
        category: d.category,
        rating: d.rating,
        review_count: d.review_count,
      });
    }

    ranked.sort((a, b) => b.vis_score - a.vis_score || b.appearances - a.appearances || a.avg_rank - b.avg_rank);
    agg[kw] = ranked.slice(0, TOP_N_COMPETITORS);
    aggFull[kw] = ranked;
  }

  return { agg, aggFull };
}
