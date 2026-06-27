import type { CompetitorEntry, LocalFinderData, SerpKeywordData } from '@growthpath/shared';
import type { CompetitorLeaderboardEntry } from '@growthpath/shared';

export function extractPositions(kwData: SerpKeywordData): [number | null, number | null, boolean] {
  const origins = kwData.origins ?? {};
  if (Object.keys(origins).length === 0) {
    const legacy = kwData as SerpKeywordData & { maps_local_pos?: number | null };
    const pos = legacy.maps_local_pos ?? null;
    return [pos, pos, false];
  }

  const sortedOrigins = Object.values(origins).sort((a, b) => (a.dist_mi ?? 99) - (b.dist_mi ?? 99));
  const homePos = sortedOrigins[0]?.pos ?? null;
  const allPositions = sortedOrigins.map((o) => o.pos).filter((p): p is number => p !== null);
  const bestPos = allPositions.length > 0 ? Math.min(...allPositions) : null;
  const anyVisible = allPositions.length > 0;
  return [homePos, bestPos, anyVisible];
}

export function extractLfPositions(kwLfData: SerpKeywordData): [number | null, boolean, CompetitorEntry[]] {
  const origins = kwLfData.origins ?? {};
  if (Object.keys(origins).length === 0) {
    return [null, false, []];
  }

  const allPositions: number[] = [];
  const top20All: CompetitorEntry[] = [];
  const seenTitles = new Set<string>();

  for (const originData of Object.values(origins)) {
    const pos = originData.pos;
    if (pos !== null && pos !== undefined) {
      allPositions.push(pos);
    }
    for (const entry of originData.top20 ?? []) {
      const title = (entry.title ?? '').trim();
      if (title && !seenTitles.has(title)) {
        seenTitles.add(title);
        top20All.push(entry);
      }
    }
  }

  const lfBestPos = allPositions.length > 0 ? Math.min(...allPositions) : null;
  const lfAny = allPositions.length > 0;
  return [lfBestPos, lfAny, top20All];
}

export function scorePosition(pos: number | null | undefined, maxPts: number): number {
  if (pos === null || pos === undefined) return 0;
  if (pos <= 3) return maxPts;
  if (pos <= 6) return Math.round(maxPts * 0.6);
  if (pos <= 10) return Math.round(maxPts * 0.4);
  if (pos <= 20) return Math.round(maxPts * 0.2);
  return 0;
}

export function weightedOriginPts(
  originsDict: Record<string, { pos?: number | null; dist_mi?: number }>,
  maxPts: number,
): number {
  if (Object.keys(originsDict).length === 0) return 0;
  const origins = Object.values(originsDict);

  if (origins.some((o) => o.dist_mi === null || o.dist_mi === undefined)) {
    const scores = origins.map((o) => scorePosition(o.pos, maxPts));
    return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  }

  const weights = origins.map((o) => 1.0 / Math.max(o.dist_mi ?? 0.1, 0.1));
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const weightedSum = origins.reduce(
    (sum, o, i) => sum + scorePosition(o.pos, maxPts) * (weights[i] ?? 0),
    0,
  );
  return Math.round(weightedSum / totalWeight);
}

export function weightedLfOriginPts(kwLfData: SerpKeywordData, maxPts: number): number {
  return weightedOriginPts(kwLfData.origins ?? {}, maxPts);
}

export function buildCompetitorLeaderboard(localFinder: LocalFinderData, clientName?: string): CompetitorLeaderboardEntry[] {
  const tally = new Map<
    string,
    { appearances: number; positions: number[]; rating: number | null; review_count: number | null }
  >();

  const clientNameLower = clientName ? clientName.toLowerCase().trim() : '';

  for (const kwData of Object.values(localFinder)) {
    for (const originData of Object.values(kwData.origins ?? {})) {
      for (const entry of originData.top20 ?? []) {
        const title = (entry.title ?? '').trim();
        if (!title) continue;
        if (clientNameLower && title.toLowerCase().trim() === clientNameLower) continue;

        let data = tally.get(title);
        if (!data) {
          data = { appearances: 0, positions: [], rating: null, review_count: null };
          tally.set(title, data);
        }
        data.appearances += 1;
        if (entry.rank !== null && entry.rank !== undefined) {
          data.positions.push(entry.rank);
        }
        if (data.rating === null && entry.rating !== null && entry.rating !== undefined) {
          data.rating = entry.rating;
        }
        if (data.review_count === null && entry.review_count !== null && entry.review_count !== undefined) {
          data.review_count = entry.review_count;
        }
      }
    }
  }

  const leaderboard: CompetitorLeaderboardEntry[] = [];
  for (const [title, data] of tally.entries()) {
    const avgPos =
      data.positions.length > 0
        ? Math.round((data.positions.reduce((a, b) => a + b, 0) / data.positions.length) * 10) / 10
        : 0;
    leaderboard.push({
      name: title,
      domain: '',
      appearances: data.appearances,
      avg_rank: avgPos,
      rating: data.rating,
      review_count: data.review_count,
    });
  }

  leaderboard.sort((a, b) => {
    if (b.appearances !== a.appearances) return b.appearances - a.appearances;
    return (a.avg_rank || 99) - (b.avg_rank || 99);
  });

  return leaderboard.slice(0, 10);
}
