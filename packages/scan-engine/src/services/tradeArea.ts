import type { Origin, TradeArea } from '@growthpath/shared';
import {
  NM_CITY_SPLIT_MI,
  TRADE_AREA_MIN_POP,
  TRADE_AREA_TIER_CONFIG,
} from '../constants.js';
import type { ScanTierKey } from '../constants.js';
import type { GazetteerRecord, ScanEngineContext } from '../types.js';
import {
  angDist,
  bearingDeg,
  haversineMi,
  quadrantOf,
  sectorOf,
  viewportRadiusMiles,
  zoomForOrigin,
} from '../utils/geo.js';

interface Candidate extends GazetteerRecord {
  dist_mi: number;
  bearing: number;
  pop?: number;
  band?: string;
  sector?: string;
  name?: string;
  zoom_override?: string;
}

function selectNearMeRadial(
  pool: Candidate[],
  seed: Candidate[],
  cap: number,
  used: Set<string>,
  distEps = 0.05,
): Candidate[] {
  const chosen = [...seed];
  let p = pool.filter((c) => !used.has(c.zcta));
  while (chosen.length < cap && p.length) {
    const scored = p.map((c) => ({
      c,
      s: Math.min(...chosen.map((ch) => Math.abs(c.dist_mi - ch.dist_mi))),
    }));
    const best = Math.max(...scored.map((x) => x.s));
    const tied = scored.filter((x) => x.s >= best - distEps).map((x) => x.c);
    let pick: Candidate;
    if (tied.length > 1) {
      const qcount: Record<string, number> = {};
      for (const ch of chosen) {
        const q = quadrantOf(ch.bearing);
        qcount[q] = (qcount[q] ?? 0) + 1;
      }
      tied.sort(
        (a, b) =>
          (qcount[quadrantOf(a.bearing)] ?? 0) - (qcount[quadrantOf(b.bearing)] ?? 0) ||
          b.pop! - a.pop!,
      );
      pick = tied[0];
    } else {
      pick = tied[0];
    }
    pick.band = pick.band ?? 'near_me';
    pick.sector = sectorOf(pick.bearing);
    chosen.push(pick);
    used.add(pick.zcta);
    p = p.filter((c) => c.zcta !== pick.zcta);
  }
  return chosen;
}

function radialBearing(pool: Candidate[], cap: number, angEps = 1.0): Candidate[] {
  if (!pool.length || cap <= 0) return [];
  const chosen = [pool.reduce((a, b) => (a.pop! >= b.pop! ? a : b))];
  let p = pool.filter((c) => c.zcta !== chosen[0].zcta);
  while (chosen.length < cap && p.length) {
    const scored = p.map((c) => ({
      c,
      s: Math.min(...chosen.map((ch) => angDist(c.bearing, ch.bearing))),
    }));
    const best = Math.max(...scored.map((x) => x.s));
    const tied = scored.filter((x) => x.s >= best - angEps).map((x) => x.c);
    tied.sort((a, b) => b.pop! - a.pop!);
    const pick = tied[0];
    chosen.push(pick);
    p = p.filter((c) => c.zcta !== pick.zcta);
  }
  return chosen;
}

function selectCityBanded(
  candidates: Candidate[],
  bands: [number, number][],
  target: number,
  used: Set<string>,
  minPop = TRADE_AREA_MIN_POP,
  nmCitySplitMi = NM_CITY_SPLIT_MI,
): [Candidate[], Record<string, [number, number]>] {
  const pool = candidates.filter(
    (c) => c.pop! >= minPop && c.dist_mi >= nmCitySplitMi && !used.has(c.zcta),
  );
  const bandPool: Record<string, Candidate[]> = {};
  for (const b of bands) {
    bandPool[`${b[0]}-${b[1]}`] = pool.filter((c) => c.dist_mi >= b[0] && c.dist_mi < b[1]);
  }
  const totalAvail = Object.values(bandPool).reduce((sum, v) => sum + v.length, 0);
  const ringInfo: Record<string, [number, number]> = {};
  if (totalAvail === 0) {
    for (const b of bands) ringInfo[`${b[0]}-${b[1]}`] = [0, 0];
    return [[], ringInfo];
  }

  const raw: Record<string, number> = {};
  for (const b of bands) {
    const key = `${b[0]}-${b[1]}`;
    raw[key] = (target * bandPool[key].length) / totalAvail;
  }
  const alloc: Record<string, number> = {};
  for (const [k, v] of Object.entries(raw)) alloc[k] = Math.floor(v);
  const rem = target - Object.values(alloc).reduce((a, b) => a + b, 0);
  const sortedKeys = Object.keys(raw).sort((a, b) => raw[b] - alloc[b] - (raw[a] - alloc[a]));
  for (let i = 0; i < rem && i < sortedKeys.length; i += 1) {
    alloc[sortedKeys[i]] += 1;
  }
  for (const b of bands) {
    const key = `${b[0]}-${b[1]}`;
    alloc[key] = Math.min(alloc[key], bandPool[key].length);
  }

  const picked: Candidate[] = [];
  for (const b of bands) {
    const lo = b[0];
    const hi = b[1];
    const key = `${lo}-${hi}`;
    const ring = radialBearing(bandPool[key], alloc[key]);
    for (const c of ring) {
      c.band = `${lo.toFixed(0)}-${hi.toFixed(0)}mi`;
      c.sector = sectorOf(c.bearing);
      used.add(c.zcta);
    }
    picked.push(...ring);
    ringInfo[key] = [bandPool[key].length, alloc[key]];
  }
  return [picked, ringInfo];
}

export async function loadGazetteer(ctx: ScanEngineContext): Promise<GazetteerRecord[]> {
  return ctx.census.loadGazetteer();
}

export async function resolveTradeArea(
  ctx: ScanEngineContext,
  bizAddress: string,
  gazetteer: GazetteerRecord[],
  scanTier: ScanTierKey,
  minPop = TRADE_AREA_MIN_POP,
): Promise<TradeArea> {
  const tierCfg = TRADE_AREA_TIER_CONFIG[scanTier];
  const geo = await ctx.google.geocode(bizAddress);
  const bizLat = geo.lat;
  const bizLng = geo.lng;
  const homeZcta = geo.homeZcta;

  const allCandidates: Candidate[] = [];
  for (const rec of gazetteer) {
    const dist = haversineMi(bizLat, bizLng, rec.lat, rec.lng);
    if (dist <= tierCfg.max_mi) {
      allCandidates.push({
        ...rec,
        dist_mi: Math.round(dist * 1000) / 1000,
        bearing: Math.round(bearingDeg(bizLat, bizLng, rec.lat, rec.lng) * 10) / 10,
      });
    }
  }
  allCandidates.sort((a, b) => a.dist_mi - b.dist_mi);

  const zctaCodes = allCandidates.map((c) => c.zcta);
  const popMap = await ctx.census.fetchAcsPopulation(zctaCodes);
  if (!Object.keys(popMap).length) {
    for (const c of allCandidates) popMap[c.zcta] = minPop;
  }
  for (const c of allCandidates) {
    c.pop = popMap[c.zcta] ?? 0;
  }

  const used = new Set<string>();
  const nmPool = allCandidates.filter((c) => c.dist_mi < NM_CITY_SPLIT_MI);
  let home = nmPool.find((c) => c.zcta === homeZcta);
  if (!home && nmPool.length) home = nmPool[0];

  let nmIncluded: Candidate[] = [];
  if (home) {
    home.band = 'home';
    home.sector = sectorOf(home.bearing);
    used.add(home.zcta);
    const nmRest = nmPool.filter((c) => c.pop! > 0 && c.zcta !== home!.zcta);
    nmIncluded = selectNearMeRadial(nmRest, [home], tierCfg.near_me_cap, used);
  }
  nmIncluded.sort((a, b) => a.dist_mi - b.dist_mi);

  const [cityIncluded, ringInfo] = selectCityBanded(
    allCandidates,
    tierCfg.city_bands,
    tierCfg.city_target,
    used,
    minPop,
    NM_CITY_SPLIT_MI,
  );
  cityIncluded.sort((a, b) => a.dist_mi - b.dist_mi);

  for (const origin of nmIncluded) {
    const assignedZoom = parseInt(zoomForOrigin(origin.dist_mi, bizLat).replace('z', ''), 10);
    const actualDist = haversineMi(bizLat, bizLng, origin.lat, origin.lng);
    let finalZoom = assignedZoom;
    for (let z = assignedZoom; z >= 10; z -= 1) {
      if (viewportRadiusMiles(z, bizLat) * 0.85 >= actualDist) {
        finalZoom = z;
        break;
      }
    }
    if (finalZoom !== assignedZoom) {
      origin.zoom_override = `${finalZoom}z`;
    }
  }

  const allToGeocode = [...nmIncluded, ...cityIncluded];
  for (const origin of allToGeocode) {
    try {
      origin.name = await ctx.google.reverseGeocode(origin.lat, origin.lng);
    } catch {
      origin.name = origin.zcta;
    }
  }

  const cumulPop = nmIncluded.reduce((sum, c) => sum + (c.pop ?? 0), 0);
  const nmStop = `radial near-me (${nmIncluded.length}/${tierCfg.near_me_cap}) + banded-radial city (${cityIncluded.length}/${tierCfg.city_target}) — tier=${scanTier}`;

  const toOrigin = (c: Candidate): Origin => ({
    zcta: c.zcta,
    lat: c.lat,
    lng: c.lng,
    dist_mi: c.dist_mi,
    pop: c.pop ?? 0,
    bearing: c.bearing,
    name: c.name ?? c.zcta,
    band: c.band,
    sector: c.sector,
    zoom_override: c.zoom_override,
  });

  return {
    biz_lat: bizLat,
    biz_lng: bizLng,
    biz_county: geo.county,
    biz_address: bizAddress,
    home_zcta: homeZcta,
    near_me_origins: nmIncluded.map(toOrigin),
    city_origins: cityIncluded.map(toOrigin),
    origins: nmIncluded.map(toOrigin),
    near_me_cumul_pop: cumulPop,
    nm_stop_reason: nmStop,
    _ring_info: ringInfo,
  };
}
