import type { AuditData, KeywordType, Origin, RankMapPresentation, SerpKeywordData } from '@growthpath/shared';
import { keywordFor, rankBand, RANK_COLORS, type SurfaceFilter } from './rankmap.js';

export type GeoKeywordType = KeywordType | 'both';

export interface GeoPoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
  dist: number;
  type: 'near_me' | 'city';
  mapsPos: number | null;
  lfPos: number | null;
  best: number | null;
}

export interface GeoBuildResult {
  biz: { lat: number; lng: number; name: string } | null;
  points: GeoPoint[];
}

function bestPosition(mapsPos: number | null, lfPos: number | null): number | null {
  const vals = [mapsPos, lfPos].filter((p): p is number => p != null && p <= 20);
  if (vals.length === 0) return null;
  return Math.min(...vals);
}

function findSerpOrigin(
  keywordData: SerpKeywordData | undefined,
  origin: Origin,
): { mapsPos: number | null; lfPos: number | null } {
  if (!keywordData?.origins) {
    return { mapsPos: null, lfPos: null };
  }

  const origins = keywordData.origins;
  const direct =
    (origin.zcta && origins[origin.zcta]) ||
    origins[origin.name] ||
    Object.values(origins).find((entry) => entry.name === origin.name);

  if (!direct) {
    return { mapsPos: null, lfPos: null };
  }

  return { mapsPos: direct.pos ?? null, lfPos: null };
}

function originsForKeywordType(
  tradeArea: AuditData['trade_area'],
  keywordType: GeoKeywordType,
): Array<Origin & { originType: 'near_me' | 'city' }> {
  const nearMe = tradeArea.near_me_origins.map((o) => ({ ...o, originType: 'near_me' as const }));
  const city = tradeArea.city_origins.map((o) => ({ ...o, originType: 'city' as const }));

  if (keywordType === 'near_me') return nearMe;
  if (keywordType === 'city') return city;
  return [...nearMe, ...city];
}

function filterSampleOrigins(
  rankMap: RankMapPresentation,
  keywordType: GeoKeywordType,
): RankMapPresentation['origins'] {
  if (keywordType === 'both') return rankMap.origins;
  return rankMap.origins.filter((o) => o.type === keywordType);
}

function ranksFromSample(
  rankMap: RankMapPresentation,
  service: string,
  originId: string,
  keywordType: GeoKeywordType,
  surface: SurfaceFilter,
): { mapsPos: number | null; lfPos: number | null } {
  const svcData = rankMap.data[service];
  if (!svcData) return { mapsPos: null, lfPos: null };

  let mR: number | null = null;
  let lR: number | null = null;

  if (keywordType === 'near_me') {
    mR = surface !== 'lf' ? (svcData.nm[originId] ?? null) : null;
    lR = surface !== 'maps' ? (svcData.nmLf[originId] ?? null) : null;
  } else if (keywordType === 'city') {
    mR = surface !== 'lf' ? (svcData.city[originId] ?? null) : null;
    lR = surface !== 'maps' ? (svcData.cityLf[originId] ?? null) : null;
  } else {
    mR =
      surface !== 'lf'
        ? (svcData.nm[originId] ?? svcData.city[originId] ?? null)
        : null;
    lR =
      surface !== 'maps'
        ? (svcData.nmLf[originId] ?? svcData.cityLf[originId] ?? null)
        : null;
  }

  return { mapsPos: mR, lfPos: lR };
}

function buildFromTradeArea(
  auditData: AuditData,
  service: string,
  keywordType: GeoKeywordType,
  surface: SurfaceFilter,
): GeoBuildResult | null {
  const tradeArea = auditData.trade_area;
  const origins = originsForKeywordType(tradeArea, keywordType).filter(
    (o) => o.lat != null && o.lng != null,
  );

  if (origins.length === 0) return null;

  const keywordNm = keywordFor(auditData.keywords, service, 'near_me');
  const keywordCity = keywordFor(auditData.keywords, service, 'city');

  const points: GeoPoint[] = origins.map((origin) => {
    const keyword =
      origin.originType === 'near_me'
        ? keywordNm
        : keywordCity;
    const serpData = keyword ? auditData.serp[keyword] : undefined;
    const lfData = keyword ? auditData.local_finder[keyword] : undefined;

    let mapsPos: number | null = null;
    let lfPos: number | null = null;

    if (keyword) {
      const serpOrigin = findSerpOrigin(serpData, origin);
      mapsPos = surface !== 'lf' ? serpOrigin.mapsPos : null;

      const lfOrigin =
        (origin.zcta && lfData?.origins?.[origin.zcta]) ||
        Object.values(lfData?.origins ?? {}).find((entry) => entry.name === origin.name);
      lfPos = surface !== 'maps' ? (lfOrigin?.pos ?? null) : null;
    }

    return {
      id: origin.zcta ?? origin.name,
      name: origin.name,
      lat: origin.lat,
      lng: origin.lng,
      dist: origin.dist_mi,
      type: origin.originType,
      mapsPos,
      lfPos,
      best: bestPosition(mapsPos, lfPos),
    };
  });

  return {
    biz: {
      lat: tradeArea.biz_lat,
      lng: tradeArea.biz_lng,
      name: auditData.business,
    },
    points,
  };
}

function buildFromSampleRankMap(
  auditData: AuditData,
  service: string,
  keywordType: GeoKeywordType,
  surface: SurfaceFilter,
): GeoBuildResult | null {
  const rankMap = auditData.presentation?.rankMap;
  if (!rankMap) return null;

  const origins = filterSampleOrigins(rankMap, keywordType);
  if (origins.length === 0) return null;

  const points: GeoPoint[] = origins.map((origin) => {
    const { mapsPos, lfPos } = ranksFromSample(rankMap, service, origin.id, keywordType, surface);
    return {
      id: origin.id,
      name: origin.name,
      lat: origin.lat,
      lng: origin.lng,
      dist: origin.dist,
      type: origin.type,
      mapsPos,
      lfPos,
      best: bestPosition(mapsPos, lfPos),
    };
  });

  return {
    biz: rankMap.biz,
    points,
  };
}

export function buildGeoPoints(options: {
  auditData: AuditData;
  service: string;
  keywordType: GeoKeywordType;
  surface: SurfaceFilter;
}): GeoBuildResult {
  const { auditData, service, keywordType, surface } = options;

  const fromTradeArea = buildFromTradeArea(auditData, service, keywordType, surface);
  if (fromTradeArea && fromTradeArea.points.length > 0) {
    return fromTradeArea;
  }

  const fromSample = buildFromSampleRankMap(auditData, service, keywordType, surface);
  if (fromSample) {
    return fromSample;
  }

  return { biz: null, points: [] };
}

export function geoPointColor(point: GeoPoint): string {
  const pos = point.best;
  return RANK_COLORS[rankBand(pos)];
}

export { rankBand, RANK_COLORS };
