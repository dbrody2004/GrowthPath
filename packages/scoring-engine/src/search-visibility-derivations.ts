import type { KeywordScore, LabsDataStub } from '@growthpath/shared';

export interface NearMissEntry {
  keyword: string;
  rank: number;
  volume?: number;
}

export interface VisibilityBuckets {
  kw3pack: Set<string>;
  kwCityVisible: Set<string>;
  nearMiss: NearMissEntry[];
}

export function deriveVisibilityBuckets(keywordScores: Record<string, KeywordScore>): VisibilityBuckets {
  const kw3pack = new Set<string>();
  const kwCityVisible = new Set<string>();
  const nearMiss: NearMissEntry[] = [];

  for (const [keyword, ks] of Object.entries(keywordScores)) {
    const mapsTop3 = ks.best_pos != null && ks.best_pos <= 3;
    const lfTop3 = ks.lf_best != null && ks.lf_best <= 3;
    if (mapsTop3 || lfTop3) {
      kw3pack.add(keyword);
    }

    if (ks.type === 'city' && (ks.best_pos != null || ks.lf_best != null)) {
      kwCityVisible.add(keyword);
    }

    const rank = ks.best_pos ?? ks.lf_best;
    if (rank != null && rank >= 4 && rank <= 10) {
      nearMiss.push({ keyword, rank });
    }
  }

  nearMiss.sort((a, b) => a.rank - b.rank || a.keyword.localeCompare(b.keyword));
  return { kw3pack, kwCityVisible, nearMiss };
}

export function mergeNearMissSources(
  serpNearMiss: NearMissEntry[],
  labsData: LabsDataStub | null | undefined,
): NearMissEntry[] {
  if (serpNearMiss.length > 0) {
    return serpNearMiss;
  }

  const labsEntries = (labsData?.near_miss_keywords ?? []) as NearMissEntry[];
  return [...labsEntries].sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0) || a.rank - b.rank);
}
