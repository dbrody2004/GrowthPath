import { describe, expect, it } from 'vitest';
import { calculateScores } from './calculate-scores.js';
import { buildReportEvidence } from './build-report-evidence.js';
import { kitchen747AuditData } from './kitchen747.fixture.js';

describe('buildReportEvidence', () => {
  it('builds structured report metadata for Kitchen 747', () => {
    const scores = calculateScores(kitchen747AuditData);
    const report = scores.report ?? buildReportEvidence(kitchen747AuditData, scores);

    expect(report.explanation.profileRationale).toContain('Invisible Closer');
    expect(report.explanation.p1Summary).toContain('P1 42/100');
    expect(report.explanation.p2Summary).toContain('P2 46/100');
    expect(report.categories).toHaveLength(7);
  });

  it('includes signal evidence rows for GBP strength', () => {
    const scores = calculateScores(kitchen747AuditData);
    const gbpEvidence = scores.report?.categories.find((c) => c.categoryId === 'gbp_strength');

    expect(gbpEvidence).toBeDefined();
    expect(gbpEvidence?.signals.length).toBeGreaterThan(0);
    expect(gbpEvidence?.signals.some((s) => s.signalId === 'review_count')).toBe(true);
    expect(gbpEvidence?.signals[0]?.clientValue).toBeTruthy();
    expect(gbpEvidence?.ruleOutcomes.length).toBe(gbpEvidence?.signals.length);
  });

  it('includes mappack reach evidence without signal_pts', () => {
    const scores = calculateScores(kitchen747AuditData);
    const mappackEvidence = scores.report?.categories.find((c) => c.categoryId === 'mappack');

    expect(mappackEvidence?.signals.some((s) => s.signalId === 'near_me_reach')).toBe(true);
    expect(mappackEvidence?.assessment).toContain('/100');
  });

  it('builds appendix collection diagnostics, kb keys, and remediation sections', () => {
    const scores = calculateScores(kitchen747AuditData);
    const appendix = scores.report?.appendix;

    expect(appendix?.collectionStatus.length).toBeGreaterThan(0);
    expect(appendix?.collectionStatus.some((s) => s.source === 'Google Business Profile')).toBe(true);
    expect(appendix?.signalAvailability.gbp_strength).toBe('available');
    expect(Array.isArray(appendix?.triggeredKbKeys)).toBe(true);
    expect(appendix?.remediation.length).toBe(5);
    expect(appendix?.remediation[0]?.id).toBe('gbp');
  });

  it('maps UX responsive client value from responsive_score', () => {
    const scores = calculateScores(kitchen747AuditData);
    const uxEvidence = scores.report?.categories.find((c) => c.categoryId === 'ux');

    expect(uxEvidence).toBeDefined();
    const responsive = uxEvidence?.signals.find((s) => s.signalId === 'responsive');
    expect(responsive?.clientValue).toBe('4/4 responsive signals');
    expect(responsive?.earned).toBeGreaterThan(0);
  });

  it('does not change Kitchen 747 headline scores', () => {
    const scores = calculateScores(kitchen747AuditData);
    expect(scores.p1).toBe(42);
    expect(scores.p2).toBe(46);
    expect(scores.profile).toBe('The Invisible Closer');
  });
});
