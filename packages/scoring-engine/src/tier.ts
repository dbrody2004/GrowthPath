import { TIER_COLORS, TIER_THRESHOLDS } from '@growthpath/shared';
import type { TierTuple } from '@growthpath/shared';

export function getTier(score: number): TierTuple {
  if (score >= TIER_THRESHOLDS.LEADING) return ['Leading', TIER_COLORS.LEADING];
  if (score >= TIER_THRESHOLDS.COMPETITIVE) return ['Competitive', TIER_COLORS.COMPETITIVE];
  if (score >= TIER_THRESHOLDS.NEEDS_WORK) return ['Needs Work', TIER_COLORS.NEEDS_WORK];
  return ['Critical', TIER_COLORS.CRITICAL];
}
