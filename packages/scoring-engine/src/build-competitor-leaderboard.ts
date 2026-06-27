import type {
  AuditData,
  CompetitorAggEntry,
  CompetitorIntel,
  CompetitorLeaderboardRow,
  MozData,
} from '@growthpath/shared';

function cleanDomain(domain: string): string {
  return domain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]?.toLowerCase() ?? '';
}

function lookupMozMetrics(
  domain: string,
  moz: MozData | null | undefined,
): { da: number | null; referringDomains: number | null } {
  const target = cleanDomain(domain);
  if (!target || !moz) {
    return { da: null, referringDomains: null };
  }

  const candidates = [moz.client, ...(moz.competitors ?? [])];
  for (const entry of candidates) {
    const candidate = cleanDomain(entry.domain ?? '');
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

interface DomainRollup {
  domain: string;
  name: string;
  appearances: number;
  maps_appearances: number;
  lf_appearances: number;
  rankSum: number;
  rankCount: number;
  visScore: number;
  rating: number | null;
  review_count: number | null;
  category: string;
  frequency_near_me: number;
  frequency_city: number;
}

function tallyTopOneFrequencies(auditData: AuditData): Map<string, { nearMe: number; city: number }> {
  const byKey = new Map<string, { nearMe: number; city: number }>();
  const serp = auditData.serp ?? {};

  for (const [, kwData] of Object.entries(serp)) {
    const kwType = kwData.type ?? 'near_me';
    for (const od of Object.values(kwData.origins ?? {})) {
      for (const item of od.top3 ?? []) {
        if (item.rank !== 1) continue;
        const domain = cleanDomain(item.domain ?? '');
        const key = domain || (item.title ?? '').trim().toLowerCase();
        if (!key) continue;

        const entry = byKey.get(key) ?? { nearMe: 0, city: 0 };
        if (kwType === 'near_me') entry.nearMe += 1;
        else entry.city += 1;
        byKey.set(key, entry);
      }
    }
  }

  return byKey;
}

function rollupFromAgg(auditData: AuditData): Map<string, DomainRollup> {
  const rollups = new Map<string, DomainRollup>();
  const frequencies = tallyTopOneFrequencies(auditData);
  const agg = auditData.competitor_agg ?? {};

  for (const entries of Object.values(agg)) {
    for (const entry of entries) {
      mergeAggEntry(rollups, entry, frequencies.get(cleanDomain(entry.domain)) ?? frequencies.get(entry.name.toLowerCase()));
    }
  }

  return rollups;
}

function mergeAggEntry(
  rollups: Map<string, DomainRollup>,
  entry: CompetitorAggEntry,
  freq?: { nearMe: number; city: number },
): void {
  const domain = cleanDomain(entry.domain);
  const key = domain || entry.name.trim().toLowerCase();
  if (!key) return;

  const existing = rollups.get(key);
  if (!existing) {
    rollups.set(key, {
      domain: key,
      name: entry.name,
      appearances: entry.appearances,
      maps_appearances: entry.maps_appearances,
      lf_appearances: entry.lf_appearances,
      rankSum: entry.avg_rank * entry.appearances,
      rankCount: entry.appearances,
      visScore: entry.vis_score,
      rating: entry.rating,
      review_count: entry.review_count,
      category: entry.category,
      frequency_near_me: freq?.nearMe ?? 0,
      frequency_city: freq?.city ?? 0,
    });
    return;
  }

  existing.appearances += entry.appearances;
  existing.maps_appearances += entry.maps_appearances;
  existing.lf_appearances += entry.lf_appearances;
  existing.rankSum += entry.avg_rank * entry.appearances;
  existing.rankCount += entry.appearances;
  existing.visScore = Math.max(existing.visScore, entry.vis_score);
  if (!existing.name && entry.name) existing.name = entry.name;
  if (existing.rating == null && entry.rating != null) existing.rating = entry.rating;
  if (existing.review_count == null && entry.review_count != null) existing.review_count = entry.review_count;
  if (!existing.category && entry.category) existing.category = entry.category;
  if (freq) {
    existing.frequency_near_me = Math.max(existing.frequency_near_me, freq.nearMe);
    existing.frequency_city = Math.max(existing.frequency_city, freq.city);
  }
}

function rollupFromSerp(auditData: AuditData): Map<string, DomainRollup> {
  const rollups = new Map<string, DomainRollup>();
  const serp = auditData.serp ?? {};
  const lf = auditData.local_finder ?? {};
  const frequencies = tallyTopOneFrequencies(auditData);

  for (const kw of new Set([...Object.keys(serp), ...Object.keys(lf)])) {
    const sources = [
      { data: serp[kw], isMaps: true },
      { data: lf[kw], isMaps: false },
    ] as const;

    for (const source of sources) {
      if (!source.data) continue;
      for (const od of Object.values(source.data.origins ?? {})) {
        for (const item of od.top20 ?? od.top3 ?? []) {
          const domain = cleanDomain(item.domain ?? '');
          const key = domain || (item.title ?? '').trim().toLowerCase();
          if (!key) continue;

          const existing =
            rollups.get(key) ??
            ({
              domain: key,
              name: item.title ?? key,
              appearances: 0,
              maps_appearances: 0,
              lf_appearances: 0,
              rankSum: 0,
              rankCount: 0,
              visScore: 0,
              rating: item.rating ?? null,
              review_count: item.review_count ?? null,
              category: item.category ?? '',
              frequency_near_me: frequencies.get(key)?.nearMe ?? 0,
              frequency_city: frequencies.get(key)?.city ?? 0,
            } satisfies DomainRollup);

          const rank = item.rank ?? 99;
          existing.appearances += 1;
          if (source.isMaps) existing.maps_appearances += 1;
          else existing.lf_appearances += 1;
          existing.rankSum += rank;
          existing.rankCount += 1;
          existing.visScore = Math.max(existing.visScore, Math.max(0, 100 - rank * 4));
          if (item.title && !existing.name) existing.name = item.title;
          if (item.rating != null && existing.rating == null) existing.rating = item.rating;
          if (item.review_count != null && existing.review_count == null) {
            existing.review_count = item.review_count;
          }
          if (item.category && !existing.category) existing.category = item.category;

          rollups.set(key, existing);
        }
      }
    }
  }

  return rollups;
}

export function buildCompetitorLeaderboard(
  auditData: AuditData,
  primary: CompetitorIntel | null,
): CompetitorLeaderboardRow[] {
  const clientDomain = cleanDomain(auditData.url ?? '');
  const primaryDomain = primary ? cleanDomain(primary.domain) : '';
  const rollups =
    Object.keys(auditData.competitor_agg ?? {}).length > 0
      ? rollupFromAgg(auditData)
      : rollupFromSerp(auditData);

  const rows = [...rollups.values()]
    .map((entry) => {
      const moz = lookupMozMetrics(entry.domain, auditData.moz);
      const avgRank =
        entry.rankCount > 0 ? Math.round((entry.rankSum / entry.rankCount) * 10) / 10 : 99;

      return {
        rank: 0,
        domain: entry.domain,
        name: entry.name || entry.domain,
        is_client:
          clientDomain !== '' &&
          (entry.domain === clientDomain || entry.domain.endsWith('.' + clientDomain)),
        is_primary:
          primaryDomain !== '' &&
          (entry.domain === primaryDomain || entry.domain.endsWith('.' + primaryDomain)),
        appearances: entry.appearances,
        maps_appearances: entry.maps_appearances,
        lf_appearances: entry.lf_appearances,
        avg_rank: avgRank,
        vis_score: Math.round(entry.visScore * 10) / 10,
        rating: entry.rating,
        review_count: entry.review_count,
        da: moz.da,
        referring_domains: moz.referringDomains,
        category: entry.category,
        frequency_near_me: entry.frequency_near_me,
        frequency_city: entry.frequency_city,
      } satisfies CompetitorLeaderboardRow;
    })
    .sort((a, b) => b.vis_score - a.vis_score || b.appearances - a.appearances || a.avg_rank - b.avg_rank);

  return rows.map((row, index) => ({ ...row, rank: index + 1 }));
}

export function clientLeaderboardStats(
  auditData: AuditData,
  leaderboard: CompetitorLeaderboardRow[],
): { vis_score: number | null; appearances: number } {
  const clientDomain = cleanDomain(auditData.url ?? '');
  const clientRow = leaderboard.find(
    (row) =>
      row.is_client ||
      (clientDomain !== '' &&
        (row.domain === clientDomain || row.domain.endsWith('.' + clientDomain))),
  );
  return {
    vis_score: clientRow?.vis_score ?? null,
    appearances: clientRow?.appearances ?? 0,
  };
}
