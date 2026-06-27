import type { PageSpeedData, PsiAccessibility } from '@growthpath/shared';
import type { ScanEngineContext } from '../types.js';

const PSI_NULL: PageSpeedData = {
  performance: null,
  accessibility: null,
  best_practices: null,
  seo_score: null,
  ttfb_ms: null,
  cls: null,
  tbt_ms: null,
  unused_js_kib: null,
  unused_css_kib: null,
};

export function extractPsiMetrics(data: unknown): PageSpeedData {
  const d = data as {
    lighthouseResult?: {
      categories?: Record<string, { score?: number }>;
      audits?: Record<string, { score?: number; numericValue?: number; details?: { overallSavingsBytes?: number } }>;
    };
  };
  const lh = d.lighthouseResult ?? {};
  const cats = lh.categories ?? {};
  const audits = lh.audits ?? {};
  const perf = cats.performance?.score;
  const ttfb = audits['server-response-time']?.numericValue;
  return {
    performance: perf != null ? Math.round(perf * 100) : null,
    accessibility:
      cats.accessibility?.score != null ? Math.round(cats.accessibility.score * 100) : null,
    best_practices:
      cats['best-practices']?.score != null ? Math.round(cats['best-practices'].score * 100) : null,
    seo_score: cats.seo?.score != null ? Math.round(cats.seo.score * 100) : null,
    ttfb_ms: ttfb != null ? Math.round(ttfb) : null,
    cls: audits['cumulative-layout-shift']?.numericValue ?? null,
    tbt_ms: audits['total-blocking-time']?.numericValue != null
      ? Math.round(audits['total-blocking-time'].numericValue)
      : null,
    unused_js_kib:
      audits['unused-javascript']?.details?.overallSavingsBytes != null
        ? Math.round(audits['unused-javascript'].details.overallSavingsBytes / 1024)
        : null,
    unused_css_kib:
      audits['unused-css-rules']?.details?.overallSavingsBytes != null
        ? Math.round(audits['unused-css-rules'].details.overallSavingsBytes / 1024)
        : null,
  };
}

export async function fetchPageSpeed(ctx: ScanEngineContext, url: string): Promise<PageSpeedData> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const data = await ctx.google.runPageSpeed(url, 'desktop');
      return extractPsiMetrics(data);
    } catch {
      // retry
    }
  }
  return { ...PSI_NULL };
}

export async function fetchPsiAccessibility(
  ctx: ScanEngineContext,
  url: string,
): Promise<PsiAccessibility> {
  try {
    const data = await ctx.google.runPageSpeed(url, 'mobile', 'accessibility');
    const audits = (data as { lighthouseResult?: { audits?: Record<string, { score?: number }> } })
      .lighthouseResult?.audits ?? {};
    return {
      psi_a11y_viewport: audits['meta-viewport']?.score ?? null,
      psi_a11y_target_size: audits['target-size']?.score ?? null,
      psi_a11y_color_contrast: audits['color-contrast']?.score ?? null,
    };
  } catch {
    return {
      psi_a11y_viewport: null,
      psi_a11y_target_size: null,
      psi_a11y_color_contrast: null,
    };
  }
}
