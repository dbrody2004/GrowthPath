import { describe, expect, it, vi } from 'vitest';
import { scoreConversionInfrastructure } from '@growthpath/scoring-engine';
import type { ScanEngineContext } from '../types.js';
import { fetchHtml } from './html.js';

function mockCtx(responses: Array<{ status: number; body: string } | Error>): ScanEngineContext {
  let call = 0;
  return {
    fetch: vi.fn(async () => {
      const next = responses[call];
      call += 1;
      if (next instanceof Error) {
        throw next;
      }
      return {
        status: next.status,
        text: async () => next.body,
      } as Response;
    }),
  } as unknown as ScanEngineContext;
}

describe('fetchHtml', () => {
  it('retries once on transient HTTP failures', async () => {
    const ctx = mockCtx([
      { status: 503, body: 'Unavailable' },
      {
        status: 200,
        body: '<html><head><title>Acme Plumbing</title></head><body><a href="tel:5551234">Call</a></body></html>',
      },
    ]);

    const html = await fetchHtml(ctx, 'https://example.com', 'Home & Professional Services');
    expect(html.fetch_attempts).toBe(2);
    expect(html.html_fetch_error).toBeUndefined();
    expect(html.click_to_call).toBe(true);
    expect(ctx.fetch).toHaveBeenCalledTimes(2);
  });

  it('returns fetch error metadata after retry exhaustion', async () => {
    const ctx = mockCtx([
      { status: 503, body: 'Unavailable' },
      { status: 503, body: 'Still unavailable' },
    ]);

    const html = await fetchHtml(ctx, 'https://example.com', 'service');
    expect(html.html_fetch_error).toBe(true);
    expect(html.html_fetch_status).toBe(503);
    expect(html.fetch_attempts).toBe(2);
  });

  it('detects servicetitan named platform for trade vertical', async () => {
    const ctx = mockCtx([
      {
        status: 200,
        body: '<html><head><title>HVAC Co</title></head><body>static.servicetitan.com/webscheduler STWidgetManager</body></html>',
      },
    ]);

    const html = await fetchHtml(ctx, 'https://hvac.example.com', 'Home & Professional Services');
    expect(html.booking_path_type).toBe('named_platform');
    expect(html.booking_platforms).toContain('servicetitan');
    expect(html.all_detected_platforms).toContain('servicetitan');
  });

  it('excludes toast from scoring on fitness vertical but keeps it in all_detected_platforms', async () => {
    const ctx = mockCtx([
      {
        status: 200,
        body: '<html><head><title>Gym</title></head><body>toasttab.com <a href="/contact-us">Contact</a></body></html>',
      },
    ]);

    const html = await fetchHtml(ctx, 'https://gym.example.com', 'Fitness & Training');
    expect(html.all_detected_platforms).toContain('toast');
    expect(html.excluded_booking_platforms).toContain('toast');
    expect(html.booking_path_type).toBe('contact_form_only');
  });
});

describe('conversion scoring integration', () => {
  it('scores external subdomain generic booking for medspa', () => {
    const [score, findings] = scoreConversionInfrastructure(
      {
        booking_path_type: 'generic_booking',
        booking_detection_method: 'external_subdomain',
        click_to_call: true,
        ga4: true,
        gtm: true,
      },
      'medspa',
    );
    expect(score).toBe(90);
    expect(findings.some((f) => f.text.includes('external scheduling subdomain'))).toBe(true);
  });

  it('warns when vertical-excluded platforms were detected', () => {
    const [, findings] = scoreConversionInfrastructure(
      {
        booking_path_type: 'contact_form_only',
        excluded_booking_platforms: ['toast'],
        click_to_call: true,
        ga4: true,
        gtm: true,
      },
      'fitness',
    );
    expect(findings.some((f) => f.text.includes('excluded for this vertical'))).toBe(true);
  });
});
