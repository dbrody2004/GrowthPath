import type {
  CompetitorExplorerCompetitor,
  CompetitorExplorerPresentation,
  CompetitorExplorerService,
  CompetitorExplorerSurface,
  DashboardSectionPresentation,
  PortalPresentation,
  PortalTaskPresentation,
  RankMapPresentation,
  RankMapServiceData,
} from '../types/presentation.js';
import { kitchen747PortalRaw as portalRaw } from './kitchen747-portal.raw.js';

const PORTAL_SECTION_TO_CATEGORY: Record<string, string> = {
  gbp: 'gbp_strength',
};

function mapPortalSectionId(id: string): string {
  return PORTAL_SECTION_TO_CATEGORY[id] ?? id;
}

type RawSection = {
  id: string;
  synopsis: string;
  actions: ReadonlyArray<{
    name: string;
    effort: string;
    impact: string;
    rank: number;
  }>;
};

function mapDashboardSections(raw: ReadonlyArray<RawSection>): DashboardSectionPresentation[] {
  return raw.map((section) => ({
    categoryId: mapPortalSectionId(section.id),
    synopsis: section.synopsis,
    actions: section.actions.map((action) => ({
      name: action.name,
      effort: action.effort,
      impact: action.impact,
      rank: action.rank,
    })),
  }));
}

type RawTask = {
  id: number;
  rank: number;
  pillar: 'P1' | 'P2';
  name: string;
  effort: string;
  impact: string;
  why: string;
  steps: readonly string[];
  chips: readonly string[];
};

function mapTasks(raw: ReadonlyArray<RawTask>): PortalTaskPresentation[] {
  return raw.map((task) => ({
    id: task.id,
    rank: task.rank,
    pillar: task.pillar,
    name: task.name,
    effort: task.effort,
    impact: task.impact,
    why: task.why,
    steps: [...task.steps],
    chips: [...task.chips],
  }));
}

type RawCompSurface = {
  origins: ReadonlyArray<{ name: string; maps: number | null; lf: number | null }>;
  client_avg: number | null;
  client_app: number;
  insight: string;
  comps: ReadonlyArray<{
    rank: number;
    name: string;
    domain: string;
    da: number | null;
    rds: number | null;
    reviews: number | null;
    rating: number | null;
    maps_app: number;
    lf_app: number;
    avg_rank: number | null;
    svc: string | null;
  }>;
};

function mapCompSurface(raw: RawCompSurface): CompetitorExplorerSurface {
  return {
    origins: raw.origins.map((origin) => ({
      name: origin.name,
      maps: origin.maps,
      lf: origin.lf,
    })),
    clientAvg: raw.client_avg,
    clientApp: raw.client_app,
    insight: raw.insight,
    comps: raw.comps.map(
      (comp): CompetitorExplorerCompetitor => ({
        rank: comp.rank,
        name: comp.name,
        domain: comp.domain,
        da: comp.da,
        rds: comp.rds,
        reviews: comp.reviews,
        rating: comp.rating,
        mapsApp: comp.maps_app,
        lfApp: comp.lf_app,
        svc: comp.svc,
      }),
    ),
  };
}

function mapCompetitors(): CompetitorExplorerPresentation {
  const services: CompetitorExplorerService[] = Object.entries(portalRaw.COMP_DATA).map(
    ([service, data]) => ({
      service,
      nearMe: mapCompSurface(data.near_me as RawCompSurface),
      city: mapCompSurface(data.city as RawCompSurface),
    }),
  );

  return {
    client: {
      name: portalRaw.CLIENT_COMP.name,
      domain: portalRaw.CLIENT_COMP.domain,
      da: portalRaw.CLIENT_COMP.da,
      reviews: portalRaw.CLIENT_COMP.reviews,
      rating: portalRaw.CLIENT_COMP.rating,
    },
    services,
  };
}

function mapRankMap(): RankMapPresentation {
  const mapData = portalRaw.MAP_DATA as Record<
    string,
    {
      nm: Record<string, number | null>;
      nm_lf: Record<string, number | null>;
      city: Record<string, number | null>;
      city_lf: Record<string, number | null>;
    }
  >;

  const data: Record<string, RankMapServiceData> = {};
  for (const [service, svc] of Object.entries(mapData)) {
    data[service] = {
      nm: { ...svc.nm },
      nmLf: { ...svc.nm_lf },
      city: { ...svc.city },
      cityLf: { ...svc.city_lf },
    };
  }

  return {
    biz: {
      lat: portalRaw.BIZ_MAP.lat,
      lng: portalRaw.BIZ_MAP.lng,
      name: portalRaw.BIZ_MAP.name,
    },
    services: Object.keys(mapData),
    origins: portalRaw.MAP_ORIGINS.map((origin) => ({
      id: origin.id,
      name: origin.name,
      zcta: origin.zcta,
      dist: origin.dist,
      lat: origin.lat,
      lng: origin.lng,
      type: origin.type as 'near_me' | 'city',
    })),
    data,
  };
}

/** GA4 / GSC tabs from growthpath-portal-kitchen747-v1_0.html (labeled sample in prototype). */
export const kitchen747PortalPresentation: PortalPresentation = {
  source: 'sample',
  seedKey: 'kitchen747-portal-v1',
  tasks: mapTasks(portalRaw.TASKS),
  dashboardSections: mapDashboardSections(portalRaw.SECTIONS),
  competitors: mapCompetitors(),
  rankMap: mapRankMap(),
  ga4: {
    source: 'sample',
    periodLabel: 'Last 90 days · kitchen747.com',
    totalSessions: 2841,
    engagedSessions: 1204,
    engagementRate: 42,
    conversionsTracked: 0,
    p2ScoreConfirmed: 46,
    p2ConfirmationText:
      'Zero conversion events configured despite Boulevard-equivalent booking infrastructure — no call tracking, no form submission events, no contact page goals. 58% of sessions bounce from the homepage without engaging. Mobile sessions are 71% of total traffic, confirming the urgency of mobile CTA placement flagged in the scan.',
    channels: [
      { name: 'Organic Search', sessions: 1079, pct: 38 },
      { name: 'Direct', sessions: 710, pct: 25 },
      { name: 'Social', sessions: 426, pct: 15 },
      { name: 'Referral', sessions: 341, pct: 12 },
      { name: 'Paid Search', sessions: 285, pct: 10 },
    ],
    topPages: [
      { path: '/ (Homepage)', sessions: 1248, bounceRate: 62 },
      { path: '/burgers', sessions: 402, bounceRate: 44 },
      { path: '/pizza', sessions: 318, bounceRate: 41 },
      { path: '/contact', sessions: 247, bounceRate: 31 },
      { path: '/menu', sessions: 198, bounceRate: 48 },
      { path: '/live-music', sessions: 144, bounceRate: 52 },
    ],
    actionItems: [
      {
        severity: 'critical',
        text: 'Set up conversion events — phone clicks, form submissions, contact page visits. Currently zero conversions are tracked.',
      },
      {
        severity: 'important',
        text: 'Homepage bounce rate (62%) above the 45% benchmark. Add a mobile CTA above the fold.',
      },
      {
        severity: 'positive',
        text: 'Organic search is the #1 traffic source at 38% — local SEO investment is already generating qualified visitors.',
      },
    ],
  },
  gsc: {
    source: 'sample',
    periodLabel: '90-day organic search performance · kitchen747.com',
    totalClicks: 844,
    totalImpressions: 18240,
    avgCtr: 4.6,
    avgPosition: 14.2,
    keywordOpportunities: [
      {
        query: 'burgers near me',
        tier: 'Position Gap',
        impressions: 2840,
        clicks: 142,
        ctr: 5.0,
        avgPosition: 11.4,
        rationale:
          'Ranking on page 2 with strong impressions — you are visible but not capturing clicks. A page title update and content depth improvement on the burgers page could push this to page 1.',
      },
      {
        query: 'burgers roseville',
        tier: 'Concentrated',
        impressions: 1920,
        clicks: 218,
        ctr: 11.4,
        avgPosition: 4.2,
        rationale:
          'Your strongest keyword — top 5 organic position with high CTR. Maintain and protect this position with fresh content and review velocity.',
      },
      {
        query: 'pizza roseville',
        tier: 'Untapped',
        impressions: 4110,
        clicks: 41,
        ctr: 1.0,
        avgPosition: 28.4,
        rationale:
          'High impressions but position 28 — a dedicated pizza page with location-specific content could unlock significant traffic. High-value intent.',
      },
      {
        query: 'live music roseville',
        tier: 'Untapped',
        impressions: 3280,
        clicks: 23,
        ctr: 0.7,
        avgPosition: 31.2,
        rationale:
          'Zero presence but high impressions — a dedicated live-music page and city-specific content would directly address this gap.',
      },
    ],
    topQueries: [
      { query: 'pizza roseville', impressions: 4110 },
      { query: 'live music roseville', impressions: 3280 },
      { query: 'burgers near me', impressions: 2840 },
      { query: 'burgers roseville', impressions: 1920 },
      { query: 'restaurant roseville', impressions: 1188 },
    ],
    clusters: [
      { name: 'Burgers', tier: 'Strong', clicks: 312, avgPosition: 8.4, ctr: 6.8, barWidthPct: 72 },
      { name: 'Pizza', tier: 'Healthy', clicks: 244, avgPosition: 5.9, ctr: 9.1, barWidthPct: 58 },
      { name: 'Menu', tier: 'Position gap', clicks: 88, avgPosition: 18.2, ctr: 1.4, barWidthPct: 35 },
      { name: 'Live Music', tier: 'Absent', clicks: 28, avgPosition: 42.1, ctr: 0.4, barWidthPct: 12 },
    ],
  },
  reports: [
    {
      title: 'Full Diagnostic Report',
      description:
        'Complete P1 + P2 analysis, all findings, scores, signal breakdowns, and action plan. PDF format, print-ready.',
      meta: 'Generated Apr 16, 2026 · 3 services · 16 pages',
      format: 'pdf',
      icon: 'report',
    },
    {
      title: 'Competitive Intelligence',
      description:
        'Full competitor breakdown across 3 services, 6 keywords, 18 origins. Maps + Local Finder rank grid, competitor profiles, service page URLs.',
      meta: 'Generated Apr 16, 2026 · 106 competitors',
      format: 'pdf',
      icon: 'radar',
    },
    {
      title: 'Position Data Export',
      description:
        'Client rank per keyword × origin × surface. Maps and Local Finder positions across all trade-area origins.',
      meta: 'Generated Apr 16, 2026 · 200 rows',
      format: 'csv',
      icon: 'map',
    },
  ],
};
