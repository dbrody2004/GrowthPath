import type { FindingSeverity } from './scores.js';

export type EvidenceTier = 'leading' | 'competitive' | 'needs_work' | 'critical' | 'unknown';

export type CollectionStatus = 'ok' | 'partial' | 'missing' | 'error';

export type SignalAvailability = 'available' | 'partial' | 'unavailable';

export type RuleOutcomeStatus = 'passed' | 'partial' | 'failed' | 'skipped';

export interface SignalEvidenceRow {
  signalId: string;
  label: string;
  earned: number;
  max: number;
  clientValue: string;
  targetLabel: string;
  targetTier: EvidenceTier;
  benchmarkNote?: string;
}

export interface RuleOutcomeRow {
  ruleId: string;
  label: string;
  status: RuleOutcomeStatus;
  points: string;
  rationale?: string;
}

export interface CategoryReportEvidence {
  categoryId: string;
  pillar: 'P1' | 'P2';
  displayName: string;
  assessment: string;
  benchmarkSummary?: string;
  signals: SignalEvidenceRow[];
  ruleOutcomes: RuleOutcomeRow[];
}

export interface CollectionDiagnostic {
  source: string;
  status: CollectionStatus;
  detail: string;
}

export type KbEffort = 'Low' | 'Medium' | 'High';
export type KbImpact = 'Critical' | 'High' | 'Medium';
export type KbSectionId = 'gbp' | 'onpage' | 'trust' | 'performance' | 'conversion';

export interface KbRemediationEntry {
  key: string;
  title: string;
  why: string;
  howGoogle: string;
  fixSteps: string[];
  priority: number;
  effort: KbEffort;
  impact: KbImpact;
}

export interface KbRemediationSection {
  id: KbSectionId;
  number: string;
  title: string;
  narrative: string;
  stat: string;
  statLabel: string;
  entries: KbRemediationEntry[];
}

export interface ReportAppendix {
  collectionStatus: CollectionDiagnostic[];
  triggeredKbKeys: string[];
  remediation: KbRemediationSection[];
  signalAvailability: Record<string, SignalAvailability>;
  notes: string[];
}

export interface ScoreExplanation {
  profileRationale: string;
  p1Summary: string;
  p2Summary: string;
}

export interface ReportMetadata {
  explanation: ScoreExplanation;
  categories: CategoryReportEvidence[];
  appendix: ReportAppendix;
}

export interface CategoryDisplayMeta {
  displayName: string;
  pillar: 'P1' | 'P2';
  benchmarkSummary?: string;
}

export type FindingLike = {
  text: string;
  severity: FindingSeverity;
  kb_key?: string;
};
