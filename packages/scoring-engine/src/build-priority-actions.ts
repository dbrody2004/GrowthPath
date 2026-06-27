import type { HtmlData, LabsDataStub, PriorityAction, SerpData } from '@growthpath/shared';
import { evaluateSchema } from './schema.js';
import { mergeNearMissSources } from './search-visibility-derivations.js';
import { extractPositions } from './search-visibility-helpers.js';

export function buildPriorityActions(
  html: HtmlData,
  serp: SerpData,
  labsData: LabsDataStub,
  kw3pack: Set<string>,
  kwCityVisible: Set<string>,
  kwLocalVisible: Set<string>,
  kwInvisible: Set<string>,
  nearMiss: Array<{ keyword: string; rank: number; volume?: number }>,
  _unexpected3pack: unknown[],
  _vertical = 'service',
  primaryType: string | null = null,
): PriorityAction[] {
  const actions: PriorityAction[] = [];
  const effectiveNearMiss = mergeNearMissSources(nearMiss, labsData);

  const add = (pillar: 'P1' | 'P2', action: string, effort: PriorityAction['effort'], impact: PriorityAction['impact'], whyNow: string) => {
    actions.push({
      rank: actions.length + 1,
      pillar,
      action,
      effort,
      impact,
      why_now: whyNow,
    });
  };

  if (!html.ga4) {
    add(
      'P2',
      'Install GA4 via GTM with conversion events',
      'Low',
      'High',
      'You are completely blind to what\'s working on your website.',
    );
  }

  if (kw3pack.size === 0) {
    if (kwCityVisible.size > 0 || kwLocalVisible.size > 0) {
      let bestKw: string | null = null;
      let bestPos = 99;
      for (const kw of new Set([...kwCityVisible, ...kwLocalVisible])) {
        const [, pos] = extractPositions(serp[kw] ?? { service: '', type: 'unknown', origins: {} });
        const effectivePos = pos ?? 99;
        if (effectivePos < bestPos) {
          bestPos = effectivePos;
          bestKw = kw;
        }
      }
      if (bestKw) {
        add(
          'P1',
          `Push '${bestKw}' into Map Pack top 3 — review velocity + content signals`,
          'Medium',
          'High',
          `You're ranking on '${bestKw}' from your closest origins but visibility drops off with distance. Building review velocity and strengthening category signals will extend your Map Pack presence across more of your trade area.`,
        );
      }
      if (kwInvisible.size > 0) {
        add(
          'P1',
          'Expand category signal for zero-visibility keywords — GBP services list + website content',
          'Low',
          'High',
          `No Maps presence for: ${[...kwInvisible].slice(0, 2).join(', ')}. Google doesn't associate you with these terms yet.`,
        );
      }
    } else {
      add(
        'P1',
        'GBP optimization + review generation campaign',
        'Medium',
        'High',
        'Zero Maps presence for any keyword tested. Category recognition problem.',
      );
    }
  }

  const bookingPathType = html.booking_path_type ?? 'none';
  if (bookingPathType === 'contact_form_only') {
    add(
      'P2',
      'Replace contact form with self-scheduling link',
      'Medium',
      'High',
      'A contact form requires a callback before a visitor can book — every friction point costs conversions. A self-scheduling link converts immediately.',
    );
  } else if (bookingPathType === 'none') {
    add(
      'P2',
      'Implement booking path with above-fold CTA',
      'Medium',
      'High',
      'No booking path detected. Visitors have no way to self-schedule. Note: our scanner reads page HTML directly and may not detect booking or contact forms that load via JavaScript or third-party widgets. If your site has a working form, this finding may not apply.',
    );
  }

  if (html.ga4 && !html.gtm) {
    add(
      'P2',
      'Verify GA4 conversion events — add GTM for proper event tracking',
      'Low',
      'High',
      'GA4 without GTM likely misses conversion events entirely.',
    );
  }

  if (!html.click_to_call) {
    add(
      'P2',
      'Add click-to-call (tel: link) to header and mobile nav',
      'Low',
      'High',
      'Mobile visitors cannot call directly. Direct conversion path missing.',
    );
  }

  const schemaResult = evaluateSchema(primaryType, html.schema_types ?? []);
  if (schemaResult.status !== 'present') {
    add(
      'P1',
      `Add ${schemaResult.recommended} schema markup to website`,
      'Low',
      'Medium',
      schemaResult.finding.text,
    );
  }

  if (effectiveNearMiss.length > 0 && actions.length < 7) {
    const topNm = effectiveNearMiss[0]!;
    add(
      'P1',
      `Convert near-miss keyword '${topNm.keyword}' to Map Pack — targeted content + review push`,
      'Medium',
      'High',
      `Ranking position #${topNm.rank}${topNm.volume != null ? ` with ${topNm.volume} monthly searches` : ''}. One review push from the top 3.`,
    );
  }

  if (!(html.webp_by_extension || html.webp_by_picture || html.webp_by_css) && actions.length < 8) {
    add(
      'P2',
      'Convert images to WebP format',
      'Low',
      'Medium',
      'WebP reduces image payload 25–35%. Direct mobile load time improvement.',
    );
  }

  const capped = actions.slice(0, 8);
  return capped.map((a, i) => ({ ...a, rank: i + 1 }));
}
