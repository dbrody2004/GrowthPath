import type { ContentDepth } from '@growthpath/shared';
import * as cheerio from 'cheerio';
import { XMLParser } from 'fast-xml-parser';
import { BROWSER_HEADERS } from '../constants.js';
import type { ScanEngineContext } from '../types.js';

/** Tightened path-segment exclusions — `/blog/` requires slash boundary */
const EXCLUDED_SERVICE_PATH_RE =
  /\/(blog|news|faq|about|review|coupon|financ|career|press|tip|guide)(\/|$)/i;

function pathDepth(url: string): number {
  try {
    return new URL(url).pathname.split('/').filter(Boolean).length;
  } catch {
    return 0;
  }
}

function isExcludedServicePath(path: string): boolean {
  return EXCLUDED_SERVICE_PATH_RE.test(path);
}

function keywordMatchesPath(keyword: string, path: string): boolean {
  const kwWords = keyword.toLowerCase().split(/\s+/);
  const pathLower = path.toLowerCase();
  const slug = keyword.replace(/\s+/g, '-');
  if (pathLower.includes(slug)) return true;
  if (kwWords.every((w) => pathLower.includes(w))) return true;
  for (const word of kwWords) {
    if (word.length >= 5) {
      const stem = word.slice(0, 4);
      const tokens = pathLower.split(/[/\-_]/);
      if (tokens.some((tok) => tok.startsWith(stem))) return true;
    }
  }
  return false;
}

function keywordMatchesFirstWord(keyword: string, path: string): boolean {
  const first = keyword.toLowerCase().split(/\s+/)[0];
  if (first.length < 5) return false;
  const stem = first.slice(0, 4);
  const tokens = path.toLowerCase().split(/[/\-_]/);
  return tokens.some((tok) => tok.startsWith(stem));
}

function matchServices(
  allUrls: string[],
  servicesLower: string[],
): Record<string, { found: boolean; url: string | null }> {
  const eligible = allUrls.filter((u) => {
    try {
      return !isExcludedServicePath(new URL(u).pathname);
    } catch {
      return true;
    }
  });
  const sortedUrls = [...eligible].sort((a, b) => pathDepth(a) - pathDepth(b));
  const results: Record<string, { found: boolean; url: string | null }> = {};
  for (const svc of servicesLower) {
    let matched: string | null = null;
    for (const u of sortedUrls) {
      const p = new URL(u).pathname;
      if (keywordMatchesPath(svc, p)) {
        matched = u;
        break;
      }
    }
    if (!matched) {
      for (const u of sortedUrls) {
        const p = new URL(u).pathname;
        if (keywordMatchesFirstWord(svc, p)) {
          matched = u;
          break;
        }
      }
    }
    results[svc] = { found: Boolean(matched), url: matched };
  }
  return results;
}

async function fetchSitemapUrls(
  ctx: ScanEngineContext,
  base: string,
): Promise<{ urls: string[]; source: string | null }> {
  const candidates = [
    `${base}/sitemap.xml`,
    `${base}/sitemap_index.xml`,
    `${base}/page-sitemap.xml`,
    `${base}/pages-sitemap.xml`,
  ];
  const parser = new XMLParser({ ignoreAttributes: false });
  const nsIgnore = (obj: Record<string, unknown>, key: string) =>
    obj[key] ?? obj[`sm:${key}`];

  for (const sitemapUrl of candidates) {
    try {
      const r = await ctx.fetch(sitemapUrl, { headers: BROWSER_HEADERS });
      const ct = r.headers.get('content-type') ?? '';
      if (r.status >= 400) continue;
      if (r.status !== 200 || (ct.includes('html') && !ct.includes('xml'))) continue;
      const text = await r.text();
      const root = parser.parse(text);
      const urlset = root.urlset ?? root.sitemapindex;
      if (!urlset) continue;

      const subLocs = nsIgnore(urlset, 'sitemap');
      const urls: string[] = [];

      if (subLocs) {
        const subs = Array.isArray(subLocs) ? subLocs : [subLocs];
        for (const sub of subs) {
          const subUrl = String(nsIgnore(sub, 'loc') ?? sub.loc ?? '');
          if (!subUrl || /image|video|news/.test(subUrl)) continue;
          try {
            const sr = await ctx.fetch(subUrl, { headers: BROWSER_HEADERS });
            if (sr.status >= 400) continue;
            const subRoot = parser.parse(await sr.text());
            const subSet = subRoot.urlset;
            const locs = nsIgnore(subSet, 'url');
            const entries = Array.isArray(locs) ? locs : locs ? [locs] : [];
            for (const entry of entries) {
              const loc = String(nsIgnore(entry, 'loc') ?? entry.loc ?? '');
              if (loc) urls.push(loc);
            }
          } catch {
            // skip sub-sitemap
          }
        }
      } else {
        const locs = nsIgnore(urlset, 'url');
        const entries = Array.isArray(locs) ? locs : locs ? [locs] : [];
        for (const entry of entries) {
          const loc = String(nsIgnore(entry, 'loc') ?? entry.loc ?? '');
          if (loc) urls.push(loc);
        }
      }

      if (urls.length) return { urls, source: sitemapUrl };
    } catch {
      // try next candidate
    }
  }
  return { urls: [], source: null };
}

export async function fetchContentDepth(
  ctx: ScanEngineContext,
  url: string,
  ownerServices: string[],
  city: string,
  maxPages = 30,
  spotCheck = 5,
): Promise<ContentDepth> {
  const parsed = new URL(url);
  const domain = parsed.hostname;
  const base = `${parsed.protocol}//${domain}`;
  const servicesLower = ownerServices.map((s) => s.trim().toLowerCase());
  const cityLower = city.split(',')[0].trim().toLowerCase();

  const nullResult: ContentDepth = {
    service_pages: Object.fromEntries(servicesLower.map((s) => [s, { found: false, url: null }])),
    city_keyword_cooccurrence: Object.fromEntries(
      servicesLower.map((s) => [s, { found: false, url: null }]),
    ),
    internal_links_crawled: 0,
    pages_spot_checked: 0,
    sitemap_url: null,
    sitemap_url_count: 0,
  };

  const { urls: sitemapUrls, source: sitemapSource } = await fetchSitemapUrls(ctx, base);
  let crawlUrls: string[] = [];

  if (!sitemapUrls.length) {
    try {
      const r = await ctx.fetch(url, { headers: BROWSER_HEADERS });
      if (r.status >= 400) return nullResult;
      const html = await r.text();
      const $ = cheerio.load(html);
      const raw = new Set<string>();
      $('a[href]').each((_, el) => {
        const href = $(el).attr('href');
        if (!href) return;
        try {
          const full = new URL(href, url);
          if (full.hostname === domain && ['http:', 'https:'].includes(full.protocol)) {
            const clean = `${full.protocol}//${full.host}${full.pathname}`;
            if (clean !== url.replace(/\/$/, '')) raw.add(clean);
          }
        } catch {
          // skip invalid href
        }
      });
      crawlUrls = [...raw].slice(0, maxPages);
    } catch {
      return nullResult;
    }
  }

  const allUrls = sitemapUrls.length ? sitemapUrls : crawlUrls;
  const servicePages = matchServices(allUrls, servicesLower);

  const matchedUrls = Object.values(servicePages)
    .map((v) => v.url)
    .filter(Boolean) as string[];
  const otherUrls = allUrls.filter((u) => !matchedUrls.includes(u));
  const pagesToCheck = [...matchedUrls, ...otherUrls].slice(0, spotCheck);

  const cooc = Object.fromEntries(
    servicesLower.map((s) => [s, { found: false, url: null as string | null }]),
  );
  let pagesChecked = 0;

  for (const pageUrl of pagesToCheck) {
    try {
      const pr = await ctx.fetch(pageUrl, { headers: BROWSER_HEADERS });
      if (pr.status >= 400) continue;
      const text = cheerio.load(await pr.text()).text().toLowerCase();
      pagesChecked += 1;
      for (const svc of servicesLower) {
        if (cooc[svc].found) continue;
        const hasSvc = svc.split(/\s+/).every((w) => text.includes(w));
        const hasCity = cityLower ? text.includes(cityLower) : false;
        if (hasSvc && hasCity) {
          cooc[svc] = { found: true, url: pageUrl };
        }
      }
    } catch {
      // skip page
    }
  }

  return {
    service_pages: servicePages,
    city_keyword_cooccurrence: cooc,
    internal_links_crawled: allUrls.length,
    pages_spot_checked: pagesChecked,
    sitemap_url: sitemapSource,
    sitemap_url_count: sitemapUrls.length,
  };
}
