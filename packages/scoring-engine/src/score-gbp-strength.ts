import type {
  CategoryOpportunity,
  Finding,
  GbpData,
  GbpPosts,
  SerpData,
  SignalPts,
} from '@growthpath/shared';

const GENERIC_PRIMARY = new Set([
  'restaurant',
  'food',
  'establishment',
  'point_of_interest',
  'store',
  'bar',
  'cafe',
  'meal_delivery',
  'meal_takeaway',
  'food_and_drink',
  'local_food_and_drink',
]);

const GENERIC_COMP = new Set([
  'restaurant',
  'food',
  'establishment',
  'store',
  'bar',
  'cafe',
  'meal_delivery',
  'meal_takeaway',
  'food_and_drink',
  'local_food_and_drink',
  'point_of_interest',
]);

const VELOCITY_MINIMUMS: Record<string, number> = {
  restaurant: 5,
  salon: 2,
  medspa: 2,
  gym: 2,
  personal_trainer: 1,
  home_service: 1,
  home_trade: 2,
  professional_service: 1,
  real_estate: 2,
  service: 1,
};

const CONSISTENCY_PTS: Record<number, number> = { 3: 11, 2: 7, 1: 3, 0: 0 };
const MINIMUM_PTS: Record<number, number> = { 3: 9, 2: 6, 1: 2, 0: 0 };

const COUNT_THRESHOLDS: Record<string, [number, number, number]> = {
  restaurant: [800, 300, 150],
  medspa: [250, 100, 50],
  salon: [300, 150, 75],
  service: [200, 80, 40],
  home_trade: [150, 60, 25],
  professional_service: [75, 30, 15],
  real_estate: [200, 80, 40],
};

function clientMatch(catKey: string, primary: string): boolean {
  const ck = catKey.toLowerCase().replace(/ /g, '_').replace(/-/g, '_');
  const pm = primary.toLowerCase().replace(/ /g, '_').replace(/-/g, '_');
  if (ck === pm) return true;
  if (ck.replace(/_/g, '') === pm.replace(/_/g, '')) return true;
  if (pm.startsWith(ck) && (pm.length === ck.length || pm[ck.length] === '_')) return true;
  return false;
}

function buildLeaderboard(
  tally: Map<string, number>,
  primary: string,
  topN = 5,
): [{ category: string; label: string; count: number; pct: number; is_client: boolean }[], number] {
  const total = [...tally.values()].reduce((a, b) => a + b, 0);
  const rows = [...tally.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([cat, count]) => {
      const pct = total ? Math.round((count / total) * 100) : 0;
      const isClient = clientMatch(cat, primary);
      const label = cat.replace(/_/g, ' ').replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      return { category: cat, label, count, pct, is_client: isClient };
    });
  return [rows, total];
}

export function scoreGbpStrength(
  gbp: GbpData,
  gbpPosts: GbpPosts | null = null,
  _ownerServices: string[] | null = null,
  vertical = 'service',
  serp: SerpData | null = null,
): [number, Finding[], CategoryOpportunity | null, SignalPts] {
  let points = 0;
  const findings: Finding[] = [];

  const primaryCat = (gbp.primary_type ?? gbp.primary_category ?? '').toLowerCase().replace(/ /g, '_');
  let catPts = 0;
  let fitPts = 0;
  let categoryOpportunity: CategoryOpportunity | null = null;

  if (!primaryCat) {
    findings.push({
      text: 'No primary GBP category detected. Primary category is the strongest relevance signal in local search — set it immediately.',
      severity: 'critical',
      kb_key: 'GBP_CATEGORY_PRIMARY',
    });
  } else {
    catPts += 10;
    if (GENERIC_PRIMARY.has(primaryCat)) {
      findings.push({
        text: `Primary category '${primaryCat.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}' is too broad. A more specific category significantly improves Map Pack relevance — log into Google Business Profile and select the most specific option available.`,
        severity: 'warning',
        kb_key: 'GBP_CATEGORY_PRIMARY',
      });
    }
  }
  points += catPts;

  if (primaryCat && serp) {
    const tallyAll = new Map<string, number>();
    const tallyNm = new Map<string, number>();
    const tallyCity = new Map<string, number>();

    for (const kwData of Object.values(serp)) {
      const kwType = kwData.type ?? '';
      for (const od of Object.values(kwData.origins ?? {})) {
        for (const item of od.top3 ?? []) {
          const cat = (item.category ?? '').trim().toLowerCase();
          if (cat && (!GENERIC_COMP.has(cat) || cat === primaryCat)) {
            tallyAll.set(cat, (tallyAll.get(cat) ?? 0) + 1);
            if (kwType === 'near_me') {
              tallyNm.set(cat, (tallyNm.get(cat) ?? 0) + 1);
            } else {
              tallyCity.set(cat, (tallyCity.get(cat) ?? 0) + 1);
            }
          }
        }
      }
    }

    if (tallyAll.size === 0) {
      fitPts = 10;
      categoryOpportunity = null;
    } else {
      const [leaderboardAll, totalAll] = buildLeaderboard(tallyAll, primaryCat);
      const [leaderboardNm, totalNm] = buildLeaderboard(tallyNm, primaryCat);
      const [leaderboardCity, totalCity] = buildLeaderboard(tallyCity, primaryCat);

      let clientCount = 0;
      for (const [cat, count] of tallyAll.entries()) {
        if (clientMatch(cat, primaryCat)) clientCount += count;
      }
      const clientPct = totalAll ? Math.round((clientCount / totalAll) * 100) : 0;
      const topEntry = [...tallyAll.entries()].sort((a, b) => b[1] - a[1])[0];
      const topPct = topEntry && totalAll ? Math.round((topEntry[1] / totalAll) * 100) : 0;
      const marketFragmented = topPct <= 30;
      const primaryClean = (gbp.primary_type ?? primaryCat).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      const clientInBoard = leaderboardAll.some((r) => r.is_client);

      if (marketFragmented || clientPct >= 15) {
        fitPts = 10;
      } else {
        fitPts = 4;
      }

      if (!clientInBoard) {
        findings.push({
          text:
            `Your primary GBP category "${primaryClean}" doesn't appear in the ` +
            `top 5 competitor categories across your scanned trade area — ` +
            `meaning competitors in other categories are winning the Map Pack slots ` +
            `your keywords should be capturing. Confirm your GBP category is ` +
            `correctly set to the most specific option available.`,
          severity: 'warning',
          kb_key: 'GBP_CATEGORY_PRIMARY',
        });
      } else if (clientInBoard && !marketFragmented && clientPct < 15) {
        const topCatClean = leaderboardAll[0]?.category.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) ?? '';
        const dominantGap = topPct - clientPct;
        if (dominantGap >= 30) {
          findings.push({
            text:
              `Your primary GBP category "${primaryClean}" represents only ${clientPct}% ` +
              `of competitor slots while "${topCatClean}" dominates at ${topPct}%. ` +
              `If your business legitimately qualifies for "${topCatClean}" as a primary ` +
              `GBP category, switching may improve Map Pack visibility for your core keywords.`,
            severity: 'warning',
            kb_key: 'GBP_CATEGORY_PRIMARY',
          });
        }
      }

      categoryOpportunity = {
        primary_clean: primaryClean,
        client_pct: clientPct,
        client_in_board: clientInBoard,
        market_fragmented: marketFragmented,
        top_pct: topPct,
        leaderboard_all: leaderboardAll,
        leaderboard_nm: leaderboardNm,
        leaderboard_city: leaderboardCity,
        total_all: totalAll,
        total_nm: totalNm,
        total_city: totalCity,
      };
    }
    points += fitPts;
  }

  const velMin = VELOCITY_MINIMUMS[vertical] ?? 1;
  const w1 = gbp.reviews_w1 ?? 0;
  const w2 = gbp.reviews_w2 ?? 0;
  const w3 = gbp.reviews_w3 ?? 0;
  const velNull = gbp.reviews_w1 === null && gbp.reviews_w2 === null && gbp.reviews_w3 === null;

  let velPts = 0;
  if (velNull) {
    findings.push({
      text: 'Review velocity data unavailable — DFS Reviews API not yet collected.',
      severity: 'warning',
    });
  } else {
    const w1Active = w1 >= 1;
    const w2Active = w2 >= 1;
    const w3Active = w3 >= 1;
    const consistencyScore = [w1Active, w2Active, w3Active].filter(Boolean).length;
    const minScore = [w1 >= velMin, w2 >= velMin, w3 >= velMin].filter(Boolean).length;
    velPts = (CONSISTENCY_PTS[consistencyScore] ?? 0) + (MINIMUM_PTS[minScore] ?? 0);
    points += velPts;

    if (consistencyScore === 0) {
      findings.push({
        text: `No new reviews across any of the past three 30-day windows (0 / 0 / 0 for days 1–30 / 31–60 / 61–90). Google treats an inactive review profile as a signal the business may no longer be operating.`,
        severity: 'critical',
        kb_key: 'REVIEW_VELOCITY_LOW',
      });
    } else if (consistencyScore === 1) {
      findings.push({
        text: `Reviews in only 1 of the past three 30-day windows — sporadic activity (${w1} / ${w2} / ${w3} for days 1–30 / 31–60 / 61–90). Google rewards consistent monthly review flow, not occasional spikes.`,
        severity: 'critical',
        kb_key: 'REVIEW_VELOCITY_LOW',
      });
    } else if (consistencyScore === 2) {
      findings.push({
        text: `Reviews missing in 1 of the past three 30-day windows (${w1} / ${w2} / ${w3} for days 1–30 / 31–60 / 61–90). A steady monthly cadence is a stronger Google signal than high volume with gaps.`,
        severity: 'warning',
        kb_key: 'REVIEW_VELOCITY_LOW',
      });
    } else if (minScore < 3) {
      findings.push({
        text: `Consistent review activity across all three windows (${w1} / ${w2} / ${w3} for days 1–30 / 31–60 / 61–90), but some windows fell below the ${velMin}+ minimum for this vertical. A structured ask-at-checkout process closes this gap.`,
        severity: 'warning',
        kb_key: 'REVIEW_VELOCITY_LOW',
      });
    }
  }

  const [rLead, rComp, rNw] = COUNT_THRESHOLDS[vertical] ?? COUNT_THRESHOLDS.service;
  const reviewCountAvailable = gbp.review_count !== null && gbp.review_count !== undefined;
  const gRev = gbp.review_count ?? 0;

  if (!reviewCountAvailable) {
    findings.push({
      text: 'Google review count unavailable — review data not yet collected, so review-volume scoring was skipped.',
      severity: 'warning',
    });
  } else if (gRev >= rLead) {
    points += 20;
  } else if (gRev >= rComp) {
    points += 14;
    findings.push({
      text: `${gRev} Google reviews — competitive range, but ${rLead}+ is the leading threshold for this market. Consistent review generation keeps you moving in the right direction.`,
      severity: 'warning',
      kb_key: 'REVIEW_COUNT_LOW',
    });
  } else if (gRev >= rNw) {
    points += 8;
    findings.push({
      text: `${gRev} Google reviews — below the competitive threshold of ${rComp}+ for this vertical. Review volume is one of Google's top three local ranking signals.`,
      severity: 'warning',
      kb_key: 'REVIEW_COUNT_LOW',
    });
  } else {
    points += 2;
    findings.push({
      text: `${gRev} Google reviews — below the ${rNw}+ threshold for this vertical. Review volume is one of the strongest local ranking signals.`,
      severity: 'critical',
      kb_key: 'REVIEW_COUNT_LOW',
    });
  }

  const ratingAvailable = gbp.rating !== null && gbp.rating !== undefined;
  const gRating = gbp.rating ?? 0;
  if (!ratingAvailable) {
    findings.push({
      text: 'Google rating unavailable — review data not yet collected, so rating scoring was skipped.',
      severity: 'warning',
    });
  } else if (gRating >= 4.8) {
    points += 10;
  } else if (gRating >= 4.5) {
    points += 7;
  } else if (gRating >= 4.3) {
    points += 4;
  } else {
    findings.push({
      text: `Google rating ${gRating}★ — below 4.3★ actively suppresses Map Pack eligibility and click-through from search results.`,
      severity: 'critical',
      kb_key: 'REVIEW_RATING_LOW',
    });
  }

  const resp = gbp.owner_response_rate;
  if (resp !== null && resp !== undefined) {
    if (resp >= 0.75) {
      points += 10;
    } else if (resp >= 0.5) {
      points += 6;
      findings.push({
        text: `Responding to ${Math.round(resp * 100)}% of reviews — strong, but 75%+ is the benchmark. Response rate is a confirmed Google engagement signal.`,
        severity: 'warning',
        kb_key: 'REVIEW_RESPONSE_RATE_LOW',
      });
    } else if (resp >= 0.25) {
      points += 3;
      findings.push({
        text: `Only ${Math.round(resp * 100)}% of reviews have an owner response. Responding to reviews is free, takes minutes, and is a confirmed Google engagement signal.`,
        severity: 'warning',
        kb_key: 'REVIEW_RESPONSE_RATE_LOW',
      });
    } else {
      findings.push({
        text: `Owner response rate critically low (${Math.round(resp * 100)}%). Unanswered reviews signal an unengaged business to Google and to potential customers reading them.`,
        severity: 'critical',
        kb_key: 'REVIEW_RESPONSE_RATE_LOW',
      });
    }
  }

  const posts = gbpPosts ?? { post_count: 0, last_post_days_ago: null, last_post_date: null, posts: [] };
  const daysSince = posts.last_post_days_ago;
  const postCount = posts.post_count ?? 0;
  let postPts = 0;

  if (postCount === 0 || daysSince === null || daysSince === undefined) {
    findings.push({
      text: 'No GBP posts detected. Weekly posts signal active listing management to Google — a factor in city-modifier rankings. 10 minutes/week, costs nothing.',
      severity: 'critical',
      kb_key: 'GBP_POSTS_MISSING',
    });
  } else if (daysSince <= 7) {
    postPts = 5;
  } else if (daysSince <= 30) {
    postPts = 4;
  } else if (daysSince <= 90) {
    postPts = 2;
    findings.push({
      text: `Last GBP post was ${daysSince} days ago. Posting at least monthly maintains the active listing signal Google factors into local rankings.`,
      severity: 'warning',
      kb_key: 'GBP_POSTS_MISSING',
    });
  } else {
    findings.push({
      text: `Last GBP post was ${daysSince} days ago — listing appears inactive. Resume weekly or monthly GBP posts.`,
      severity: 'critical',
      kb_key: 'GBP_POSTS_MISSING',
    });
  }
  points += postPts;

  const photoCount = gbp.photo_count;
  if (photoCount !== null && photoCount !== undefined) {
    if (photoCount >= 15) {
      points += 5;
    } else if (photoCount >= 10) {
      points += 3;
      findings.push({
        text: `${photoCount} GBP photos — add ${15 - photoCount} more to reach the 15-photo engagement threshold.`,
        severity: 'warning',
        kb_key: 'GBP_PHOTOS_LOW',
      });
    } else if (photoCount >= 5) {
      points += 1;
      findings.push({
        text: `${photoCount} GBP photos — below the 15-photo benchmark. Add interior, exterior, and service photos.`,
        severity: 'warning',
        kb_key: 'GBP_PHOTOS_LOW',
      });
    } else {
      findings.push({
        text: `${photoCount === 0 ? 'No' : String(photoCount)} GBP photos — add at least 15 covering interior, exterior, and services.`,
        severity: 'critical',
        kb_key: 'GBP_PHOTOS_LOW',
      });
    }
  }

  const secCount = (gbp.secondary_categories ?? []).length;
  if (secCount >= 3) {
    points += 10;
  } else if (secCount >= 1) {
    points += 4;
    const needed = 3 - secCount;
    const catWord = secCount === 1 ? 'category' : 'categories';
    findings.push({
      text: `${secCount} secondary ${catWord} set — add ${needed} more to reach the 3+ threshold. Each additional category expands the search queries your GBP is eligible to rank for.`,
      severity: 'warning',
      kb_key: 'GBP_SECONDARY_CATEGORIES',
    });
  } else {
    findings.push({
      text: 'No secondary GBP categories set. Adding 3+ secondary categories expands your ranking surface across more search queries.',
      severity: 'warning',
      kb_key: 'GBP_SECONDARY_CATEGORIES',
    });
  }

  const velMinRecalc = VELOCITY_MINIMUMS[vertical] ?? 1;
  const w1r = gbp.reviews_w1 ?? 0;
  const w2r = gbp.reviews_w2 ?? 0;
  const w3r = gbp.reviews_w3 ?? 0;
  let velE = 0;
  if (!(gbp.reviews_w1 === null && gbp.reviews_w2 === null && gbp.reviews_w3 === null)) {
    const cons = [w1r >= 1, w2r >= 1, w3r >= 1].filter(Boolean).length;
    const mins = [w1r >= velMinRecalc, w2r >= velMinRecalc, w3r >= velMinRecalc].filter(Boolean).length;
    velE = (CONSISTENCY_PTS[cons] ?? 0) + (MINIMUM_PTS[mins] ?? 0);
  }

  const gRevV = gbp.review_count ?? 0;
  const rctE = !reviewCountAvailable
    ? 0
    : gRevV >= rLead
      ? 20
      : gRevV >= rComp
        ? 14
        : gRevV >= rNw
          ? 8
          : 2;
  const gRatV = gbp.rating ?? 0;
  const ratE = !ratingAvailable ? 0 : gRatV >= 4.8 ? 10 : gRatV >= 4.5 ? 7 : gRatV >= 4.3 ? 4 : 0;
  const respV = gbp.owner_response_rate;
  const respE =
    respV === null || respV === undefined
      ? 0
      : respV >= 0.75
        ? 10
        : respV >= 0.5
          ? 6
          : respV >= 0.25
            ? 3
            : 0;
  const photoV = gbp.photo_count ?? 0;
  const photoE = photoV >= 15 ? 5 : photoV >= 10 ? 3 : photoV >= 5 ? 1 : 0;
  const secV = (gbp.secondary_categories ?? []).length;
  const secE = secV >= 3 ? 10 : secV >= 1 ? 4 : 0;

  const signalPts: SignalPts = {
    primary_category: { earned: catPts + fitPts, max: 20 },
    review_velocity: { earned: velE, max: 20 },
    review_count: { earned: rctE, max: 20 },
    google_rating: { earned: ratE, max: 10 },
    secondary_categories: { earned: secE, max: 10 },
    response_rate: { earned: respE, max: 10 },
    photos: { earned: photoE, max: 5 },
    gbp_posts: { earned: postPts, max: 5 },
  };

  return [Math.min(100, points), findings, categoryOpportunity, signalPts];
}
