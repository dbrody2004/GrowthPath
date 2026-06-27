import type {
  AuditData,
  CompetitorCounterMove,
  CompetitorDeltaAdvantage,
  CompetitorIntel,
  CompetitorMetricDelta,
  CompetitorSurfaceRow,
  KeywordScore,
  MozData,
} from '@growthpath/shared';
import { buildCompetitorLeaderboard, clientLeaderboardStats } from './build-competitor-leaderboard.js';

function cleanDomain(domain: string): string {
  return domain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]?.toLowerCase() ?? '';
}

function lookupMozMetrics(domain: string, moz: MozData | null | undefined): { da: number | null; referringDomains: number | null } {
  const target = cleanDomain(domain);
  if (!target || !moz) {
    return { da: null, referringDomains: null };
  }

  for (const entry of moz.competitors ?? []) {
    const candidate = cleanDomain(entry.domain);
    if (!candidate) continue;
    if (candidate === target || candidate.endsWith('.' + target) || target.endsWith('.' + candidate)) {
      return {
        da: entry.da ?? null,
        referringDomains: entry.referring_domains ?? null,
      };
    }
  }

  return { da: null, referringDomains: null };
}

function formatNumber(value: number | null | undefined): string {
  if (value == null) return '—';
  return value.toLocaleString();
}

function formatRating(value: number | null | undefined): string {
  if (value == null) return '—';
  return `${value.toFixed(1)}★`;
}

function deltaAdvantage(delta: number | null, higherIsBetter = true): CompetitorDeltaAdvantage {
  if (delta == null || delta === 0) return 'neutral';
  if (higherIsBetter) return delta > 0 ? 'competitor' : 'client';
  return delta > 0 ? 'client' : 'competitor';
}

function buildMetricDelta(
  metric: string,
  label: string,
  clientValue: number | null,
  competitorValue: number | null,
  format: (value: number | null) => string = formatNumber,
  higherIsBetter = true,
): CompetitorMetricDelta {
  const delta =
    clientValue != null && competitorValue != null ? competitorValue - clientValue : null;

  return {
    metric,
    label,
    clientValue,
    competitorValue,
    delta,
    advantage: deltaAdvantage(delta, higherIsBetter),
    formattedClient: format(clientValue),
    formattedCompetitor: format(competitorValue),
    formattedDelta:
      delta == null ? '—' : `${delta > 0 ? '+' : ''}${higherIsBetter ? delta : -delta}`,
  };
}

function matchesCompetitor(
  item: { title?: string; domain?: string | null },
  compName: string,
  compDomain: string,
): boolean {
  const title = (item.title ?? '').trim().toLowerCase();
  const domain = cleanDomain(item.domain ?? '');
  const targetDomain = cleanDomain(compDomain);
  const targetName = compName.trim().toLowerCase();

  if (targetDomain && domain && (domain === targetDomain || domain.endsWith('.' + targetDomain) || targetDomain.endsWith('.' + domain))) {
    return true;
  }
  return targetName !== '' && title === targetName;
}

function bestRankForKeyword(
  auditData: AuditData,
  keyword: string,
  compName: string,
  compDomain: string,
  surface: 'maps' | 'lf',
): number | null {
  const source =
    surface === 'maps' ? auditData.serp?.[keyword] : auditData.local_finder?.[keyword];
  if (!source) return null;

  let best: number | null = null;
  for (const od of Object.values(source.origins ?? {})) {
    for (const item of od.top20 ?? od.top3 ?? []) {
      if (!matchesCompetitor(item, compName, compDomain)) continue;
      const rank = item.rank ?? null;
      if (rank == null) continue;
      best = best == null ? rank : Math.min(best, rank);
    }
  }
  return best;
}

function buildSurfaceMatrix(
  auditData: AuditData,
  keywordScores: Record<string, KeywordScore>,
  compName: string,
  compDomain: string,
): CompetitorSurfaceRow[] {
  const services = new Map<string, { nearMe?: KeywordScore; city?: KeywordScore }>();

  for (const [keyword, score] of Object.entries(keywordScores)) {
    const service = score.service ?? keyword;
    const bucket = services.get(service) ?? {};
    if (score.type === 'near_me') bucket.nearMe = score;
    else if (score.type === 'city') bucket.city = score;
    services.set(service, bucket);
  }

  const rows: CompetitorSurfaceRow[] = [];

  for (const [service, bucket] of services.entries()) {
    const nearMeKeyword = bucket.nearMe
      ? Object.entries(keywordScores).find(([, s]) => s.service === service && s.type === 'near_me')?.[0]
      : undefined;
    const cityKeyword = bucket.city
      ? Object.entries(keywordScores).find(([, s]) => s.service === service && s.type === 'city')?.[0]
      : undefined;

    rows.push({
      service,
      maps_nm: nearMeKeyword
        ? bestRankForKeyword(auditData, nearMeKeyword, compName, compDomain, 'maps')
        : null,
      lf_nm: nearMeKeyword
        ? bestRankForKeyword(auditData, nearMeKeyword, compName, compDomain, 'lf')
        : null,
      maps_city: cityKeyword
        ? bestRankForKeyword(auditData, cityKeyword, compName, compDomain, 'maps')
        : null,
      lf_city: cityKeyword
        ? bestRankForKeyword(auditData, cityKeyword, compName, compDomain, 'lf')
        : null,
      client_maps_nm: bucket.nearMe?.home_pos ?? bucket.nearMe?.best_pos ?? null,
      client_lf_nm: bucket.nearMe?.lf_best ?? null,
      client_maps_city: bucket.city?.home_pos ?? bucket.city?.best_pos ?? null,
      client_lf_city: bucket.city?.lf_best ?? null,
    });
  }

  return rows;
}

function buildWhyWinning(
  topName: string,
  compRev: number,
  compDa: number | null,
  cr: number,
  cd: number,
  freqNm: number,
): string {
  if (compRev > cr * 2 && compDa != null && compDa > cd * 1.4) {
    return (
      `<strong>${topName}'s advantage compounds two gaps: review volume and domain authority.</strong> ` +
      `With ${compRev.toLocaleString()} reviews vs. your ${cr}, they have a ${Math.round((compRev / Math.max(cr, 1)) * 10) / 10}× review advantage. ` +
      `Combined with higher domain authority, Google's local ranking algorithm weights both signals heavily ` +
      `for searchers beyond your immediate block. Closing either gap narrows this lead.`
    );
  }
  if (compRev > cr * 2) {
    return (
      `<strong>Review volume is the primary gap.</strong> ${topName} has ${compRev.toLocaleString()} reviews vs. your ${cr} — ` +
      `a ${Math.round((compRev / Math.max(cr, 1)) * 10) / 10}× difference. At the same proximity from a searcher, ` +
      `Google's algorithm weights review count as a trust signal. Your quality signals (rating, GBP) ` +
      `are competitive. Closing the review gap to within ~50 reviews is the primary lever.`
    );
  }
  if (compDa != null && compDa > cd * 1.4 && compRev < cr) {
    return (
      `<strong>Domain authority is the gap — not reviews.</strong> ${topName} outranks you despite having ` +
      `fewer reviews (${compRev.toLocaleString()} vs. your ${cr}). Their domain carries more weight from backlinks and ` +
      `directory citations. GBP category signals and content structure may also play a role. ` +
      `Study their directory presence and service page architecture.`
    );
  }
  return (
    `<strong>GBP category and content structure are the likely gaps.</strong> ${topName} appears ` +
    `${freqNm} times as the #1 near me result. Their review count (${compRev.toLocaleString()}) is comparable ` +
    `to yours. The advantage likely comes from GBP primary category selection and dedicated ` +
    `service page structure with city-targeted content — neither requires an agency to fix.`
  );
}

function buildWhyFactors(
  compRev: number,
  compDa: number | null,
  cr: number,
  cd: number,
  freqNm: number,
  freqCity: number,
  categoryMatch: boolean,
): string[] {
  const factors: string[] = [];

  if (compRev > cr * 2) factors.push('Review volume gap exceeds 2× client count');
  if (compDa != null && compDa > cd * 1.4) factors.push('Domain authority materially higher than client');
  if (freqNm >= 2) factors.push(`Leads near-me Map Pack ${freqNm} times as #1`);
  if (freqCity >= 2) factors.push(`Leads city-modifier Map Pack ${freqCity} times as #1`);
  if (!categoryMatch) factors.push('GBP primary category differs from client');
  if (factors.length === 0) {
    factors.push('Visibility lead driven by comparable trust signals and stronger local relevance');
  }

  return factors;
}

function buildCounterMoves(
  deltas: CompetitorMetricDelta[],
  whyFactors: string[],
  surfaceMatrix: CompetitorSurfaceRow[],
): CompetitorCounterMove[] {
  const moves: CompetitorCounterMove[] = [];

  const reviewDelta = deltas.find((d) => d.metric === 'reviews');
  if (reviewDelta?.advantage === 'competitor') {
    moves.push({
      rank: moves.length + 1,
      pillar: 'P1',
      surface: 'reviews',
      action: 'Launch a consistent review generation program targeting recent customers',
      rationale: `Primary competitor leads by ${reviewDelta.formattedDelta} reviews — review velocity closes this gap fastest.`,
    });
  }

  const daDelta = deltas.find((d) => d.metric === 'da');
  if (daDelta?.advantage === 'competitor') {
    moves.push({
      rank: moves.length + 1,
      pillar: 'P1',
      surface: 'domain',
      action: 'Audit directory citations and pursue high-quality local backlinks',
      rationale: `Domain authority gap (${daDelta.formattedDelta} DA) supports their visibility beyond proximity.`,
    });
  }

  const visDelta = deltas.find((d) => d.metric === 'visibility');
  if (visDelta?.advantage === 'competitor') {
    moves.push({
      rank: moves.length + 1,
      pillar: 'P1',
      surface: 'visibility',
      action: 'Prioritize Map Pack keywords where the competitor ranks #1 but you are outside top 3',
      rationale: `Aggregate visibility score trails by ${visDelta.formattedDelta} points across scanned surfaces.`,
    });
  }

  const categoryDelta = deltas.find((d) => d.metric === 'category');
  if (categoryDelta?.advantage === 'competitor') {
    moves.push({
      rank: moves.length + 1,
      pillar: 'P1',
      surface: 'gbp',
      action: 'Confirm GBP primary category is the most specific option and add 3+ secondary categories',
      rationale: 'Category mismatch suggests Google may classify their listing as more relevant for core queries.',
    });
  }

  const losingSurfaces = surfaceMatrix.filter((row) => {
    const clientBest = Math.min(
      row.client_maps_nm ?? 99,
      row.client_lf_nm ?? 99,
      row.client_maps_city ?? 99,
      row.client_lf_city ?? 99,
    );
    const compBest = Math.min(row.maps_nm ?? 99, row.lf_nm ?? 99, row.maps_city ?? 99, row.lf_city ?? 99);
    return compBest < clientBest;
  });

  if (losingSurfaces.length > 0 && moves.length < 4) {
    moves.push({
      rank: moves.length + 1,
      pillar: 'P1',
      surface: 'content',
      action: `Build dedicated service pages for: ${losingSurfaces.map((r) => r.service).join(', ')}`,
      rationale: 'Competitor outranks you on one or more service × surface combinations despite comparable trust metrics.',
    });
  }

  if (whyFactors.some((f) => f.includes('city-modifier')) && moves.length < 5) {
    moves.push({
      rank: moves.length + 1,
      pillar: 'P1',
      surface: 'visibility',
      action: 'Strengthen city-modifier content and internal linking for regional keywords',
      rationale: 'Competitor frequency is stronger on city-modifier searches than near-me.',
    });
  }

  return moves.slice(0, 5).map((move, index) => ({ ...move, rank: index + 1 }));
}

export function identifyPrimaryCompetitor(
  auditData: AuditData,
  keywordScores: Record<string, KeywordScore>,
  clientReviews: number | null,
  clientDa: number | null,
  clientRating: number | null,
): CompetitorIntel | null {
  const clientDomain = cleanDomain(auditData.url ?? '');
  const clientName = auditData.gbp?.name ?? auditData.business ?? 'Client';
  const clientCategory =
    auditData.gbp?.primary_type ?? auditData.gbp?.primary_category ?? auditData.gbp_primary_category ?? '—';

  const serpData = auditData.serp ?? {};
  const nmTally = new Map<
    string,
    {
      count: number;
      rating: number | null;
      review_count: number | null;
      domain: string | null;
      category: string | null;
      positions: Record<string, Record<string, number | null>>;
    }
  >();
  const cityTally = new Map<string, { count: number }>();

  for (const [kw, kwData] of Object.entries(serpData)) {
    const kwType = keywordScores[kw]?.type ?? kwData.type ?? 'unknown';
    const svc = keywordScores[kw]?.service ?? kwData.service ?? '';

    for (const od of Object.values(kwData.origins ?? {})) {
      for (const item of od.top3 ?? []) {
        const itemDomain = cleanDomain(item.domain ?? '');
        if (clientDomain && (itemDomain === clientDomain || itemDomain.endsWith('.' + clientDomain))) continue;
        const title = (item.title ?? '').trim();
        if (!title) continue;

        if (item.rank === 1) {
          if (kwType === 'near_me') {
            let entry = nmTally.get(title);
            if (!entry) {
              entry = {
                count: 0,
                rating: null,
                review_count: null,
                domain: null,
                category: null,
                positions: {},
              };
              nmTally.set(title, entry);
            }
            entry.count += 1;
            if (svc) {
              if (!entry.positions[svc]) entry.positions[svc] = {};
              entry.positions[svc].maps_nm = item.rank ?? null;
            }
            if (entry.rating === null && item.rating !== null) entry.rating = item.rating;
            if (entry.review_count === null && item.review_count !== null) {
              entry.review_count = item.review_count;
            }
            if (entry.domain === null && item.domain) entry.domain = item.domain;
            if (entry.category === null && item.category) entry.category = item.category;
          } else {
            let entry = cityTally.get(title);
            if (!entry) {
              entry = { count: 0 };
              cityTally.set(title, entry);
            }
            entry.count += 1;
          }
        }
      }
    }
  }

  for (const [kw, kwData] of Object.entries(auditData.local_finder ?? {})) {
    const kwType = keywordScores[kw]?.type ?? kwData.type ?? 'unknown';
    const svc = keywordScores[kw]?.service ?? kwData.service ?? '';
    if (kwType !== 'near_me') continue;

    for (const od of Object.values(kwData.origins ?? {})) {
      for (const item of od.top20 ?? od.top3 ?? []) {
        if (item.rank !== 1) continue;
        const title = (item.title ?? '').trim();
        if (!title || !nmTally.has(title)) continue;
        const entry = nmTally.get(title)!;
        if (svc) {
          if (!entry.positions[svc]) entry.positions[svc] = {};
          entry.positions[svc].lf_nm = item.rank ?? null;
        }
      }
    }
  }

  if (nmTally.size === 0) return null;

  const topName = [...nmTally.keys()].reduce((best, name) => {
    const bestData = nmTally.get(best)!;
    const nameData = nmTally.get(name)!;
    const bestCity = cityTally.get(best)?.count ?? 0;
    const nameCity = cityTally.get(name)?.count ?? 0;
    if (nameData.count > bestData.count) return name;
    if (nameData.count === bestData.count && nameCity > bestCity) return name;
    return best;
  });

  const data = nmTally.get(topName)!;
  const compRev = data.review_count ?? 0;
  const mozMetrics = lookupMozMetrics(data.domain ?? '', auditData.moz);
  const compDa = mozMetrics.da;
  const compRd = mozMetrics.referringDomains;
  const compRating = data.rating;
  const compDomain = data.domain ?? '—';
  const compCat = data.category ?? '—';
  const freqNm = data.count;
  const freqCity = cityTally.get(topName)?.count ?? 0;

  const cr = clientReviews ?? 0;
  const cd = clientDa ?? 0;
  const clientRd = auditData.moz?.client?.referring_domains ?? 0;

  const provisionalIntel: CompetitorIntel = {
    name: topName,
    domain: compDomain,
    rating: compRating,
    review_count: compRev,
    da: compDa ?? 0,
    referring_domains: compRd ?? 0,
    gbp_category: compCat,
    frequency_near_me: freqNm,
    frequency_city: freqCity,
    why_winning: '',
    surface_positions: {},
    action_callout: null,
    client: {
      name: clientName,
      domain: clientDomain,
      rating: clientRating,
      review_count: cr,
      da: cd,
      referring_domains: clientRd,
      gbp_category: clientCategory,
      vis_score: null,
      appearances: 0,
    },
    visibility: {
      vis_score: null,
      appearances: 0,
      maps_appearances: 0,
      lf_appearances: 0,
      avg_rank: null,
      frequency_near_me: freqNm,
      frequency_city: freqCity,
    },
    deltas: [],
    why_factors: [],
    surface_matrix: [],
    counter_moves: [],
    category_match: compCat.toLowerCase() === clientCategory.toLowerCase(),
    category_advantage: 'neutral',
  };

  const leaderboard = buildCompetitorLeaderboard(auditData, provisionalIntel);
  const clientStats = clientLeaderboardStats(auditData, leaderboard);
  const primaryRow = leaderboard.find((row) => row.is_primary || row.name === topName);

  provisionalIntel.client.vis_score = clientStats.vis_score;
  provisionalIntel.client.appearances = clientStats.appearances;
  provisionalIntel.visibility = {
    vis_score: primaryRow?.vis_score ?? null,
    appearances: primaryRow?.appearances ?? 0,
    maps_appearances: primaryRow?.maps_appearances ?? 0,
    lf_appearances: primaryRow?.lf_appearances ?? 0,
    avg_rank: primaryRow?.avg_rank ?? null,
    frequency_near_me: freqNm,
    frequency_city: freqCity,
  };

  const surfaceMatrix = buildSurfaceMatrix(auditData, keywordScores, topName, compDomain);
  const surfacePositions: Record<string, Record<string, number | null>> = {};
  for (const row of surfaceMatrix) {
    surfacePositions[row.service] = {
      maps_nm: row.maps_nm,
      lf_nm: row.lf_nm,
      maps_city: row.maps_city,
      lf_city: row.lf_city,
      client_maps_nm: row.client_maps_nm,
      client_lf_nm: row.client_lf_nm,
      client_maps_city: row.client_maps_city,
      client_lf_city: row.client_lf_city,
    };
  }

  const categoryMatch = compCat.toLowerCase() === clientCategory.toLowerCase();
  const categoryAdvantage: CompetitorDeltaAdvantage = categoryMatch
    ? 'neutral'
    : freqNm > 0
      ? 'competitor'
      : 'neutral';

  const deltas: CompetitorMetricDelta[] = [
    buildMetricDelta('reviews', 'Google reviews', cr, compRev),
    buildMetricDelta('rating', 'Google rating', clientRating, compRating, formatRating),
    buildMetricDelta('da', 'Domain authority', cd, compDa),
    buildMetricDelta('referring_domains', 'Referring domains', clientRd, compRd),
    buildMetricDelta(
      'visibility',
      'Visibility score',
      clientStats.vis_score,
      primaryRow?.vis_score ?? null,
    ),
    buildMetricDelta('near_me_frequency', 'Near-me #1 frequency', 0, freqNm),
    buildMetricDelta('city_frequency', 'City #1 frequency', 0, freqCity),
  ];

  if (!categoryMatch) {
    deltas.push({
      metric: 'category',
      label: 'GBP primary category',
      clientValue: null,
      competitorValue: null,
      delta: null,
      advantage: 'competitor',
      formattedClient: clientCategory,
      formattedCompetitor: compCat,
      formattedDelta: 'Mismatch',
    });
  }

  const whyFactors = buildWhyFactors(compRev, compDa, cr, cd, freqNm, freqCity, categoryMatch);
  const counterMoves = buildCounterMoves(deltas, whyFactors, surfaceMatrix);
  const whyWinning = buildWhyWinning(topName, compRev, compDa, cr, cd, freqNm);

  return {
    ...provisionalIntel,
    why_winning: whyWinning,
    surface_positions: surfacePositions,
    surface_matrix: surfaceMatrix,
    deltas,
    why_factors: whyFactors,
    counter_moves: counterMoves,
    action_callout: counterMoves[0]?.action ?? null,
    category_match: categoryMatch,
    category_advantage: categoryAdvantage,
  };
}
