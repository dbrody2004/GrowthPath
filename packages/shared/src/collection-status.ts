import type { ScanStatus } from './types/intake.js';
import type {
  CollectionOutcomeStatus,
  CollectionSourceId,
  SourceCollectionResult,
} from './types/collection.js';
import { COLLECTION_SOURCE_LABELS, CRITICAL_COLLECTION_SOURCES } from './types/collection.js';
import type { CollectionDiagnostic } from './types/report.js';

const CUSTOMER_REASONS: Partial<Record<CollectionSourceId, string>> = {
  pagespeed:
    'PageSpeed data unavailable — P2 reweighted without performance category',
  html: 'Homepage HTML could not be fully collected — on-page and conversion signals may be incomplete',
  gbp: 'Google Business Profile data could not be collected',
  serp: 'Map Pack ranking data could not be collected',
  local_finder: 'Local Finder data is incomplete',
  moz: 'Domain authority metrics unavailable',
  content_depth: 'Service page coverage crawl incomplete',
};

export function customerPartialReason(source: SourceCollectionResult): string {
  return CUSTOMER_REASONS[source.sourceId] ?? `${source.label} — ${source.detail}`;
}

export function isCriticalSource(sourceId: CollectionSourceId): boolean {
  return CRITICAL_COLLECTION_SOURCES.includes(sourceId);
}

export function deriveScanStatusFromCollection(
  sources: SourceCollectionResult[],
): { status: ScanStatus; partialReasons: string[] } {
  const criticalFailures = sources.filter(
    (s) =>
      isCriticalSource(s.sourceId) &&
      (s.status === 'error' || s.status === 'missing'),
  );

  if (criticalFailures.length > 0) {
    return {
      status: 'failed',
      partialReasons: criticalFailures.map((s) => customerPartialReason(s)),
    };
  }

  const degradations = sources.filter(
    (s) => s.status !== 'ok' && s.status !== 'skipped',
  );

  if (degradations.length === 0) {
    return { status: 'complete', partialReasons: [] };
  }

  const scoreAffecting = degradations.filter((s) => s.affectsScore !== false);
  const reasons = (scoreAffecting.length > 0 ? scoreAffecting : degradations).map(
    customerPartialReason,
  );

  return { status: 'partial', partialReasons: [...new Set(reasons)] };
}

export function toCollectionDiagnostics(
  sources: SourceCollectionResult[],
): CollectionDiagnostic[] {
  return sources
    .filter((s) => s.sourceId !== 'competitor_agg')
    .map((s) => ({
      source: s.label,
      status: s.status === 'skipped' ? 'partial' : s.status,
      detail: s.detail,
    }));
}

export function mergeCollectionStatus(
  prior: SourceCollectionResult[] | undefined,
  updated: SourceCollectionResult[],
): SourceCollectionResult[] {
  const byId = new Map<CollectionSourceId, SourceCollectionResult>();
  for (const row of prior ?? []) {
    byId.set(row.sourceId, row);
  }
  for (const row of updated) {
    byId.set(row.sourceId, row);
  }
  return [...byId.values()].sort((a, b) => a.label.localeCompare(b.label));
}

export function sourcesNeedingRetry(
  sources: SourceCollectionResult[],
): CollectionSourceId[] {
  return sources
    .filter(
      (s) =>
        s.recoverable !== false &&
        (s.status === 'error' || s.status === 'missing' || s.status === 'partial'),
    )
    .map((s) => s.sourceId);
}

export function classifyErrorKind(error: unknown): import('./types/collection.js').CollectionErrorKind {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  if (message.includes('timeout') || message.includes('timed out')) return 'timeout';
  if (message.includes('429') || message.includes('503') || message.includes('502')) return 'transient';
  if (message.includes('400') || message.includes('404') || message.includes('validation')) {
    return 'validation';
  }
  if (message.includes('vendor') || message.includes('dataforseo') || message.includes('moz')) {
    return 'vendor';
  }
  return 'unknown';
}

export function isRetryableError(
  kind: import('./types/collection.js').CollectionErrorKind,
): boolean {
  return kind === 'transient' || kind === 'timeout' || kind === 'vendor' || kind === 'unknown';
}

export function emptySourceResult(
  sourceId: CollectionSourceId,
  status: CollectionOutcomeStatus,
  detail: string,
  extra?: Partial<SourceCollectionResult>,
): SourceCollectionResult {
  return {
    sourceId,
    label: COLLECTION_SOURCE_LABELS[sourceId],
    status,
    detail,
    affectsScore: true,
    recoverable: status !== 'ok',
    ...extra,
  };
}
