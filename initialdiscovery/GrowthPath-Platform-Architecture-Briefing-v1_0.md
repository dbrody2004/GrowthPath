# GrowthPath Analytics — Platform Architecture Briefing

**Audience:** Incoming CTO / technical co-founder
**Purpose:** A section-by-section technical walkthrough of the platform — the moving parts of each subsystem, what every external API contributes, how raw signals are collected, how they are scored, and how the output is rendered. Pair this with the three Python engine files you already have.
**Version:** v1.0
**Companion files:** `rules-engine-v4_57.py`, `scoring-engine-v4_69.py`, `comp-intel-engine-v2_0.py`, plus the report generator `generate_report_v6_58.py` (not shipped to you yet — flagged where relevant).

---

## 0. Read this first — the one rule that governs the codebase

**Docstrings and display strings drift from live runtime values.** This has caused real errors. Throughout this document, every weight, constant, and threshold has been verified against the actual executable code blocks, not the docstrings or spec files. Two live examples you will hit immediately:

- `scoring-engine-v4_69.py`, `score_search_visibility()`: the function's own docstring (line ~23) still reads *"Near me origins: inverse distance weighting (1/dist_mi)"* — but the v4.69 change at the top of the file replaced that with **equal weighting**. The docstring is stale; the code is correct.
- `calculate_scores()` return dict labels the four P1 categories with `"weight": "55%/20%/15%/10%"`. The **actual P1 computation** is `60/20/10/10` (see §6). The display strings are stale; the math is authoritative.

When in doubt, trust the code block, not the comment above it. Verify runtime values from actual code.

---

## 1. What the platform is

GrowthPath is a **local SEO diagnostic and competitive-intelligence SaaS** for small-to-medium businesses. It scans a business's visibility across Google Maps and the Local Finder over a geographic grid, scores the business across seven categories grouped into two pillars, and generates a client-facing report (HTML + PDF), dashboard, and prioritized action plan.

**Product philosophy — "graduation, not renewal":** the program is explicitly designed to complete its diagnostic and remediation work within ~12 months rather than create indefinite dependency. This shapes the economics (§9) and the action-plan logic.

**Primary channel:** direct B2B to small businesses (MVP / Phase 1). Agency white-label is a planned secondary channel, post-MVP.

### The two-pillar scoring model

| Pillar | Categories |
|---|---|
| **P1 — Local Search Visibility** | Search Visibility (Map Pack), GBP Strength, On-Page Relevance, Domain Trust |
| **P2 — Website & Conversion** | Website Performance, Conversion Infrastructure, Mobile UX / Readiness |

P1 and P2 are the two headline 0–100 scores. Their intersection places the business in one of five strategic profiles via the quadrant model (§7).

---

## 2. System architecture — three engines, deliberate separation

The platform is three independent Python engines plus a report generator. They run today as **synchronous Google Colab notebooks** (Python). There is no async job queue yet — that's a known infrastructure gap and a hard dependency for the regional heatmap and for production multi-client operation (§10).

```
                    ┌─────────────────────────────────────────────┐
                    │  INTAKE (HTML form)                          │
                    │  emits BIZ_*, OWNER_SERVICES, SCAN_TIER, etc │
                    └───────────────────┬─────────────────────────┘
                                        │ config constants
                                        ▼
   ┌────────────────────────────────────────────────────────────────┐
   │  RULES ENGINE  (rules-engine-v4_57.py)                          │
   │  Data collection + I/O. Orchestrates ~11 steps, calls every     │
   │  external API, assembles a single `audit_data` dict.            │
   └───────────────────────────────┬────────────────────────────────┘
                                    │  audit_data (dict)
                                    ▼
   ┌────────────────────────────────────────────────────────────────┐
   │  SCORING ENGINE  (scoring-engine-v4_69.py)                      │
   │  Pure scoring functions, NO I/O. Consumes audit_data, returns   │
   │  a `scores` dict (per-category scores, findings, P1/P2, profile)│
   └───────────────────────────────┬────────────────────────────────┘
                                    │  scores (dict)
                                    ▼
   ┌────────────────────────────────────────────────────────────────┐
   │  REPORT GENERATOR  (generate_report_v6_58.py)                   │
   │  build_report(audit_data, scores) → HTML; generate_pdf() → PDF  │
   │  Quadrant SVG, keyword cards, appendix, competitor intel block. │
   └────────────────────────────────────────────────────────────────┘

   ┌────────────────────────────────────────────────────────────────┐
   │  COMP-INTEL ENGINE  (comp-intel-engine-v2_0.py)  — SEPARATE     │
   │  Standalone competitive scan + its own HTML/PDF output.         │
   │  Decision logged to MERGE this into the main engine (§10).      │
   └────────────────────────────────────────────────────────────────┘
```

**The architectural property to preserve:** the **rules engine does all I/O** (network, file reads, API calls) and the **scoring engine is pure** (deterministic functions, no network, no side effects). This separation is intentional and valuable — it makes scoring testable in isolation and keeps collection logic from contaminating scoring logic. Keep them separate.

**Data handoff:** `run_scan()` in the rules engine returns the `audit_data` dict. `calculate_scores(audit_data)` in the scoring engine consumes it and returns `scores`. `build_report(audit_data, scores)` renders the deliverable. In Colab today this is three cells run in sequence; in production it needs to be an orchestrated pipeline with persistence between stages.

---

## 3. External APIs — the complete inventory

Every external dependency, what it provides, and where it's called. All keys are config constants at the top of the rules engine (currently placeholders like `YOUR_CENSUS_API_KEY`).

| API | Endpoint(s) | What it provides | Called in |
|---|---|---|---|
| **Google Places** | `places.googleapis.com/v1/places:searchText`, `maps.googleapis.com/maps/api/place/details/json` | Core GBP fields: name, rating, address, phone, hours, categories, place_id | `fetch_gbp()` |
| **DataForSEO — Business Data** | `/v3/business_data/google/my_business_info/live` | Accurate total photo count, CID, place_id | `fetch_gbp()` |
| **DataForSEO — Reviews** | `/v3/business_data/google/reviews/task_post` + `task_get/{id}` | Review velocity (last 30d), recency, owner response rate | `fetch_gbp()` |
| **DataForSEO — GBP Updates** | `/v3/business_data/google/my_business_updates/task_post` + `task_get/{id}` | GBP post activity (count, last-post recency) | `fetch_gbp_posts()` |
| **DataForSEO — Maps SERP** | `/v3/serp/google/maps/live/advanced` | Map Pack rankings per keyword per origin | `maps_search()` / `fetch_serp()` |
| **DataForSEO — Local Finder** | `/v3/serp/google/local_finder/live/advanced` | Local Finder rankings per keyword per origin | `local_finder_search()` / `fetch_local_finder()` |
| **Google Geocoding** | `maps.googleapis.com/maps/api/geocode/json` | Business front-door coords; ZCTA centroid resolution | `resolve_trade_area()` |
| **US Census ACS** | `api.census.gov/data/2023/acs/acs5` | ZCTA population for origin weighting/tiebreak (requires free key) | `resolve_trade_area()` |
| **Moz** | `api.moz.com/jsonrpc` (`data.site.metrics.fetch`) | Domain Authority, referring domains, spam score — client + competitors | `fetch_moz()` |
| **Google PageSpeed Insights v5** | `googleapis.com/pagespeedonline/v5/runPagespeed` | Performance score, TTFB, CLS, TBT, unused JS/CSS (desktop) + a11y signals (mobile) | `fetch_psi()`, `fetch_psi_accessibility()` |
| **WHOIS** (lib) | — | Domain age, HTTPS | `fetch_whois()` |
| **Direct HTTP fetch** | client site | Raw HTML for on-page / conversion / mobile signal extraction | `fetch_html()`, `fetch_content_depth()` |
| **Anthropic Claude API** | Messages API (Sonnet) | Narrative synthesis (monthly) + chat interface; pre-loaded with scan data | Staged integration (deterministic narrative first, chat second) |
| **DataForSEO — Business Listings** | `business_listings` search | Citation / NAP consistency check | Cost-modeled; citation add-on via BrightLocal |
| **DataForSEO — LLM Mentions** | `/v3/ai_optimization/llm_mentions/search/live` | AI-assistant brand mention tracking | Confirmed endpoint; $100/mo activation was a pending blocker — verify status |

**Auth patterns to note:** Moz uses a pre-encoded token in an `x-moz-token` header. DataForSEO reviews/updates use a **task_post → poll task_get** async pattern (not a single live call) — relevant because the reviews poll has a timeout fragility bug (§10). Census ACS now requires a key (it used to be open); known connectivity flakiness in some Colab sessions.

> **Workflow rule that applies to you immediately:** always run an isolated API smoke test before wiring any new API into the full pipeline. We test APIs in standalone cells first, validate the response shape, then integrate.

---

## 4. Data collection — the `run_scan()` spine, step by step

`run_scan()` in the rules engine executes these in order and assembles `audit_data`. Each step is an independent function with its own failure handling (most degrade gracefully and return a null-shaped dict so scoring can detect absence vs. a real zero).

1. **Load gazetteer** (once per session — pass it in for multi-business runs) — ZCTA lookup table.
2. **Normalize keywords** — `normalize_keywords(OWNER_SERVICES, CITY)` expands owner-defined services into near-me and city-modifier keyword variants.
3. **GBP fetch** — `fetch_gbp()`, the three-source merge (Places + DFS my_business_info + DFS reviews). Returns core fields, categories, identity (cid/place_id), photo count, and review velocity/recency/response-rate.
4. **Moz (client)** — `fetch_moz()` for client DA + referring domains. Competitor enrichment deferred to step 4b.
5. **GBP post activity** — `fetch_gbp_posts()`.
6. **Trade-area resolution** — `resolve_trade_area()` (the grid selector; §5).
7. **Maps SERP** — `fetch_serp()` across the grid, dual-grid + keyword-type routing + domain matching to identify the client in results.
8. **Moz competitor enrichment (4b)** — pulls the top competitor domains out of the SERP results and batch-fetches their DA (6 parallel workers). *Aggregator/platform domains can pollute this list — a known data-quality issue (§10).*
9. **Local Finder** — `fetch_local_finder()`, dual-grid, sequential.
10. **WHOIS** — `fetch_whois()` for domain age + HTTPS.
11. **HTML checks** — `fetch_html()` (§5, the big one).
12. **Content depth crawl** — `fetch_content_depth()` (§5).
13. **PageSpeed** — `fetch_psi()` (desktop performance).
14. **PSI accessibility** — `fetch_psi_accessibility()` (mobile UX a11y signals).

The function tracks `total_cost` as it goes (rank calls are the variable cost driver) and returns the assembled `audit_data` dict consumed by scoring.

---

## 5. The crawl & signal-extraction subsystems (deep dive)

This is the part you specifically asked to see laid out: how the site is crawled, by what means, and what it looks for.

### 5.1 Trade-area selection — `resolve_trade_area()` (v4.57)

This decides **which geographic origins to scan from**. It's a two-pass system sharing a used-set:

- **Pass 1 — Near-me (<5 mi, identical across all tiers):** the home ZCTA (geocoded from the business postal code) is always slot 1 and is population-exempt. Remaining picks come from `select_near_me_radial()` — radial farthest-point selection on the *distance axis* from the business coords, with a `pop>0` guard and a directional-spread + population tiebreak. It samples 0→5 mi at even radial intervals (the near-me visibility-reach curve) rather than clustering near the front door. Up to 5 near-me origins total.
- **Pass 2 — City (≥5 mi, tier-scoped):** `select_city_banded()` allocates the city target across distance bands by candidate availability, then `_radial_bearing()` fills each band by even angular spread (population seed + tiebreak).

**Two principles encoded here that are easy to break if you don't know them:**
- **Selection geometry ≠ scan origin.** ZCTAs are *selected* by radial geometry measured from the business's real front-door coords, but *scanned* from their **centroids**. These are deliberately separate. (Scanning from the front door makes near-me scans win on proximity alone and become non-diagnostic — validated on the Sapien medspa case.)
- **Near-me is a reach signal, not an audience-size signal.** The grid measures how visible the business is *across* its trade area. Population is a tiebreaker after spread is satisfied, not the primary driver. `TRADE_AREA_MIN_POP` is set low (250) precisely so low-population ZCTAs aren't filtered out — filtering them would hide real visibility blind spots.

**Tier grid sizes:** Basic = 10 ZCTAs / city reach to 10 mi (bands 5–7.5 / 7.5–10). Advanced & Premium = 20 ZCTAs / city reach to 20 mi (bands 5–9 / 9–13 / 13–16 / 16–20). Near-me boundary is fixed at <5 mi across all tiers. (Advanced and Premium share one grid config; Premium's differentiator is GA4/GSC access, not reach.)

**Validated across:** dense urban (Sapien / Eastlake), suburban large-ZCTA (Metamorphosis / Issaquah), sparse (Sushi Blossom / Spokane). **Known open geo bug:** haversine distance can select unreachable ZCTAs across water (e.g. Puget Sound) for coastal businesses — the water-crossing filter is logged but not yet built.

### 5.2 Rank collection — Maps SERP + Local Finder

For each keyword × each origin, the engine queries two surfaces (Maps + Local Finder) at a zoom level computed from the origin's distance (`zoom_for_origin()` / `viewport_radius_miles()`). The client is matched in results by domain + name + street address (`_lf_match_client()`) to extract their rank position. Both surfaces run across the full grid; this is the dominant variable cost (see §9: every keyword = 4 rank calls per ZCTA — 2 surfaces × 2 intent variants).

### 5.3 HTML crawl — `fetch_html()` (the on-page / conversion / mobile signal harvester)

**Means:** a single direct `requests.get()` of the homepage with a realistic desktop browser User-Agent and full Accept headers, 20s timeout. **Static HTML only** — it does not execute JavaScript. This is a known limitation the scoring engine discloses in client copy (booking widgets that render via JS may be missed), and it's an area where you may want to evaluate a headless-render option.

**Guardrails first:** before extracting anything it bails on HTTP ≥400 and on error-page detection (it title-matches against patterns like "just a moment", "attention required", "403 forbidden", "429 too many requests"). Scraping an error/Cloudflare page produces completely wrong signals, so a clean failure dict is returned instead.

**What it looks for (all from raw HTML / BeautifulSoup DOM parse):**

- **Analytics & pixels:** GA4 (`G-XXXXXX` regex), GTM, Facebook Pixel (`fbq(`), Microsoft Clarity.
- **Booking / conversion path** — the most elaborate detector. It fingerprints **~60 named booking/scheduling/ordering platforms** across verticals (beauty/wellness: Boulevard, Vagaro, Mindbody, Zenoti, Booksy, Fresha, Mangomint, GlossGenius, etc.; home trades: ServiceTitan, Housecall Pro, Jobber, Workiz, FieldEdge…; restaurants: Toast, Slice, ChowNow, Owner.com, Olo…; medical: Athena, Zocdoc). Detection uses domain strings, JS globals (e.g. `STWidgetManager`, `HCPWidget` — case-sensitive), CDN asset fingerprints, and white-label patterns. It then resolves a single **`booking_path_type`** via a priority cascade: `named_platform` → `generic_booking` (external URL / external subdomain / JS-modal CTA hash / internal booking slug) → `quote_form` → `contact_form_only` → `none`, recording the **detection method** for finding-copy branching. Lead-capture form platforms (Jotform, Typeform, HubSpot Forms) are tracked separately. Platforms are **vertical-gated** to prevent false positives (a gym's in-house café using Toast shouldn't count as a booking path; a beauty platform appearing via a third-party widget on an insurance site is filtered — both are confirmed real false positives that drove this logic).
- **Click-to-call:** `href="tel:"` presence.
- **On-page SEO:** title text + length, H1 count (+ multiple-H1 flag), meta description presence/length, schema.org `@type` inventory.
- **Mobile UX signals:** viewport tag (exists / `width=device-width` / blocks-zoom via `user-scalable=no` or `maximum-scale=1`), plus a **4-point responsive score** built from (1) `@media` queries in inline styles, (2) responsive theme/framework markers (Bootstrap, Tailwind, Elementor, `vc_responsive`, grid classes…), (3) responsive images (`srcset`/`sizes`), (4) mobile-nav patterns (hamburger/off-canvas/navbar-toggler tokens). Also: WebP usage (3 detection methods: extension, `<picture>` source, CSS), `<video autoplay>`, alt-text coverage (with tracking-pixel/icon/spacer exclusion), social links, and CSS-framework detection.

Everything returns as a flat signal dict that the scoring engine reads key-by-key.

### 5.4 Content depth crawl — `fetch_content_depth()`

A separate, deeper crawl that answers "does this site have real service-page coverage for what they do?"

- **Discovery order:** sitemap-first (`sitemap.xml` → `sitemap_index.xml` → `page-sitemap.xml` → `pages-sitemap.xml`), with a homepage-link crawl fallback only if no sitemap exists. Sitemap-first is deterministic and JS-independent.
- **Service-page matching** is depth-sorted and two-pass: Pass 1 stem-based matching against all URLs sorted by path depth ascending (shallowest wins — `/facials/` beats `/blog/benefits-of-facials/`); Pass 2 first-word fallback for synonym slugs (e.g. "laser treatments" → `/laser-services/`), only firing when the first word is ≥5 chars.
- **Also checks** city-keyword co-occurrence per service (local relevance) and returns the sitemap source + URL count.
- **Known bug:** root-level blog slugs can bypass the `/blog/` exclusion regex and produce service-page false positives. Fix is scoped (tighten the regex) but not yet shipped.

### 5.5 Performance & mobile-readiness pings

- **`fetch_psi()`** — PageSpeed Insights v5, **desktop strategy**, 90s timeout, 2 attempts. Extracts: performance score (0–100), accessibility/best-practices/SEO category scores, TTFB (`server-response-time`), CLS, TBT, and unused-JS / unused-CSS KiB. **Critical detail:** on failure it returns a dict of `None`s (not zeros) so the scoring engine can distinguish "PSI unavailable" from "real score of 0" — and when performance is `None`, P2 *excludes* the performance category and reweights the remaining two (see §6).
- **`fetch_psi_accessibility()`** — a second PSI call, **mobile strategy**, `category=accessibility` only. Pulls three Lighthouse audit scores used as mobile-UX signals: `meta-viewport`, `target-size` (tap-target sizing), and `color-contrast`.

---

## 6. Scoring engine — `scoring-engine-v4_69.py`

Pure functions. `calculate_scores(audit_data)` orchestrates seven category scorers, each returning a 0–100 score, a findings list, and a `signal_pts` breakdown (the per-signal point attribution shown in the report's benchmark tables).

### 6.1 Category scorers

| Category | Function | Pillar |
|---|---|---|
| GBP Strength | `score_gbp_strength()` | P1 |
| Search Visibility (Map Pack) | `score_search_visibility()` | P1 |
| On-Page Relevance | `score_onpage_relevance()` | P1 |
| Domain Trust | `score_domain_trust()` | P1 |
| Website Performance | `score_mobile_performance()` | P2 |
| Conversion Infrastructure | `score_conversion_infrastructure()` | P2 |
| Mobile UX / Readiness | `score_mobile_ux()` | P2 |

### 6.2 Pillar weights — LIVE values (verify against display strings)

**P1** (in `calculate_scores`):
```
p1 = round(gbp*0.20 + mappack*0.60 + onpage*0.10 + trust*0.10)
```
**P2** (normal case):
```
p2 = round(perf*0.35 + conv*0.40 + ux*0.25)
```
**P2** (when PSI failed — performance is `None`): performance is dropped and conv:ux is reweighted preserving the original 0.40:0.25 ratio →
```
p2 = round(conv*0.615 + ux*0.385)
```

> ⚠️ **Drift to fix:** the category dicts returned by `calculate_scores` still carry display weights of `gbp 55% / mappack 20% / onpage 15% / trust 10%`. These contradict both the live math above (`20/60/10/10`) and the report generator, which was corrected in v6.57 to display `Search Visibility 60% · GBP 20% · On-Page 10% · Trust 10%`. The math is right; the leftover label strings are wrong. Good first cleanup task.

### 6.3 Search Visibility internals (the most nuanced scorer)

- **Dual-grid:** near-me keywords scored against near-me origins; city keywords against city origins.
- **Reach score per grid** = `peak × 0.70 + breadth × 0.30` (v4.69; was 65/35). Peak rewards dominant performance on the core service; breadth captures coverage across keywords.
- **Category composite** = `near_me_score × 0.65 + city_score × 0.35` (the ~80%-of-customers-within-5mi rationale).
- **v4.69 fix (resolves a logged open item):** near-me origins are now **equal-weighted**, matching the city path. Previously they used inverse-distance (`1/dist_mi`) weighting, which collapsed up to ~83% of the near-me score onto the closest origin for dense-urban businesses and double-counted a proximity preference the 65/35 split already expresses. `_weighted_origin_pts` / `_weighted_lf_origin_pts` are retained for backward compatibility (city empty-origins fallback only). *(The function docstring still describes the old inverse-distance behavior — ignore it.)*

### 6.4 Tier labels (`get_tier`)

Applied to any 0–100 score:

| Score | Label | Color |
|---|---|---|
| ≥ 75 | Leading | `#4ade80` green |
| ≥ 50 | Competitive | `#60a5fa` blue |
| ≥ 25 | Needs Work | `#f59e0b` amber |
| < 25 | Critical | `#f87171` red |

### 6.5 Vertical normalization & supporting logic

`normalize_vertical()` maps the intake vertical + GBP primary_type into the internal vertical key (drives schema recommendations, booking-platform gating, and copy). `evaluate_schema()` / `get_recommended_schema()` map GBP category → expected schema.org type. `build_priority_actions()` assembles the ranked action plan. `identify_primary_competitor()` selects the single competitor surfaced in the report and quadrant.

---

## 7. Report output — `generate_report_v6_58.py`

`build_report(audit_data, scores)` renders the full HTML deliverable; `generate_pdf()` converts it. (You don't have this file yet — say the word and it goes in the next handoff.)

### 7.1 The five-profile quadrant — `build_quadrant_svg()`

The headline visual. **X-axis = P2 (Website Conversion), Y-axis = P1 (Local Search Visibility).** Scores map to an SVG plot (viewBox 940×580). Profile assignment (from `calculate_scores`):

| Profile | Condition | Meaning |
|---|---|---|
| **The Leader** | P1 ≥ 70 **and** P2 ≥ 70 | Strong on both — defend |
| **The Contender** | P1 ≥ 50 **and** P2 ≥ 50 | Solid, room to lead |
| **The Leaky Bucket** | P1 ≥ 50 **and** P2 < 50 | Visible but the site doesn't convert — traffic leaks |
| **The Hidden Gem** | P1 < 50 **and** P2 ≥ 50 | Good site, can't be found |
| **The Invisible Closer** | both < 50 | Weak on both |

The 50-lines are the primary quadrant dividers (gold dashed); the Leader zone is the inset box at P1≥70/P2≥70. An optional competitor marker (the local leader) is plotted alongside the client for visual gap framing.

### 7.2 Keyword cards, competitor intel, benchmark tables

`build_keyword_cards()` renders per-keyword position detail (near-me vs city, Maps vs LF). `build_competitor_intel()` renders the competitor comparison block (reviews, DA, rating vs client). `bench()` / `cat_card()` render the benchmark rows where each signal's earned-vs-max points are shown with tier coloring — this is where `signal_pts` from the scoring engine surfaces to the client.

### 7.3 Appendix — `build_appendix_html()` + the Knowledge Base

The appendix is **data-driven from findings**, not hand-written. Every finding can carry a `kb_key`. The builder collects all triggered `kb_key`s across categories, dedupes, looks each up in the **KB registry** (a structured store of remediation entries: `title`, `why`, `how_google`, `fix` steps, `priority`, `effort`, `impact`, `section`), sorts by priority, groups by section, and renders section bands + cards. So the "how to fix it" content a client sees is automatically assembled from exactly the issues their scan triggered. The KB is maintained in `SEO-Knowledge-Base-v1_6.md`.

### 7.4 PDF generation (the method, because it's non-obvious)

`generate_pdf()` uses **Playwright headless Chromium** to screenshot the rendered HTML at 2× scale, then a **numpy smart-break slicer** scans upward from each target cut point to snap page breaks to a background-colored row (avoiding mid-element cuts), and PIL assembles a multi-page PDF at 200 DPI with `MARGIN_PX=0` for continuous flow. **Why not `page.pdf()` native print?** Because the dark theme doesn't survive Chrome's print-CSS reinterpretation — the screenshot-slice method preserves visual fidelity. The same method is used by the comp-intel engine.

---

## 8. Competitive Intelligence engine — `comp-intel-engine-v2_0.py`

A **separate** engine today (decision is logged to merge it into the main diagnostic engine for a single unified scan — §10). It runs its own grid build, Maps + Local Finder scans, competitor aggregation, and Moz bulk DA fetch, then emits its own HTML + PDF.

Key functions: `build_origins()`, `fetch_maps()` / `fetch_local_finder()`, `aggregate_competitors()` (rolls up who appears where across the grid), `visibility_score()`, `fetch_moz_bulk()`, `export_html()` (a large ZCTA-column position-grid layout — Near Me vs City column groups, M/LF stacked per cell, GrowthPath tier colors), and `generate_pdf()` (same screenshot-slice method as the report generator). As of v2.0, PDF generation is merged into the engine and the standalone `comp-intel-pdf-generator` is retired.

**Methodology differentiator worth understanding:** competitor grids from tools like LocalFalcon/BrightLocal/Semrush are **geometry-weighted** (evenly spaced points). GrowthPath's origins are **population-aware ZCTA centroids** selected by radial spread. That's the core defensibility claim of the methodology — it's measuring trade-area reach, not a uniform geometric lattice.

---

## 9. Economics — per-client API cost & margin (from the cost model)

Live numbers from `GrowthPathAPICostModelv1_2.xlsx`. Useful context for any architecture decision that changes call volume.

**Scan composition:** every keyword is scanned on 2 surfaces (Maps + LF) × 2 intent variants (near-me + city) = **4 rank calls per keyword per ZCTA**. Rank calls are ~$0.002 each and are the dominant variable cost. Flat per-scan signal costs (GBP bundle + on-page/PSI + Moz DA + citations) total ~$0.039.

**Per-tier annual economics (weekly cadence, 52 scans/yr):**

| Tier | Price/yr | Keywords | ZCTAs | AI msgs/mo | GA4+GSC | API cost/yr | Margin % |
|---|---|---|---|---|---|---|---|
| **Basic** | $149 | 3 | 10 | 50 | — | ~$21.48 | ~86% |
| **Premium** | $199 | 5 | 20 | 100 | — | ~$48.04 | ~76% |
| **Elite** | $249 | 5 | 20 | 100 | ✓ | ~$49.88 | ~80% |

GA4/GSC OAuth and data retrieval cost **$0 in Anthropic tokens** — the only added cost is feeding that data into Claude for narrative + chat (~$1.84/client/yr on the Elite tier; cache reads keep recurring chat near-zero, the monthly narrative output is the main driver). Break-even headroom is large: even Basic could absorb ~567 full scans/yr before going underwater on scan cost alone. **Takeaway:** the architecture has enormous cost headroom; scan-frequency and grid-size decisions are not cost-constrained at these tiers — they're constrained by infrastructure (no async scheduler) and by signal quality, not by API spend.

---

## 10. Known issues, open items & where you can add value

**Logged bugs:**
- **Reviews poll timeout** — DFS reviews task times out at 90s, dropping velocity signals. Validated fix (in isolation): raise to 120s with a 3s poll interval. Not yet shipped.
- **Service-page false positives** — root-level blog slugs bypass the `/blog/` exclusion regex in `fetch_content_depth()`.
- **Competitor DA pollution** — aggregator/platform domains contaminate the Moz competitor list and need filtering.
- **Water-crossing ZCTAs** — haversine can select unreachable cross-water origins for coastal businesses; filter logged, not scoped.
- **Version-banner mismatch** — older engines printed stale version strings; fixed in v4.57, but a reminder that print/doc strings drift.

**Infrastructure gaps (the real blockers for production):**
- **No async job queue / scheduler.** Everything is synchronous Colab execution today. This is a hard dependency for the regional heatmap and for running scans for multiple clients on a cadence. This is probably the single highest-leverage thing to build for a real SaaS backend.
- **GA4 / GSC pipelines are mock data** in the dashboard. Real build needs CSV ingestion, deterministic classification logic, Claude API for narrative synthesis only, and a data handoff from Colab to the dashboard UI.
- **Comp-intel / diagnostic engine merge** — decision logged to unify into a single scan.
- **LLM Mentions API** — endpoint confirmed; verify the $100/mo activation status.

**Where the CTO role is explicitly scoped to contribute:** better **collection and detection methods** for On-Page Relevance and Conversion Infrastructure — i.e. *how we detect and gather signals*, not the scoring weights (those are settled). The JS-rendered-booking blind spot in `fetch_html()` (static HTML only) is a concrete, high-value target: a headless-render path would meaningfully improve conversion-path detection accuracy.

---

## 11. Conventions you'll need to match

- **Architecture separation is sacred:** rules engine = I/O + collection; scoring engine = pure functions, no I/O. Don't blur them.
- **Verify runtime values from code, never docstrings or spec files.** Use `grep -n "def fn"` then `sed -n 'START,ENDp'` to read specific function blocks in these large files.
- **Versioned filenames with underscores for decimals** (`rules-engine-v4_57.py`). Changelog block in every file header. Bump the version on any change so a re-download is recognized as a new file.
- **Validation workflow (non-negotiable):** read existing code → prototype in isolation (standalone Colab cells) → validate against real data across geographically diverse test businesses (Sapien / Metamorphosis / Squatch / Sushi Blossom) → only then write the production file. **Test new APIs in isolation before integrating.**
- **No placeholder data in any output, ever.** A null signal is rendered as absent/unavailable, never faked.

---

## Appendix A — File inventory

| File | Role | Latest |
|---|---|---|
| `rules-engine-v4_57.py` | Data collection + orchestration (`run_scan`) | v4.57 |
| `scoring-engine-v4_69.py` | Pure scoring (`calculate_scores`) | v4.69 |
| `comp-intel-engine-v2_0.py` | Standalone competitive intel + PDF | v2.0 |
| `generate_report_v6_58.py` | Report HTML + PDF (not yet handed off) | v6.58 |
| `SEO-Engine-Decisions-v4_36.md` | Decision log — **read at session start** | v4.36 |
| `SEO-Engine-Core-v4_12.md` / `SEO-Engine-Product-v4_13.md` | Core + product spec | — |
| `SEO-Knowledge-Base-v1_6.md` | Appendix KB registry source | v1.6 |
| `GrowthPathAPICostModelv1_2.xlsx` | Per-client cost & margin model | v1.2 |
| HTML deliverables | dashboard / overview / rankmap / intake | — |

## Appendix B — Glossary

- **ZCTA** — ZIP Code Tabulation Area; the scan "altitude." Sub-ZCTA (block-group) granularity was tested and rejected as noise.
- **Near-me vs City** — two keyword intent variants; near-me = within-5mi reach, city = "{service} {city}" modifier.
- **Map Pack** — the Google Maps local 3-pack; the Search Visibility category's primary signal.
- **Peak / Breadth** — peak = best performance on the core service; breadth = coverage across keywords.
- **P1 / P2** — the two headline pillars (Search Visibility / Website & Conversion).
- **Signal pts** — per-signal earned-vs-max point attribution surfaced in benchmark tables.
- **Booking path type** — resolved conversion-path classification (`named_platform` / `generic_booking` / `quote_form` / `contact_form_only` / `none`).

---

*GrowthPath Analytics · Platform Architecture Briefing v1.0 · Confidential · June 2026*
