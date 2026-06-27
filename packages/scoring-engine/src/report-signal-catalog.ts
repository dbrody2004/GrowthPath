import type { EvidenceTier } from '@growthpath/shared';

export interface SignalCatalogEntry {
  label: string;
  targetLabel: string;
  benchmarkNote?: string;
}

export const CATEGORY_DISPLAY: Record<
  string,
  { displayName: string; pillar: 'P1' | 'P2'; benchmarkSummary?: string }
> = {
  gbp_strength: {
    displayName: 'GBP Strength',
    pillar: 'P1',
    benchmarkSummary:
      'Correct primary category · 3+ secondary categories · 4.8★+ rating · 800+ reviews · 5+/window velocity · 75%+ response rate · GBP post within 7 days',
  },
  mappack: {
    displayName: 'Search Visibility',
    pillar: 'P1',
    benchmarkSummary:
      'Healthy near-me and regional reach · consistent Maps / Local Finder visibility across core keywords',
  },
  onpage: {
    displayName: 'On-Page Relevance',
    pillar: 'P1',
    benchmarkSummary:
      'City + service in title · LocalBusiness schema · dedicated service pages · single H1 · city keyword co-occurrence',
  },
  trust: {
    displayName: 'Domain Trust',
    pillar: 'P1',
    benchmarkSummary: 'DA 40+ · 100+ referring domains · HTTPS · 3+ year domain age',
  },
  performance: {
    displayName: 'Mobile Performance',
    pillar: 'P2',
    benchmarkSummary: 'Desktop PSI 90+ · TTFB ≤600ms · CLS ≤0.05 · TBT ≤200ms · WebP images',
  },
  conversion: {
    displayName: 'Conversion Infrastructure',
    pillar: 'P2',
    benchmarkSummary: 'Named booking platform · click-to-call · GA4 analytics',
  },
  ux: {
    displayName: 'Mobile UX',
    pillar: 'P2',
    benchmarkSummary:
      'Viewport configured · responsive layout · tap targets · color contrast',
  },
};

export const SIGNAL_CATALOG: Record<string, Record<string, SignalCatalogEntry>> = {
  gbp_strength: {
    primary_category: {
      label: 'Primary Category',
      targetLabel: 'Confirm in GBP dashboard',
      benchmarkNote: 'Most specific primary category available',
    },
    secondary_categories: {
      label: 'Secondary Categories',
      targetLabel: 'Target: 3+',
    },
    google_rating: {
      label: 'Google Rating',
      targetLabel: 'Target: 4.8★+',
    },
    review_count: {
      label: 'Review Count',
      targetLabel: 'Target: 800+',
    },
    review_velocity: {
      label: 'Review Velocity',
      targetLabel: 'Target: 5+/window',
      benchmarkNote: 'Consistent reviews across 30-day windows',
    },
    response_rate: {
      label: 'Response Rate',
      targetLabel: 'Target: 75%+',
    },
    photos: {
      label: 'Photos',
      targetLabel: 'Target: 15+',
    },
    gbp_posts: {
      label: 'GBP Post Activity',
      targetLabel: 'Target: within 7 days',
    },
  },
  onpage: {
    title_tag: { label: 'Title Tag', targetLabel: 'City + service in title' },
    schema: { label: 'Local Schema', targetLabel: 'LocalBusiness present' },
    service_pages: { label: 'Service Pages', targetLabel: 'Dedicated pages per service' },
    h1: { label: 'H1 Tag', targetLabel: 'Exactly one H1' },
    city_keyword_cooc: { label: 'City Keyword Co-occurrence', targetLabel: 'City on service pages' },
  },
  trust: {
    domain_authority: { label: 'Domain Authority', targetLabel: 'Target: DA 40+' },
    referring_domains: { label: 'Referring Domains', targetLabel: 'Target: 100+' },
    https: { label: 'HTTPS', targetLabel: 'HTTPS enabled' },
    domain_age: { label: 'Domain Age', targetLabel: 'Target: 3+ years' },
  },
  performance: {
    desktop_psi: { label: 'Desktop PSI', targetLabel: 'Target: 90+' },
    ttfb: { label: 'TTFB', targetLabel: 'Target: ≤600ms' },
    cls: { label: 'CLS', targetLabel: 'Target: ≤0.05' },
    tbt: { label: 'TBT', targetLabel: 'Target: ≤200ms' },
    unused_code: { label: 'Unused Code', targetLabel: 'Minimal JS/CSS bloat' },
    webp_images: { label: 'WebP Images', targetLabel: 'WebP detected' },
  },
  conversion: {
    booking: { label: 'Booking Path', targetLabel: 'Named platform or strong path' },
    click_to_call: { label: 'Click-to-Call', targetLabel: 'Tel link on homepage' },
    analytics: { label: 'Analytics', targetLabel: 'GA4 detected' },
  },
  ux: {
    viewport: { label: 'Viewport', targetLabel: 'width=device-width configured' },
    responsive: { label: 'Responsive Layout', targetLabel: 'Mobile-friendly layout' },
    tap_targets: { label: 'Tap Targets', targetLabel: 'Adequate touch target size' },
    color_contrast: { label: 'Color Contrast', targetLabel: 'Accessibility pass' },
  },
};

export const MAPPACK_SIGNAL_CATALOG: Record<string, SignalCatalogEntry> = {
  near_me_reach: {
    label: 'Near-Me Reach',
    targetLabel: 'Target: 60+/100',
    benchmarkNote: 'Average visibility for near-me keywords',
  },
  regional_reach: {
    label: 'Regional Reach',
    targetLabel: 'Target: 60+/100',
    benchmarkNote: 'Average visibility for city keywords',
  },
  maps_3pack: {
    label: 'Maps 3-Pack Keywords',
    targetLabel: 'Core keywords visible',
  },
  invisible_keywords: {
    label: 'Invisible Keywords',
    targetLabel: 'No core gaps',
  },
};

export function tierFromRatio(earned: number, max: number): EvidenceTier {
  if (max <= 0) return 'unknown';
  const ratio = earned / max;
  if (ratio >= 0.85) return 'leading';
  if (ratio >= 0.6) return 'competitive';
  if (ratio >= 0.35) return 'needs_work';
  return 'critical';
}

export function tierLabel(tier: EvidenceTier): string {
  switch (tier) {
    case 'leading':
      return 'Leading';
    case 'competitive':
      return 'Competitive';
    case 'needs_work':
      return 'Needs Work';
    case 'critical':
      return 'Critical';
    default:
      return 'Unknown';
  }
}

export function ruleStatusFromRatio(earned: number, max: number): 'passed' | 'partial' | 'failed' {
  if (max <= 0) return 'failed';
  if (earned >= max) return 'passed';
  if (earned > 0) return 'partial';
  return 'failed';
}
