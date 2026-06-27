import { describe, expect, it } from 'vitest';
import { evaluatePageSpeed, runSource } from './run-source.js';

describe('runSource', () => {
  it('retries transient failures then succeeds', async () => {
    let attempts = 0;
    const { data, meta } = await runSource(
      { sourceId: 'pagespeed', evaluate: evaluatePageSpeed },
      async () => {
        attempts += 1;
        if (attempts < 2) throw new Error('timeout while calling vendor');
        return { performance: 80, accessibility: null, best_practices: null, seo_score: null, ttfb_ms: null, cls: null, tbt_ms: null, unused_js_kib: null, unused_css_kib: null };
      },
    );

    expect(data.performance).toBe(80);
    expect(meta.status).toBe('ok');
    expect(meta.retryCount).toBe(1);
  });

  it('evaluates missing PageSpeed as missing status', async () => {
    const { meta } = await runSource(
      { sourceId: 'pagespeed', evaluate: evaluatePageSpeed },
      async () => ({
        performance: null,
        accessibility: null,
        best_practices: null,
        seo_score: null,
        ttfb_ms: null,
        cls: null,
        tbt_ms: null,
        unused_js_kib: null,
        unused_css_kib: null,
      }),
    );
    expect(meta.status).toBe('missing');
    expect(meta.detail).toContain('PageSpeed');
  });
});
