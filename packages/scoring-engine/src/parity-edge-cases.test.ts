import { describe, expect, it } from 'vitest';
import {
  buildPriorityActions,
  calculateScores,
  scoreConversionInfrastructure,
  scoreSearchVisibility,
} from './index.js';
import { kitchen747AuditData } from './kitchen747.fixture.js';

describe('parity edge cases', () => {
  it('scores invisible business with zero map pack category score', () => {
    const invisibleSerp = {
      'plumber near me': {
        service: 'plumber',
        type: 'near_me' as const,
        origins: {
          z0: { name: 'Origin', dist_mi: 1, pop: 1000, pos: null, top3: [] },
        },
      },
    };

    const result = scoreSearchVisibility(invisibleSerp, {}, 'service', [
      { keyword: 'plumber near me', service: 'plumber', type: 'near_me' },
    ]);

    expect(result.categoryScore).toBe(0);
    expect(result.scenario).toBe('C');
    expect(result.kw3pack.size).toBe(0);
    expect(result.findings.some((f) => f.severity === 'critical')).toBe(true);
  });

  it('adds near-miss priority action from rank 4–10 keywords', () => {
    const serp = {
      'burgers near me': {
        service: 'burgers',
        type: 'near_me' as const,
        origins: {
          z0: { name: 'Origin', dist_mi: 0.5, pop: 1000, pos: 4, top3: [] },
        },
      },
    };
    const lf = {
      'burgers near me': {
        service: 'burgers',
        type: 'near_me' as const,
        origins: {
          z0: { name: 'Origin', dist_mi: 0.5, pop: 1000, pos: 4, top3: [] },
        },
      },
    };

    const visibility = scoreSearchVisibility(serp, lf, 'restaurant', [
      { keyword: 'burgers near me', service: 'burgers', type: 'near_me' },
    ]);

    const actions = buildPriorityActions(
      { ga4: true, gtm: true, click_to_call: true, booking_path_type: 'named_platform' },
      serp,
      { all_3pack_keywords: [], near_miss_keywords: [], total_3pack_count: 0 },
      visibility.kw3pack,
      visibility.kwCityVisible,
      visibility.kwLocalVisible,
      visibility.kwInvisible,
      visibility.nearMiss,
      [],
      'restaurant',
      'restaurant',
    );

    expect(visibility.nearMiss[0]?.keyword).toBe('burgers near me');
    expect(actions.some((a) => a.action.includes('near-miss'))).toBe(true);
  });

  it('scores home trade quote form above generic contact-only path', () => {
    const [quoteScore] = scoreConversionInfrastructure(
      { booking_path_type: 'quote_form', click_to_call: true, ga4: true, gtm: true },
      'home_trade',
    );
    const [contactScore] = scoreConversionInfrastructure(
      { booking_path_type: 'contact_form_only', click_to_call: true, ga4: true, gtm: true },
      'home_trade',
    );

    expect(quoteScore).toBeGreaterThan(contactScore);
  });

  it('derives Kitchen 747 3-pack keywords without changing category score', () => {
    const scores = calculateScores(kitchen747AuditData);

    expect(scores.categories.mappack.score).toBe(36);
    expect(scores.categories.mappack.kw_3pack).toContain('burgers near me');
    expect(scores.categories.mappack.kw_3pack).toContain('pizza near me');
    expect(scores.categories.mappack.near_miss.length).toBeGreaterThan(0);
  });
});
