import { describe, expect, it } from 'vitest';
import { kitchen747PortalPresentation } from './kitchen747-portal-presentation.js';

describe('kitchen747PortalPresentation', () => {
  it('maps competitors explorer with three services', () => {
    expect(kitchen747PortalPresentation.competitors.services).toHaveLength(3);
    expect(kitchen747PortalPresentation.competitors.services.map((s) => s.service)).toEqual([
      'Burgers',
      'Pizza',
      'Live Music',
    ]);

    const burgers = kitchen747PortalPresentation.competitors.services[0];
    expect(burgers?.nearMe.insight.length).toBeGreaterThan(0);
    expect(burgers?.nearMe.comps.length).toBeGreaterThan(0);
    expect(burgers?.nearMe.origins[0]?.maps).toBe(1);
  });

  it('maps rankMap with geo origins and per-service data', () => {
    const { rankMap } = kitchen747PortalPresentation;

    expect(rankMap.services).toContain('Burgers');
    expect(rankMap.origins.length).toBeGreaterThan(0);
    expect(rankMap.origins.every((o) => o.lat && o.lng)).toBe(true);
    expect(rankMap.data.Burgers?.nm.z95747).toBe(1);
    expect(rankMap.biz.lat).toBeCloseTo(38.771156, 4);
  });
});
