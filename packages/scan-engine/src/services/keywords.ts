import type { KeywordEntry } from '@growthpath/shared';

export interface CityLocation {
  /** Display label e.g. "Roseville CA 95747" */
  display: string;
  /** Lowercase keyword suffix e.g. "roseville ca 95747" */
  keywordSuffix: string;
}

/** Derive city display + keyword suffix from intake address (falls back to bizCity). */
export function deriveCityLocation(bizAddress: string, bizCity?: string): CityLocation {
  const zipMatch = bizAddress.match(/\b(\d{5})(?:-\d{4})?\b/);
  const stateMatch = bizAddress.match(/,\s*([A-Z]{2})(?:\s|,|$)/);
  const zip = zipMatch?.[1] ?? '';
  const state = stateMatch?.[1] ?? '';

  let city = (bizCity ?? '').trim();
  if (!city && bizAddress) {
    const parts = bizAddress.split(',').map((p) => p.trim());
    if (parts.length >= 2) city = parts[parts.length - 2].replace(/\s+[A-Z]{2}$/, '').trim() || parts[1];
  }

  const displayParts = [city, state, zip].filter(Boolean);
  const display = displayParts.join(' ');
  return { display, keywordSuffix: display.toLowerCase() };
}

export function normalizeKeywords(ownerServices: string[], city?: string): KeywordEntry[] {
  const keywords: KeywordEntry[] = [];
  const cityStr = (city ?? '').trim();
  for (const svc of ownerServices) {
    const svcClean = svc.trim().toLowerCase();
    keywords.push({
      keyword: `${svcClean} near me`,
      service: svcClean,
      type: 'near_me',
    });
    if (cityStr) {
      keywords.push({
        keyword: `${svcClean} ${cityStr.toLowerCase()}`,
        service: svcClean,
        type: 'city',
      });
    }
  }
  return keywords;
}
