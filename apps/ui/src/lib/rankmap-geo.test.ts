import { describe, expect, it } from 'vitest';
import { kitchen747PortalPresentation } from '@growthpath/shared';
import { kitchen747AuditData } from '@growthpath/scoring-engine';
import { buildGeoPoints } from './rankmap-geo.js';

describe('buildGeoPoints', () => {
  it('falls back to presentation.rankMap when trade_area origins are empty', () => {
    const auditData = {
      ...kitchen747AuditData,
      presentation: kitchen747PortalPresentation,
    };

    const geo = buildGeoPoints({
      auditData,
      service: 'Burgers',
      keywordType: 'near_me',
      surface: 'both',
    });

    expect(geo.biz).not.toBeNull();
    expect(geo.biz?.lat).toBeCloseTo(38.771156, 4);
    expect(geo.points.length).toBeGreaterThan(0);
    expect(geo.points.every((p) => p.lat && p.lng)).toBe(true);
    expect(geo.points.some((p) => p.mapsPos === 1)).toBe(true);
  });

  it('uses trade_area origins when populated', () => {
    const auditData = {
      ...kitchen747AuditData,
      trade_area: {
        ...kitchen747AuditData.trade_area,
        near_me_origins: [
          {
            zcta: '95747',
            lat: 38.7821,
            lng: -121.3732,
            dist_mi: 0.51,
            pop: 10000,
            name: 'Westpark (0.51mi)',
          },
        ],
        city_origins: [],
      },
    };

    const geo = buildGeoPoints({
      auditData,
      service: 'burgers',
      keywordType: 'near_me',
      surface: 'both',
    });

    expect(geo.points).toHaveLength(1);
    expect(geo.points[0]?.name).toContain('Westpark');
  });

  it('filters sample origins by keyword type', () => {
    const auditData = {
      ...kitchen747AuditData,
      presentation: kitchen747PortalPresentation,
    };

    const nearMe = buildGeoPoints({
      auditData,
      service: 'Burgers',
      keywordType: 'near_me',
      surface: 'both',
    });
    const city = buildGeoPoints({
      auditData,
      service: 'Burgers',
      keywordType: 'city',
      surface: 'both',
    });

    expect(nearMe.points.every((p) => p.type === 'near_me')).toBe(true);
    expect(city.points.every((p) => p.type === 'city')).toBe(true);
    expect(city.points.length).toBeGreaterThan(nearMe.points.length);
  });
});
