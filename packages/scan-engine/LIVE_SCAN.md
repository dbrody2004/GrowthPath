# Live Scan Validation

Opt-in harness to prove the real vendor pipeline end-to-end. Default CI and unit tests use `SCAN_MOCK=1` / mock mode and do **not** call external APIs.

## Required environment

| Variable | Required | Purpose |
|----------|----------|---------|
| `GOOGLE_API_KEY` | **Yes** | GBP, PageSpeed, PSI accessibility |
| `DFS_LOGIN` | **Yes** | DataForSEO SERP / Local Finder / HTML |
| `DFS_PASSWORD` | **Yes** | DataForSEO authentication |
| `MOZ_API_KEY` | Optional | Domain Authority + competitor enrichment. Use a token from [Moz API dashboard](https://moz.com/api/dashboard), or legacy base64(`access_id:secret`) from “Show legacy credentials”. |
| `CENSUS_API_KEY` | Optional | Trade-area gazetteer enrichment |
| `SCAN_MOCK` | Default `0` | Set `1` to force fixture scan (no vendor calls) |

Load credentials from the project `.env` (see `.env.example`).

## Google Cloud APIs

Enable for the API key project:

- **Places API** (GBP lookup)
- **PageSpeed Insights API**

## Running the smoke harness

```bash
# From repo root — requires live credentials in .env
SCAN_MOCK=0 npx tsx packages/scan-engine/src/scripts/live-smoke.ts
```

Prints per-source status, duration, cost, derived scan status, and partial reasons.

## Vitest live test (opt-in)

```bash
LIVE_SCAN_TEST=1 npm test -w @growthpath/scan-engine
```

Skipped unless `LIVE_SCAN_TEST=1` **and** credentials pass `preflightScanCredentials()`.

## Cost expectations (basic tier)

Rough order of magnitude for a single basic scan:

- DataForSEO SERP + Local Finder: **$0.05–$0.20** depending on keyword count
- PageSpeed / PSI: free tier within Google quotas
- Moz (if configured): API unit consumption per domain

Use the smoke harness `total_cost` and per-row `cost` fields to validate billing.

## Partial scans and retry (`missing_sources`)

When collection returns `partial`:

1. Worker calls `deriveScanStatusFromCollection()` and stores `partialReasons`.
2. `sourcesNeedingRetry()` identifies failed/partial sources from `collection_status`.
3. Retry job passes `sourcesToRetry` into `runScan()` with `priorAudit` from the failed scan.
4. Only missing sources re-fetch; merged status is written on completion.

Critical sources (GBP, SERP) failing may block a complete status even after retry — check operator collection table.

## Preflight helper

```typescript
import { preflightScanCredentials } from '@growthpath/config';

const { readyForLive, sources } = preflightScanCredentials(process.env);
```

Use before scheduling live scans in staging or ops scripts.
