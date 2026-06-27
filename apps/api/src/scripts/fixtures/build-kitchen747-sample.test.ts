import { describe, expect, it } from 'vitest';
import { PROFILE_NAMES } from '@growthpath/shared';
import {
  buildKitchen747SamplePayload,
  KITCHEN747_SAMPLE_SEED_KEY,
} from './build-kitchen747-sample.js';

describe('buildKitchen747SamplePayload', () => {
  it('produces portal-aligned Kitchen 747 scores and presentation', () => {
    const payload = buildKitchen747SamplePayload();

    expect(payload.p1).toBe(42);
    expect(payload.p2).toBe(46);
    expect(payload.profile).toBe(PROFILE_NAMES.INVISIBLE_CLOSER);
    expect(payload.auditData.presentation?.seedKey).toBe(KITCHEN747_SAMPLE_SEED_KEY);
    expect(payload.auditData.presentation?.tasks).toHaveLength(5);
    expect(payload.auditData.presentation?.dashboardSections).toHaveLength(7);
    expect(
      payload.auditData.presentation?.dashboardSections.every((section) => section.synopsis.length > 0),
    ).toBe(true);
    expect(
      payload.auditData.presentation?.dashboardSections.some(
        (section) => section.categoryId === 'gbp_strength',
      ),
    ).toBe(true);
    expect(payload.auditData.presentation?.competitors.services).toHaveLength(3);
    expect(payload.auditData.presentation?.rankMap.origins.length).toBeGreaterThan(0);
    expect(payload.auditData.presentation?.rankMap.origins.every((o) => o.lat && o.lng)).toBe(
      true,
    );
    expect(payload.auditData.presentation?.ga4.source).toBe('sample');
    expect(payload.scores.categories.mappack.score).toBe(36);
    expect(payload.scores.categories.gbp_strength.score).toBe(57);
    expect(payload.scores.actions.length).toBeGreaterThan(0);
  });
});
