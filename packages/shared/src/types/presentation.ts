/** Sample / portal-only presentation data — not from live scan collection. */

export interface DashboardSectionActionPresentation {
  name: string;
  effort: string;
  impact: string;
  rank: number;
}

export interface DashboardSectionPresentation {
  categoryId: string;
  synopsis: string;
  actions: DashboardSectionActionPresentation[];
}

export interface PortalTaskPresentation {
  id: number;
  rank: number;
  pillar: 'P1' | 'P2';
  name: string;
  effort: string;
  impact: string;
  why: string;
  steps: string[];
  chips: string[];
}

export interface Ga4ChannelRow {
  name: string;
  sessions: number;
  pct: number;
}

export interface Ga4PageRow {
  path: string;
  sessions: number;
  bounceRate: number;
}

export interface Ga4ActionItem {
  severity: 'critical' | 'important' | 'positive';
  text: string;
}

export interface Ga4SamplePresentation {
  source: 'sample';
  periodLabel: string;
  totalSessions: number;
  engagedSessions: number;
  engagementRate: number;
  conversionsTracked: number;
  p2ScoreConfirmed: number;
  p2ConfirmationText: string;
  channels: Ga4ChannelRow[];
  topPages: Ga4PageRow[];
  actionItems: Ga4ActionItem[];
}

export interface GscKeywordOpportunity {
  query: string;
  tier: 'Position Gap' | 'Concentrated' | 'Untapped';
  impressions: number;
  clicks: number;
  ctr: number;
  avgPosition: number;
  rationale: string;
}

export interface GscClusterRow {
  name: string;
  tier: string;
  clicks: number;
  avgPosition: number;
  ctr: number;
  barWidthPct: number;
}

export interface GscSamplePresentation {
  source: 'sample';
  periodLabel: string;
  totalClicks: number;
  totalImpressions: number;
  avgCtr: number;
  avgPosition: number;
  keywordOpportunities: GscKeywordOpportunity[];
  topQueries: Array<{ query: string; impressions: number }>;
  clusters: GscClusterRow[];
}

export interface ReportCatalogItem {
  title: string;
  description: string;
  meta: string;
  format: 'pdf' | 'csv';
  icon: 'report' | 'radar' | 'chart' | 'map';
}

export interface CompetitorExplorerClient {
  name: string;
  domain: string;
  da: number;
  reviews: number;
  rating: number;
}

export interface CompetitorExplorerOriginRow {
  name: string;
  maps: number | null;
  lf: number | null;
}

export interface CompetitorExplorerCompetitor {
  rank: number;
  name: string;
  domain: string;
  da: number | null;
  rds: number | null;
  reviews: number | null;
  rating: number | null;
  mapsApp: number;
  lfApp: number;
  svc: string | null;
}

export interface CompetitorExplorerSurface {
  origins: CompetitorExplorerOriginRow[];
  clientAvg: number | null;
  clientApp: number;
  insight: string;
  comps: CompetitorExplorerCompetitor[];
}

export interface CompetitorExplorerService {
  service: string;
  nearMe: CompetitorExplorerSurface;
  city: CompetitorExplorerSurface;
}

export interface CompetitorExplorerPresentation {
  client: CompetitorExplorerClient;
  services: CompetitorExplorerService[];
}

export interface RankMapOrigin {
  id: string;
  name: string;
  zcta: string;
  dist: number;
  lat: number;
  lng: number;
  type: 'near_me' | 'city';
}

export interface RankMapServiceData {
  nm: Record<string, number | null>;
  nmLf: Record<string, number | null>;
  city: Record<string, number | null>;
  cityLf: Record<string, number | null>;
}

export interface RankMapPresentation {
  biz: { lat: number; lng: number; name: string };
  services: string[];
  origins: RankMapOrigin[];
  data: Record<string, RankMapServiceData>;
}

export interface PortalPresentation {
  source: 'sample';
  seedKey: 'kitchen747-portal-v1';
  tasks: PortalTaskPresentation[];
  dashboardSections: DashboardSectionPresentation[];
  competitors: CompetitorExplorerPresentation;
  rankMap: RankMapPresentation;
  ga4: Ga4SamplePresentation;
  gsc: GscSamplePresentation;
  reports: ReportCatalogItem[];
}
