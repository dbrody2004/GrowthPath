import type {
  AuditData,
  CollectionOutcomeStatus,
  CollectionSourceId,
  SourceCollectionResult,
} from '@growthpath/shared';
import {
  COLLECTION_SOURCE_LABELS,
  classifyErrorKind,
  emptySourceResult,
  isRetryableError,
} from '@growthpath/shared';
import { getRetryPolicy, sleep } from './retry-policy.js';

export interface RunSourceOptions<T> {
  sourceId: CollectionSourceId;
  evaluate: (result: T) => Pick<SourceCollectionResult, 'status' | 'detail' | 'operatorDetail' | 'affectsScore' | 'recoverable'>;
  cost?: number | ((result: T) => number);
  affectsScore?: boolean;
  recoverable?: boolean;
  skip?: boolean;
}

export async function runSource<T>(
  options: RunSourceOptions<T>,
  fn: () => Promise<T>,
): Promise<{ data: T; meta: SourceCollectionResult }> {
  const policy = getRetryPolicy(options.sourceId);
  const started = Date.now();
  let lastError: unknown;
  let attempts = 0;

  if (options.skip) {
    return {
      data: await fn(),
      meta: emptySourceResult(options.sourceId, 'skipped', 'Skipped — prior data retained', {
        durationMs: 0,
        retryCount: 0,
        recoverable: false,
      }),
    };
  }

  for (let attempt = 1; attempt <= policy.maxAttempts; attempt += 1) {
    attempts = attempt;
    try {
      const data = await fn();
      const evaluated = options.evaluate(data);
      const cost =
        typeof options.cost === 'function'
          ? options.cost(data)
          : options.cost;

      return {
        data,
        meta: {
          sourceId: options.sourceId,
          label: COLLECTION_SOURCE_LABELS[options.sourceId],
          status: evaluated.status,
          detail: evaluated.detail,
          operatorDetail: evaluated.operatorDetail,
          affectsScore: evaluated.affectsScore ?? options.affectsScore ?? true,
          recoverable: evaluated.recoverable ?? options.recoverable ?? evaluated.status !== 'ok',
          retryCount: attempt - 1,
          durationMs: Date.now() - started,
          cost,
          attemptedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      lastError = error;
      const kind = classifyErrorKind(error);
      const canRetry = attempt < policy.maxAttempts && policy.retryableKinds.includes(kind) && isRetryableError(kind);
      if (!canRetry) break;
      await sleep(policy.backoffMs * attempt);
    }
  }

  const kind = classifyErrorKind(lastError);
  const message = lastError instanceof Error ? lastError.message : String(lastError);

  throw Object.assign(new Error(message), {
    sourceCollectionMeta: emptySourceResult(options.sourceId, 'error', `${COLLECTION_SOURCE_LABELS[options.sourceId]} failed`, {
      operatorDetail: message,
      errorKind: kind,
      recoverable: isRetryableError(kind),
      retryCount: attempts,
      durationMs: Date.now() - started,
      attemptedAt: new Date().toISOString(),
      affectsScore: options.affectsScore ?? true,
    }) satisfies SourceCollectionResult,
  });
}

export function sourceCollectionMetaFromError(error: unknown): SourceCollectionResult | undefined {
  if (error && typeof error === 'object' && 'sourceCollectionMeta' in error) {
    return (error as { sourceCollectionMeta: SourceCollectionResult }).sourceCollectionMeta;
  }
  return undefined;
}

export function evaluateGbp(gbp: AuditData['gbp']): Pick<SourceCollectionResult, 'status' | 'detail'> {
  if (gbp?.name) return { status: 'ok', detail: `Profile loaded for ${gbp.name}` };
  return { status: 'missing', detail: 'GBP data missing — no Places match' };
}

export function evaluateSerp(serp: AuditData['serp']): Pick<SourceCollectionResult, 'status' | 'detail'> {
  const keywords = Object.keys(serp ?? {});
  if (keywords.length === 0) {
    return { status: 'missing', detail: 'No SERP keyword data collected' };
  }

  for (const kw of keywords) {
    for (const od of Object.values(serp![kw]?.origins ?? {})) {
      if (od.pos != null || (od.top3?.length ?? 0) > 0) {
        return { status: 'ok', detail: `${keywords.length} keywords scanned` };
      }
    }
  }

  return {
    status: 'partial',
    detail: 'SERP keywords collected but ranking data empty for all origins',
  };
}

export function evaluateLocalFinder(lf: AuditData['local_finder']): Pick<SourceCollectionResult, 'status' | 'detail'> {
  const count = Object.keys(lf ?? {}).length;
  if (count > 0) return { status: 'ok', detail: 'Local Finder origins collected' };
  return { status: 'partial', detail: 'Local Finder data incomplete' };
}

export function evaluateHtml(html: AuditData['html']): Pick<SourceCollectionResult, 'status' | 'detail' | 'operatorDetail'> {
  if (html.html_fetch_error) {
    return {
      status: 'error',
      detail: `Homepage fetch failed${html.html_fetch_status ? ` (HTTP ${html.html_fetch_status})` : ''}`,
      operatorDetail: `html_fetch_error status=${html.html_fetch_status ?? 'unknown'}`,
    };
  }
  if (html.title_text) return { status: 'ok', detail: 'Homepage fetched and parsed' };
  return { status: 'partial', detail: 'Homepage HTML partially available' };
}

export function evaluateMoz(moz: AuditData['moz']): Pick<SourceCollectionResult, 'status' | 'detail'> {
  if (moz?.client?.da != null) {
    return {
      status: 'ok',
      detail: `DA ${moz.client.da} · ${moz.client.referring_domains ?? 0} RDs`,
    };
  }
  return { status: 'partial', detail: 'Moz metrics unavailable' };
}

export function evaluatePageSpeed(psi: AuditData['pagespeed']): Pick<SourceCollectionResult, 'status' | 'detail' | 'affectsScore'> {
  if (psi.performance != null) {
    return { status: 'ok', detail: `Desktop performance ${psi.performance}`, affectsScore: true };
  }
  return {
    status: 'missing',
    detail: 'PageSpeed data unavailable — performance category excluded',
    affectsScore: true,
  };
}

export function evaluateWhois(whois: AuditData['whois']): Pick<SourceCollectionResult, 'status' | 'detail' | 'affectsScore'> {
  if (whois?.domain) {
    return {
      status: 'ok',
      detail: `${whois.domain}${whois.age_years != null ? ` · ${whois.age_years.toFixed(1)}y` : ''}`,
      affectsScore: false,
    };
  }
  return { status: 'partial', detail: 'WHOIS data unavailable', affectsScore: false };
}

export function evaluateContentDepth(cd: AuditData['content_depth']): Pick<SourceCollectionResult, 'status' | 'detail'> {
  const pages = cd?.service_pages ?? {};
  const found = Object.values(pages).filter((p) => p?.found).length;
  const total = Object.keys(pages).length;
  if (total === 0) return { status: 'partial', detail: 'No service pages matched' };
  if (found === total) return { status: 'ok', detail: `${found}/${total} service pages found` };
  return { status: 'partial', detail: `${found}/${total} service pages found` };
}

export function evaluateTradeArea(ta: AuditData['trade_area']): Pick<SourceCollectionResult, 'status' | 'detail'> {
  const nm = ta?.near_me_origins?.length ?? 0;
  const city = ta?.city_origins?.length ?? 0;
  const origins = nm + city || (ta?.origins?.length ?? 0);
  if (origins > 0) return { status: 'ok', detail: `${origins} scan origins resolved` };
  return { status: 'missing', detail: 'Trade area origins missing' };
}

export function evaluateCompetitorAgg(
  agg: AuditData['competitor_agg'],
): Pick<SourceCollectionResult, 'status' | 'detail' | 'affectsScore'> {
  const keys = Object.keys(agg ?? {}).length;
  if (keys > 0) return { status: 'ok', detail: 'Competitor aggregation complete', affectsScore: false };
  return { status: 'partial', detail: 'Competitor aggregation empty', affectsScore: false };
}

export function statusFromMeta(
  meta: SourceCollectionResult,
): CollectionOutcomeStatus {
  return meta.status;
}
