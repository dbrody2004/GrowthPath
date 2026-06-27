import type { Finding, KeywordEntry, KeywordScore, LocalFinderData, SerpData } from '@growthpath/shared';
import type { CompetitorLeaderboardEntry } from '@growthpath/shared';
import {
  buildCompetitorLeaderboard,
  extractLfPositions,
  extractPositions,
  scorePosition,
  weightedLfOriginPts,
  weightedOriginPts,
} from './search-visibility-helpers.js';
import { deriveVisibilityBuckets, type NearMissEntry } from './search-visibility-derivations.js';

export interface SearchVisibilityResult {
  categoryScore: number;
  scenario: string;
  kw3pack: Set<string>;
  kwCityVisible: Set<string>;
  kwLocalVisible: Set<string>;
  kwInvisible: Set<string>;
  findings: Finding[];
  keywordScores: Record<string, KeywordScore>;
  unexpected3pack: unknown[];
  nearMiss: NearMissEntry[];
  competitorLeaderboard: CompetitorLeaderboardEntry[];
  localReach: number;
  regionalReach: number;
  diagnosis: string;
  nearMeScore: number;
  cityScore: number;
}

export function scoreSearchVisibility(
  serp: SerpData,
  localFinder: LocalFinderData,
  _vertical = 'service',
  keywords: KeywordEntry[] | null = null,
  clientName?: string,
): SearchVisibilityResult {
  const keywordScores: Record<string, KeywordScore> = {};
  const kwLocalVisible = new Set<string>();
  const kwInvisible = new Set<string>();

  const MAPS_MAX = 50;
  const LF_MAX = 50;

  const kwTypes: Record<string, string> = {};
  const kwServices: Record<string, string> = {};
  if (keywords) {
    for (const kwDict of keywords) {
      kwTypes[kwDict.keyword] = kwDict.type ?? 'unknown';
      kwServices[kwDict.keyword] = kwDict.service ?? '';
    }
  }

  const nearMeTotals: number[] = [];
  const cityTotals: number[] = [];

  for (const [kw, data] of Object.entries(serp)) {
    const [homePos, bestPos, mapsAny] = extractPositions(data);
    const lfData = localFinder[kw] ?? { service: '', type: 'unknown', origins: {} };
    const [lfBest, lfAny] = extractLfPositions(lfData);

    const kwType = kwTypes[kw] ?? 'unknown';
    let mapsPts = 0;
    let lfPts = 0;

    if (kwType === 'city') {
      const originsDict = data.origins ?? {};
      if (Object.keys(originsDict).length > 0) {
        const originsList = Object.values(originsDict);
        const mapsScores = originsList.map((o) => scorePosition(o.pos, MAPS_MAX));
        mapsPts = mapsScores.length > 0 ? Math.round(mapsScores.reduce((a, b) => a + b, 0) / mapsScores.length) : 0;
      } else {
        mapsPts = weightedOriginPts(data.origins ?? {}, MAPS_MAX);
      }

      const lfOrigins = lfData.origins ?? {};
      if (Object.keys(lfOrigins).length > 0) {
        const lfList = Object.values(lfOrigins);
        const lfScores = lfList.map((o) => scorePosition(o.pos, LF_MAX));
        lfPts = lfScores.length > 0 ? Math.round(lfScores.reduce((a, b) => a + b, 0) / lfScores.length) : 0;
      } else {
        lfPts = weightedLfOriginPts(lfData, LF_MAX);
      }
    } else {
      const originsDict = data.origins ?? {};
      if (Object.keys(originsDict).length > 0) {
        const originsList = Object.values(originsDict);
        const mapsScores = originsList.map((o) => scorePosition(o.pos, MAPS_MAX));
        mapsPts = mapsScores.length > 0 ? Math.round(mapsScores.reduce((a, b) => a + b, 0) / mapsScores.length) : 0;
      }

      const lfOrigins = lfData.origins ?? {};
      if (Object.keys(lfOrigins).length > 0) {
        const lfList = Object.values(lfOrigins);
        const lfScores = lfList.map((o) => scorePosition(o.pos, LF_MAX));
        lfPts = lfScores.length > 0 ? Math.round(lfScores.reduce((a, b) => a + b, 0) / lfScores.length) : 0;
      }
    }

    const total = Math.min(100, mapsPts + lfPts);

    keywordScores[kw] = {
      home_pos: homePos,
      best_pos: bestPos,
      maps_pts: mapsPts,
      lf_best: lfBest,
      lf_pts: lfPts,
      total,
      type: kwType,
      service: kwServices[kw],
    };

    if (mapsAny || lfAny) {
      kwLocalVisible.add(kw);
    } else {
      kwInvisible.add(kw);
    }

    if (kwType === 'city') {
      cityTotals.push(total);
    } else if (kwType === 'near_me') {
      nearMeTotals.push(total);
    } else {
      // unknown type: dual-bucket (matches Python scoring engine behaviour)
      nearMeTotals.push(total);
      cityTotals.push(total);
    }
  }

  const localReach = nearMeTotals.length > 0 ? Math.round(nearMeTotals.reduce((a, b) => a + b, 0) / nearMeTotals.length) : 0;
  const regionalReach = cityTotals.length > 0 ? Math.round(cityTotals.reduce((a, b) => a + b, 0) / cityTotals.length) : 0;

  let nearMeScore = 0;
  if (nearMeTotals.length > 0) {
    const nmPeak = Math.max(...nearMeTotals);
    const nmBreadth = Math.round(nearMeTotals.reduce((a, b) => a + b, 0) / nearMeTotals.length);
    nearMeScore = Math.round(nmPeak * 0.7 + nmBreadth * 0.3);
  }

  let cityScoreVal = 0;
  if (cityTotals.length > 0) {
    const cityPeak = Math.max(...cityTotals);
    const cityBreadth = Math.round(cityTotals.reduce((a, b) => a + b, 0) / cityTotals.length);
    cityScoreVal = Math.round(cityPeak * 0.7 + cityBreadth * 0.3);
  }

  const categoryScore =
    nearMeTotals.length > 0 || cityTotals.length > 0
      ? Math.round(nearMeScore * 0.65 + cityScoreVal * 0.35)
      : 0;

  const gap = localReach - regionalReach;
  let diagnosis: string;
  if (gap > 20) diagnosis = 'Near me dominant — strong proximity, weak regional reach';
  else if (gap > 10) diagnosis = 'Near me stronger — local visibility leads regional';
  else if (gap < -10) diagnosis = 'City modifier dominant — regional authority exceeds local';
  else if (gap < 0) diagnosis = 'City modifier slightly stronger — regional signals healthy';
  else diagnosis = 'Balanced local and regional reach';

  const scenario = kwLocalVisible.size > 0 ? 'A' : 'C';
  const competitorLeaderboard = buildCompetitorLeaderboard(localFinder, clientName);

  const findings: Finding[] = [];
  const visibleCount = kwLocalVisible.size;
  const totalKw = Object.keys(serp).length;

  if (visibleCount === 0) {
    findings.push({
      text: 'No Maps or Local Finder visibility detected for any owner-stated keyword. Category recognition gap — Google is not associating this business with these search terms.',
      severity: 'critical',
    });
  } else if (visibleCount < totalKw) {
    const invisibleList = [...kwInvisible].slice(0, 3).join(', ');
    findings.push({
      text: `Visible on ${visibleCount} of ${totalKw} keywords. Zero visibility for: ${invisibleList}.`,
      severity: 'warning',
    });
  } else {
    findings.push({
      text: `Maps or Local Finder visibility confirmed on all ${totalKw} scanned keywords.`,
      severity: 'good',
    });
  }

  findings.push({
    text: `Local Reach (near me avg): ${localReach}/100 — Regional Reach (city avg): ${regionalReach}/100. ${diagnosis}.`,
    severity:
      localReach >= 50 && regionalReach >= 50 ? 'good' : localReach >= 25 || regionalReach >= 25 ? 'warning' : 'critical',
  });

  if (nearMeTotals.length > 0) {
    const nearMeKws = Object.entries(keywordScores).filter(([, ks]) => ks.type === 'near_me');
    if (nearMeKws.length > 0) {
      const bestNmKw = nearMeKws.reduce((best, [kw, ks]) => (ks.total > best[1].total ? [kw, ks] : best))[0];
      if (keywordScores[bestNmKw]?.total > 0) {
        findings.push({
          text: `Strongest near me keyword: '${bestNmKw}' (score ${keywordScores[bestNmKw].total}/100) — this keyword drives your near me score.`,
          severity: keywordScores[bestNmKw].total >= 50 ? 'good' : 'warning',
        });
      }
    }
  }

  if (cityTotals.length > 0) {
    const cityKws = Object.entries(keywordScores).filter(([, ks]) => ks.type === 'city');
    if (cityKws.length > 0) {
      const bestCityKw = cityKws.reduce((best, [kw, ks]) => (ks.total > best[1].total ? [kw, ks] : best))[0];
      if (keywordScores[bestCityKw]?.total > 0) {
        findings.push({
          text: `Strongest city keyword: '${bestCityKw}' (score ${keywordScores[bestCityKw].total}/100) — this keyword drives your regional reach score.`,
          severity: keywordScores[bestCityKw].total >= 50 ? 'good' : 'warning',
        });
      }
    }
  }

  for (const [kw, ks] of Object.entries(keywordScores)) {
    if (ks.best_pos !== null && ks.lf_best === null) {
      findings.push({
        text: `'${kw}': ranked #${ks.best_pos} in Maps but absent from Local Finder top 20. May indicate thin category signal in Google Search index.`,
        severity: 'warning',
      });
    } else if (ks.lf_best !== null && ks.best_pos === null) {
      findings.push({
        text: `'${kw}': ranked #${ks.lf_best} in Local Finder but absent from Maps. Unusual — Local Finder presence without Maps presence.`,
        severity: 'warning',
      });
    }
  }

  const { kw3pack, kwCityVisible, nearMiss } = deriveVisibilityBuckets(keywordScores);

  return {
    categoryScore,
    scenario,
    kw3pack,
    kwCityVisible,
    kwLocalVisible,
    kwInvisible,
    findings,
    keywordScores,
    unexpected3pack: [],
    nearMiss,
    competitorLeaderboard,
    localReach,
    regionalReach,
    diagnosis,
    nearMeScore,
    cityScore: cityScoreVal,
  };
}
