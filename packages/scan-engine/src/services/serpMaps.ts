import type { CompetitorEntry, KeywordEntry, SerpData, TradeArea } from '@growthpath/shared';
import pLimit from 'p-limit';
import { MAPS_DEPTH, MAX_SERP_WORKERS } from '../constants.js';
import type { ScanEngineContext } from '../types.js';
import { cleanDomain, zoomForOrigin } from '../utils/geo.js';

interface MapsItem {
  domain?: string;
  rank_group?: number;
  title?: string;
  name?: string;
  category?: string;
  rating?: { value?: number; votes_count?: number };
}

function parseMapsItems(
  items: MapsItem[],
  bizDomain: string,
): { pos: number | null; top3: CompetitorEntry[]; cost: number } {
  const cleanBiz = cleanDomain(bizDomain);
  let pos: number | null = null;
  const top3: CompetitorEntry[] = [];

  for (const item of items) {
    const itemDomain = cleanDomain(item.domain ?? '');
    const rank = item.rank_group ?? 99;
    const isClient =
      !!cleanBiz && (itemDomain === cleanBiz || itemDomain.endsWith('.' + cleanBiz));
    if (isClient && pos === null) {
      pos = rank;
    }
    const itemCat = (item.category ?? '').trim();
    const isStub = !itemDomain && !itemCat;
    if (top3.length < 3 && !isClient && !isStub) {
      top3.push({
        rank,
        title: item.title ?? item.name ?? '',
        domain: item.domain ?? '',
        rating: item.rating?.value ?? null,
        review_count: item.rating?.votes_count ?? null,
        category: itemCat,
      });
    }
  }
  return { pos, top3, cost: 0.002 };
}

export async function fetchSerpMaps(
  ctx: ScanEngineContext,
  keywords: KeywordEntry[],
  tradeArea: TradeArea,
  _bizName: string,
  bizDomain = '',
  maxWorkers = MAX_SERP_WORKERS,
): Promise<{ serp: SerpData; cost: number }> {
  const serp: SerpData = {};
  let totalCost = 0;
  const bizLat = tradeArea.biz_lat;
  const nmOrigins = tradeArea.near_me_origins.length
    ? tradeArea.near_me_origins
    : tradeArea.origins;
  const cityOrigins = tradeArea.city_origins;
  const limit = pLimit(maxWorkers);

  for (const kwDict of keywords) {
    const kw = kwDict.keyword;
    const origins = kwDict.type === 'near_me' ? nmOrigins : cityOrigins;
    serp[kw] = { service: kwDict.service, type: kwDict.type, origins: {} };
    if (!origins.length) continue;

    const tasks = origins.map((origin) =>
      limit(async () => {
        const zoom = origin.zoom_override ?? zoomForOrigin(origin.dist_mi, bizLat);
        const coord = `${origin.lat},${origin.lng},${zoom}`;
        const data = await ctx.dataforseo.postLive('serp/google/maps/live/advanced', [
          {
            keyword: kw,
            location_coordinate: coord,
            language_code: 'en',
            depth: MAPS_DEPTH,
          },
        ]);
        const cost = data.cost ?? 0.002;
        const task0 = data.tasks?.[0];
        const result = task0?.status_code === 20000
          ? (task0.result as Array<{ items?: MapsItem[] }> | undefined)?.[0]
          : undefined;
        const items = result?.items ?? [];
        const parsed = parseMapsItems(items, bizDomain);
        return { origin, parsed, zoom, cost };
      }),
    );

    const results = await Promise.all(tasks);
    for (const { origin, parsed, zoom, cost } of results) {
      totalCost += cost;
      serp[kw].origins[origin.zcta] = {
        name: origin.name,
        dist_mi: origin.dist_mi,
        pop: origin.pop,
        pos: parsed.pos,
        top3: parsed.top3,
        zoom,
      };
    }
  }

  return { serp, cost: totalCost };
}
