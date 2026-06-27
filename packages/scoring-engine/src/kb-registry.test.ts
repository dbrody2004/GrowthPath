import { describe, expect, it } from 'vitest';
import { KB_REGISTRY, isKbKey } from './kb-registry.js';
import { calculateScores } from './calculate-scores.js';
import { buildReportEvidence } from './build-report-evidence.js';
import { kitchen747AuditData } from './kitchen747.fixture.js';

describe('KB_REGISTRY', () => {
  it('resolves every kb_key emitted by Kitchen 747 scoring', () => {
    const scores = calculateScores(kitchen747AuditData);
    const report = scores.report ?? buildReportEvidence(kitchen747AuditData, scores);
    const keys = report.appendix.triggeredKbKeys;

    expect(keys.length).toBeGreaterThan(0);
    for (const key of keys) {
      expect(isKbKey(key), `missing registry entry for ${key}`).toBe(true);
      expect(KB_REGISTRY[key as keyof typeof KB_REGISTRY].title.length).toBeGreaterThan(0);
    }
  });

  it('orders Kitchen 747 remediation into five section bands', () => {
    const scores = calculateScores(kitchen747AuditData);
    const sections = scores.report!.appendix.remediation;

    expect(sections.map((s) => s.id)).toEqual(['gbp', 'onpage', 'trust', 'performance', 'conversion']);
    expect(sections[0]!.entries[0]!.key).toBe('GBP_CATEGORY_PRIMARY');
    expect(sections[0]!.entries.every((entry, index, arr) =>
      index === 0 || entry.priority >= arr[index - 1]!.priority,
    )).toBe(true);
  });
});
