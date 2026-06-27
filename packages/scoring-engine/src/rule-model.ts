import type { Finding, SignalPts } from '@growthpath/shared';

export type RuleParityStatus = 'ported' | 'partial' | 'missing' | 'blocked' | 'obsolete';

export interface ScoredRuleResult {
  ruleId: string;
  earned: number;
  max: number;
  finding?: Finding;
}

export interface CategoryRuleResult {
  categoryId: string;
  score: number;
  findings: Finding[];
  signalPts: SignalPts;
  rules: ScoredRuleResult[];
}

export function ruleResult(
  ruleId: string,
  earned: number,
  max: number,
  finding?: Finding,
): ScoredRuleResult {
  return { ruleId, earned, max, finding };
}

export function signalPtsToRules(signalPts: SignalPts, prefix: string): ScoredRuleResult[] {
  return Object.entries(signalPts).map(([key, value]) =>
    ruleResult(`${prefix}.${key}`, value.earned, value.max),
  );
}

export function mergeCategoryRules(
  categoryId: string,
  score: number,
  findings: Finding[],
  signalPts: SignalPts,
  extraRules: ScoredRuleResult[] = [],
): CategoryRuleResult {
  return {
    categoryId,
    score,
    findings,
    signalPts,
    rules: [...signalPtsToRules(signalPts, categoryId), ...extraRules],
  };
}
