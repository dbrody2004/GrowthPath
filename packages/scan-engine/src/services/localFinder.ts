import type { CompetitorEntry, KeywordEntry, LocalFinderData, TradeArea } from '@growthpath/shared';
import pLimit from 'p-limit';
import { LF_DEPTH, MAX_SERP_WORKERS } from '../constants.js';
import type { ScanEngineContext } from '../types.js';
import { cleanDomain, zoomForOrigin } from '../utils/geo.js';

const LF_GENERIC = new Set([
  'restaurant',
  'bar',
  'grill',
  'cafe',
  'the',
  'and',
  'kitchen',
  'steakhouse',
  'steak',
  'house',
  'prime',
  'pub',
  'grille',
  'of',
  'at',
  'in',
  'a',
  'an',
]);

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
}

function compactAlnum(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function lfMatchClient(
  item: Record<string, unknown>,
  bizAddressStreet: string,
  bizName: string,
  bizDomain: string,
): boolean {
  const desc = String(item.description ?? '');
  const lfAddr = desc.split('\n')[0]?.trim() ?? '';
  if (lfAddr && bizAddressStreet) {
    const lfTokens = new Set(norm(lfAddr).split(' '));
    const gbpTokens = new Set(norm(bizAddressStreet).split(' '));
    if (lfTokens.size && gbpTokens.size) {
      const overlap = [...lfTokens].filter((t) => gbpTokens.has(t));
      const ratio = overlap.length / Math.max(lfTokens.size, gbpTokens.size);
      if (ratio >= 0.8) return true;
    }
  }
  const itemDomain = cleanDomain(String(item.domain ?? ''));
  const cleanDom = cleanDomain(bizDomain);
  if (cleanDom && itemDomain && (itemDomain === cleanDom || itemDomain.endsWith('.' + cleanDom)))
    return true;

  const lfTitle = String(item.title ?? item.name ?? '');
  const lfCompact = compactAlnum(lfTitle);
  const bizCompact = compactAlnum(bizName);
  const domainRoot = compactAlnum(cleanDom.split('.')[0] ?? cleanDom);
  if (
    lfCompact &&
    (lfCompact === bizCompact ||
      lfCompact === domainRoot ||
      (domainRoot.length >= 4 && lfCompact.includes(domainRoot)))
  ) {
    return true;
  }

  const lfTitleLower = lfTitle.toLowerCase();
  const lfTokens = new Set(lfTitleLower.split(' ').filter((t) => !LF_GENERIC.has(t)));
  const bizTokens = new Set(bizName.toLowerCase().split(' ').filter((t) => !LF_GENERIC.has(t)));
  if (lfTokens.size && bizTokens.size) {
    const overlap = [...lfTokens].filter((t) => bizTokens.has(t));
    const ratio = overlap.length / Math.max(lfTokens.size, bizTokens.size);
    if (ratio >= 0.5 && overlap.length) return true;
  }
  return false;
}

interface LfItem {
  rank_group?: number;
  rank_absolute?: number;
  title?: string;
  name?: string;
  domain?: string;
  category?: string;
  description?: string;
  rating?: { value?: number; votes_count?: number };
}

function parseLfItems(
  items: LfItem[],
  bizAddressStreet: string,
  bizName: string,
  bizDomain: string,
): { pos: number | null; top3: CompetitorEntry[]; top20: CompetitorEntry[] } {
  let pos: number | null = null;
  const top3: CompetitorEntry[] = [];
  const top20: CompetitorEntry[] = [];

  for (const item of items) {
    const rank = item.rank_group ?? item.rank_absolute ?? 99;
    const isClient = lfMatchClient(item as Record<string, unknown>, bizAddressStreet, bizName, bizDomain);
    if (isClient && pos === null) pos = rank;

    if (!isClient && top20.length < 20) {
      const ratingObj = item.rating ?? {};
      top20.push({
        rank,
        title: item.title ?? item.name ?? '',
        domain: item.domain ?? '',
        rating: ratingObj.value ?? null,
        review_count: ratingObj.votes_count ?? null,
      });
    }

    const itemCat = (item.category ?? '').trim();
    const itemDom = cleanDomain(item.domain ?? '');
    const isStub = !itemDom && !itemCat;
    if (top3.length < 3 && !isClient && !isStub) {
      const ratingObj = item.rating ?? {};
      top3.push({
        rank,
        title: item.title ?? item.name ?? '',
        domain: item.domain ?? '',
        rating: ratingObj.value ?? null,
        review_count: ratingObj.votes_count ?? null,
        category: itemCat,
      });
    }
  }
  return { pos, top3, top20 };
}

export async function fetchLocalFinder(
  ctx: ScanEngineContext,
  keywords: KeywordEntry[],
  tradeArea: TradeArea,
  bizName: string,
  bizDomain = '',
  bizAddressStreet = '',
  maxWorkers = MAX_SERP_WORKERS,
): Promise<{ localFinder: LocalFinderData; cost: number }> {
  const localFinder: LocalFinderData = {};
  let totalCost = 0;
  const nmOrigins = tradeArea.near_me_origins.length ? tradeArea.near_me_origins : tradeArea.origins;
  const cityOrigins = tradeArea.city_origins;
  const limit = pLimit(maxWorkers);

  for (const kwDict of keywords) {
    const kw = kwDict.keyword;
    const origins = kwDict.type === 'near_me' ? nmOrigins : cityOrigins;
    localFinder[kw] = { service: kwDict.service, type: kwDict.type, origins: {} };
    if (!origins.length) continue;

    const tasks = origins.map((origin) =>
      limit(async () => {
        const zoom = origin.zoom_override ?? zoomForOrigin(origin.dist_mi, tradeArea.biz_lat);
        const coord = `${origin.lat},${origin.lng},${zoom}`;
        const data = await ctx.dataforseo.postLive('serp/google/local_finder/live/advanced', [
          {
            keyword: kw,
            location_coordinate: coord,
            language_code: 'en',
            depth: LF_DEPTH,
          },
        ]);
        const cost = data.cost ?? 0.002;
        const task0 = data.tasks?.[0];
        const result = task0?.status_code === 20000
          ? (task0.result as Array<{ items?: LfItem[] }> | undefined)?.[0]
          : undefined;
        const items = result?.items ?? [];
        const parsed = parseLfItems(items, bizAddressStreet, bizName, bizDomain);
        return { origin, parsed, zoom, cost };
      }),
    );

    const results = await Promise.all(tasks);
    for (const { origin, parsed, zoom, cost } of results) {
      totalCost += cost;
      localFinder[kw].origins[origin.zcta] = {
        name: origin.name,
        dist_mi: origin.dist_mi,
        pop: origin.pop,
        pos: parsed.pos,
        top20: parsed.top20,
        top3: parsed.top3,
        zoom,
      };
    }
  }

  return { localFinder, cost: totalCost };
}
