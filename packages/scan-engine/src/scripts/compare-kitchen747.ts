#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadWorkerEnv, preflightScanCredentials } from '@growthpath/config';
import { deriveScanStatusFromCollection, scanIntakeSchema } from '@growthpath/shared';
import type { AuditData, SerpData } from '@growthpath/shared';
import { kitchen747AuditData } from '../fixtures/kitchen747.fixture.js';
import { runScan } from '../run-scan.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SNAPSHOT_PATH = join(__dirname, '../../.tmp/kitchen747-live.json');

const STABLE_INTAKE = scanIntakeSchema.parse({
  bizName: 'Kitchen 747',
  bizAddress: '747 Main St, Roseville, CA 95747',
  bizDomain: 'kitchen747.com',
  bizCity: 'Roseville',
  bizVertical: 'Food & Beverage',
  bizType: 'Burger Restaurant',
  verticalKey: 'restaurant',
  bizTier: 'Advanced',
  scanTier: 'advanced_premium',
  ownerServices: ['burgers', 'pizza', 'live music'],
});

/** Paths where value differences are expected live drift, not bugs. */
const VOLATILE_PATH_PATTERNS: RegExp[] = [
  /^scan_date$/,
  /^engine$/,
  /^total_cost$/,
  /^collection_status$/,
  /^collection_metadata$/,
  /^biz_type$/,
  /^gbp\.review_count$/,
  /^gbp\.reviews_last_30$/,
  /^gbp\.reviews_w1$/,
  /^gbp\.reviews_w2$/,
  /^gbp\.reviews_w3$/,
  /^gbp\.last_review_days_ago$/,
  /^gbp\.owner_response_rate$/,
  /^gbp\.rating$/,
  /^gbp\.address$/,
  /^gbp\.phone$/,
  /^gbp\.cid$/,
  /^gbp\.place_id$/,
  /^gbp\.types(\.|$)/,
  /^gbp_posts(\.|$)/,
  /^moz(\.|$)/,
  /^serp\.[^.]+\.origins\.[^.]+\.name$/,
  /^serp\.[^.]+\.origins\.[^.]+\.dist_mi$/,
  /^serp\.[^.]+\.origins\.[^.]+\.pop$/,
  /^serp\.[^.]+\.origins\.[^.]+\.pos$/,
  /^serp\.[^.]+\.origins\.[^.]+\.top3(\.|$)/,
  /^serp\.[^.]+\.origins\.[^.]+\.top20(\.|$)/,
  /^serp\.[^.]+\.origins\.[^.]+\.zoom$/,
  /^local_finder\.[^.]+\.origins\.[^.]+\.name$/,
  /^local_finder\.[^.]+\.origins\.[^.]+\.dist_mi$/,
  /^local_finder\.[^.]+\.origins\.[^.]+\.pop$/,
  /^local_finder\.[^.]+\.origins\.[^.]+\.pos$/,
  /^local_finder\.[^.]+\.origins\.[^.]+\.top3(\.|$)/,
  /^local_finder\.[^.]+\.origins\.[^.]+\.top20(\.|$)/,
  /^local_finder\.[^.]+\.origins\.[^.]+\.zoom$/,
  /^pagespeed(\.|$)/,
  /^psi_accessibility(\.|$)/,
  /^whois(\.|$)/,
  /^competitor_agg(\.|$)/,
  /^crux(\.|$)/,
  /^labs_data(\.|$)/,
  /^content_depth\.city_keyword_cooccurrence(\.|$)/,
  /^content_depth\.service_pages\.[^.]+\.url$/,
  /^content_depth\.sitemap_url$/,
  /^content_depth\.sitemap_url_count$/,
  /^content_depth\.internal_links_crawled$/,
  /^content_depth\.pages_spot_checked$/,
  /^trade_area\.biz_lat$/,
  /^trade_area\.biz_lng$/,
  /^trade_area\.biz_address$/,
  /^trade_area\.home_zcta$/,
  /^trade_area\.near_me_origins(\.|$)/,
  /^trade_area\.city_origins(\.|$)/,
  /^trade_area\.origins(\.|$)/,
  /^trade_area\.near_me_cumul_pop$/,
  /^trade_area\.nm_stop_reason$/,
  /^trade_area\._ring_info(\.|$)/,
  /^html\.schema_types(\.|$)/,
  /^gbp_category_confirmed$/,
  /^gbp_category_mismatch$/,
  /^gbp_primary_category$/,
];

function isVolatilePath(path: string): boolean {
  return VOLATILE_PATH_PATTERNS.some((re) => re.test(path));
}

function remapSerpOriginsToIndexed(
  origins: SerpData[string]['origins'],
): SerpData[string]['origins'] {
  const sorted = Object.entries(origins ?? {}).sort(([, a], [, b]) => a.dist_mi - b.dist_mi);
  const out: SerpData[string]['origins'] = {};
  sorted.forEach(([, od], i) => {
    out[`z${i}`] = od;
  });
  return out;
}

/** Normalize live + seed audits so origin keys and optional fields compare fairly. */
export function normalizeAuditForCompare(audit: AuditData): AuditData {
  const normalized = structuredClone(audit) as AuditData;

  normalized.keywords = [...(normalized.keywords ?? [])].sort((a, b) =>
    a.keyword.localeCompare(b.keyword),
  );

  for (const field of ['serp', 'local_finder'] as const) {
    const data = normalized[field] ?? {};
    const remapped: SerpData = {};
    for (const [kw, kwData] of Object.entries(data)) {
      remapped[kw] = {
        ...kwData,
        origins: remapSerpOriginsToIndexed(kwData.origins ?? {}),
      };
    }
    normalized[field] = remapped;
  }

  if (normalized.gbp?.primary_category) {
    normalized.gbp.primary_category = normalized.gbp.primary_category.toLowerCase();
  }

  if (normalized.html?.schema_types) {
    normalized.html.schema_types = [...normalized.html.schema_types]
      .filter((t) => ['Organization', 'WebPage'].includes(t))
      .sort();
  }

  const fixtureHtmlKeys = new Set(Object.keys(kitchen747AuditData.html ?? {}));
  if (normalized.html) {
    const trimmed: Record<string, unknown> = {};
    for (const key of fixtureHtmlKeys) {
      trimmed[key] = normalized.html[key as keyof typeof normalized.html];
    }
    normalized.html = trimmed as AuditData['html'];
  }

  if (normalized.trade_area) {
    normalized.trade_area = {
      biz_lat: normalized.trade_area.biz_lat,
      biz_lng: normalized.trade_area.biz_lng,
      biz_county: normalized.trade_area.biz_county,
      biz_address: normalized.trade_area.biz_address,
      home_zcta: normalized.trade_area.home_zcta,
      near_me_origins: [],
      city_origins: [],
      origins: [],
    };
  }

  return normalized;
}

/** High-signal structural checks — presence and shape, not volatile ranking values. */
export function validateStructuralParity(expected: AuditData, actual: AuditData): string[] {
  const issues: string[] = [];

  const expectedKeywords = new Set((expected.keywords ?? []).map((k) => k.keyword));
  const actualKeywords = new Set((actual.keywords ?? []).map((k) => k.keyword));
  for (const kw of expectedKeywords) {
    if (!actualKeywords.has(kw)) issues.push(`Missing keyword: ${kw}`);
  }

  for (const kw of expectedKeywords) {
    if (!actual.serp?.[kw]) issues.push(`Missing SERP entry: ${kw}`);
    if (!actual.local_finder?.[kw]) issues.push(`Missing Local Finder entry: ${kw}`);
    const actSerpOrigins = Object.keys(actual.serp?.[kw]?.origins ?? {}).length;
    const actLfOrigins = Object.keys(actual.local_finder?.[kw]?.origins ?? {}).length;
    if (actSerpOrigins === 0) issues.push(`SERP "${kw}": no origins collected`);
    if (actLfOrigins === 0) issues.push(`Local Finder "${kw}": no origins collected`);
  }

  if (!actual.gbp?.name) issues.push('GBP name missing');
  if (actual.gbp?.review_count == null) issues.push('GBP review_count missing');
  if (actual.gbp?.rating == null) issues.push('GBP rating missing');
  if (!actual.html?.title_text) issues.push('HTML title missing');
  if (actual.pagespeed?.performance == null) issues.push('PageSpeed performance missing');

  for (const svc of expected.owner_services ?? []) {
    const exp = expected.content_depth?.service_pages?.[svc];
    const act = actual.content_depth?.service_pages?.[svc];
    if (exp?.found && !act?.found) {
      issues.push(`Content depth: expected service page for "${svc}"`);
    }
  }

  return issues;
}

function isEmpty(value: unknown): boolean {
  if (value == null) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value as object).length === 0;
  return false;
}

function typeLabel(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

export interface DiffEntry {
  path: string;
  kind: 'missing' | 'extra' | 'type_mismatch' | 'empty_expected' | 'value_mismatch';
  expected?: unknown;
  actual?: unknown;
  volatile: boolean;
}

export function diffAuditData(expected: AuditData, actual: AuditData): DiffEntry[] {
  const entries: DiffEntry[] = [];

  function walk(expectedVal: unknown, actualVal: unknown, path: string): void {
    const volatile = isVolatilePath(path);

    if (expectedVal === undefined && actualVal === undefined) return;

    if (expectedVal !== undefined && actualVal === undefined) {
      entries.push({
        path,
        kind: 'missing',
        expected: summarize(expectedVal),
        actual: undefined,
        volatile,
      });
      return;
    }

    if (expectedVal === undefined && actualVal !== undefined) {
      if (!volatile && path.split('.').length <= 2) {
        entries.push({
          path,
          kind: 'extra',
          expected: undefined,
          actual: summarize(actualVal),
          volatile,
        });
      }
      return;
    }

    const expectedType = typeLabel(expectedVal);
    const actualType = typeLabel(actualVal);
    if (expectedType !== actualType) {
      entries.push({
        path,
        kind: 'type_mismatch',
        expected: expectedType,
        actual: actualType,
        volatile,
      });
      return;
    }

    if (volatile) return;

    if (expectedType === 'object' && expectedVal !== null && actualVal !== null) {
      const expectedObj = expectedVal as Record<string, unknown>;
      const actualObj = actualVal as Record<string, unknown>;
      const keys = new Set([...Object.keys(expectedObj), ...Object.keys(actualObj)]);
      for (const key of keys) {
        walk(expectedObj[key], actualObj[key], path ? `${path}.${key}` : key);
      }
      return;
    }

    if (expectedType === 'array') {
      const expectedArr = expectedVal as unknown[];
      const actualArr = actualVal as unknown[];
      if (!volatile && !isEmpty(expectedArr) && isEmpty(actualArr)) {
        entries.push({
          path,
          kind: 'empty_expected',
          expected: `[${expectedArr.length} items]`,
          actual: '[]',
          volatile,
        });
        return;
      }
      const maxLen = Math.max(expectedArr.length, actualArr.length);
      for (let i = 0; i < maxLen; i += 1) {
        walk(expectedArr[i], actualArr[i], `${path}[${i}]`);
      }
      return;
    }

    if (!isEmpty(expectedVal) && isEmpty(actualVal)) {
      entries.push({
        path,
        kind: 'empty_expected',
        expected: summarize(expectedVal),
        actual: summarize(actualVal),
        volatile,
      });
      return;
    }

    if (typeof expectedVal === 'number' && typeof actualVal === 'number') {
      return;
    }

    if (expectedVal !== actualVal) {
      entries.push({
        path,
        kind: 'value_mismatch',
        expected: summarize(expectedVal),
        actual: summarize(actualVal),
        volatile,
      });
    }
  }

  walk(expected, actual, '');
  return entries;
}

function summarize(value: unknown): unknown {
  if (value == null) return value;
  if (typeof value === 'string' && value.length > 80) {
    return `${value.slice(0, 77)}...`;
  }
  if (Array.isArray(value)) return `[${value.length} items]`;
  if (typeof value === 'object') {
    const keys = Object.keys(value as object);
    if (keys.length > 6) return `{${keys.length} keys: ${keys.slice(0, 4).join(', ')}...}`;
  }
  return value;
}

function printDiffReport(entries: DiffEntry[]): void {
  const structural = entries.filter((e) => !e.volatile);
  const drift = entries.filter((e) => e.volatile);

  console.log('\n=== Structural mismatches (likely bugs) ===');
  if (structural.length === 0) {
    console.log('  (none)');
  } else {
    for (const entry of structural) {
      console.log(`  [${entry.kind}] ${entry.path || '(root)'}`);
      if (entry.expected !== undefined) console.log(`    expected: ${fmt(entry.expected)}`);
      if (entry.actual !== undefined) console.log(`    actual:   ${fmt(entry.actual)}`);
    }
  }

  console.log('\n=== Accepted drift (volatile fields) ===');
  if (drift.length === 0) {
    console.log('  (none)');
  } else {
    const byKind = new Map<string, number>();
    for (const entry of drift) {
      byKind.set(entry.kind, (byKind.get(entry.kind) ?? 0) + 1);
    }
    console.log(`  ${drift.length} differences across volatile paths`);
    for (const [kind, count] of byKind) {
      console.log(`    ${kind}: ${count}`);
    }
    if (process.env.VERBOSE_DRIFT === '1') {
      for (const entry of drift.slice(0, 50)) {
        console.log(`  [${entry.kind}] ${entry.path}`);
      }
      if (drift.length > 50) console.log(`  ... and ${drift.length - 50} more`);
    } else {
      console.log('  (set VERBOSE_DRIFT=1 to list individual paths)');
    }
  }

  console.log(`\nSummary: ${structural.length} structural, ${drift.length} drift`);
}

function fmt(value: unknown): string {
  if (typeof value === 'string') return JSON.stringify(value);
  return String(value);
}

async function loadOrRunAudit(fromSnapshot: boolean): Promise<AuditData> {
  if (fromSnapshot) {
    const raw = readFileSync(SNAPSHOT_PATH, 'utf8');
    return JSON.parse(raw) as AuditData;
  }

  const env = loadWorkerEnv();
  const preflight = preflightScanCredentials(env);

  console.log('GrowthPath Kitchen 747 compare harness');
  console.log(`Mock mode: ${preflight.mockMode ? 'ON' : 'OFF'}`);
  console.log(`Ready for live: ${preflight.readyForLive ? 'YES' : 'NO'}`);

  if (!preflight.readyForLive) {
    console.error('Missing required credentials. Set GOOGLE_API_KEY, DFS_LOGIN, DFS_PASSWORD and SCAN_MOCK=0.');
    for (const source of preflight.sources) {
      if (!source.liveCapable && source.reason) {
        console.error(`  - ${source.label}: ${source.reason}`);
      }
    }
    process.exit(1);
  }

  const started = Date.now();
  const audit = await runScan(
    STABLE_INTAKE,
    {
      GOOGLE_API_KEY: env.GOOGLE_API_KEY,
      CENSUS_API_KEY: env.CENSUS_API_KEY,
      DFS_LOGIN: env.DFS_LOGIN,
      DFS_PASSWORD: env.DFS_PASSWORD,
      MOZ_API_KEY: env.MOZ_API_KEY,
    },
    { mock: false },
  );

  mkdirSync(dirname(SNAPSHOT_PATH), { recursive: true });
  writeFileSync(SNAPSHOT_PATH, JSON.stringify(audit, null, 2), 'utf8');
  console.log(`\nSnapshot written: ${SNAPSHOT_PATH}`);
  console.log(`Scan finished in ${((Date.now() - started) / 1000).toFixed(1)}s`);

  const { status, partialReasons } = deriveScanStatusFromCollection(audit.collection_status ?? []);
  console.log(`Status: ${status}  cost: $${(audit.total_cost ?? 0).toFixed(4)}`);
  if (partialReasons.length > 0) {
    console.log('Partial reasons:');
    for (const reason of partialReasons) console.log(`  - ${reason}`);
  }

  console.log('\nPer-source collection status:');
  for (const row of audit.collection_status ?? []) {
    const duration = row.durationMs != null ? `${row.durationMs}ms` : '—';
    console.log(
      `  ${row.sourceId.padEnd(18)} ${row.status.padEnd(8)} ${duration.padStart(8)}  ${row.detail}`,
    );
  }

  return audit;
}

async function main(): Promise<void> {
  const fromSnapshot = process.argv.includes('--from-snapshot');
  const live = await loadOrRunAudit(fromSnapshot);
  const expected = normalizeAuditForCompare(kitchen747AuditData);
  const actual = normalizeAuditForCompare(live);
  const structuralIssues = validateStructuralParity(kitchen747AuditData, live);
  const entries = diffAuditData(expected, actual);
  printDiffReport(entries);

  if (structuralIssues.length > 0) {
    console.log('\n=== Structural parity failures ===');
    for (const issue of structuralIssues) console.log(`  - ${issue}`);
  } else {
    console.log('\n=== Structural parity: PASS ===');
  }

  const structuralCount = structuralIssues.length;
  if (structuralCount > 0) {
    process.exitCode = 1;
  }
}

const isDirectRun =
  process.argv[1] != null &&
  fileURLToPath(import.meta.url) === process.argv[1];

if (isDirectRun) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.stack ?? error.message : error);
    process.exit(1);
  });
}
