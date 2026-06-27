# GrowthPath — Signal, Data-Source & Methodology Briefing

**Audience:** Technical co-founder · **Purpose:** Companion to your *Initial Technical Framing* memo — per-signal detail on what each pillar measures, which APIs feed it, how data is gathered and returned, and how much to trust each output.

**Source of truth:** `rules-engine-v4.57` (collection) · `scoring-engine-v4.68` (scoring) · `GrowthPathAPICostModel-v1.2`. All figures below are read from current code, not the older spec docstrings (several of which are stale on weights).

---

## 1. Architecture at a glance

Your three-layer read is correct and matches the code:

| Your layer | In code today | Reality |
|---|---|---|
| Data collection / rules engine | `rules-engine-v4.57.py` — ~12 API integrations, synchronous Colab run | Already a clean "scan" boundary. Wrap it as an async job; minimal refactor. |
| Scoring / methodology engine | `scoring-engine-v4.68.py` — pure functions, no I/O | Already modular and testable. This is the defensible core; treat as a library. |
| Delivery | `generate_report_*`, dashboards, rank map | File-based HTML/PDF today. Becomes the portal. |

The scoring engine takes one `audit_data` dict in and returns scores + findings out — no network calls. That separation is real and worth preserving exactly as-is.

---

## 2. The scoring frame (so the tables below make sense)

Two pillars, each 0–100, each a weighted blend of signals. **Weights below are the live `calculate_scores()` values, not the docstrings.**

**Pillar 1 — Search Visibility**
| Signal | P1 weight | Confidence |
|---|---|---|
| Search Visibility (rankings) | **60%** | High |
| GBP Strength | **20%** | High |
| On-Page Relevance | **10%** | **Medium ⚠** |
| Domain Trust | **10%** | High |

**Pillar 2 — Website & Conversion**
| Signal | P2 weight | Confidence |
|---|---|---|
| Website Performance | **35%** | High |
| Conversion Infrastructure | **40%** | **Low–Medium ⚠** |
| Mobile Readiness (UX) | **25%** | Medium–High |

> If PageSpeed fails on a scan, P2 reweights to Conversion 61.5% / UX 38.5% and excludes Performance — so a flaky external API silently shifts pillar weight. Worth surfacing as an explicit job status ("partial") rather than hiding.

Profiles are assigned off the P1×P2 grid (≥70/≥70 Leader → … → Invisible Closer; the code has **five** bands incl. "Contender", though only four are surfaced in client-facing copy).

---

## 3. Pillar 1 — signal by signal

| Signal | API / source | How gathered | What's returned | Confidence |
|---|---|---|---|---|
| **Search Visibility (60%)** | DataForSEO **Maps** (`serp/google/maps/live/advanced`) + **Local Finder** (`serp/google/local_finder/live/advanced`) | One SERP pull per origin ZCTA × keyword × surface (see §6). Position of the business is extracted per origin. | Rank position per origin/keyword/surface → Peak+Breadth composite, near-me/city split, competitor leaderboard | **High** — direct ranked positions from Google surfaces. Main variance is normal SERP volatility, not detection error. |
| **GBP Strength (20%)** | Google **Places API** (identity/category) + DFS `my_business_info/live` (photos, CID) + DFS `reviews` (task_post→task_get) + DFS `my_business_updates` (posts) | Resolve the listing, then pull review count/velocity/recency/response-rate, rating, photo count, post activity | Numeric GBP signal bundle | **High** — all hard numbers from Google's own data via DFS. Only soft spot is review *response-rate* parsing across DFS field variants (already hardened). |
| **On-Page Relevance (10%)** | **HTML crawl** (`requests` + regex/parse) + `fetch_content_depth` (crawls up to 30 pages, spot-checks 5) | Homepage title/H1/schema/meta + multi-page service-page and city-keyword co-occurrence detection | Title (25), LocalBusiness schema (25), service pages (25), H1 (15), city+kw co-occurrence (10) | **Medium ⚠** — see §4. Deterministic signals (title/H1/schema) are reliable; page-coverage signals depend on crawl reach and URL guessing. |
| **Domain Trust (10%)** | **Moz** (`api.moz.com/jsonrpc`, `data.site.metrics.fetch`) + **WHOIS** (`python-whois`) | Bulk DA + referring domains; domain registration age | Domain Authority, RD count, domain age | **High** — Moz DA is an industry-standard external metric; WHOIS age is factual. (CrUX was removed at ~25% SMB availability — correct call.) |

---

## 4. The two signals where I want fresh collection methods

**Important framing:** the scoring model and weights are set — that's our methodology and not what I'm asking you to touch. What I want here is narrow and technical: **these two signals have the lowest confidence in the system because of *how the data is collected*, and I want your thinking on alternative collection/detection methods that would raise accuracy.** The goal is better input data feeding the same scoring — not re-scoring.

### 4a. On-Page Relevance — confidence: Medium, limited by collection method

**Reliable (deterministic HTML parse):** title tag (city + category match), H1 count, LocalBusiness schema. These we trust.

**Lower confidence (collection-method dependent):**
- **Service-page detection** relies on `fetch_content_depth` crawling/guessing URLs (≤30 pages). A site that nests services oddly, renders them via JS, or uses one combined page reads as "missing pages" when the content actually exists → false negatives.
- **City+keyword co-occurrence** is a body-text string match — brittle against synonyms and JS-rendered copy.
- Root cause: the crawler is **static HTML only**, no JS execution. JS-rendered content is invisible.

**What I'm asking:** what collection methods would raise our confidence on the page-level signals? Candidates I'd want your read on: a headless render (we already run Playwright for PDF), parsing `sitemap.xml` instead of URL-guessing, rendered-DOM text extraction for co-occurrence. Which is worth the latency/cost in an async worker, and is there a better approach I'm not seeing?

### 4b. Conversion Infrastructure — confidence: Low–Medium, limited by collection method

This is the signal where current confidence is lowest, entirely because of how the data is detected:

- **Booking-path classification** (named_platform / generic / quote_form / contact_form_only / none) is regex/heuristic matching against static HTML — a long, brittle ladder of platform fingerprints (Boulevard, Acuity, Athena, Mindbody, etc.) plus slug/subdomain fallbacks. Every win came from chasing individual false negatives. **Almost every finding already ships with the caveat:** *"our scanner reads page HTML directly and may not detect booking or contact forms that load via JavaScript or third-party widgets."* That caveat is the system telling the customer the detection is probabilistic.
- **Analytics** = regex for `G-XXXXXX` / `GTM-XXXX` in raw HTML. Misses server-side GTM and some tag-manager-injected GA4 → false "business is blind" criticals.
- **Click-to-call** = homepage-only `tel:` check. A linked number elsewhere on the site reads as missing.

**What I'm asking:** how do we detect these three things more reliably? The detection is the problem, not the scoring. Candidates I'd want your read on: headless render so JS-loaded booking widgets/forms become visible; inspecting network requests / loaded third-party domains (a Wappalyzer-style fingerprint of what the rendered page actually pulls in) rather than string-matching source; full-page (not homepage-only) checks for `tel:` and analytics tags. Where would you get the biggest accuracy gain for the least latency, and what would you do differently?

---

## 5. Pillar 2 — signal by signal

| Signal | API / source | How gathered | What's returned | Confidence |
|---|---|---|---|---|
| **Website Performance (35%)** | Google **PageSpeed Insights** (Lighthouse, desktop) | One call per scan | Performance score, TTFB, CLS, TBT, unused JS/CSS KiB | **High** — Lighthouse lab data. Note: lab, not field (CrUX dropped); one homepage sample. |
| **Conversion Infrastructure (40%)** | **HTML crawl** (regex/heuristics) | Homepage parse | Booking path type, click-to-call, GA4/GTM | **Low–Medium ⚠** — see §4b. |
| **Mobile Readiness / UX (25%)** | **HTML crawl** (viewport + responsive markers) + PSI **accessibility** | Homepage parse + Lighthouse a11y | Viewport config, media queries / responsive images / mobile nav, tap-target signals | **Medium–High** — viewport/responsive are deterministic; some signals are homepage-only proxies. |

---

## 6. The keyword + grid methodology (the layered part)

This is the part that doesn't reduce to a table. It runs in four layers.

### Layer 1 — Keyword variants (2 per service)
For each owner service, the engine generates two keywords (`normalize_keywords`):
- **`[service] near me`** → `type: near_me` (proximity intent)
- **`[service] [city]`** → `type: city` (destination/authority intent)

These are scored against **different origin grids and different ranking drivers**. Near-me rankings are driven by GBP signals + proximity; city-modifier rankings are driven by domain authority + content depth. Keeping them separate is the core methodological bet.

### Layer 2 — Census-driven grid construction (tier-aware)
Origins are **population-weighted ZCTA centroids**, not a uniform geometric grid (the LocalFalcon/BrightLocal approach). Build pipeline (free APIs):

1. **Google Geocoder** → business coordinates
2. **Census ZCTA Gazetteer** (2023 national file) → candidate ZCTA centroids + populations
3. **Census ACS** (`acs5`, requires free key) → population weighting; ACS fallback if unreachable

The grid splits into two independent selection passes, sized by tier (`TRADE_AREA_TIER_CONFIG`):

| | Near-me grid | City grid | Bands | Max radius | Total ZCTAs |
|---|---|---|---|---|---|
| **Basic** | 5 | 5 | 5–7.5, 7.5–10 mi | 10 mi | **10** |
| **Advanced / Premium** | 5 | 15 | 5–9, 9–13, 13–16, 16–20 mi | 20 mi | **20** |

**Near-me selection** (identical across tiers): home ZCTA is always slot 1 (population-exempt); remaining slots picked by **radial farthest-point on the distance axis** out to the cap, with a `pop > 0` guard. Goal = distance spread, not density.

**City selection** (tier-scoped): target slots allocated across distance bands by candidate availability (**largest-remainder**), then **radial farthest-point on the bearing axis** within each band (population as seed + tiebreak). This replaced an earlier sector-rotation method that under-covered SW/W in low-quota bands. `TRADE_AREA_MIN_POP = 250` is a floor/tiebreaker, not a coverage gate.

> Selection geometry uses **front-door distance**, but the scan origins remain **centroids** — a deliberate distinction from the Sapien proximity finding.

### Layer 3 — Search execution (2 surfaces)
Each keyword is pulled on **both** Google surfaces, which are independent ranking engines:
- **Maps** (`serp/google/maps/live/advanced`) — proximity/GBP-anchored
- **Local Finder** (`serp/google/local_finder/live/advanced`) — more organic/content logic

A near-me keyword runs across the **near-me grid**; a city keyword runs across the **city grid**. Per cost model: ~4 rank calls per keyword per ZCTA across surfaces/variants; a full Basic scan ≈ 200 rank calls ≈ **$0.24/scan**, ~**$14/client/year** all-in (>90% gross margin at $149).

### Layer 4 — Scoring the grid (`score_search_visibility`)
- **Per keyword/origin/surface:** position → points (Maps max 50, LF max 50, equal-weighted — they measure different things).
- **Origin weighting:** near-me origins use **inverse-distance** (1/dist_mi — closer counts more); city origins use **equal weight** (all are valid authority tests).
- **Peak + Breadth** per reach type: `reach = peak×0.65 + breadth×0.35` — rewards dominance on the primary keyword without ignoring breadth.
- **Near-me / city blend:** `60%`... actually **65/35** (`near_me×0.65 + city×0.35`) — ~80% of local customers come from within 5 mi (AEA/CDC research), so near-me is where revenue lives.

The output curve (strong near home, variable mid-band, authority-driven at city distance) is what no competitor replicates at this price — and it's the asset to protect in the methodology engine.

---

## 7. What I'd flag for the MVP scope conversation

- **Keep intact:** the scoring engine boundary, the Census dual-grid, Search Visibility, GBP, Domain Trust, Performance. These are high-confidence and defensible.
- **Methodological-improvement target:** On-Page Relevance (§4a) and Conversion Infrastructure (§4b) are our **two lowest-confidence collection methods**. The scoring is settled; what I want from him is better *detection methods* that raise the accuracy of the data feeding them.
- **Async-job design** (your 5.2) directly fixes a real problem: PSI/DFS failures currently shift pillar weights silently. Explicit `partial / needs-review` statuses make the diagnostic more honest, not just more robust.
- **"Keep raw evidence" (your 5.3)** maps cleanly onto storing the DFS/Moz/PSI JSON snapshots we already fetch — near-zero extra work, big credibility payoff for the explainability you want in 5.5.

---

## 8. Two more MVP flags to weigh

### 8a. Anthropic API — full LLM-augmented experience

Your memo stages this correctly (5.6 / "AI summarization layer"): **narrative first, chat later.** The cost model already accounts for both, and the numbers are why this is low-risk to commit to early:

- **Monthly narrative:** ~$0.10/generation → ~**$1.20/client/year**.
- **Chat (cached):** ~$0.02/message; with prompt caching the recurring per-message cost is near-zero (cache reads ~$0.30/1M tokens vs $3/1M uncached). Tier allotments are 50/100/200 msgs/month.
- **GA4/GSC context** (Growth tier only) adds ~**$1.84/client/year** in tokens — OAuth and Google data pulls cost **$0** in tokens; the only cost is feeding that data into Claude.

So a full LLM experience costs **single-digit dollars per client per year** against $149–$249 pricing. The constraint isn't economics — it's product discipline.

**Questions for him:**
1. MVP scope: **deterministic narrative only** (Claude *synthesizes* pre-computed findings — Option B in our GA4/GSC spec, no analysis done by the model), or do we let chat reach into raw scan data? The first is cheap, safe, and explainable; the second is the harder build.
2. Caching architecture: the cost model assumes the scan/context block is cached and chat reads from it. That shapes how the worker hands data to the API. Worth designing the prompt-prefix/cache boundary up front so we don't rebuild it.
3. **Guardrail:** the model should *explain and prioritize* findings the scoring engine produced — never invent scores or recommendations. Keeps recommendations defensible (your 5.5) and keeps the methodology engine as the single source of truth.

### 8b. BrightLocal API — citation building as a billable add-on

This is a revenue lever and a product wedge, and it maps onto a real, hard-to-move metric.

**The mechanics:** BrightLocal citation building API at **~$2/citation wholesale**, billed at **$2.50–$3** → **$0.50–$1.00 margin each**, sold per-citation on top of subscription. Already in the model as a per-citation add-on.

**Why it's strategically right:** Domain Trust (10% of P1) is driven by DA + referring domains, and **referring domains are the slowest, hardest signal to move** — it takes time and is mostly outside an owner's control. Seeding a batch of citations at onboarding gives a weak-DA business early, visible movement on the one metric they otherwise can't touch for months. It also fits "graduation not renewal": a front-loaded, finite intervention rather than indefinite dependency.

**Where I want us to be precise with him (so the pitch holds up):** citation listings and *high-authority* referring domains aren't the same thing. Directory citations **do** create referring domains, but they're typically **low-authority** links. Their largest, most reliable payoff is **NAP consistency → local-pack trust / GBP prominence**, with DA lift as a **secondary, slower** benefit. Over-promising "big DA boost" invites a "we bought 50 citations and DA barely moved" complaint. The honest, stronger framing: *foundational citation coverage that improves local trust signals and contributes incremental referring domains over time* — measurable in our own Domain Trust signal at re-scan, which conveniently closes the loop (we sell the fix, then re-measure it).

**Questions for him:**
1. Fulfillment model: pure API pass-through, or do we hold a queue/approval step (citations can take weeks; status tracking maps to the same async-job pattern)?
2. Do we **gate** the upsell on the diagnostic — only surface it to businesses our scan flags as weak on referring domains? That makes it evidence-driven rather than a generic add-on, and reinforces the diagnostic's value.
3. Re-scan attribution: tracking citation → referring-domain → Domain Trust delta over time is exactly the "metric snapshot over time" entity in his data model (§6 of his memo). Worth wiring deliberately so we can *show* the impact we sold.

---

## 9. The MVP front-end question — what data earns the screen

This is the consideration that should come *first* in the build conversation, because the answer dictates both the front end **and** the backend schema. Your memo already set the principle (clarity of findings over feature coverage; show the core aha moment). This is the specific version of that decision.

**What the engine currently produces** (today's 7-tab dashboard): Dashboard (two-pillar score + quadrant), Action Plan, Competitors, Rank Map, **Analytics/GA4**, **Search Console/GSC**, Reports. Two of those — **GA4 and GSC — are hardcoded mock data**, not live.

I'd want him thinking in three buckets:

**Emphasize (the aha moment + the proof):**
- **Trade-area visibility curve / Rank Map** — this is the differentiator nothing else replicates at our price. It's the single most defensible thing we show. It should be the hero, not a tab.
- **Two-pillar score + quadrant profile** — the headline verdict that orients everything else.
- **Competitor comparison** — supplies the urgency that drives the buying decision.
- **Prioritized Action Plan** (effort/impact, owner-readable) — your memo's conversion mechanic; this is what makes the diagnostic *actionable* rather than just diagnostic.

**De-emphasize / present softly (tie to §4):** the low-confidence signals — **On-Page Relevance and Conversion Infrastructure**. The front end should not present probabilistic detection with the same visual authority as a hard ranking. These likely belong as "here's what we detected, confirm if this is right" rather than a bold scored headline. **Emphasis should track confidence** — that's the clean rule, and it keeps recommendations defensible (his point 5.5).

**Defer / ignore for MVP:**
- **GA4 + GSC tabs** — they're mock today and require the OAuth + live-pipeline build. Real value, but not needed to create the first buying decision. Strong candidate to cut from MVP scope.
- Agency white-label, deep analytics, full chat history — already on his "wait" list.

**Why this dictates the backend, not just the UI:** if the visibility curve is the hero, the schema must persist **per-origin ranking data over time** (longitudinal comparison — his Metric Snapshot entity) so re-scans can show movement. If the Action Plan is core, the backend needs **task/completion state**. If we defer GA4/GSC, we skip the entire OAuth + token-pipeline layer for v1. So the order of operations is: **decide what we emphasize → that defines what we persist → that defines the schema and the API surface.** Picking the hero data first prevents us from building storage and endpoints for things the MVP front end never shows.

**The question for him:** given the above, what's the leanest front end that lands the aha moment and the action plan — and what's the minimum we therefore need to persist and serve to support it?

---
*GrowthPath Analytics · Confidential · v1.3 · grounded in rules-engine-v4.57 / scoring-engine-v4.68 / cost-model-v1.2*
