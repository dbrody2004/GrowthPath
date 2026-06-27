import type { CollectionErrorKind, CollectionSourceId } from '@growthpath/shared';

export interface RetryPolicy {
  maxAttempts: number;
  backoffMs: number;
  retryableKinds: CollectionErrorKind[];
}

export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxAttempts: 2,
  backoffMs: 750,
  retryableKinds: ['transient', 'timeout', 'vendor', 'unknown'],
};

export const SOURCE_RETRY_POLICIES: Partial<Record<CollectionSourceId, RetryPolicy>> = {
  gbp: { maxAttempts: 2, backoffMs: 1000, retryableKinds: ['transient', 'timeout', 'vendor', 'unknown'] },
  gbp_posts: { maxAttempts: 2, backoffMs: 750, retryableKinds: ['transient', 'timeout', 'vendor', 'unknown'] },
  moz: { maxAttempts: 2, backoffMs: 750, retryableKinds: ['transient', 'timeout', 'vendor', 'unknown'] },
  moz_competitors: { maxAttempts: 2, backoffMs: 750, retryableKinds: ['transient', 'timeout', 'vendor', 'unknown'] },
  trade_area: { maxAttempts: 2, backoffMs: 1000, retryableKinds: ['transient', 'timeout', 'unknown'] },
  serp: { maxAttempts: 2, backoffMs: 1500, retryableKinds: ['transient', 'timeout', 'vendor', 'unknown'] },
  local_finder: { maxAttempts: 2, backoffMs: 1500, retryableKinds: ['transient', 'timeout', 'vendor', 'unknown'] },
  whois: { maxAttempts: 1, backoffMs: 0, retryableKinds: [] },
  html: { maxAttempts: 2, backoffMs: 1000, retryableKinds: ['transient', 'timeout', 'unknown'] },
  content_depth: { maxAttempts: 2, backoffMs: 750, retryableKinds: ['transient', 'timeout', 'unknown'] },
  pagespeed: { maxAttempts: 2, backoffMs: 2000, retryableKinds: ['transient', 'timeout', 'vendor', 'unknown'] },
  psi_accessibility: { maxAttempts: 2, backoffMs: 1500, retryableKinds: ['transient', 'timeout', 'unknown'] },
  competitor_agg: { maxAttempts: 1, backoffMs: 0, retryableKinds: [] },
};

export function getRetryPolicy(sourceId: CollectionSourceId): RetryPolicy {
  return SOURCE_RETRY_POLICIES[sourceId] ?? DEFAULT_RETRY_POLICY;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
