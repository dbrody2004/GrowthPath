import { describe, expect, it } from 'vitest';
import { mergeCategoryRules, ruleResult, signalPtsToRules } from './rule-model.js';

describe('rule-model', () => {
  it('builds scored rule results with stable ids', () => {
    const rule = ruleResult('conversion.booking', 30, 40);
    expect(rule).toEqual({ ruleId: 'conversion.booking', earned: 30, max: 40, finding: undefined });
  });

  it('maps signal points into category rules', () => {
    const rules = signalPtsToRules(
      {
        booking: { earned: 40, max: 40 },
        analytics: { earned: 25, max: 40 },
      },
      'conversion',
    );
    expect(rules).toEqual([
      { ruleId: 'conversion.booking', earned: 40, max: 40, finding: undefined },
      { ruleId: 'conversion.analytics', earned: 25, max: 40, finding: undefined },
    ]);
  });

  it('merges category metadata with rule inventory', () => {
    const category = mergeCategoryRules(
      'trust',
      54,
      [{ text: 'DA warning', severity: 'warning' }],
      { domain_authority: { earned: 20, max: 50 } },
      [ruleResult('trust.https', 10, 10)],
    );
    expect(category.rules).toHaveLength(2);
    expect(category.score).toBe(54);
  });
});
