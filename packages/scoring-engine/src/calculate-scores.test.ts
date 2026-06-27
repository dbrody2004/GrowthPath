import { describe, expect, it } from 'vitest';
import {
  CATEGORY_DISPLAY_WEIGHTS,
  PROFILE_NAMES,
  P1_WEIGHTS,
  P2_WEIGHTS,
} from '@growthpath/shared';
import {
  calculateScores,
  evaluateSchema,
  getRecommendedSchema,
  getTier,
  normalizeVertical,
  scoreConversionInfrastructure,
  scoreDomainTrust,
  scoreGbpStrength,
  scoreMobilePerformance,
  scoreMobileUx,
  scoreOnpageRelevance,
  scoreSearchVisibility,
} from './index.js';
import { kitchen747AuditData } from './kitchen747.fixture.js';

describe('getTier', () => {
  it('maps score bands to tier labels', () => {
    expect(getTier(80)[0]).toBe('Leading');
    expect(getTier(60)[0]).toBe('Competitive');
    expect(getTier(30)[0]).toBe('Needs Work');
    expect(getTier(10)[0]).toBe('Critical');
  });
});

describe('schema helpers', () => {
  it('recommends Restaurant for restaurant primary type', () => {
    expect(getRecommendedSchema('restaurant')).toBe('Restaurant');
  });

  it('scores org-only schema at 8 points', () => {
    const result = evaluateSchema('restaurant', ['Organization', 'WebPage']);
    expect(result.status).toBe('org_only');
    expect(result.score_pts).toBe(8);
  });
});

describe('normalizeVertical', () => {
  it('maps Food & Beverage intake to restaurant', () => {
    expect(normalizeVertical('Food & Beverage')).toBe('restaurant');
  });
});

describe('category scorers', () => {
  it('scores mobile performance from PSI metrics', () => {
    const [score] = scoreMobilePerformance({
      performance: 38,
      ttfb_ms: 5,
      cls: 0.492,
      tbt_ms: 742,
      unused_js_kib: 162,
      unused_css_kib: 70,
    });
    expect(score).toBe(21);
  });

  it('scores conversion infrastructure for toast booking without analytics', () => {
    const [score] = scoreConversionInfrastructure(
      {
        booking_path_type: 'named_platform',
        booking_platforms: ['toast'],
        click_to_call: false,
        ga4: false,
        gtm: true,
      },
      'restaurant',
    );
    expect(score).toBe(40);
  });

  it('scores mobile UX with strong responsive signals', () => {
    const [score] = scoreMobileUx(
      {
        viewport_exists: true,
        viewport_has_width_device: true,
        viewport_blocks_zoom: false,
        responsive_score: 4,
        has_media_queries: true,
        has_responsive_markers: true,
        has_responsive_images: true,
        has_mobile_nav: true,
      },
      { psi_a11y_target_size: 1.0, psi_a11y_color_contrast: 0.0 },
    );
    expect(score).toBe(90);
  });
});

describe('calculateScores', () => {
  it('uses corrected P1 display weights on categories', () => {
    const scores = calculateScores(kitchen747AuditData);
    expect(scores.categories.gbp_strength.weight).toBe(CATEGORY_DISPLAY_WEIGHTS.gbp_strength);
    expect(scores.categories.mappack.weight).toBe(CATEGORY_DISPLAY_WEIGHTS.mappack);
    expect(scores.categories.onpage.weight).toBe(CATEGORY_DISPLAY_WEIGHTS.onpage);
    expect(scores.categories.trust.weight).toBe(CATEGORY_DISPLAY_WEIGHTS.trust);
  });

  it('computes P1 from 20/60/10/10 category weights', () => {
    const scores = calculateScores(kitchen747AuditData);
    const expected = Math.round(
      scores.categories.gbp_strength.score * P1_WEIGHTS.gbp +
        scores.categories.mappack.score * P1_WEIGHTS.mappack +
        scores.categories.onpage.score * P1_WEIGHTS.onpage +
        scores.categories.trust.score * P1_WEIGHTS.trust,
    );
    expect(scores.p1).toBe(expected);
  });

  it('computes P2 from performance/conversion/ux weights', () => {
    const scores = calculateScores(kitchen747AuditData);
    const expected = Math.round(
      (scores.categories.performance.score ?? 0) * P2_WEIGHTS.performance +
        scores.categories.conversion.score * P2_WEIGHTS.conversion +
        scores.categories.ux.score * P2_WEIGHTS.ux,
    );
    expect(scores.p2).toBe(expected);
  });

  it('produces Kitchen 747 portal scores and Invisible Closer profile', () => {
    const scores = calculateScores(kitchen747AuditData);

    expect(scores.p1).toBe(42);
    expect(scores.p2).toBe(46);
    expect(scores.profile).toBe(PROFILE_NAMES.INVISIBLE_CLOSER);

    expect(scores.categories.mappack.score).toBe(36);
    expect(scores.categories.gbp_strength.score).toBe(57);
    expect(scores.categories.onpage.score).toBe(36);
    expect(scores.categories.trust.score).toBe(54);
    expect(scores.categories.performance.score).toBe(21);
    expect(scores.categories.conversion.score).toBe(40);
    expect(scores.categories.ux.score).toBe(90);
  });

  it('scores search visibility with equal-weight near-me origins and 70/30 peak/breadth', () => {
    const result = scoreSearchVisibility(
      kitchen747AuditData.serp,
      kitchen747AuditData.local_finder,
      'restaurant',
      kitchen747AuditData.keywords,
    );
    expect(result.nearMeScore).toBe(35);
    expect(result.categoryScore).toBe(36);
    expect(result.kw3pack.has('burgers near me')).toBe(true);
    expect(result.nearMiss.some((entry) => entry.keyword === 'live music near me')).toBe(true);
  });

  it('scores Kitchen 747 GBP strength at 57', () => {
    const [score] = scoreGbpStrength(
      kitchen747AuditData.gbp,
      kitchen747AuditData.gbp_posts,
      kitchen747AuditData.owner_services,
      'restaurant',
      kitchen747AuditData.serp,
    );
    expect(score).toBe(57);
  });

  it('scores Kitchen 747 domain trust at 54', () => {
    const [score] = scoreDomainTrust(kitchen747AuditData.whois, kitchen747AuditData.moz, 'restaurant');
    expect(score).toBe(54);
  });

  it('scores Kitchen 747 on-page relevance at 36', () => {
    const [score] = scoreOnpageRelevance(
      kitchen747AuditData.html,
      'Roseville CA 95747',
      kitchen747AuditData.content_depth,
      'restaurant',
    );
    expect(score).toBe(36);
  });
});
