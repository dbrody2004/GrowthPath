# Rules Engine Parity Matrix

Reference: `initialdiscovery/currentapp/scoring-engine-v4_69 (1).py`, `initialdiscovery/currentapp/rules-engine-v4_57 (1).py`.

Status legend: **ported** | **partial** | **missing** | **blocked** | **obsolete**

## GBP Strength (`score-gbp-strength.ts`)

| Rule ID | Description | Status | Notes |
|---------|-------------|--------|-------|
| `gbp.primary_category` | Primary category presence (10 pts) | ported | |
| `gbp.category_fit` | Category fit vs SERP competitor tally (10 pts) | ported | Includes category opportunity card |
| `gbp.review_velocity` | 30/60/90d consistency + minimum model (20 pts) | ported | |
| `gbp.review_count` | Vertical-aware review count tiers (20 pts) | ported | |
| `gbp.google_rating` | Rating tiers ≥4.3 (10 pts) | ported | |
| `gbp.response_rate` | Owner response rate tiers (10 pts) | ported | |
| `gbp.gbp_posts` | Post recency tiers (5 pts) | ported | |
| `gbp.photos` | Photo count tiers (5 pts) | ported | |
| `gbp.secondary_categories` | Secondary category count (10 pts) | ported | |
| `gbp.yelp_signals` | Yelp review/rating scoring | obsolete | Findings-only in v4.69 |
| `gbp.profile_completeness` | Profile completeness points | obsolete | Removed in v4.69 |

## Search Visibility (`score-search-visibility.ts`)

| Rule ID | Description | Status | Notes |
|---------|-------------|--------|-------|
| `mappack.origin_scoring` | Equal-weight near-me origins; equal-weight city origins | ported | |
| `mappack.peak_breadth` | 70/30 peak+breadth per reach type | ported | |
| `mappack.near_me_weight` | 65/35 near-me vs city category blend | ported | |
| `mappack.diagnosis` | Local vs regional reach diagnosis | ported | |
| `mappack.kw_3pack` | Keywords in Maps/LF top 3 | partial | Derived from SERP in TS (Python v4.69 returns empty set) |
| `mappack.kw_city_visible` | City keywords with any visibility | partial | Derived from SERP in TS |
| `mappack.near_miss` | Rank 4–10 near-miss keywords | partial | SERP-derived + `labs_data.near_miss_keywords` fallback |
| `mappack.labs_3pack` | DataForSEO Labs 3-pack keyword list | blocked | Labs API not wired in scan-engine |
| `mappack.unexpected_3pack` | Unexpected 3-pack appearances | blocked | Requires Labs / extended SERP analysis |

## On-Page Relevance (`score-onpage-relevance.ts`)

| Rule ID | Description | Status | Notes |
|---------|-------------|--------|-------|
| `onpage.title_tag` | City + category title match (25 pts) | ported | |
| `onpage.schema` | LocalBusiness schema evaluation (25 pts) | ported | Via `evaluateSchema` |
| `onpage.service_pages` | Dedicated service pages (25 pts) | ported | |
| `onpage.h1` | H1 presence/uniqueness (15 pts) | ported | |
| `onpage.city_cooc` | City+service co-occurrence (10 pts) | ported | |
| `onpage.meta_desc` | Meta description length | partial | Findings-only (not scored) — matches v4.69 |
| `onpage.social_links` | Social proof links | partial | Findings-only — matches v4.69 |

## Domain Trust (`score-domain-trust.ts`)

| Rule ID | Description | Status | Notes |
|---------|-------------|--------|-------|
| `trust.domain_authority` | Moz DA tiers (50 pts) | ported | |
| `trust.referring_domains` | Vertical RD tiers (30 pts) | ported | |
| `trust.https` | HTTPS present (10 pts) | ported | |
| `trust.domain_age` | WHOIS age tiers (10 pts) | ported | |

## Mobile Performance (`score-mobile-performance.ts`)

| Rule ID | Description | Status | Notes |
|---------|-------------|--------|-------|
| `perf.desktop_psi` | Desktop PSI score tiers (30 pts) | ported | |
| `perf.ttfb` | Server response time (20 pts) | ported | |
| `perf.cls` | Cumulative layout shift (25 pts) | ported | |
| `perf.tbt` | Total blocking time (15 pts) | ported | |
| `perf.unused_code` | Unused JS/CSS bloat (5 pts) | ported | |
| `perf.webp` | WebP image detection (5 pts) | ported | Injected from HTML in orchestrator |
| `perf.psi_failed` | Reweight P2 when PSI unavailable | ported | In `calculate-scores.ts` |

## Conversion Infrastructure (`score-conversion-infrastructure.ts`)

| Rule ID | Description | Status | Notes |
|---------|-------------|--------|-------|
| `conversion.booking_path` | Vertical-aware booking path table (40 pts max) | ported | |
| `conversion.click_to_call` | tel: link detection (20 pts) | ported | |
| `conversion.analytics` | GA4/GTM tiers (40 pts) | ported | |
| `conversion.cta_hash` | CTA hash booking detection scoring | partial | Detection in scan-engine HTML fetch is thinner than rules-engine v4.57 |
| `conversion.external_subdomain` | Medspa/salon booking subdomain fallback | missing | Planned in html booking depth milestone |

## Mobile UX (`score-mobile-ux.ts`)

| Rule ID | Description | Status | Notes |
|---------|-------------|--------|-------|
| `ux.viewport` | Viewport configuration (40 pts) | ported | |
| `ux.responsive` | Responsive signal score (35 pts) | ported | Per-signal findings at ≤2/4 |
| `ux.tap_targets` | PSI tap target audit (15 pts) | ported | |
| `ux.color_contrast` | PSI contrast audit (10 pts) | ported | |

## Priority Actions (`build-priority-actions.ts`)

| Rule ID | Description | Status | Notes |
|---------|-------------|--------|-------|
| `actions.ga4` | Install GA4 action | ported | |
| `actions.mappack_push` | Push keyword into 3-pack | ported | Uses derived `kw_3pack` empty check |
| `actions.booking_path` | Booking path remediation | ported | |
| `actions.near_miss` | Near-miss keyword conversion | partial | Uses SERP + labs near-miss |
| `actions.schema` | Schema markup action | ported | |

## Primary Competitor (`identify-primary-competitor.ts`)

| Rule ID | Description | Status | Notes |
|---------|-------------|--------|-------|
| `comp_intel.selection` | Near-me #1 frequency selection | ported | |
| `comp_intel.why_winning` | Decision-tree narrative | ported | |
| `comp_intel.moz_enrichment` | DA/RD from Moz competitor lookup | partial | Uses `moz.competitors` when present |

## Intentionally Unported (blockers)

- **DataForSEO Labs 3-pack / volume-backed near-miss**: Labs step stubbed in `run-scan.ts`.
- **Yelp scoring signals**: Removed from scoring in Python v4.69; findings-only if Yelp data added later.
- **CRUX field data scoring**: `crux` stub empty; not in P2 formula.
- **Extended booking platform catalog**: ~60 platforms in rules-engine v4.57 vs ~17 in TS HTML fetch — separate milestone.

## Kitchen 747 Snapshot (regression anchor)

| Metric | Expected |
|--------|----------|
| P1 | 42 |
| P2 | 46 |
| Profile | The Invisible Closer |
| GBP | 57 |
| Map pack | 36 |
| On-page | 36 |
| Trust | 54 |
| Performance | 21 |
| Conversion | 40 |
| UX | 90 |
