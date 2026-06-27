export type FindingSeverity = 'critical' | 'warning' | 'good';

export interface Finding {
  text: string;
  severity: FindingSeverity;
  kb_key?: string;
}

export interface SignalPoint {
  earned: number;
  max: number;
}

export type SignalPts = Record<string, SignalPoint>;

export type TierTuple = [label: string, color: string];

export interface KeywordScore {
  home_pos: number | null;
  best_pos: number | null;
  maps_pts: number;
  lf_best: number | null;
  lf_pts: number;
  total: number;
  type: string;
  service?: string;
}

export interface LeaderboardRow {
  category: string;
  label: string;
  count: number;
  pct: number;
  is_client: boolean;
}

export interface CategoryOpportunity {
  primary_clean: string;
  client_pct: number;
  client_in_board: boolean;
  market_fragmented: boolean;
  top_pct: number;
  leaderboard_all: LeaderboardRow[];
  leaderboard_nm: LeaderboardRow[];
  leaderboard_city: LeaderboardRow[];
  total_all: number;
  total_nm: number;
  total_city: number;
}

export interface CompetitorLeaderboardEntry {
  name: string;
  domain: string;
  appearances: number;
  avg_rank: number;
  rating: number | null;
  review_count: number | null;
}

export interface PriorityAction {
  rank: number;
  pillar: 'P1' | 'P2';
  action: string;
  effort: 'Low' | 'Medium' | 'High';
  impact: 'Low' | 'Medium' | 'High';
  why_now: string;
}

export type CompetitorDeltaAdvantage = 'client' | 'competitor' | 'neutral';

export interface CompetitorMetricDelta {
  metric: string;
  label: string;
  clientValue: number | null;
  competitorValue: number | null;
  delta: number | null;
  advantage: CompetitorDeltaAdvantage;
  formattedClient: string;
  formattedCompetitor: string;
  formattedDelta: string;
}

export interface CompetitorSurfaceRow {
  service: string;
  maps_nm: number | null;
  lf_nm: number | null;
  maps_city: number | null;
  lf_city: number | null;
  client_maps_nm: number | null;
  client_lf_nm: number | null;
  client_maps_city: number | null;
  client_lf_city: number | null;
}

export interface CompetitorCounterMove {
  rank: number;
  pillar: 'P1' | 'P2';
  surface: 'visibility' | 'reviews' | 'domain' | 'gbp' | 'content';
  action: string;
  rationale: string;
}

export interface CompetitorClientSnapshot {
  name: string;
  domain: string;
  rating: number | null;
  review_count: number;
  da: number;
  referring_domains: number;
  gbp_category: string;
  vis_score: number | null;
  appearances: number;
}

export interface CompetitorVisibilityStats {
  vis_score: number | null;
  appearances: number;
  maps_appearances: number;
  lf_appearances: number;
  avg_rank: number | null;
  frequency_near_me: number;
  frequency_city: number;
}

export interface CompetitorIntel {
  name: string;
  domain: string;
  rating: number | null;
  review_count: number;
  da: number;
  referring_domains: number;
  gbp_category: string;
  frequency_near_me: number;
  frequency_city: number;
  why_winning: string;
  surface_positions: Record<string, Record<string, number | null>>;
  action_callout: string | null;
  client: CompetitorClientSnapshot;
  visibility: CompetitorVisibilityStats;
  deltas: CompetitorMetricDelta[];
  why_factors: string[];
  surface_matrix: CompetitorSurfaceRow[];
  counter_moves: CompetitorCounterMove[];
  category_match: boolean;
  category_advantage: CompetitorDeltaAdvantage;
}

export interface CompetitorLeaderboardRow {
  rank: number;
  domain: string;
  name: string;
  is_client: boolean;
  is_primary: boolean;
  appearances: number;
  maps_appearances: number;
  lf_appearances: number;
  avg_rank: number;
  vis_score: number;
  rating: number | null;
  review_count: number | null;
  da: number | null;
  referring_domains: number | null;
  category: string;
  frequency_near_me: number;
  frequency_city: number;
}

export interface CategoryScoreBase {
  score: number;
  tier: TierTuple;
  weight: string;
  findings: Finding[];
}

export interface GbpCategoryScore extends CategoryScoreBase {
  category_opportunity: CategoryOpportunity | null;
  signal_pts: SignalPts;
}

export interface MappackCategoryScore extends CategoryScoreBase {
  scenario: string;
  kw_3pack: string[];
  kw_city_visible: string[];
  kw_local_visible: string[];
  kw_invisible: string[];
  keyword_scores: Record<string, KeywordScore>;
  unexpected_3pack: unknown[];
  near_miss: unknown[];
  competitor_leaderboard: CompetitorLeaderboardEntry[];
  local_reach: number;
  regional_reach: number;
  near_me_score: number;
  city_score: number;
  diagnosis: string;
}

export interface OnpageCategoryScore extends CategoryScoreBase {
  signal_pts: SignalPts;
}

export interface TrustCategoryScore extends CategoryScoreBase {
  da?: number;
  referring_domains?: number;
  signal_pts: SignalPts;
}

export interface PerformanceCategoryScore extends Omit<CategoryScoreBase, 'score'> {
  score: number | null;
  data_source?: string;
  signal_pts: SignalPts;
}

export interface ConversionCategoryScore extends CategoryScoreBase {
  signal_pts: SignalPts;
}

export interface UxCategoryScore extends CategoryScoreBase {
  signal_pts: SignalPts;
}

export interface ScoreCategories {
  gbp_strength: GbpCategoryScore;
  mappack: MappackCategoryScore;
  onpage: OnpageCategoryScore;
  trust: TrustCategoryScore;
  performance: PerformanceCategoryScore;
  conversion: ConversionCategoryScore;
  ux: UxCategoryScore;
}

import type { ReportMetadata } from './report.js';

export interface Scores {
  p1: number;
  p2: number;
  profile: string;
  p1_tier: TierTuple;
  p2_tier: TierTuple;
  categories: ScoreCategories;
  actions: PriorityAction[];
  serp_data: Record<string, unknown>;
  labs_data: Record<string, unknown>;
  competitor_intel: CompetitorIntel | null;
  competitor_leaderboard?: CompetitorLeaderboardRow[];
  report?: ReportMetadata;
  partial?: boolean;
  partialReasons?: string[];
}
