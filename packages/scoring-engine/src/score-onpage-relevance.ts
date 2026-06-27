import type { ContentDepth, Finding, HtmlData, SignalPts } from '@growthpath/shared';
import { evaluateSchema } from './schema.js';

export function scoreOnpageRelevance(
  html: HtmlData | null = null,
  city = 'Seattle',
  contentDepth: ContentDepth | null = null,
  primaryType: string | null = null,
): [number, Finding[], SignalPts] {
  let points = 0;
  const findings: Finding[] = [];
  const htmlData = html ?? {};

  const titleLen = htmlData.title_length ?? 0;
  const titleText = (htmlData.title_text ?? '').toLowerCase();
  const hasCity = titleText.includes(city.toLowerCase());
  const ptNormalized = (primaryType ?? '').toLowerCase().replace(/_/g, ' ');
  const ptTokens = ptNormalized.split(' ').filter((t) => t.length > 2);
  const hasCategory = ptTokens.some((t) => titleText.includes(t));

  let titleE = 0;
  if (titleLen === 0) {
    findings.push({
      text: 'Title tag missing — critical on-page gap.',
      severity: 'critical',
      kb_key: 'TITLE_TAG_NO_CITY',
    });
  } else if (hasCity && hasCategory) {
    titleE = 25;
    findings.push({
      text: 'Title tag confirmed — city and business category both present. Strong homepage identity signal.',
      severity: 'good',
    });
  } else if (hasCity) {
    titleE = 15;
    findings.push({
      text: `Title tag includes '${city}' but missing a category keyword (e.g. '${ptNormalized.replace(/\b\w/g, (c) => c.toUpperCase())}'). Adding your business type strengthens what-and-where signal.`,
      severity: 'warning',
      kb_key: 'TITLE_TAG_NO_CITY',
    });
  } else if (hasCategory) {
    titleE = 10;
    findings.push({
      text: `Title tag includes your business category but missing city keyword '${city}'. Local search requires both what and where.`,
      severity: 'warning',
      kb_key: 'TITLE_TAG_NO_CITY',
    });
  } else {
    titleE = 5;
    findings.push({
      text: `Title tag present but missing both city ('${city}') and business category. Homepage title should establish what you are and where you are.`,
      severity: 'warning',
      kb_key: 'TITLE_TAG_NO_CITY',
    });
  }
  points += titleE;

  const schemaTypes = htmlData.schema_types ?? [];
  const schemaResult = evaluateSchema(primaryType, schemaTypes);
  points += schemaResult.score_pts;
  findings.push(schemaResult.finding);

  const cd = contentDepth ?? {
    service_pages: {},
    city_keyword_cooccurrence: {},
    internal_links_crawled: 0,
    pages_spot_checked: 0,
    sitemap_url: null,
    sitemap_url_count: 0,
  };
  const svcPages = cd.service_pages ?? {};
  const cityCooc = cd.city_keyword_cooccurrence ?? {};
  const totalSvcs = Object.keys(svcPages).length;

  let svcPts = 0;
  if (totalSvcs > 0) {
    const pagesFound = Object.values(svcPages).filter((v) => v.found).length;
    const pagePct = pagesFound / totalSvcs;
    if (pagePct >= 1.0) svcPts = 25;
    else if (pagePct >= 0.67) svcPts = 17;
    else if (pagePct >= 0.33) svcPts = 8;
    else svcPts = 0;
    points += svcPts;

    const missingPages = Object.entries(svcPages)
      .filter(([, v]) => !v.found)
      .map(([s]) => s);
    if (missingPages.length > 0) {
      findings.push({
        text: `No dedicated service page for: ${missingPages.join(', ')}. Google ranks pages, not websites — a dedicated page per service strengthens topical authority and city-modifier rankings.`,
        severity: pagesFound === 0 ? 'critical' : 'warning',
        kb_key: 'SERVICE_PAGE_MISSING',
      });
    }
  }

  const h1Count = htmlData.h1_count ?? 0;
  if (h1Count === 1) {
    points += 15;
  } else if (h1Count > 1) {
    points += 6;
    findings.push({
      text: `${h1Count} H1 tags detected — only one per page. Extra H1s dilute keyword signal.`,
      severity: 'warning',
      kb_key: 'H1_MISSING',
    });
  } else {
    findings.push({
      text: 'No H1 tag detected.',
      severity: 'critical',
      kb_key: 'H1_MISSING',
    });
  }

  const metaMissing = htmlData.meta_desc_missing ?? true;
  const metaText = htmlData.meta_desc ?? '';
  const metaLen = metaText.length;
  if (metaMissing) {
    findings.push({
      text: 'Meta description missing. While not a ranking signal, a well-written meta description improves click-through from search results.',
      severity: 'warning',
      kb_key: 'META_DESCRIPTION_MISSING',
    });
  } else if (metaLen < 140 || metaLen > 160) {
    findings.push({
      text: `Meta description ${metaLen} chars — benchmark is 140–160 chars for optimal display.`,
      severity: 'warning',
      kb_key: 'META_DESCRIPTION_MISSING',
    });
  }

  let coocPts = 0;
  if (totalSvcs > 0) {
    const coocFound = Object.values(cityCooc).filter((v) => v.found).length;
    const coocPct = coocFound / totalSvcs;
    if (coocPct >= 1.0) coocPts = 10;
    else if (coocPct >= 0.67) coocPts = 6;
    else if (coocPct >= 0.33) coocPts = 2;
    else coocPts = 0;
    points += coocPts;

    if (coocPct < 1.0) {
      const missingCooc = Object.entries(cityCooc)
        .filter(([, v]) => !v.found)
        .map(([s]) => s);
      if (missingCooc.length > 0) {
        findings.push({
          text: `City + service keyword not co-occurring for: ${missingCooc.join(', ')}. Including city name alongside service keywords in body content reinforces local relevance signals.`,
          severity: 'warning',
          kb_key: 'CITY_KW_ABSENT',
        });
      }
    }
  }

  const socialPatterns = [
    'instagram.com',
    'facebook.com',
    'yelp.com',
    'tiktok.com',
    'twitter.com',
    'x.com',
    'google.com/maps',
  ];
  const socialLinks = htmlData.social_links ?? [];
  const hasSocial =
    socialLinks.length > 0 &&
    socialLinks.some((link) => socialPatterns.some((p) => link.toLowerCase().includes(p)));

  if (!hasSocial) {
    findings.push({
      text: 'No social media links detected. Linking to active profiles strengthens cross-platform NAP consistency.',
      severity: 'warning',
    });
  }

  const schemaE = schemaResult.score_pts;
  const svcE = totalSvcs > 0 ? svcPts : 0;
  const h1E = h1Count === 1 ? 15 : h1Count > 1 ? 6 : 0;
  const coocE = totalSvcs > 0 ? coocPts : 0;

  const onpageSignalPts: SignalPts = {
    title_tag: { earned: titleE, max: 25 },
    schema: { earned: schemaE, max: 25 },
    service_pages: { earned: svcE, max: 25 },
    h1: { earned: h1E, max: 15 },
    city_keyword_cooc: { earned: coocE, max: 10 },
  };

  return [Math.min(100, points), findings, onpageSignalPts];
}
