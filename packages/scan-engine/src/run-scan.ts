import type { AuditData, CollectionSourceId, SourceCollectionResult } from '@growthpath/shared';
import type { ScanIntake } from '@growthpath/shared';
import { emptySourceResult, mergeCollectionStatus, sourcesNeedingRetry } from '@growthpath/shared';
import { format } from 'date-fns';
import { createScanContext } from './context.js';
import type { ScanCredentials } from './types.js';
import type { ScanEngineOptions } from './types.js';
import { fetchGbp, fetchGbpPosts } from './services/gbp.js';
import { normalizeKeywords, deriveCityLocation } from './services/keywords.js';
import { loadGazetteer, resolveTradeArea } from './services/tradeArea.js';
import { fetchSerpMaps } from './services/serpMaps.js';
import { enrichCompetitors, fetchMoz } from './services/moz.js';
import { fetchLocalFinder } from './services/localFinder.js';
import { fetchWhois } from './services/whois.js';
import { fetchHtml } from './services/html.js';
import { fetchContentDepth } from './services/contentDepth.js';
import { fetchPageSpeed, fetchPsiAccessibility } from './services/pagespeed.js';
import { aggregateCompetitors } from './services/compIntel.js';
import { kitchen747AuditData } from './fixtures/kitchen747.fixture.js';
import type { ScanTierKey } from './constants.js';
import {
  evaluateCompetitorAgg,
  evaluateContentDepth,
  evaluateGbp,
  evaluateHtml,
  evaluateLocalFinder,
  evaluateMoz,
  evaluatePageSpeed,
  evaluateSerp,
  evaluateTradeArea,
  evaluateWhois,
  runSource,
  sourceCollectionMetaFromError,
  type RunSourceOptions,
} from './collection/run-source.js';

function normalizeGbpCategory(s: string): string {
  return s.replace(/[\s_-]+/g, '').toLowerCase();
}

function shouldCollect(
  sourceId: CollectionSourceId,
  sourcesToRetry?: CollectionSourceId[],
): boolean {
  if (!sourcesToRetry || sourcesToRetry.length === 0) return true;
  if (sourcesToRetry.includes(sourceId)) return true;
  if (sourceId === 'competitor_agg') {
    return sourcesToRetry.some((id) => id === 'serp' || id === 'local_finder');
  }
  if (sourceId === 'moz_competitors') {
    return sourcesToRetry.includes('moz_competitors') || sourcesToRetry.includes('serp');
  }
  return false;
}

function pushCollectionMeta(rows: SourceCollectionResult[], meta: SourceCollectionResult): void {
  const existingIndex = rows.findIndex((row) => row.sourceId === meta.sourceId);
  if (existingIndex >= 0) {
    rows[existingIndex] = meta;
    return;
  }
  rows.push(meta);
}

async function collectSource<T>(
  sourceId: CollectionSourceId,
  config: Omit<RunSourceOptions<T>, 'sourceId'>,
  rows: SourceCollectionResult[],
  fetchFn: () => Promise<T>,
  fallback: T,
): Promise<T> {
  try {
    const result = await runSource({ sourceId, ...config }, fetchFn);
    pushCollectionMeta(rows, result.meta);
    return result.data;
  } catch (error) {
    const meta = sourceCollectionMetaFromError(error);
    if (meta) pushCollectionMeta(rows, meta);
    return fallback;
  }
}

async function fetchIfMissing<T>(
  sourceId: CollectionSourceId,
  config: Omit<RunSourceOptions<T>, 'sourceId'>,
  value: T | undefined,
  rows: SourceCollectionResult[],
  fetchFn: () => Promise<T>,
): Promise<T> {
  if (value !== undefined && value !== null) return value;
  return collectSource(sourceId, config, rows, fetchFn, value as T);
}

export async function runScan(
  intake: ScanIntake,
  creds: ScanCredentials,
  options?: ScanEngineOptions,
): Promise<AuditData> {
  if (options?.mock) {
    return {
      ...kitchen747AuditData,
      total_cost: 0,
      collection_status: [],
    };
  }

  const runStarted = Date.now();
  const ctx = createScanContext(creds, options?.context);
  const prior = options?.priorAudit;
  const sourcesToRetry = options?.sourcesToRetry;
  const collectionRows: SourceCollectionResult[] = [];
  let totalCost = prior?.total_cost ?? 0;

  const url = `https://www.${intake.bizDomain.replace(/^www\./, '')}`;
  const cityLocation = deriveCityLocation(intake.bizAddress, intake.bizCity);
  const keywords = prior?.keywords ?? normalizeKeywords(intake.ownerServices, cityLocation.keywordSuffix);

  let gbp = prior?.gbp;
  if (shouldCollect('gbp', sourcesToRetry)) {
    gbp = await collectSource(
      'gbp',
      { evaluate: evaluateGbp },
      collectionRows,
      () => fetchGbp(ctx, url, intake.bizName, intake.bizCity, intake.bizAddress),
      prior?.gbp ?? ({} as AuditData['gbp']),
    );
  }
  gbp = gbp ?? ({} as AuditData['gbp']);

  const geoAddress = (gbp.address?.replace(/, USA$/i, '') || intake.bizAddress).trim();
  const bizName = gbp.name || intake.bizName || url;

  let moz = prior?.moz;
  if (shouldCollect('moz', sourcesToRetry)) {
    moz = await collectSource(
      'moz',
      { evaluate: evaluateMoz, affectsScore: true },
      collectionRows,
      () => fetchMoz(ctx, url, []),
      prior?.moz ?? ({} as AuditData['moz']),
    );
  }
  moz = await fetchIfMissing(
    'moz',
    { evaluate: evaluateMoz, affectsScore: true },
    moz,
    collectionRows,
    () => fetchMoz(ctx, url, []),
  );

  let gbpPosts = prior?.gbp_posts;
  if (shouldCollect('gbp_posts', sourcesToRetry)) {
    gbpPosts = await collectSource(
      'gbp_posts',
      {
        evaluate: (data) =>
          data.last_post_date || data.post_count
            ? { status: 'ok', detail: `${data.post_count ?? 0} posts tracked` }
            : { status: 'partial', detail: 'GBP post activity unavailable' },
        affectsScore: false,
      },
      collectionRows,
      () => fetchGbpPosts(ctx, bizName, intake.bizCity, gbp!.cid),
      prior?.gbp_posts ?? ({} as AuditData['gbp_posts']),
    );
  }
  gbpPosts = await fetchIfMissing(
    'gbp_posts',
    {
      evaluate: (data) =>
        data.last_post_date || data.post_count
          ? { status: 'ok', detail: `${data.post_count ?? 0} posts tracked` }
          : { status: 'partial', detail: 'GBP post activity unavailable' },
      affectsScore: false,
    },
    gbpPosts,
    collectionRows,
    () => fetchGbpPosts(ctx, bizName, intake.bizCity, gbp.cid),
  );

  const gazetteer = options?.gazetteer ?? (await (async () => {
    try {
      return await loadGazetteer(ctx);
    } catch (error) {
      pushCollectionMeta(
        collectionRows,
        emptySourceResult('trade_area', 'error', 'Gazetteer load failed', {
          operatorDetail: error instanceof Error ? error.message : String(error),
          recoverable: true,
          durationMs: 0,
          retryCount: 0,
        }),
      );
      return [];
    }
  })());

  let tradeArea = prior?.trade_area;
  if (shouldCollect('trade_area', sourcesToRetry)) {
    tradeArea = await collectSource(
      'trade_area',
      { evaluate: evaluateTradeArea },
      collectionRows,
      () => resolveTradeArea(ctx, geoAddress, gazetteer, intake.scanTier as ScanTierKey),
      prior?.trade_area ?? ({} as AuditData['trade_area']),
    );
  }
  tradeArea = await fetchIfMissing(
    'trade_area',
    { evaluate: evaluateTradeArea },
    tradeArea,
    collectionRows,
    () => resolveTradeArea(ctx, geoAddress, gazetteer, intake.scanTier as ScanTierKey),
  );

  let serp = prior?.serp ?? {};
  if (shouldCollect('serp', sourcesToRetry)) {
    serp = await collectSource(
      'serp',
      { evaluate: evaluateSerp },
      collectionRows,
      async () => {
        const { serp: serpData, cost } = await fetchSerpMaps(
          ctx,
          keywords,
          tradeArea!,
          bizName,
          intake.bizDomain,
        );
        totalCost += cost;
        return serpData;
      },
      prior?.serp ?? {},
    );
  }

  if (shouldCollect('moz_competitors', sourcesToRetry)) {
    moz = await collectSource(
      'moz_competitors',
      {
        evaluate: (data) =>
          (data.competitors?.length ?? 0) > 0
            ? { status: 'ok', detail: `${data.competitors!.length} competitor domains enriched` }
            : { status: 'partial', detail: 'No competitor Moz metrics collected' },
        affectsScore: false,
      },
      collectionRows,
      () => enrichCompetitors(ctx, url, serp, intake.bizDomain),
      moz ?? ({} as AuditData['moz']),
    );
  } else if (shouldCollect('serp', sourcesToRetry)) {
    moz = await fetchIfMissing(
      'moz_competitors',
      {
        evaluate: (data) =>
          (data.competitors?.length ?? 0) > 0
            ? { status: 'ok', detail: `${data.competitors!.length} competitor domains enriched` }
            : { status: 'partial', detail: 'No competitor Moz metrics collected' },
        affectsScore: false,
      },
      moz,
      collectionRows,
      () => enrichCompetitors(ctx, url, serp, intake.bizDomain),
    );
  }

  let localFinder = prior?.local_finder ?? {};
  if (shouldCollect('local_finder', sourcesToRetry)) {
    const bizStreet = geoAddress.split(',')[0]?.trim() ?? '';
    localFinder = await collectSource(
      'local_finder',
      { evaluate: evaluateLocalFinder },
      collectionRows,
      async () => {
        const { localFinder: lfData, cost } = await fetchLocalFinder(
          ctx,
          keywords,
          tradeArea!,
          bizName,
          intake.bizDomain,
          bizStreet,
        );
        totalCost += cost;
        return lfData;
      },
      prior?.local_finder ?? {},
    );
  }

  let whoisData = prior?.whois;
  if (shouldCollect('whois', sourcesToRetry)) {
    whoisData = await collectSource(
      'whois',
      { evaluate: evaluateWhois, affectsScore: false },
      collectionRows,
      () => fetchWhois(ctx, url),
      prior?.whois ?? ({} as AuditData['whois']),
    );
  }
  whoisData = await fetchIfMissing(
    'whois',
    { evaluate: evaluateWhois, affectsScore: false },
    whoisData,
    collectionRows,
    () => fetchWhois(ctx, url),
  );

  let html = prior?.html;
  if (shouldCollect('html', sourcesToRetry)) {
    html = await collectSource(
      'html',
      { evaluate: evaluateHtml },
      collectionRows,
      () => fetchHtml(ctx, url, intake.bizVertical),
      prior?.html ?? ({} as AuditData['html']),
    );
  }
  html = await fetchIfMissing(
    'html',
    { evaluate: evaluateHtml },
    html,
    collectionRows,
    () => fetchHtml(ctx, url, intake.bizVertical),
  );

  let contentDepth = prior?.content_depth;
  if (shouldCollect('content_depth', sourcesToRetry)) {
    contentDepth = await collectSource(
      'content_depth',
      { evaluate: evaluateContentDepth },
      collectionRows,
      () => fetchContentDepth(ctx, url, intake.ownerServices, cityLocation.display),
      prior?.content_depth ?? ({} as AuditData['content_depth']),
    );
  }
  contentDepth = await fetchIfMissing(
    'content_depth',
    { evaluate: evaluateContentDepth },
    contentDepth,
    collectionRows,
    () => fetchContentDepth(ctx, url, intake.ownerServices, cityLocation.display),
  );

  let pagespeed = prior?.pagespeed;
  if (shouldCollect('pagespeed', sourcesToRetry)) {
    pagespeed = await collectSource(
      'pagespeed',
      { evaluate: evaluatePageSpeed },
      collectionRows,
      () => fetchPageSpeed(ctx, url),
      prior?.pagespeed ?? ({} as AuditData['pagespeed']),
    );
  }
  pagespeed = await fetchIfMissing(
    'pagespeed',
    { evaluate: evaluatePageSpeed },
    pagespeed,
    collectionRows,
    () => fetchPageSpeed(ctx, url),
  );

  let psiAccessibility = prior?.psi_accessibility;
  if (shouldCollect('psi_accessibility', sourcesToRetry)) {
    psiAccessibility = await collectSource(
      'psi_accessibility',
      {
        evaluate: (data) =>
          data.psi_a11y_viewport != null
            ? { status: 'ok', detail: 'Mobile accessibility signals collected' }
            : { status: 'partial', detail: 'PSI accessibility unavailable' },
        affectsScore: false,
      },
      collectionRows,
      () => fetchPsiAccessibility(ctx, url),
      prior?.psi_accessibility ?? ({} as AuditData['psi_accessibility']),
    );
  }
  psiAccessibility = await fetchIfMissing(
    'psi_accessibility',
    {
      evaluate: (data) =>
        data.psi_a11y_viewport != null
          ? { status: 'ok', detail: 'Mobile accessibility signals collected' }
          : { status: 'partial', detail: 'PSI accessibility unavailable' },
      affectsScore: false,
    },
    psiAccessibility,
    collectionRows,
    () => fetchPsiAccessibility(ctx, url),
  );

  let competitorAgg = prior?.competitor_agg;
  if (shouldCollect('competitor_agg', sourcesToRetry)) {
    const { agg } = aggregateCompetitors(serp, localFinder, tradeArea!, intake.bizDomain);
    competitorAgg = await collectSource(
      'competitor_agg',
      {
        evaluate: () => evaluateCompetitorAgg(agg),
        skip: false,
      },
      collectionRows,
      async () => agg,
      prior?.competitor_agg ?? {},
    );
  } else if (!competitorAgg) {
    competitorAgg = aggregateCompetitors(serp, localFinder, tradeArea!, intake.bizDomain).agg;
  }

  const gbpPrimary = (intake.gbpPrimaryCategory ?? '').trim();
  const gbpActual = (gbp.primary_type || gbp.primary_category || '').trim();

  const mergedCollection = mergeCollectionStatus(
    prior?.collection_status,
    collectionRows,
  );

  const auditData: AuditData = {
    business: bizName,
    url,
    city: cityLocation.display,
    vertical: intake.bizVertical,
    biz_type: intake.bizType,
    scan_date: format(new Date(), 'MMMM d, yyyy'),
    engine: 'v4.58',
    gbp_category_confirmed:
      Boolean(gbpPrimary) && normalizeGbpCategory(gbpPrimary) === normalizeGbpCategory(gbpActual),
    gbp_category_mismatch:
      Boolean(gbpPrimary) && normalizeGbpCategory(gbpPrimary) !== normalizeGbpCategory(gbpActual),
    gbp_primary_category: gbpPrimary || null,
    owner_services: intake.ownerServices,
    keywords,
    trade_area: tradeArea!,
    gbp,
    gbp_posts: gbpPosts!,
    moz: moz!,
    serp,
    local_finder: localFinder,
    labs_data: prior?.labs_data ?? { all_3pack_keywords: [], near_miss_keywords: [], total_3pack_count: 0 },
    whois: whoisData!,
    html: html!,
    content_depth: contentDepth!,
    pagespeed: pagespeed!,
    psi_accessibility: psiAccessibility!,
    crux: {},
    competitor_agg: competitorAgg,
    total_cost: Math.round(totalCost * 10000) / 10000,
    collection_status: mergedCollection,
    collection_metadata: {
      sources: mergedCollection,
      startedAt: new Date(runStarted).toISOString(),
      completedAt: new Date().toISOString(),
      totalDurationMs: Date.now() - runStarted,
    },
  };

  return auditData;
}

export { sourcesNeedingRetry };
