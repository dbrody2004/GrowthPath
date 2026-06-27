import { describe, expect, it } from 'vitest';
import { EXPORT_STRATEGY, OPERATOR_ONLY_SECTIONS, SHAREABLE_REPORT_SECTIONS } from './export-scope.js';

describe('export scope', () => {
  it('defines client-shareable sections', () => {
    expect(SHAREABLE_REPORT_SECTIONS).toContain('score_header');
    expect(SHAREABLE_REPORT_SECTIONS).toContain('keywords');
    expect(SHAREABLE_REPORT_SECTIONS).not.toContain('scan_retry_controls');
  });

  it('lists operator-only sections separately', () => {
    expect(OPERATOR_ONLY_SECTIONS).toContain('collection_operator_table');
    expect(OPERATOR_ONLY_SECTIONS).toContain('triggered_kb_keys');
  });

  it('documents export strategy decision', () => {
    expect(EXPORT_STRATEGY.primary).toBe('browser_print');
    expect(EXPORT_STRATEGY.serverPdf).toBe('playwright_print_url');
  });
});
