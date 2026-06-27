import {
  CATEGORY_DISPLAY_WEIGHTS,
  P2_WEIGHTS,
  P2_WEIGHTS_PSI_FAILED,
  PROFILE_NAMES,
} from '@growthpath/shared';
import type {
  AuditData,
  CategoryReportEvidence,
  CollectionDiagnostic,
  ReportAppendix,
  ReportMetadata,
  RuleOutcomeRow,
  ScoreExplanation,
  Scores,
  SignalEvidenceRow,
  SignalPts,
} from '@growthpath/shared';
import {
  CATEGORY_DISPLAY,
  MAPPACK_SIGNAL_CATALOG,
  ruleStatusFromRatio,
  SIGNAL_CATALOG,
  tierFromRatio,
  tierLabel,
} from './report-signal-catalog.js';
import { resolveKbRemediation } from './resolve-kb-remediation.js';

function formatPct(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'Not available';
  return `${Math.round(value * 100)}%`;
}

function formatRating(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'Not available';
  return `${value.toFixed(1)}★`;
}

function buildSignalRows(
  categoryId: string,
  signalPts: SignalPts,
  clientValues: Record<string, string>,
): SignalEvidenceRow[] {
  const catalog = SIGNAL_CATALOG[categoryId] ?? {};

  return Object.entries(signalPts).map(([signalId, point]) => {
    const meta = catalog[signalId];
    const targetTier = tierFromRatio(point.earned, point.max);

    return {
      signalId,
      label: meta?.label ?? signalId.replace(/_/g, ' '),
      earned: point.earned,
      max: point.max,
      clientValue: clientValues[signalId] ?? '—',
      targetLabel: meta?.targetLabel ?? 'See scoring rules',
      targetTier,
      benchmarkNote: meta?.benchmarkNote,
    };
  });
}

function buildRuleOutcomes(rows: SignalEvidenceRow[]): RuleOutcomeRow[] {
  return rows.map((row) => ({
    ruleId: row.signalId,
    label: row.label,
    status: ruleStatusFromRatio(row.earned, row.max),
    points: `${row.earned} / ${row.max}`,
    rationale: row.benchmarkNote,
  }));
}

function gbpClientValues(audit: AuditData): Record<string, string> {
  const gbp = audit.gbp;
  const posts = audit.gbp_posts;
  const velocity =
    gbp.reviews_w1 === null && gbp.reviews_w2 === null && gbp.reviews_w3 === null
      ? 'Not available'
      : `${gbp.reviews_w1 ?? 0} / ${gbp.reviews_w2 ?? 0} / ${gbp.reviews_w3 ?? 0} (days 1–30 / 31–60 / 61–90)`;

  let postValue = 'No posts detected';
  if (posts?.last_post_days_ago != null) {
    postValue =
      posts.last_post_date != null
        ? `${posts.last_post_date} (${posts.last_post_days_ago}d ago)`
        : `${posts.last_post_days_ago}d since last post`;
  }

  return {
    primary_category: gbp.primary_type ?? gbp.primary_category ?? 'Not set',
    secondary_categories: `${(gbp.secondary_categories ?? []).length} set`,
    google_rating: formatRating(gbp.rating),
    review_count: gbp.review_count != null ? String(gbp.review_count) : 'Not available',
    review_velocity: velocity,
    response_rate: formatPct(gbp.owner_response_rate),
    photos: gbp.photo_count != null ? String(gbp.photo_count) : 'Not available',
    gbp_posts: postValue,
  };
}

function onpageClientValues(audit: AuditData): Record<string, string> {
  const html = audit.html ?? {};
  const depth = audit.content_depth;
  const servicePages = depth?.service_pages ?? {};
  const serviceCount = Object.values(servicePages).filter((page) => page.found).length;
  const cityCooc = depth?.city_keyword_cooccurrence ?? {};
  const cityFound = Object.values(cityCooc).some((entry) => entry.found);

  return {
    title_tag: html.title_text ?? (html.title_length != null ? `${html.title_length} chars` : 'Not detected'),
    schema: (html.schema_types ?? []).length > 0 ? (html.schema_types ?? []).join(', ') : 'None detected',
    service_pages: serviceCount > 0 ? `${serviceCount} pages` : 'None detected',
    h1: html.h1_count != null ? `${html.h1_count} H1 tag(s)` : 'Not detected',
    city_keyword_cooc: cityFound ? 'City found on service pages' : 'Missing on service pages',
  };
}

function trustClientValues(audit: AuditData): Record<string, string> {
  const moz = audit.moz?.client;
  const whois = audit.whois;

  return {
    domain_authority: moz?.da != null ? String(moz.da) : 'Not available',
    referring_domains: moz?.referring_domains != null ? String(moz.referring_domains) : 'Not available',
    https: whois?.https ? 'HTTPS enabled' : 'Not secure',
    domain_age:
      whois?.age_years != null ? `${whois.age_years.toFixed(1)} years` : 'Not available',
  };
}

function performanceClientValues(audit: AuditData): Record<string, string> {
  const psi = audit.pagespeed ?? {};

  return {
    desktop_psi: psi.performance != null ? `${psi.performance}` : 'Not available',
    ttfb: psi.ttfb_ms != null ? `${Math.round(psi.ttfb_ms)}ms` : 'Not available',
    cls: psi.cls != null ? `${psi.cls.toFixed(3)}` : 'Not available',
    tbt: psi.tbt_ms != null ? `${Math.round(psi.tbt_ms)}ms` : 'Not available',
    unused_code:
      psi.unused_js_kib != null || psi.unused_css_kib != null
        ? `${Math.round(psi.unused_js_kib ?? 0)} KiB JS · ${Math.round(psi.unused_css_kib ?? 0)} KiB CSS`
        : 'Not measured',
    webp_images:
      (psi.webp_by_extension ?? false) ||
      (psi.webp_by_picture ?? false) ||
      (audit.html?.webp_by_extension ?? false) ||
      (audit.html?.webp_by_picture ?? false)
        ? 'WebP detected'
        : 'Not detected',
  };
}

function conversionClientValues(audit: AuditData): Record<string, string> {
  const html = audit.html ?? {};
  const platforms = html.all_detected_platforms ?? html.booking_platforms ?? [];

  let bookingValue = 'None detected';
  if (html.booking_path_type && html.booking_path_type !== 'none') {
    bookingValue = html.booking_path_type.replace(/_/g, ' ');
    if (platforms.length > 0) {
      bookingValue += ` (${platforms.join(', ')})`;
    }
  }

  const analyticsParts: string[] = [];
  if (html.ga4) analyticsParts.push('GA4');
  if (html.gtm) analyticsParts.push('GTM');
  if (html.facebook_pixel) analyticsParts.push('Meta Pixel');

  return {
    booking: bookingValue,
    click_to_call: html.click_to_call ? 'Tel link detected' : 'Not detected',
    analytics: analyticsParts.length > 0 ? analyticsParts.join(' + ') : 'None detected',
  };
}

function uxClientValues(audit: AuditData): Record<string, string> {
  const html = audit.html ?? {};
  const a11y = audit.psi_accessibility ?? {};
  const respScore = html.responsive_score ?? 0;
  const viewportOk = html.viewport_has_width_device || html.viewport_exists || html.viewport;

  return {
    viewport: html.viewport_has_width_device
      ? 'width=device-width configured'
      : viewportOk
        ? 'Viewport tag present'
        : 'Missing or misconfigured',
    responsive:
      respScore > 0
        ? `${respScore}/4 responsive signals`
        : viewportOk
          ? 'Responsive signals not scored'
          : 'Not confirmed',
    tap_targets:
      a11y.psi_a11y_target_size === 1.0
        ? 'Pass'
        : a11y.psi_a11y_target_size === 0.0
          ? 'Fail'
          : 'Not measured',
    color_contrast:
      a11y.psi_a11y_color_contrast === 1.0
        ? 'Pass'
        : a11y.psi_a11y_color_contrast === 0.0
          ? 'Fail'
          : 'Not measured',
  };
}

function buildMappackSignals(scores: Scores): SignalEvidenceRow[] {
  const mappack = scores.categories.mappack;

  const rows: Array<{ id: string; earned: number; max: number; clientValue: string }> = [
    {
      id: 'near_me_reach',
      earned: mappack.near_me_score,
      max: 100,
      clientValue: `${mappack.near_me_score}/100 (local reach ${mappack.local_reach})`,
    },
    {
      id: 'regional_reach',
      earned: mappack.city_score,
      max: 100,
      clientValue: `${mappack.city_score}/100 (regional reach ${mappack.regional_reach})`,
    },
    {
      id: 'maps_3pack',
      earned: mappack.kw_3pack.length,
      max: Math.max(mappack.kw_3pack.length + mappack.kw_invisible.length, 1),
      clientValue:
        mappack.kw_3pack.length > 0 ? mappack.kw_3pack.join(', ') : 'No 3-pack keywords confirmed',
    },
    {
      id: 'invisible_keywords',
      earned: Math.max(0, mappack.kw_invisible.length === 0 ? 1 : 0),
      max: 1,
      clientValue:
        mappack.kw_invisible.length > 0
          ? `${mappack.kw_invisible.length} invisible (${mappack.kw_invisible.slice(0, 3).join(', ')}${mappack.kw_invisible.length > 3 ? '…' : ''})`
          : 'All scanned keywords have some visibility',
    },
  ];

  return rows.map((row) => {
    const meta = MAPPACK_SIGNAL_CATALOG[row.id];
    const targetTier = tierFromRatio(row.earned, row.max);

    return {
      signalId: row.id,
      label: meta?.label ?? row.id,
      earned: row.earned,
      max: row.max,
      clientValue: row.clientValue,
      targetLabel: meta?.targetLabel ?? 'Healthy visibility',
      targetTier,
      benchmarkNote: meta?.benchmarkNote,
    };
  });
}

function categoryAssessment(
  categoryId: string,
  score: number | null,
  tierLabelText: string,
  scores: Scores,
): string {
  const cat = scores.categories[categoryId as keyof Scores['categories']];

  if (categoryId === 'performance' && score == null) {
    return 'Unavailable — PageSpeed data excluded';
  }

  if (categoryId === 'mappack' && 'diagnosis' in cat && cat.diagnosis) {
    return `${score}/100 — ${cat.diagnosis}`;
  }

  const topFinding = cat.findings[0]?.text;
  if (topFinding) {
    return `${score}/100 (${tierLabelText}) — ${topFinding}`;
  }

  return `${score}/100 (${tierLabelText}) — ${CATEGORY_DISPLAY[categoryId]?.displayName ?? categoryId} is ${tierLabelText.toLowerCase()} for this scan.`;
}

function buildScoreExplanation(scores: Scores, psiFailed: boolean): ScoreExplanation {
  const profileRationale: Record<string, string> = {
    [PROFILE_NAMES.LEADER]:
      'Strong P1 and P2 scores — local visibility and conversion infrastructure are both healthy.',
    [PROFILE_NAMES.CONTENDER]:
      'Solid foundation in both pillars with room to tighten execution on the weaker categories below.',
    [PROFILE_NAMES.LEAKY_BUCKET]:
      'Search visibility is ahead of conversion — traffic may be arriving but the site is not capturing it efficiently.',
    [PROFILE_NAMES.HIDDEN_GEM]:
      'Conversion infrastructure outpaces search visibility — fix local reach before scaling paid or organic spend.',
    [PROFILE_NAMES.INVISIBLE_CLOSER]:
      'Classic Invisible Closer pattern: conversion may be acceptable but local search reach is limiting growth.',
  };

  const p1Parts = [
    `GBP ${scores.categories.gbp_strength.score} (${CATEGORY_DISPLAY_WEIGHTS.gbp_strength})`,
    `Search ${scores.categories.mappack.score} (${CATEGORY_DISPLAY_WEIGHTS.mappack})`,
    `On-page ${scores.categories.onpage.score} (${CATEGORY_DISPLAY_WEIGHTS.onpage})`,
    `Trust ${scores.categories.trust.score} (${CATEGORY_DISPLAY_WEIGHTS.trust})`,
  ];

  const weights = psiFailed ? P2_WEIGHTS_PSI_FAILED : P2_WEIGHTS;
  const p2Parts = psiFailed
    ? [
        `Conversion ${scores.categories.conversion.score} (${Math.round(weights.conversion * 100)}% weight)`,
        `UX ${scores.categories.ux.score} (${Math.round(weights.ux * 100)}% weight)`,
        'Performance excluded — PageSpeed unavailable',
      ]
    : [
        `Performance ${scores.categories.performance.score} (${CATEGORY_DISPLAY_WEIGHTS.performance})`,
        `Conversion ${scores.categories.conversion.score} (${CATEGORY_DISPLAY_WEIGHTS.conversion})`,
        `UX ${scores.categories.ux.score} (${CATEGORY_DISPLAY_WEIGHTS.ux})`,
      ];

  return {
    profileRationale:
      profileRationale[scores.profile] ??
      `Profile "${scores.profile}" reflects P1 ${scores.p1}/100 and P2 ${scores.p2}/100.`,
    p1Summary: `P1 ${scores.p1}/100 (${scores.p1_tier[0]}) — weighted from ${p1Parts.join(' · ')}.`,
    p2Summary: `P2 ${scores.p2}/100 (${scores.p2_tier[0]}) — ${p2Parts.join(' · ')}.`,
  };
}

function buildCollectionStatus(audit: AuditData, scores: Scores): CollectionDiagnostic[] {
  if (audit.collection_status?.length) {
    return audit.collection_status
      .filter((s) => s.sourceId !== 'competitor_agg')
      .map((s) => ({
        source: s.label,
        status: s.status === 'skipped' ? 'partial' : s.status,
        detail: s.detail,
      }))
      .concat([
        {
          source: 'Scoring engine',
          status: 'ok',
          detail: `Profile ${scores.profile} · P1 ${scores.p1} · P2 ${scores.p2}`,
        },
      ]);
  }

  const html = audit.html ?? {};
  const psi = audit.pagespeed ?? {};
  const keywordCount = Object.keys(audit.serp ?? {}).length;

  return [
    {
      source: 'Google Business Profile',
      status: audit.gbp?.name ? 'ok' : 'missing',
      detail: audit.gbp?.name ? `Profile loaded for ${audit.gbp.name}` : 'GBP data missing',
    },
    {
      source: 'SERP / Map Pack',
      status: keywordCount > 0 ? 'ok' : 'missing',
      detail: keywordCount > 0 ? `${keywordCount} keywords scanned` : 'No SERP keyword data',
    },
    {
      source: 'Local Finder',
      status: Object.keys(audit.local_finder ?? {}).length > 0 ? 'ok' : 'partial',
      detail:
        Object.keys(audit.local_finder ?? {}).length > 0
          ? 'Local Finder origins collected'
          : 'Local Finder data incomplete',
    },
    {
      source: 'Homepage HTML',
      status: html.html_fetch_error ? 'error' : html.title_text ? 'ok' : 'partial',
      detail: html.html_fetch_error
        ? `Fetch failed${html.html_fetch_status ? ` (HTTP ${html.html_fetch_status})` : ''}`
        : html.title_text
          ? 'Homepage fetched and parsed'
          : 'Homepage HTML partially available',
    },
    {
      source: 'Moz / Domain metrics',
      status: audit.moz?.client?.da != null ? 'ok' : 'partial',
      detail:
        audit.moz?.client?.da != null
          ? `DA ${audit.moz.client.da} · ${audit.moz.client.referring_domains ?? 0} RDs`
          : 'Moz metrics unavailable',
    },
    {
      source: 'PageSpeed Insights',
      status:
        psi.performance === null || psi.performance === undefined
          ? 'missing'
          : 'ok',
      detail:
        psi.performance != null
          ? `Desktop performance ${psi.performance}`
          : 'PageSpeed data unavailable — performance category excluded',
    },
    {
      source: 'WHOIS',
      status: audit.whois?.domain ? 'ok' : 'partial',
      detail: audit.whois?.domain
        ? `${audit.whois.domain}${audit.whois.age_years != null ? ` · ${audit.whois.age_years.toFixed(1)}y` : ''}`
        : 'WHOIS data unavailable',
    },
    {
      source: 'Scoring engine',
      status: 'ok',
      detail: `Profile ${scores.profile} · P1 ${scores.p1} · P2 ${scores.p2}`,
    },
  ];
}

function buildSignalAvailability(scores: Scores, psiFailed: boolean): Record<string, 'available' | 'partial' | 'unavailable'> {
  const availability: Record<string, 'available' | 'partial' | 'unavailable'> = {};

  for (const [categoryId, category] of Object.entries(scores.categories)) {
    if (categoryId === 'mappack') {
      availability[categoryId] = 'available';
      continue;
    }

    if ('signal_pts' in category) {
      const pts = category.signal_pts;
      const keys = Object.keys(pts);
      if (keys.length === 0) {
        availability[categoryId] = categoryId === 'performance' && psiFailed ? 'unavailable' : 'partial';
      } else {
        availability[categoryId] = 'available';
      }
    }
  }

  return availability;
}

function collectKbKeys(scores: Scores): string[] {
  const keys = new Set<string>();

  for (const category of Object.values(scores.categories)) {
    for (const finding of category.findings) {
      if (finding.kb_key) keys.add(finding.kb_key);
    }
  }

  return [...keys].sort();
}

function buildCategoryEvidence(
  categoryId: string,
  scores: Scores,
  audit: AuditData,
): CategoryReportEvidence {
  const meta = CATEGORY_DISPLAY[categoryId] ?? {
    displayName: categoryId,
    pillar: 'P1' as const,
  };
  const category = scores.categories[categoryId as keyof Scores['categories']];
  const tierText = category.tier[0];

  let signals: SignalEvidenceRow[] = [];

  if (categoryId === 'mappack') {
    signals = buildMappackSignals(scores);
  } else if ('signal_pts' in category) {
    const clientValueBuilders: Record<string, () => Record<string, string>> = {
      gbp_strength: () => gbpClientValues(audit),
      onpage: () => onpageClientValues(audit),
      trust: () => trustClientValues(audit),
      performance: () => performanceClientValues(audit),
      conversion: () => conversionClientValues(audit),
      ux: () => uxClientValues(audit),
    };

    const clientValues = clientValueBuilders[categoryId]?.() ?? {};
    signals = buildSignalRows(categoryId, category.signal_pts, clientValues);
  }

  return {
    categoryId,
    pillar: meta.pillar,
    displayName: meta.displayName,
    assessment: categoryAssessment(categoryId, category.score ?? null, tierText, scores),
    benchmarkSummary: meta.benchmarkSummary,
    signals,
    ruleOutcomes: buildRuleOutcomes(signals),
  };
}

function buildAppendix(audit: AuditData, scores: Scores, psiFailed: boolean): ReportAppendix {
  const notes: string[] = [];

  if (psiFailed) {
    notes.push('PageSpeed data unavailable — P2 reweighted without performance category.');
  }
  if (audit.html?.html_fetch_error) {
    notes.push('Homepage HTML fetch failed — on-page and conversion signals may be incomplete.');
  }
  if (scores.partialReasons?.length) {
    notes.push(...scores.partialReasons);
  }

  return {
    collectionStatus: buildCollectionStatus(audit, scores),
    triggeredKbKeys: collectKbKeys(scores),
    remediation: resolveKbRemediation(collectKbKeys(scores)),
    signalAvailability: buildSignalAvailability(scores, psiFailed),
    notes,
  };
}

export function buildReportEvidence(audit: AuditData, scores: Scores): ReportMetadata {
  const psiFailed =
    audit.pagespeed?.performance === null || audit.pagespeed?.performance === undefined;

  const categoryIds = [
    'gbp_strength',
    'mappack',
    'onpage',
    'trust',
    'performance',
    'conversion',
    'ux',
  ] as const;

  return {
    explanation: buildScoreExplanation(scores, psiFailed),
    categories: categoryIds.map((id) => buildCategoryEvidence(id, scores, audit)),
    appendix: buildAppendix(audit, scores, psiFailed),
  };
}

export { tierFromRatio, tierLabel };
