import type { GbpData, GbpPosts } from '@growthpath/shared';
import type { ScanEngineContext } from '../types.js';
import type { PlacesCandidate } from '../clients/google.js';

const GENERIC_TYPES = new Set([
  'point_of_interest',
  'establishment',
  'food',
  'store',
  'premise',
  'geocode',
]);

function normalizeGbpDisplayName(
  gbpName: string,
  intakeName: string,
  domain: string,
): string {
  if (!gbpName) return intakeName;
  const domainRoot = domain.replace(/^www\./, '').split('.')[0].toLowerCase();
  const compact = gbpName.toLowerCase().replace(/[^a-z0-9]/g, '');
  const domainCompact = domain.replace(/^www\./, '').replace(/\./g, '').toLowerCase();
  if (compact === domainRoot || compact === domainCompact) {
    return intakeName || gbpName;
  }
  return gbpName;
}

function normalizeWebsite(url: string): string {
  if (!url) return url;
  return url
    .replace(/^http:\/\//i, 'https://')
    .replace(/\/$/, '')
    .replace(/^https:\/\/(?!www\.)/i, 'https://www.');
}

function parseReviewDt(review: Record<string, unknown>): Date | null {
  for (const key of ['timestamp', 'datetime', 'time']) {
    const val = review[key];
    if (val == null) continue;
    if (typeof val === 'number') {
      return new Date(val);
    }
    if (typeof val === 'string') {
      try {
        // DFS format: "yyyy-mm-dd hh-mm-ss +00:00"
        const normalized = val.includes('T')
          ? val.replace('Z', '+00:00')
          : val.replace(/^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}) /, '$1T$2');
        const dt = new Date(normalized.replace(' ', ''));
        if (!Number.isNaN(dt.getTime())) return dt;
      } catch {
        // continue
      }
    }
  }
  return null;
}

function hasOwnerReply(review: Record<string, unknown>): boolean {
  for (const key of ['owner_answer', 'owner_reply', 'review_reply', 'reply']) {
    const val = review[key];
    if (typeof val === 'string' && val.trim()) return true;
    if (typeof val === 'object' && val) return true;
  }
  return false;
}

function matchPlace(
  places: PlacesCandidate[],
  bizName: string,
  bizCity: string,
  domain: string,
  street: string,
): PlacesCandidate | undefined {
  const cityLower = bizCity.toLowerCase();
  const domainClean = domain.replace(/^www\./, '').toLowerCase();
  const streetLower = street.split(',')[0]?.trim().toLowerCase() ?? '';

  const nameTokensMatch = (candidate: PlacesCandidate): boolean => {
    const cname = (candidate.displayName?.text ?? '').toLowerCase();
    const tokens = bizName.toLowerCase().split(/\s+/).filter((t) => t.length > 3);
    return tokens.length > 0 && tokens.some((t) => cname.includes(t));
  };

  if (streetLower) {
    for (const candidate of places) {
      const addr = (candidate.formattedAddress ?? '').toLowerCase();
      if (addr.includes(streetLower) && addr.includes(cityLower)) return candidate;
    }
  }
  for (const candidate of places) {
    const siteClean = (candidate.websiteUri ?? '')
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0]
      ?.toLowerCase() ?? '';
    const addr = (candidate.formattedAddress ?? '').toLowerCase();
    if (
      (siteClean === domainClean || siteClean.endsWith('.' + domainClean)) &&
      addr.includes(cityLower)
    ) return candidate;
  }
  for (const candidate of places) {
    const addr = (candidate.formattedAddress ?? '').toLowerCase();
    if (nameTokensMatch(candidate) && addr.includes(cityLower)) return candidate;
  }
  return undefined;
}

export async function fetchGbp(
  ctx: ScanEngineContext,
  url: string,
  bizName = '',
  bizCity = '',
  bizAddress = '',
): Promise<GbpData> {
  const domain = url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];

  let places: PlacesCandidate[] = [];
  const q1 = bizName && bizCity ? `${bizName} ${bizCity}`.trim() : '';
  if (q1) {
    places = await ctx.google.searchPlaces(q1);
  }
  if (!places.length) {
    places = await ctx.google.searchPlaces(domain);
  }
  if (!places.length) {
    return {} as GbpData;
  }

  const street = bizAddress || '';
  const p = matchPlace(places, bizName, bizCity, domain, street);
  if (!p) {
    return {} as GbpData;
  }
  const primaryType = p.primaryType ?? '';
  const allTypes = p.types ?? [];
  const secondary = allTypes.filter((t) => t !== primaryType && !GENERIC_TYPES.has(t));

  const gbp: GbpData = {
    name: p.displayName?.text ?? '',
    rating: p.rating ?? null,
    review_count: p.userRatingCount ?? null,
    address: p.formattedAddress ?? '',
    phone: p.nationalPhoneNumber ?? '',
    hours: Boolean(p.regularOpeningHours),
    website: p.websiteUri ?? '',
    primary_type: primaryType,
    primary_category: primaryType,
    types: allTypes,
    secondary_categories: secondary,
    cid: null,
    place_id: p.id ?? null,
    photo_count: null,
    reviews_last_30: null,
    reviews_w1: null,
    reviews_w2: null,
    reviews_w3: null,
    last_review_days_ago: null,
    owner_response_rate: null,
  };

  if (gbp.place_id) {
    const cid = await ctx.google.getPlaceCid(gbp.place_id);
    if (cid) gbp.cid = cid;
  }

  try {
    const mbiKeyword = gbp.cid ? `cid:${gbp.cid}` : `${gbp.name}, ${gbp.address}`;
    const mbi = await ctx.dataforseo.postLive('business_data/google/my_business_info/live', [
      { keyword: mbiKeyword, location_code: 2840, language_code: 'en' },
    ]);
    const items = ((mbi.tasks?.[0]?.result as Array<{ items?: unknown[] }> | undefined)?.[0]
      ?.items ?? []) as Array<Record<string, unknown>>;
    const mbiItem = items[0];
    if (mbiItem) {
      if (!gbp.cid && mbiItem.cid) gbp.cid = String(mbiItem.cid);
      if (!gbp.place_id && mbiItem.place_id) gbp.place_id = String(mbiItem.place_id);
      if (mbiItem.total_photos != null) gbp.photo_count = Number(mbiItem.total_photos);
      const mbiCat = mbiItem.category as string | undefined;
      const mbiCatIds = (mbiItem.category_ids as string[] | undefined) ?? [];
      const mbiAddCat = (mbiItem.additional_categories as string[] | undefined) ?? [];
      if (mbiCat) gbp.primary_category = mbiCat;
      if (mbiCatIds.length) gbp.primary_type = mbiCatIds[0];
      if (mbiAddCat.length) gbp.secondary_categories = mbiAddCat;
    }
  } catch {
    // my_business_info optional
  }

  if (gbp.cid) {
    try {
      const taskId = await ctx.dataforseo.taskPost('business_data/google/reviews/task_post', [
        {
          // Keep CID as string — parseInt loses precision above MAX_SAFE_INTEGER.
          cid: gbp.cid,
          location_code: 2840,
          language_name: 'English',
          depth: 100,
          sort_by: 'newest',
        },
      ]);
      const reviewsResp = await ctx.dataforseo.pollReviews(taskId);
      if (reviewsResp) {
        const result = (reviewsResp.tasks?.[0]?.result as Array<{ items?: unknown[] }> | undefined) ?? [];
        const items = (result[0]?.items ?? []) as Array<Record<string, unknown>>;
        const now = new Date();
        let reviewsLast30 = 0;
        let w1 = 0;
        let w2 = 0;
        let w3 = 0;
        let latestDt: Date | null = null;
        let replies = 0;

        for (const review of items) {
          const dt = parseReviewDt(review);
          if (dt) {
            const ageDays = Math.floor((now.getTime() - dt.getTime()) / 86_400_000);
            if (ageDays <= 30) {
              reviewsLast30 += 1;
              w1 += 1;
            } else if (ageDays <= 60) {
              w2 += 1;
            } else if (ageDays <= 90) {
              w3 += 1;
            }
            if (!latestDt || dt > latestDt) latestDt = dt;
          }
          if (hasOwnerReply(review)) replies += 1;
        }

        gbp.reviews_last_30 = reviewsLast30;
        gbp.reviews_w1 = w1;
        gbp.reviews_w2 = w2;
        gbp.reviews_w3 = w3;
        gbp.last_review_days_ago = latestDt
          ? Math.floor((now.getTime() - latestDt.getTime()) / 86_400_000)
          : null;
        gbp.owner_response_rate = items.length ? Math.round((replies / items.length) * 1000) / 1000 : null;
      }
    } catch {
      // reviews optional
    }
  }

  gbp.name = normalizeGbpDisplayName(gbp.name, bizName, domain);
  gbp.website = normalizeWebsite(gbp.website);
  gbp.address = gbp.address.replace(/, USA$/i, '').trim();
  if (gbp.primary_category) {
    gbp.primary_category = gbp.primary_category.toLowerCase();
  }

  return gbp;
}

function parsePostDt(item: Record<string, unknown>): Date | null {
  for (const key of ['timestamp', 'datetime', 'publish_time', 'create_time']) {
    const val = item[key];
    if (!val) continue;
    try {
      if (typeof val === 'number') return new Date(val);
      return new Date(String(val).replace('Z', '+00:00'));
    } catch {
      // continue
    }
  }
  return null;
}

export async function fetchGbpPosts(
  ctx: ScanEngineContext,
  bizName: string,
  city: string,
  cid?: string | null,
): Promise<GbpPosts> {
  const empty: GbpPosts = {
    post_count: 0,
    last_post_days_ago: null,
    last_post_date: null,
    posts: [],
  };

  try {
    const keyword = cid ? `cid:${cid}` : `${bizName}, ${city}`;
    const taskId = await ctx.dataforseo.taskPost(
      'business_data/google/my_business_updates/task_post',
      [{ keyword, location_code: 2840, language_code: 'en', depth: 10 }],
    );
    const updatesResp = await ctx.dataforseo.pollGbpPosts(taskId);
    if (!updatesResp) return empty;

    const result =
      (updatesResp.tasks?.[0]?.result as Array<{ items?: unknown[] }> | undefined) ?? [];
    const items = (result[0]?.items ?? []) as Array<Record<string, unknown>>;

    const posts = items.map((item) => {
      const postDt = parsePostDt(item);
      return {
        type: (item.post_type as string | undefined) ?? (item.type as string | undefined) ?? null,
        summary: String(item.summary ?? item.text ?? '').slice(0, 120),
        dt: postDt ? postDt.toISOString() : null,
      };
    });

    posts.sort((a, b) => {
      const at = a.dt ? new Date(a.dt).getTime() : -Infinity;
      const bt = b.dt ? new Date(b.dt).getTime() : -Infinity;
      return bt - at;
    });

    let lastPostDaysAgo: number | null = null;
    let lastPostDate: string | null = null;
    if (posts[0]?.dt) {
      const lpDt = new Date(posts[0].dt);
      lastPostDaysAgo = Math.floor((Date.now() - lpDt.getTime()) / 86_400_000);
      lastPostDate = lpDt.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    }

    return {
      post_count: posts.length,
      last_post_days_ago: lastPostDaysAgo,
      last_post_date: lastPostDate,
      posts,
    };
  } catch {
    return empty;
  }
}
