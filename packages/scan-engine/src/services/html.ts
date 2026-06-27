import type { HtmlData } from '@growthpath/shared';
import * as cheerio from 'cheerio';
import { BROWSER_HEADERS } from '../constants.js';
import type { ScanEngineContext } from '../types.js';
import { classifyBookingPath, detectAllPlatforms } from './bookingCatalog.js';

const ERROR_PAGE_PATTERNS = [
  'not acceptable',
  '403 forbidden',
  '404 not found',
  'access denied',
  'just a moment',
  'attention required',
  'bad gateway',
  '503 service',
  '429',
  'too many requests',
];

const TRANSIENT_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);

function isTransientFailure(status: number | undefined, error: unknown): boolean {
  if (error) return true;
  return status != null && TRANSIENT_STATUS.has(status);
}

function collectSchemaTypes(node: unknown, out: Set<string>): void {
  if (Array.isArray(node)) {
    for (const item of node) collectSchemaTypes(item, out);
    return;
  }
  if (node && typeof node === 'object') {
    const obj = node as Record<string, unknown>;
    const type = obj['@type'];
    const normalizeSchemaType = (rawType: string): string => {
      let normalized = rawType
        .trim()
        .replace(/^https?:\/\/(?:www\.)?schema\.org\//i, '')
        .replace(/^(?:www\.)?schema\.org\//i, '')
        .replace(/^\/+|\/+$/g, '');
      normalized = normalized.split(/[?#]/)[0] ?? normalized;
      if (normalized.includes('/')) {
        const parts = normalized.split('/').filter(Boolean);
        normalized = parts[parts.length - 1] ?? normalized;
      }
      return normalized;
    };
    if (typeof type === 'string') {
      const normalized = normalizeSchemaType(type);
      if (normalized) out.add(normalized);
    } else if (Array.isArray(type)) {
      for (const t of type) {
        if (typeof t === 'string') {
          const normalized = normalizeSchemaType(t);
          if (normalized) out.add(normalized);
        }
      }
    }
    for (const value of Object.values(obj)) {
      if (value && typeof value === 'object') collectSchemaTypes(value, out);
    }
  }
}

async function fetchHtmlOnce(
  ctx: ScanEngineContext,
  url: string,
): Promise<{ status: number; raw: string } | { error: true; status?: number }> {
  try {
    const response = await ctx.fetch(url, { headers: BROWSER_HEADERS });
    const raw = await response.text();
    return { status: response.status, raw };
  } catch {
    return { error: true };
  }
}

function parseHtmlSignals(raw: string, url: string, vertical: string, fetchAttempts: number): HtmlData {
  const htmlLower = raw.toLowerCase();
  const $ = cheerio.load(raw);
  const titleText = $('title').first().text().trim();
  const titleLower = titleText.toLowerCase();

  const ga4 = /G-[A-Z0-9]{6,}/.test(raw);
  const gtm = /GTM-[A-Z0-9]+/.test(raw);
  const facebook_pixel = htmlLower.includes('fbq(');
  const clarity = htmlLower.includes('clarity.ms') || htmlLower.includes('microsoft.clarity');

  const allHrefs: string[] = [];
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    if (href) allHrefs.push(href);
  });

  const clientDomain = new URL(url).hostname.replace(/^www\./, '').toLowerCase();
  const detectionCtx = { raw, htmlLower, allHrefs };
  const allDetectedPlatforms = detectAllPlatforms(detectionCtx);
  const booking = classifyBookingPath(detectionCtx, vertical, clientDomain);

  const h1Count = $('h1').length;
  const metaDesc = $('meta[name="description"]').attr('content') ?? '';
  const viewportMeta = $('meta[name="viewport"]').attr('content') ?? '';
  const schemaTypeSet = new Set<string>();
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      collectSchemaTypes(JSON.parse($(el).text()), schemaTypeSet);
    } catch {
      // skip invalid json-ld
    }
  });
  const schemaTypes: string[] = [...schemaTypeSet];

  const hasMediaQueries = /@media\s*\(/.test(raw);
  const hasResponsiveMarkers = /responsive|mobile-menu|navbar-toggle|hamburger/i.test(raw);
  const hasMobileNav = $('nav').length > 0 && hasResponsiveMarkers;
  const hasResponsiveImages = $('img[srcset], picture').length > 0;
  const webpByExtension = /\.webp/i.test(raw);
  const clickToCall = /href=["']tel:/i.test(htmlLower);

  return {
    ga4,
    gtm,
    facebook_pixel,
    clarity,
    booking_platforms: booking.scoringPlatforms.filter((p) => !['generic', 'contact_form', 'quote_form'].includes(p)),
    all_detected_platforms: allDetectedPlatforms,
    excluded_booking_platforms: booking.excludedPlatforms,
    booking_evidence: booking.bookingEvidence,
    fetch_attempts: fetchAttempts,
    booking_detected: booking.bookingPathType === 'named_platform' || booking.bookingPathType === 'generic_booking',
    booking_path_type: booking.bookingPathType,
    booking_detection_method: booking.bookingDetectionMethod,
    booking_internal_slug: booking.bookingInternalSlug,
    lead_capture_platforms: booking.leadCapturePlatforms,
    click_to_call: clickToCall,
    title_text: titleText,
    title_length: titleText.length,
    h1_count: h1Count,
    h1_multiple_flag: h1Count > 1,
    meta_desc: metaDesc,
    meta_desc_missing: !metaDesc.trim(),
    schema_types: schemaTypes,
    viewport: viewportMeta.length > 0,
    viewport_exists: viewportMeta.length > 0,
    viewport_has_width_device: /width\s*=\s*device-width/i.test(viewportMeta),
    viewport_blocks_zoom: /user-scalable\s*=\s*no/i.test(viewportMeta),
    responsive_score: [hasMediaQueries, hasResponsiveMarkers, hasMobileNav, hasResponsiveImages].filter(Boolean).length,
    has_media_queries: hasMediaQueries,
    has_responsive_markers: hasResponsiveMarkers,
    has_responsive_images: hasResponsiveImages,
    has_mobile_nav: hasMobileNav,
    webp: webpByExtension,
    webp_by_extension: webpByExtension,
    webp_by_picture: $('picture source[type*="webp"]').length > 0,
    webp_by_css: /\.webp/i.test(raw),
    video_autoplay: $('video[autoplay]').length > 0,
    alt_text_total_images: $('img').length,
    alt_text_with_alt: $('img[alt]').filter((_, el) => Boolean($(el).attr('alt')?.trim())).length,
    social_links: allHrefs.filter((h) =>
      /instagram\.com|facebook\.com|yelp\.com|tiktok\.com|twitter\.com|x\.com/.test(h),
    ),
    css_framework: /bootstrap|tailwind|foundation/i.test(raw)
      ? raw.match(/bootstrap|tailwind|foundation/i)?.[0]?.toLowerCase() ?? ''
      : '',
    vertical,
    html_fetch_error: ERROR_PAGE_PATTERNS.some((pat) => titleLower.includes(pat)) ? true : undefined,
  };
}

export async function fetchHtml(
  ctx: ScanEngineContext,
  url: string,
  vertical = 'service',
): Promise<HtmlData> {
  let attempts = 0;
  let lastStatus: number | undefined;

  while (attempts < 2) {
    attempts += 1;
    const result = await fetchHtmlOnce(ctx, url);

    if ('error' in result) {
      lastStatus = result.status;
      if (attempts < 2 && isTransientFailure(result.status, true)) {
        continue;
      }
      return {
        html_fetch_error: true,
        html_fetch_status: result.status,
        fetch_attempts: attempts,
      };
    }

    lastStatus = result.status;
    if (result.status >= 400) {
      if (attempts < 2 && isTransientFailure(result.status, false)) {
        continue;
      }
      return {
        html_fetch_error: true,
        html_fetch_status: result.status,
        fetch_attempts: attempts,
      };
    }

    const parsed = parseHtmlSignals(result.raw, url, vertical, attempts);
    if (parsed.html_fetch_error) {
      return {
        html_fetch_error: true,
        html_fetch_status: result.status,
        fetch_attempts: attempts,
      };
    }

    return parsed;
  }

  return {
    html_fetch_error: true,
    html_fetch_status: lastStatus,
    fetch_attempts: attempts,
  };
}
