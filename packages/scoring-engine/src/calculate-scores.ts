import {
  CATEGORY_DISPLAY_WEIGHTS,
  P1_WEIGHTS,
  P2_WEIGHTS,
  P2_WEIGHTS_PSI_FAILED,
  PROFILE_NAMES,
} from '@growthpath/shared';
import type { AuditData, Scores } from '@growthpath/shared';
import { buildPriorityActions } from './build-priority-actions.js';
import { identifyPrimaryCompetitor } from './identify-primary-competitor.js';
import { normalizeVertical } from './normalize-vertical.js';
import { scoreConversionInfrastructure } from './score-conversion-infrastructure.js';
import { scoreDomainTrust } from './score-domain-trust.js';
import { scoreGbpStrength } from './score-gbp-strength.js';
import { scoreMobilePerformance } from './score-mobile-performance.js';
import { scoreMobileUx } from './score-mobile-ux.js';
import { scoreOnpageRelevance } from './score-onpage-relevance.js';
import { scoreSearchVisibility } from './score-search-visibility.js';
import { buildCompetitorLeaderboard } from './build-competitor-leaderboard.js';
import { buildReportEvidence } from './build-report-evidence.js';
import { getTier } from './tier.js';

export function calculateScores(auditData: AuditData): Scores {
  const gbp = auditData.gbp;
  const serp = auditData.serp ?? {};
  const labsData = auditData.labs_data ?? {
    all_3pack_keywords: [],
    near_miss_keywords: [],
    total_3pack_count: 0,
  };
  const localFinder = auditData.local_finder ?? {};
  const whois = auditData.whois;
  const html = auditData.html ?? {};
  const psi = auditData.pagespeed ?? { performance: null };
  const vertical = normalizeVertical(
    auditData.vertical,
    auditData.gbp?.primary_type,
    auditData.biz_type,
  );
  const city = (auditData.city ?? 'Seattle').split(',')[0]?.trim() ?? 'Seattle';
  const keywords = auditData.keywords ?? [];
  const moz = auditData.moz;
  const gbpPosts = auditData.gbp_posts;
  const contentDepth = auditData.content_depth;

  const [gbpScore, gbpFindings, gbpCatOpportunity, gbpSignalPts] = scoreGbpStrength(
    gbp,
    gbpPosts,
    auditData.owner_services,
    vertical,
    serp,
  );

  const [onpageScore, onpageFindings, onpageSignalPts] = scoreOnpageRelevance(
    html,
    city,
    contentDepth,
    gbp.primary_type ?? gbp.primary_category,
  );

  const [trustScore, trustFindings, trustMeta, trustSignalPts] = scoreDomainTrust(whois, moz, vertical);

  const searchResult = scoreSearchVisibility(serp, localFinder, vertical, keywords, gbp.name);

  const p1 = Math.round(
    gbpScore * P1_WEIGHTS.gbp +
      searchResult.categoryScore * P1_WEIGHTS.mappack +
      onpageScore * P1_WEIGHTS.onpage +
      trustScore * P1_WEIGHTS.trust,
  );

  const psiWithWebp = {
    ...psi,
    webp_by_extension: html.webp_by_extension ?? false,
    webp_by_picture: html.webp_by_picture ?? false,
    webp_by_css: html.webp_by_css ?? false,
  };

  const [perfScore, perfFindingsBase, dataSource, perfSignalPtsBase] = scoreMobilePerformance(psiWithWebp);
  let perfFindings = perfFindingsBase;
  let perfSignalPts = perfSignalPtsBase;

  const [convScore, convFindings, convSignalPts] = scoreConversionInfrastructure(html, vertical);
  const [uxScore, uxFindings, uxSignalPts] = scoreMobileUx(html, auditData.psi_accessibility);

  const psiFailed = psi.performance === null || psi.performance === undefined;

  let p2: number;
  if (psiFailed) {
    p2 = Math.round(convScore * P2_WEIGHTS_PSI_FAILED.conversion + uxScore * P2_WEIGHTS_PSI_FAILED.ux);
    perfFindings = [
      {
        text: 'PageSpeed data unavailable for this scan — website performance scoring excluded from this analysis. Re-run the scan to collect performance data.',
        severity: 'warning',
      },
    ];
    perfSignalPts = {};
  } else {
    p2 = Math.round(
      perfScore * P2_WEIGHTS.performance + convScore * P2_WEIGHTS.conversion + uxScore * P2_WEIGHTS.ux,
    );
  }

  let profile: string;
  if (p1 >= 70 && p2 >= 70) profile = PROFILE_NAMES.LEADER;
  else if (p1 >= 50 && p2 >= 50) profile = PROFILE_NAMES.CONTENDER;
  else if (p1 >= 50 && p2 < 50) profile = PROFILE_NAMES.LEAKY_BUCKET;
  else if (p1 < 50 && p2 >= 50) profile = PROFILE_NAMES.HIDDEN_GEM;
  else profile = PROFILE_NAMES.INVISIBLE_CLOSER;

  const actions = buildPriorityActions(
    html,
    serp,
    labsData,
    searchResult.kw3pack,
    searchResult.kwCityVisible,
    searchResult.kwLocalVisible,
    searchResult.kwInvisible,
    searchResult.nearMiss,
    searchResult.unexpected3pack,
    vertical,
    gbp.primary_type ?? gbp.primary_category,
  );

  const competitorIntel = identifyPrimaryCompetitor(
    auditData,
    searchResult.keywordScores,
    gbp.review_count,
    trustMeta.da,
    gbp.rating,
  );
  const competitorLeaderboard = buildCompetitorLeaderboard(auditData, competitorIntel);

  const perfDisplayWeight = psiFailed ? '0% (excluded)' : CATEGORY_DISPLAY_WEIGHTS.performance;
  const convPsiPct = Math.round(P2_WEIGHTS_PSI_FAILED.conversion * 100);
  const convDisplayWeight = psiFailed ? `${convPsiPct}%` : CATEGORY_DISPLAY_WEIGHTS.conversion;
  const uxDisplayWeight = psiFailed ? `${100 - convPsiPct}%` : CATEGORY_DISPLAY_WEIGHTS.ux;

  const scoresWithoutReport: Omit<Scores, 'report'> = {
    p1,
    p2,
    profile,
    p1_tier: getTier(p1),
    p2_tier: getTier(p2),
    categories: {
      gbp_strength: {
        score: gbpScore,
        tier: getTier(gbpScore),
        weight: CATEGORY_DISPLAY_WEIGHTS.gbp_strength,
        findings: gbpFindings,
        category_opportunity: gbpCatOpportunity,
        signal_pts: gbpSignalPts,
      },
      mappack: {
        score: searchResult.categoryScore,
        tier: getTier(searchResult.categoryScore),
        weight: CATEGORY_DISPLAY_WEIGHTS.mappack,
        findings: searchResult.findings,
        scenario: searchResult.scenario,
        kw_3pack: [...searchResult.kw3pack],
        kw_city_visible: [...searchResult.kwCityVisible],
        kw_local_visible: [...searchResult.kwLocalVisible],
        kw_invisible: [...searchResult.kwInvisible],
        keyword_scores: searchResult.keywordScores,
        unexpected_3pack: searchResult.unexpected3pack,
        near_miss: searchResult.nearMiss,
        competitor_leaderboard: searchResult.competitorLeaderboard,
        local_reach: searchResult.localReach,
        regional_reach: searchResult.regionalReach,
        near_me_score: searchResult.nearMeScore,
        city_score: searchResult.cityScore,
        diagnosis: searchResult.diagnosis,
      },
      onpage: {
        score: onpageScore,
        tier: getTier(onpageScore),
        weight: CATEGORY_DISPLAY_WEIGHTS.onpage,
        findings: onpageFindings,
        signal_pts: onpageSignalPts,
      },
      trust: {
        score: trustScore,
        tier: getTier(trustScore),
        weight: CATEGORY_DISPLAY_WEIGHTS.trust,
        findings: trustFindings,
        da: trustMeta.da,
        referring_domains: trustMeta.referring_domains,
        signal_pts: trustSignalPts,
      },
      performance: {
        score: psiFailed ? null : perfScore,
        tier: psiFailed ? ['Unavailable', '#9ca3af'] : getTier(perfScore),
        weight: perfDisplayWeight,
        findings: perfFindings,
        data_source: dataSource,
        signal_pts: perfSignalPts,
      },
      conversion: {
        score: convScore,
        tier: getTier(convScore),
        weight: convDisplayWeight,
        findings: convFindings,
        signal_pts: convSignalPts,
      },
      ux: {
        score: uxScore,
        tier: getTier(uxScore),
        weight: uxDisplayWeight,
        findings: uxFindings,
        signal_pts: uxSignalPts,
      },
    },
    actions,
    serp_data: serp,
    labs_data: labsData as unknown as Record<string, unknown>,
    competitor_intel: competitorIntel,
    competitor_leaderboard: competitorLeaderboard,
  };

  return {
    ...scoresWithoutReport,
    report: buildReportEvidence(auditData, scoresWithoutReport as Scores),
  };
}
