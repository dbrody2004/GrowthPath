import type { KeywordEntry, KeywordType, LocalFinderData, SerpData } from '@growthpath/shared';

export type RankBand = 'top3' | 'lf' | 'deep' | 'none';
export type SurfaceFilter = 'maps' | 'lf' | 'both';

export const RANK_COLORS = {
  top3: '#4ade80',
  lf: '#f59e0b',
  deep: '#f87171',
  none: '#94a3b8',
} as const;

export interface OriginRow {
  key: string;
  name: string;
  distMi: number;
  pop: number;
  mapsPos: number | null;
  lfPos: number | null;
}

export interface KeywordStats {
  top3Appearances: number;
  avgRank: number | null;
  notRanked: number;
  total: number;
}

export function rankBand(pos: number | null | undefined): RankBand {
  if (pos == null || pos > 20) return 'none';
  if (pos <= 3) return 'top3';
  if (pos <= 10) return 'lf';
  return 'deep';
}

export function rankColor(pos: number | null | undefined): string {
  return RANK_COLORS[rankBand(pos)];
}

export function formatRank(pos: number | null | undefined): string {
  if (pos == null || pos > 20) return 'Not ranked';
  return `#${pos}`;
}

export function servicesFromKeywords(keywords: KeywordEntry[]): string[] {
  const seen = new Set<string>();
  const services: string[] = [];
  for (const entry of keywords) {
    if (!seen.has(entry.service)) {
      seen.add(entry.service);
      services.push(entry.service);
    }
  }
  return services;
}

export function keywordFor(
  keywords: KeywordEntry[],
  service: string,
  type: KeywordType,
): string | null {
  const match = keywords.find((entry) => entry.service === service && entry.type === type);
  return match?.keyword ?? null;
}

export function originRows(
  serp: SerpData,
  localFinder: LocalFinderData,
  keyword: string,
): OriginRow[] {
  const serpOrigins = serp[keyword]?.origins ?? {};
  const lfOrigins = localFinder[keyword]?.origins ?? {};
  const keys = new Set([...Object.keys(serpOrigins), ...Object.keys(lfOrigins)]);

  const rows: OriginRow[] = [];
  for (const key of keys) {
    const maps = serpOrigins[key];
    const lf = lfOrigins[key];
    rows.push({
      key,
      name: maps?.name ?? lf?.name ?? key,
      distMi: maps?.dist_mi ?? lf?.dist_mi ?? 0,
      pop: maps?.pop ?? lf?.pop ?? 0,
      mapsPos: maps?.pos ?? null,
      lfPos: lf?.pos ?? null,
    });
  }

  return rows.sort((a, b) => a.distMi - b.distMi);
}

export function keywordStats(rows: OriginRow[], surface: SurfaceFilter = 'both'): KeywordStats {
  const positions: number[] = [];
  let top3Appearances = 0;
  let notRanked = 0;

  for (const row of rows) {
    const positionsToCheck: Array<number | null> = [];
    if (surface === 'maps' || surface === 'both') positionsToCheck.push(row.mapsPos);
    if (surface === 'lf' || surface === 'both') positionsToCheck.push(row.lfPos);

    for (const pos of positionsToCheck) {
      if (pos == null || pos > 20) {
        notRanked += 1;
      } else {
        positions.push(pos);
        if (pos <= 3) top3Appearances += 1;
      }
    }
  }

  const total = positions.length + notRanked;
  const avgRank =
    positions.length > 0
      ? Math.round((positions.reduce((sum, p) => sum + p, 0) / positions.length) * 10) / 10
      : null;

  return { top3Appearances, avgRank, notRanked, total };
}

export function proximityWall(rows: OriginRow[], surface: SurfaceFilter = 'both'): number | null {
  const sorted = [...rows].sort((a, b) => a.distMi - b.distMi);
  let lastRankedDist: number | null = null;

  for (const row of sorted) {
    const positions: Array<number | null> = [];
    if (surface === 'maps' || surface === 'both') positions.push(row.mapsPos);
    if (surface === 'lf' || surface === 'both') positions.push(row.lfPos);

    const ranked = positions.some((pos) => pos != null && pos <= 20);
    if (ranked) {
      lastRankedDist = row.distMi;
    } else if (lastRankedDist != null) {
      return row.distMi;
    }
  }

  return null;
}

export function bestPosition(positions: Array<number | null>): number | null {
  const valid = positions.filter((p): p is number => p != null && p <= 20);
  if (valid.length === 0) return null;
  return Math.min(...valid);
}

export function flattenCompetitorAgg(
  competitorAgg: Record<string, { domain: string; name: string; appearances: number; avg_rank: number; vis_score: number; category: string; rating: number | null; review_count: number | null }[]> | undefined,
): Array<{
  domain: string;
  name: string;
  appearances: number;
  avgRank: number;
  visScore: number;
  category: string;
  rating: number | null;
  reviewCount: number | null;
}> {
  if (!competitorAgg) return [];

  const byDomain = new Map<
    string,
    {
      domain: string;
      name: string;
      appearances: number;
      avgRank: number;
      visScore: number;
      category: string;
      rating: number | null;
      reviewCount: number | null;
    }
  >();

  for (const entries of Object.values(competitorAgg)) {
    for (const entry of entries) {
      const existing = byDomain.get(entry.domain);
      if (!existing || entry.appearances > existing.appearances) {
        byDomain.set(entry.domain, {
          domain: entry.domain,
          name: entry.name,
          appearances: entry.appearances,
          avgRank: entry.avg_rank,
          visScore: entry.vis_score,
          category: entry.category,
          rating: entry.rating,
          reviewCount: entry.review_count,
        });
      }
    }
  }

  return [...byDomain.values()].sort((a, b) => b.visScore - a.visScore || a.avgRank - b.avgRank);
}
