import type { AuditData, Scores, ScanIntake } from '@growthpath/shared';
import { COLLECTION_SOURCE_LABELS, kitchen747PortalPresentation } from '@growthpath/shared';
import { scanIntakeSchema } from '@growthpath/shared';
import { calculateScores } from '@growthpath/scoring-engine';
import { kitchen747AuditData } from '@growthpath/scoring-engine';

export const KITCHEN747_SAMPLE_SEED_KEY = kitchen747PortalPresentation.seedKey;

export const kitchen747SampleIntake: ScanIntake = scanIntakeSchema.parse({
  bizName: 'Kitchen 747',
  bizAddress: '747 Main St, Roseville, CA 95747',
  bizDomain: 'kitchen747.com',
  bizCity: 'Roseville',
  bizVertical: 'Food & Beverage',
  bizType: 'Burger Restaurant',
  verticalKey: 'restaurant',
  gbpPrimaryCategory: 'Restaurant',
  bizTier: 'Basic',
  scanTier: 'basic',
  ownerServices: ['burgers', 'pizza', 'live music'],
});

export interface Kitchen747SamplePayload {
  intake: ScanIntake;
  auditData: AuditData;
  scores: Scores;
  p1: number;
  p2: number;
  profile: string;
}

/** Builds the canonical Kitchen 747 demo scan from engine fixtures + portal presentation layer. */
export function buildKitchen747SamplePayload(): Kitchen747SamplePayload {
  const auditData: AuditData = {
    ...kitchen747AuditData,
    scan_date: 'June 25, 2026',
    engine: 'v4.26',
    presentation: kitchen747PortalPresentation,
    collection_status: (
      ['gbp', 'serp', 'local_finder', 'moz', 'html', 'pagespeed'] as const
    ).map((sourceId) => ({
      sourceId,
      label: COLLECTION_SOURCE_LABELS[sourceId],
      status: 'ok' as const,
      detail: 'Sample seed — live collection skipped',
    })),
  };

  const scores = calculateScores(auditData);

  return {
    intake: kitchen747SampleIntake,
    auditData,
    scores,
    p1: scores.p1,
    p2: scores.p2,
    profile: scores.profile,
  };
}
