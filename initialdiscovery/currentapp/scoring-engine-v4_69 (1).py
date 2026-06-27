# ════════════════════════════════════════════════════════════════
# GROWTHPATH SCORING ENGINE v4.70
#
# v4.70 changes (booking path copy — Playwright render in rules engine v4.58):
#   Removed the static-HTML scanner caveat from conversion-infrastructure
#   findings. Rules engine now renders homepage via Playwright and captures
#   network requests for booking-widget detection; the old disclaimer is
#   obsolete for detected paths. "none" findings no longer imply a JS blind spot.
#
# GROWTHPATH SCORING ENGINE v4.69
#
# v4.69 changes (near-me scoring aligned to the v4.57 even-dispersion grid):
#   1. Near-me origin weighting: INVERSE-DISTANCE -> EQUAL weight.
#      score_search_visibility() near-me branch now averages origins equally
#      (same method city already uses), instead of 1/dist_mi weighting via
#      _weighted_origin_pts / _weighted_lf_origin_pts. The v4.57 grid samples
#      0-5mi evenly to measure visibility REACH; inverse-distance collapsed
#      that onto the closest origin (~83% on the home ZCTA for dense-urban
#      businesses; ~54% of the entire Search Visibility score after the 65%
#      near-me pillar weight) and double-counted a proximity preference the
#      65/35 pillar split already expresses. _weighted_origin_pts /
#      _weighted_lf_origin_pts retained (now unused by the near-me path; city
#      empty-origins fallback only) for backward compatibility.
#   2. Peak/Breadth weight: 65/35 -> 70/30 (both near-me and city reach
#      scores). Rewards dominant performance on the core service; weak
#      non-core-service keywords drag the score less. Trades a little breadth-
#      gap sensitivity for a more charitable headline (gap still visible in
#      per-keyword detail). Owner-directed product stance.
#   UNCHANGED: 65/35 near-me/city pillar weight (already matched the
#   "~80% of customers within 5mi" rationale). See Decisions v4.36.
#
# GROWTHPATH SCORING ENGINE v4.68
#
# v4.68 changes:
#   Booking path scanner caveat extended to generic_booking, quote_form,
#   and contact_form_only findings.
#   Previously the caveat ("our scanner reads page HTML directly and may
#   not detect booking or contact forms that load via JavaScript or
#   third-party widgets") only appeared on booking_path_type == "none".
#   Now appended to every finding in generic_booking, quote_form, and
#   contact_form_only branches. Named platform findings excluded — if
#   we confirmed a platform, no caveat needed. No scoring changes.
#
# v4.67 changes:
#   Booking path "none" finding copy — HTML scanner caveat added.
#   Both the score_conversion_infrastructure() finding and the
#   priority actions block now append a disclaimer when
#   booking_path_type == "none": scanner reads static HTML and may
#   not detect booking/contact forms loaded via JS or third-party
#   widgets. No action item or scoring change — copy only.
#
# v4.66 changes:
#   GBP Strength — point reallocation (pool stays 100pts exact):
#     Primary category: 25 → 20 pts
#       Rationale: binary signal once correctly set — over-weighted
#       relative to its differentiation value in competitive sets.
#     Response rate: 5 → 10 pts
#       Rationale: Whitespark 2026 cites owner responsiveness as a
#       growing prominence signal. High ROI, fully actionable lever.
#   signal_pts dict updated: primary_category max 25→20,
#     response_rate max 5→10.
#   Docstring updated to reflect new allocation.
#
#   P1 pillar weight formula updated:
#     OLD: GBP Strength 25% · Search Visibility 50% · On-Page 15% · Domain Trust 10%
#     NEW: GBP Strength 20% · Search Visibility 60% · On-Page 10% · Domain Trust 10%
#   Rationale: Search Visibility is the output signal — the verdict on
#     whether all P1 inputs are working. GBP/On-Page/Trust are inputs.
#     60% weight on the output signal forces P1 to reflect real search
#     performance, not just structural readiness. Businesses with strong
#     inputs but weak Map Pack presence correctly score below 50 and
#     land in Hidden Gem (converting but not found) rather than Contender.
#     Action story for Hidden Gem is clear and specific: reviews, DA,
#     on-page relevance, secondary categories. On-Page reduced 15→10%
#     to absorb freed weight while preserving Trust at 10%.
#   Validated direction: strong-input / weak-search business example:
#     GBP=70, Search=30, On-Page=65, Trust=60
#     OLD P1: 70×.25 + 30×.50 + 65×.15 + 60×.10 = 48.25 (borderline)
#     NEW P1: 70×.20 + 30×.60 + 65×.10 + 60×.10 = 44.50 (clear Hidden Gem)
#
# v4.65 changes:
#   score_conversion_infrastructure(): internal_slug booking method added.
#
#   New booking_detection_method value: "internal_slug" — set by rules
#   engine v4.48 when a dedicated scheduling page slug is found in
#   internal hrefs (e.g. /scorpion-scheduling/, /book-appointment/).
#
#   Points for home_trade/professional_service:
#     internal_slug → 30pts (between cta_hash 25pts and quote_form 35pts)
#     Rationale: a dedicated scheduling page is real infrastructure —
#     stronger signal than a JS modal (cta_hash) but weaker than a
#     confirmed quote/estimate form with job-description fields (quote_form).
#     All other verticals: 30pts (same as other generic_booking).
#
#   Finding copy (internal_slug branch):
#     "Dedicated scheduling page detected at [slug]. Verify the page
#      loads a working scheduler and that a prominent button links to
#      it above the fold on mobile."
#     severity: good
#
#   booking_e updated: internal_slug = 30pts for is_quote_model,
#   30pts for all others (same as non-home_trade generic_booking).
#
#   Also reads new output field booking_internal_slug for named slug
#   in finding copy.
#
# v4.64 changes:
#   score_conversion_infrastructure(): Four changes for home_trade
#   booking path accuracy and scoring calibration.
#
#   (1) quote_form raised to 35pts for home_trade/professional_service.
#       Rationale: a structured quote/estimate request form is the
#       vertical best practice — better lead quality than a generic
#       booking modal. Named FSM platforms (ServiceTitan etc.) retain
#       40pts as the gold standard. generic_booking (CTA hash / external
#       URL) lowered to 25pts for home_trade — a JS modal with no job
#       context is less qualified than a purpose-built quote form.
#       Non-home-trade verticals: all points unchanged.
#       Updated point table for home_trade/professional_service:
#         named_platform   → 40pts (unchanged)
#         quote_form       → 35pts (was 30pts)
#         generic_booking  → 25pts (was 30pts)
#         contact_form     → 10pts (unchanged)
#         none             → 0pts  (unchanged)
#
#   (2) generic_booking finding copy split on booking_detection_method.
#       "cta_hash": "Online booking detected — visitors can self-schedule
#         from your homepage. Platform not identified (JS-rendered). Verify
#         the booking flow works on mobile and is above the fold."
#       "external_url": existing copy (suggests getting a scheduling tool).
#       For non-quote-model verticals: existing copy retained regardless
#       of detection method.
#
#   (3) quote_form finding copy updated for home_trade when
#       lead_capture_platforms present (Jotform/Typeform/HubSpot Forms):
#       Acknowledges the structured lead-capture form as the right tool,
#       focuses finding on response time and form field optimization.
#
#   (4) booking_e recalculated to match new point values:
#       quote_form: 35 if is_quote_model else 10.
#       generic_booking: 25 if is_quote_model else 30.
#
# v4.63 changes:
#   score_gbp_strength(): competitor category leaderboard now renders
#     for all businesses regardless of _GENERIC_PRIMARY membership.
#
#   BUG: Leaderboard tally gate `primary_cat not in _GENERIC_PRIMARY`
#     blocked the entire tally block for any business whose GBP primary
#     type appeared in _GENERIC_PRIMARY (e.g. "restaurant"). Result:
#     no leaderboard, no category opportunity card, 0 fit pts — even
#     when 143 competitor slots with valid category data were available.
#
#   FIX 1 (line ~1061): Gate changed from
#     `if primary_cat and primary_cat not in _GENERIC_PRIMARY and serp:`
#     to `if primary_cat and serp:`
#     Leaderboard now always builds when primary_cat and serp exist.
#
#   FIX 2 (line ~1073): Tally filter changed from
#     `if cat and cat not in _GENERIC_COMP:`
#     to `if cat and (cat not in _GENERIC_COMP or cat == primary_cat):`
#     Client's own primary category is always included in the tally
#     regardless of _GENERIC_COMP membership.
#
#   Fit scoring unchanged: _GENERIC_PRIMARY check at line ~1046 still
#     awards 0 fit pts for generic primary categories. Presence pts
#     (10) still awarded. Total cat pts for generic primary = 10/25.
#     The leaderboard now renders in all cases — fit scoring and
#     leaderboard rendering are now correctly decoupled.
#
#   Validated against Two Mixed Up (Minneapolis) scan data:
#     primary_cat='restaurant' (in _GENERIC_PRIMARY)
#     144 competitor slots, all with category data
#     Leaderboard: 15 unique categories, 143 slots tallied
#     Top category: hamburger (41%) — correct and actionable signal
#     client_in_board: False — correct (restaurant filtered by
#       _GENERIC_COMP, finding fires directing owner to switch to
#       "Hamburger Restaurant" as primary GBP category)
#
#
# v4.62 changes:
#   score_conversion_infrastructure(): quote_form booking path added.
#     New booking_path_type "quote_form" (from rules engine v4.45)
#     scores 30/40 pts for home_trade and professional_service verticals
#     — recognizes quote/estimate request forms as the correct conversion
#     path for service businesses, not a gap.
#     Non-service verticals with quote_form signal fall back to 10pts
#     (same as contact_form_only) with BOOKING_PATH_MISSING finding.
#     contact_form_only for is_quote_model verticals updated:
#       was: 25pts + "Contact/quote form detected" (good-ish finding)
#       now: 10pts + CONTACT_FORM_ONLY_SERVICE finding — a generic
#            contact form with no quote language is now correctly
#            distinguished from a proper quote form.
#     booking_e calculation updated to include quote_form: 30 if
#     is_quote_model else 10.
#     New kb_keys: QUOTE_FORM_DETECTED, CONTACT_FORM_ONLY_SERVICE.
#     Validated against: Wildcat Painting, Salt City Plumbing,
#     Richmond VA Roofing (quote_form), Ronnie's Handyman
#     (contact_form_only — generic form, no quote language).
#
# v4.60 changes:
#   score_gbp_strength(): signal_pts review count thresholds fixed.
#     BUG: signal_pts recalc block (line ~1325) used an incomplete inline
#     dict missing home_trade, professional_service, and real_estate verticals.
#     These fell back to "service" thresholds (200/80/40), but the main points
#     accumulator correctly used COUNT_THRESHOLDS which includes all verticals.
#     Result: score header and signal_pts bench table disagreed by up to 6pts
#     for affected verticals (e.g. home_trade: 150 threshold vs 200 fallback).
#     FIX: replaced inline dict with reference to r_lead/r_comp/r_nw variables
#     already computed above via COUNT_THRESHOLDS. Score and table now agree.
#   score_gbp_strength() docstring updated to reflect current actual allocation
#     (was stale from v4.25 — showed old 110pt pool that no longer exists).
#
# v4.59 changes:
#   score_scores() / P2 assembly: PSI failure handling added.
#     PSI failure detected via psi.get("performance") is None —
#     distinguishes null dict (fetch failure) from real PSI=0 score.
#     On failure: performance category excluded from P2 entirely.
#     P2 reweighted: conv 0.40→0.615, ux 0.25→0.385 (same ratio, rescaled).
#     perf_findings replaced with single warning finding.
#     perf_signal_pts set to {} — report generator uses .get() throughout.
#     No penalty applied. Score reflects only what was measurable.
#     Prerequisite: rules-engine v4.44 fetch_psi() returns None-valued
#     null dict on failure (not 0-valued), enabling is None detection.
#
# v4.58 changes:
#   score_gbp_strength(): Two finding gaps closed.
#
#   Review count findings — three-tier copy replacing single-floor trigger:
#     OLD: finding only fires when g_rev < r_nw (floor). Silent at competitive
#          and needs-work tiers. kb_key incorrectly pointed to REVIEW_VELOCITY_LOW.
#     NEW:
#       g_rev >= r_lead  -> silent (no finding)
#       g_rev >= r_comp  -> warning, encouraging copy, kb_key: REVIEW_COUNT_LOW
#       g_rev >= r_nw    -> warning, gap-focused copy, kb_key: REVIEW_COUNT_LOW
#       g_rev < r_nw     -> critical (existing copy),  kb_key: REVIEW_COUNT_LOW
#     kb_key corrected on all tiers -- review count and velocity are distinct
#     signals and should reference distinct KB entries.
#
#   Secondary categories findings -- mid-tier gap closed:
#     OLD: finding only fires at 0 categories. Silent at 1-2.
#     NEW:
#       sec_count >= 3  -> silent (no finding)
#       sec_count 1-2   -> warning, tells owner exactly how many more to add,
#                          kb_key: GBP_CATEGORY_PRIMARY
#       sec_count == 0  -> warning (existing copy), kb_key: GBP_CATEGORY_PRIMARY
#
# v4.57 changes:
#   score_domain_trust(): DA finding block rebuilt — three-tier copy.
#     OLD: single finding fires when da < 15 (warning if ≥5, critical if <5).
#          Silent for da 15–39. Mismatch with bench row "Target: 30+".
#     NEW: four-state logic against 30+ leading threshold:
#       da ≥ 30   → no finding (leading, silent)
#       da 20–29  → warning, encouraging copy — competitive range,
#                   30+ is the next milestone, low-pressure path forward
#       da 10–19  → warning, actionable copy — below competitive threshold,
#                   directory citations as primary lever
#       da 1–9    → critical, urgent copy — backlink profile not established,
#                   free citation baseline as starting point
#       da == 0 + no moz_client → data unavailable warning (unchanged)
#     kb_key: DA_LOW retained on all three finding tiers.
#
#   score_conversion_infrastructure(): contact_form_only quote model finding
#     updated from good (green) to warning (amber).
#     Copy updated: single punchy sentence acknowledging standard practice
#     while pointing to self-scheduling as the gap to close.
#     kb_key: BOOKING_PATH_SERVICE (new key — appendix entry to be added
#     to SEO-Knowledge-Base).
#
# v4.56 changes:
#   Home & Professional Services vertical fully wired into scoring engine.
#   Three new scoring keys: home_trade, professional_service, real_estate.
#
#   normalize_vertical(): Added "Home & Professional Services" branch.
#     Routes to home_trade, professional_service, or real_estate based on
#     BIZ_TYPE string from intake form. Falls back to home_trade for
#     unmapped home/professional types. KNOWN_KEYS updated with new keys.
#     Docstring updated.
#
#   COUNT_THRESHOLDS (review count): Added home_trade, professional_service,
#     real_estate keys.
#       home_trade:          (150, 60, 25)   — v1 estimate, calibrate after 3-5 scans
#       professional_service: (75, 30, 15)   — v1 estimate, calibrate after 3-5 scans
#       real_estate:         (200, 80, 40)   — mirrors service default
#     TODO comments added at each new key.
#
#   VELOCITY_MINIMUMS (reviews/window): Added home_trade, professional_service,
#     real_estate keys.
#       home_trade:          2   — trades have repeated customer touchpoints
#       professional_service: 1  — attorneys/CPAs serve fewer clients, fewer reviews
#       real_estate:         2   — agents solicit reviews post-close
#     TODO comments added at each new key.
#
#   RD_THRESHOLDS (referring domains): Added home_trade, professional_service,
#     real_estate keys.
#       home_trade:          [(80,30),(35,22),(15,14),(6,7)]   — v1 estimate
#       professional_service: [(60,30),(25,22),(10,14),(4,7)]  — v1 estimate
#       real_estate:         [(80,30),(35,22),(15,14),(6,7)]   — mirrors home_trade
#     TODO comments added at each new key.
#
#   score_conversion_infrastructure(): Three changes:
#     (1) HOME_TRADE_TYPES and PROF_SERVICE_TYPES sets added alongside
#         MEMBERSHIP_TYPES. contact_form_only scores 25pts (not 10pts) for
#         all home trade and professional service types — contact/quote form
#         IS the standard conversion path, not a fallback.
#     (2) is_quote_model flag: True when vertical is home_trade or
#         professional_service. Used in booking path scoring and findings.
#     (3) Booking finding copy is now vertical-aware:
#         — generic_booking finding references trade/professional platforms
#           (ServiceTitan, Jobber, Calendly, Acuity) not beauty platforms
#           when is_quote_model is True.
#         — contact_form_only good-state finding adapted for quote model.
#         — none finding adapted for quote model businesses.
#
# v4.55 changes:
#   calculate_scores(): keyword_volume extraction removed.
#     keyword_volume key removed from mappack output dict.
#     No scoring logic changed — data was display-only pass-through.
#
# v4.54 changes:
#   score_mobile_ux(): Responsive findings rebuilt — per-signal findings
#     for each failed signal (media queries, markers, images, nav).
#     3/4: one warning per failed signal, kb_key per signal type.
#     ≤2/4: per-signal criticals + additional conversion-impact critical
#     (RESPONSIVE_DESIGN_WEAK). 4/4: no finding.
#     New kb_keys: RESPONSIVE_NO_MEDIA_QUERIES, RESPONSIVE_NO_MARKERS,
#     RESPONSIVE_NO_IMAGES, RESPONSIVE_NO_NAV, RESPONSIVE_DESIGN_WEAK.
#   score_conversion_infrastructure(): Booking path caveat added to
#     contact_form_only and none findings — notes walk-in inapplicability.
#
# v4.53 changes:
#   score_mobile_performance(): Rebalanced to exactly 100pts — no cap needed.
#     WebP: 15pts → 5pts. Unused JS/CSS: 10pts → 5pts. TTFB/CLS/TBT/PSI unchanged.
#     crux param removed (already unused since v4.52).
#     Raw max was 115 → now exactly 100. min(100, points) retained as safety net.
#
# v4.51 changes (Mobile UX — rebuilt scoring model):
#   score_mobile_ux(): Complete rebuild. Consumes new html fields from
#     rules engine v4.41 (viewport_exists, viewport_has_width_device,
#     viewport_blocks_zoom, responsive_score, has_media_queries,
#     has_responsive_markers, has_responsive_images, has_mobile_nav).
#
#   New model (100 pts max):
#     Viewport          40 pts  — HTML parse (parsed meta tag, not PSI)
#       Clean (exists + width=device-width + no zoom block) → 40
#       Blocks zoom (exists + width=device-width + zoom blocked) → 35
#       No width=device-width + responsive_score ≥ 2              → 20
#       No width=device-width + responsive_score < 2              →  0
#       No meta tag at all                                        →  0
#     Responsive impl   35 pts  — HTML parse, 4 signals scored 0–4
#       4/4 → 35, 3/4 → 26, 2/4 → 18, 1/4 → 9, 0/4 → 0
#     Tap targets       15 pts  — PSI a11y target-size (unchanged)
#       Pass → 15, None → 7 (neutral partial), Fail → 0
#     Color contrast    10 pts  — PSI a11y color-contrast (reduced from 30)
#       Pass → 10, None → 0, Fail → 0
#
#   Rationale:
#     Viewport remains dominant (40 pts) — foundational mobile requirement.
#     Responsive implementation replaces dead weight in old color contrast
#       allocation — directly measures mobile layout effort, all from
#       existing HTML fetch data at zero additional API cost.
#     Color contrast reduced 30→10 pts — PSI returns None for ~40% of
#       small business sites; penalizing them for untestable signal was
#       unfair. Still scored when available.
#     Tap targets reduced 30→15 pts — real UX signal but downstream of
#       viewport + responsive. Proportionate weighting.
#     PSI no longer used as viewport truth source — DOM parse is more
#       accurate for this signal. PSI viewport audit failed sites with
#       genuine responsive implementation (confirmed: Bellingham Fitness).
#
#   signal_pts dict updated: viewport max=40, responsive max=35,
#     tap_targets max=15, color_contrast max=10.
#   Findings updated: viewport finding now has three severity states.
#     Responsive findings added at ≤2/4 and 0/4 thresholds.
#     kb_key tags added for appendix: VIEWPORT_MISCONFIGURED,
#     RESPONSIVE_DESIGN_WEAK.
#
#
# v4.50 changes:
#     _client_match(): rebuilt with three-step logic replacing v4.44 exact match.
#     v4.44 exact match broke for every cuisine/service type where DFS Maps SERP
#     returns a short display label ("japanese") vs the full primary_type string
#     ("japanese_restaurant") — 35/52 business types failed in isolation test.
#     New logic:
#       Step 1: exact match (gym → gym, medical_spa → medical_spa)
#       Step 2: underscore-stripped exact match (steakhouse → steak_house)
#       Step 3: word-boundary prefix match — pm.startswith(ck) AND next char
#               in pm is "_" or pm ends. Prevents "bar" matching "barbershop"
#               while correctly matching "bar" → "bar_and_grill".
#     Validated: 52/52 cases across F&B, Beauty, Fitness, Service verticals.
#     v4.44 scored 17/52 on the same test suite.
#
# v4.44 changes:
#     _client_match(): substring match replaced with exact match after
#     normalization. Fixes double-badge bug where "spa" matched inside
#     "medical_spa", causing both rows to show "your category" in the
#     leaderboard. Safe now that primary_type comes from DFS category_ids[0]
#     (rules engine v4.35) — exact strings on both sides guaranteed.
#
# v4.43 changes:
#   Fitness & Training vertical wired into scoring engine:
#
#   vertical normalization: normalize_vertical() added at top of
#     calculate_scores(). Maps BIZ_VERTICAL strings from intake form
#     ("Fitness & Training", "Food & Beverage", "Beauty & Wellness")
#     to scoring engine keys ("fitness", "restaurant"/"gym", "medspa"/"salon").
#     Uses GBP primary_type as tiebreaker for Beauty sub-verticals.
#     Falls back to "service" for unmapped types.
#
#   Fitness threshold strategy: "fitness" vertical key intentionally
#     maps to "service" fallback for review count, velocity, and RD
#     thresholds. No real scan cohort yet — calibrate after 3-5 fitness
#     scans. TODO comment added at each threshold dict.
#
#   Booking scoring override: score_p2_conversion() now accepts vertical.
#     Membership-model fitness (gym, yoga_studio, pilates_studio,
#     crossfit_gym, fitness_center, boxing_gym) treats contact_form_only
#     as 25/40 pts instead of 10/40 — contact/inquiry IS the conversion
#     path for these business types, not a fallback.
#
# v4.42 changes:
#   _client_match(): normalized both cat_key and primary to underscore
#     format before comparing. Fixes space-vs-underscore mismatch between
#     DFS ("coffee shop") and Google Places ("coffee_shop") that caused
#     client category to never match in the leaderboard tally.
#   category_opportunity: added client_in_board flag (bool) — True when
#     any leaderboard_all row has is_client=True. Consumed by report
#     generator advisory logic.
#   Finding added when client_in_board is False: amber warning surfacing
#     that the client's primary category is absent from the top-5 tally,
#     with kb_key GBP_CATEGORY_PRIMARY.
#
# v4.41 changes:
#   P2 category renamed: "Mobile Performance" → "Website Performance"
#   P2 weights updated: perf 0.45→0.35, conv 0.35→0.40, ux 0.20→0.25
#   Weight strings in return dict updated: "35%", "40%", "25%"
#   score_mobile_performance(): WebP signal added (15pts). Raw max now
#     115pts → capped at 100. webp_by_* keys injected from html dict
#     into psi_with_webp at call site in run_score(). Docstring updated.
#   score_mobile_ux(): Rebuilt as clean 3-signal 100pt model.
#     Viewport 40pts, Color contrast 30pts, Tap targets 30pts.
#     WebP removed (moved to Website Performance). Alt text removed
#     (home-page-only sample, not a genuine mobile UX signal).
#     No normalization required. signal_pts updated accordingly.
#
# v4.40 changes:
#   Competitor category tally expanded to produce full leaderboard dict
#     for report rendering: top-5 categories with near-me/city splits,
#     client_pct, market_fragmented flag, per-split totals.
#   Client category matching switched from exact key lookup to token
#     overlap (_client_match): handles DFS truncation where "grill"
#     appears in tally instead of "bar_and_grill".
#   primary_clean now uses gbp.primary_type (Places API full string)
#     instead of normalized primary_cat — ensures display shows
#     canonical GBP category name e.g. "Bar And Grill" not "Grill".
#   category_opportunity dict restructured: leaderboard_all/nm/city
#     replace old suggested/current/competitor_frequency keys.
#     Primary Category 10+15=25 (was 10), Review Count 20 (was 25),
#     Review Velocity 20 (was 25), Secondary Categories 10 (was 3),
#     Google Rating 10 (was 20), Response Rate 5 (was 10),
#     Photos 5 (unchanged), GBP Posts 5 (was 8).
#     Profile Completeness removed (was 4, hidden from report).
#   Primary category fit scoring replaced binary specific/generic check:
#     10pts presence + 15pts fit. Fit uses client share of competitor
#     category tally: fragmented market (leader ≤30%) → 15pts;
#     client ≥15% of tally → 15pts; client <15%, market not fragmented
#     → 5pts + opportunity card. _GENERIC_COMP consolidated with
#     _GENERIC_PRIMARY into single block.
#   All rescaled signal tiers adjusted proportionally to new maxes.
#   Velocity tables: Consistency 3/2/1/0 → 11/7/3/0; Minimum → 9/6/2/0.
#     Competitor tally retained as informational finding only — no score
#     impact. gbp_category_confirmed, gbp_category_mismatch, and
#     gbp_stated_category params removed from score_gbp_strength().
#     Review velocity pts increased 20→25, review count 20→25,
#     google rating 15→20 to absorb freed 5pts and keep pool at 100.
#     signal_pts dict updated to reflect new maxes.
#   Review velocity findings: reframed from cumulative to discrete window
#     language. "over last 30/60/90 days" replaced with
#     "days 1-30 / 31-60 / 61-90" to eliminate ambiguity about whether
#     counts are cumulative or per-window.
#
# v4.35 changes:
#   RD_THRESHOLDS: restaurant leading tier lowered 500->200, validated
#     against 27-business local restaurant cohort (Well and Table scan).
#     Actual market data: median=162 RDs, P75=264 RDs. 500 was calibrated
#     against national chains, not independent local operators (our ICP).
#     Updated tiers (restaurant): 200/100/40/15
#     Updated tiers (medspa):     150/60/25/10  (proportional adjustment)
#     Updated tiers (salon):      200/80/30/12  (proportional adjustment)
#     Updated tiers (service):    100/40/20/8   (proportional adjustment)
#   Rationale: leading threshold should be achievable by a well-optimized
#     independent local business, not a regional chain. Competitive threshold
#     should represent the median of the real local competitive set.
#
# v4.34 changes:
#   score_search_visibility(): Maps/LF equal weighting + normalization removed.
#     MAPS_MAX: 50 -> 50 (unchanged)
#     LF_MAX:   35 -> 50 (equal weight with Maps)
#     Total per-keyword max: 85 -> 100 (clean, no normalization required)
#     Line: round((maps_pts + lf_pts) / 85 * 100) -> maps_pts + lf_pts
#   Rationale: Maps and LF measure different underlying signals (proximity vs
#     prominence) but the optimization path to improve either is identical.
#     Equal weighting reflects this. A business dominant on one surface should
#     score proportionally — not be penalized for LF gap via unequal weights.
#     50+50=100 eliminates normalization hack introduced in v4.32.
#   _score_maps_local(): removed — dead code since v4.12, never called by
#     score_search_visibility(). Replaced by _score_position() + MAPS_MAX.
#   _score_maps_city(): removed — retired v4.1, always returned 0.
#
# v4.33 changes:
#   Schema scoring rebuilt (score_onpage_relevance + build_priority_actions):
#     GBP_TO_SCHEMA: 141 Google Places primaryType strings mapped to correct
#       schema.org LocalBusiness subtypes. Module-level constant.
#     VALID_LOCAL_SCHEMA_TYPES: full accepted set (38 types). Replaces the
#       previous hardcoded 6-item list.
#     get_recommended_schema(primary_type): derives correct schema.org type
#       from GBP primary_type. Falls back to LocalBusiness for unmapped types.
#     evaluate_schema(primary_type, detected_schema_types): returns status
#       (present/org_only/missing), score_pts (25/8/0), finding, recommended.
#     score_onpage_relevance(): gains primary_type param. Schema block uses
#       evaluate_schema(). Finding always shows detected type vs GBP category
#       side by side. Owner verifies alignment. No scoring penalty for type
#       mismatch (unreliable at scale across 141 GBP types).
#     calculate_scores(): passes gbp primary_type to score_onpage_relevance().
#     build_priority_actions(): schema label switch replaced with
#       get_recommended_schema(primary_type). Covers all 141 GBP types vs
#       previous 4-vertical hardcoded switch.
#
# v4.32 changes:
#   score_search_visibility(): per-keyword score normalized to true 100pt ceiling.
#     OLD: total = min(100, maps_pts + lf_pts)
#     NEW: total = min(100, round((maps_pts + lf_pts) / 85 * 100))
#   Rationale: Maps max (50) + LF max (35) = 85, not 100. The old cap was
#   unreachable — a perfect performer (#1 on both surfaces from all origins)
#   scored 85, not 100. Full proportional rescale: all tiers lift by the same
#   ratio, relative spread preserved, 100 is now achievable.
#   Validated: Voodoo Doughnut scan (dominant all ZCTAs) → 81 → 96.
#
#
# v4.31 changes:
#   score_gbp_strength(): added gbp_category_mismatch and gbp_stated_category
#     params. Mismatch finding copy now references both the actual GBP value
#     and the owner-stated intake value for actionable client messaging.
#   calculate_scores(): passes gbp_category_mismatch and gbp_primary_category
#     from audit_data through to score_gbp_strength().
#   Velocity findings: all four finding strings now include w1/w2/w3 actuals
#     inline (e.g. "0 / 0 / 1 over last 30/60/90 days") for client context.
#
# v4.30 changes (GBP Strength point reallocation + velocity model rebuild):
#   Point reallocation within 100pt GBP Strength pool:
#     Primary category: 25 → 15 pts (binary signal, rarely differentiates)
#     Review velocity:  18 → 20 pts (see new model below)
#     Review count:     15 → 20 pts (stronger ranking signal than category)
#     Google rating:    12 → 15 pts (direct prominence signal)
#     All other signals unchanged. Total still 100 pts.
#   Velocity scoring model rebuilt — replaces ratio-based approach:
#     OLD: (reviews_last_30 / vertical_target) * 18, capped at 18
#     NEW: 30/60/90 day window consistency + minimum threshold model
#     Two components scored independently:
#       Consistency (11 pts): did review activity occur in each window?
#         3/3 windows = 11, 2/3 = 7, 1/3 = 3, 0/3 = 0
#       Minimum (9 pts): did each window meet the vertical floor?
#         Scored against ALL 3 windows (not just active ones)
#         3/3 = 9, 2/3 = 6, 1/3 = 2, 0/3 = 0
#     Vertical minimums (reviews/window):
#       restaurant=5, salon=2, medspa=2, gym=2,
#       personal_trainer=1, home_service=1, service=1
#     Rationale: Google measures review recency across trailing 30/60/90d
#     windows. Consistent monthly activity outranks volume spikes.
#     Validated against Julia Nicole Fitness scan data (Mar 2026):
#       W1=0, W2=0, W3=1 → 5/20 pts, CRITICAL finding. Correct.
#   Rules engine change required: collect reviews_w1/w2/w3 counts
#     in addition to reviews_last_30. See rules-engine notes.
#
# v4.29 changes (P1 reweight + quadrant restructure):
#   P1 weight formula updated:
#     OLD: GBP Strength 55% · MapPack 20% · On-Page 15% · Trust 10%
#     NEW: GBP Strength 25% · MapPack 50% · On-Page 15% · Trust 10%
#   Rationale: Search Visibility is the revenue signal — the effect.
#     GBP is the cause. Scoring the effect more heavily forces the score
#     to reflect what the business owner can actually verify in search
#     results. A Leader score on a functionally invisible business is
#     indefensible. Validated against Embody scan: old P1=55 (Leader),
#     new P1=40 (Invisible Closer) — correct.
#   Quadrant restructure:
#     "The Leader" renamed to "The Contender" at @50/50 threshold.
#     New "The Leader" designation added at @70/70 threshold.
#     Profile assignment: 70/70 check runs first; falls through to
#     standard @50 quadrant labels if not met.
#     Five profile copy blocks required in report generator.
#
# v4.28 changes (Run block — fix stale category keys):
#   Print block updated to match current categories dict structure:
#     'gbp' → 'gbp_strength' (merged in v4.25, weight 35%→55%)
#     'reviews' removed (merged into gbp_strength in v4.25)
#     'trust' DA/RD accessed via .get() for safety
#     'performance' → confirmed correct key (was never renamed)
#     'ux' → confirmed correct key (was never renamed)
#     Weight annotations updated throughout to match current model.
#
# v4.27 changes (KB key tagging — appendix integration):
#   Added optional "kb_key" field to findings dicts wherever a finding maps
#   to a KB entry in SEO-Knowledge-Base-v1_0.md. Keys follow the exact KB key
#   constants (e.g. "GBP_CATEGORY_PRIMARY", "REVIEW_VELOCITY_LOW", etc.).
#   Findings with no KB counterpart (good-state confirmations, data-unavailable
#   notices, or signals not in the KB) are left without a kb_key field.
#   Report generator collects all kb_key values from all category findings,
#   deduplicates, sorts by KB priority, and renders the appendix section.
#   No scoring logic changed — additive instrumentation only.
#
# v4.26 changes (Severity-tagged findings — deterministic dot colors):
#   All findings.append() calls converted from plain strings to dicts:
#     {"text": "...", "severity": "critical|warning|good"}
#   Severity assigned at source based on threshold state — not inferred from text.
#   Covers all scoring functions: score_gbp_strength, score_gbp,
#   score_search_visibility, score_onpage_relevance, score_domain_trust,
#   score_mobile_performance, score_conversion_infrastructure, score_mobile_ux.
#   Report generator infer_severity() updated to read dict severity directly.
#   Legacy string fallback retained in infer_severity() for safety.
#
# v4.25 changes:
#   score_gbp() + score_review_ecosystem() merged into score_gbp_strength().
#   P1 weights: GBP Strength 55% (was GBP 35% + Reviews 20%) · MapPack 20%
#   · On-Page 15% · Domain Trust 10%.
#   Clean 100pt pool (Primary cat 25 · Velocity 18 · Count 15 · Rating 12
#   · Response 10 · Posts 8 · Photos 5 · Completeness 4 · Secondary 3).
#   Yelp removed from scoring (findings-only). Review recency removed.
#   gbp_category_confirmed flag: bypasses token match when intake form
#   owner-stated GBP category is available.
#   score_review_ecosystem() retained as _DEPRECATED stub for reference.
#
# v4.24 changes:
#   Category 1.4 split into 1.4a On-Page Relevance and 1.4b Domain Trust.
#   score_trust_authority_onpage() retired — replaced by two new functions:
#
#   score_onpage_relevance() — Category 1.4a (15% of P1, 100pt clean budget):
#     Title tag:           15pts → 25pts (city match), 10pts (present+city), 10pts (present)
#     LocalBusiness schema: MOVED HERE from 1.1 GBP — 25pts
#     Service pages:       10pts → 25pts
#     H1:                  10pts → 15pts
#     City+keyword cooc:    5pts → 10pts
#     Meta description:    REMOVED → findings only
#     Social proof links:  REMOVED → findings only
#
#   score_domain_trust() — Category 1.4b (10% of P1, 100pt clean budget):
#     DA:               35pts/145 → 50pts/100
#     Referring domains: 20pts/145 → 30pts/100 (same vertical thresholds, scaled)
#     HTTPS:            10pts (unchanged)
#     Domain age:       10pts (unchanged in 100pt pool)
#
#   score_gbp() (1.1): Schema scoring block removed entirely.
#     Schema findings also removed from 1.1 — 1.4a owns all schema findings.
#     Max drops from 105pts → 90pts → normalized to 100.
#
#   score_review_ecosystem() (1.3):
#     Yelp review count (3pts): REMOVED from scoring → findings only when low.
#     Google/Yelp gap (6pts):   REMOVED from scoring → findings only when gap ≥ 0.5★.
#     Max drops from 100pts → 91pts → normalized to 100.
#
#   score_mobile_ux() (2.3):
#     Alt text: reduced 20pts → 10pts. Point tiers scaled proportionally.
#     CSS framework (5pts): REMOVED entirely — too indirect a proxy.
#     Max drops from 90pts → 75pts → normalized via round(points/75*100).
#     Docstring updated.
#
#   calculate_scores():
#     Calls score_onpage_relevance() and score_domain_trust() instead of
#       score_trust_authority_onpage().
#     P1 formula updated:
#       OLD: gbp×0.35 + mappack×0.25 + reviews×0.20 + trust×0.20
#       NEW: gbp×0.35 + mappack×0.20 + reviews×0.20 + onpage×0.15 + trust×0.10
#     Output categories dict: "trust" key split into "onpage" (15%) and "trust" (10%).
#     mappack weight string updated "25%" → "20%".
#     identify_primary_competitor() client_da still reads from trust_meta (da/rd
#       returned by score_domain_trust).
#
# v4.23 changes:
#   score_mobile_ux(): Removed heading hierarchy (H1) scoring block — 10 pts.
#     H1 is already scored in score_trust_authority_onpage() (P1.4). Removing
#     from P2.3 eliminates double-counting. Max points for P2.3 is now 90
#     (normalized to 100 via min(100, points)).
#     Docstring updated to reflect 6 signals, note added re: H1 placement.
#     contact_form_only → 10 pts + finding: "add self-scheduling link".
#     none → 0 pts + finding: "no booking path detected".
#   run_score() roadmap: booking finding split into contact_form_only vs none — 
#     different action titles and copy for each case.
#
# v4.21 changes (Three-step category validation, adjacent_sub, opportunity detection from SERP top3):
#
#   score_trust_authority() → score_trust_authority_onpage():
#     - Renamed to reflect expanded scope.
#     - Absorbs all signals from score_onpage_seo(): title tag, H1,
#       meta description, LocalBusiness schema, social proof links,
#       service page depth, city+keyword co-occurrence.
#     - These are Google relevance/prominence signals — correctly
#       placed in P1 alongside domain authority signals.
#     - Point budget expanded: DA(35) + RD(20) + HTTPS(10) + Age(10)
#       + Title(15) + H1(10) + Meta(10) + Schema(15) + Social(5)
#       + ServicePages(10) + CityCooc(5) = 145 pts → normalized to 100.
#     - Directory presence placeholder (25 pts) removed from budget
#       since it was always 0. Will be re-added when implemented.
#
#   score_onpage_seo() → DELETED:
#     - All signals absorbed into score_trust_authority_onpage().
#     - Category 2.3 On-Page SEO & Trust eliminated entirely.
#     - Social proof links (trust badges, review count on-site) removed
#       — weak signals for local business ICP, unreliable to detect.
#
#   score_mobile_ux() → renumbered Category 2.3 (was 2.4):
#     - No logic changes. Category number updated in docstring only.
#
#   calculate_scores() pillar weights updated:
#     P1: GBP 35% · MapPack 25% · Reviews 20% · Trust+OnPage 20%
#     P2: MobilePerf 45% · ConvInfra 35% · MobileUX 20%
#     onpage_score call removed. ux_score weight updated.
#
# v4.17 changes (Competitor Intelligence):
#
#   identify_primary_competitor():
#     - New function. Identifies the top competitor from dual-grid
#       scan top3 data. Aggregates #1 frequency across near me
#       keywords × origins × surfaces. Picks top by near me count,
#       breaks ties with city count.
#     - Builds competitor profile from DFS top3 fields: name, domain,
#       rating, review_count, gbp_category, frequency_near_me,
#       frequency_city, surface_positions by service.
#     - DA and referring_domains initialized to 0 — enriched by Moz
#       call in rules engine (future: rules engine passes comp domain
#       to fetch_moz() alongside client domain).
#     - WHY they're winning: data-driven decision tree comparing
#       comp vs. client reviews and DA. Four branches:
#       (1) both review + DA gap, (2) review-only gap,
#       (3) DA gap despite fewer reviews, (4) GBP/content signals.
#     - Output stored as scores["competitor_intel"] dict.
#     - Report generator (v6.3) consumes this in build_competitor_intel()
#       for Section 4b.
#
# v4.16 changes (Peak+Breadth scoring, 65/35 near me/city weighting):
#
#   score_search_visibility():
#     - Near me / city weighting changed from 50/50 to 65/35.
#       Rationale: research data (AEA, CDC/RAND, BrightLocal) confirms ~80% of
#       customers come from within 5mi for most local businesses. Near me
#       visibility is where revenue lives.
#     - Per-reach scoring model changed from pure average to Peak+Breadth:
#         peak_score   = best single keyword score for that reach type
#         breadth_score = avg across all keywords for that reach type
#         reach_score  = (peak × 0.70) + (breadth × 0.30)   # v4.69 (was 0.65/0.35)
#       Rationale: pure averaging crushes a business ranking #1 on its primary
#       keyword when its other keywords are zero. Peak+Breadth rewards depth
#       without ignoring breadth entirely.
#     - category_score formula:
#         OLD: round((local_reach + regional_reach) / 2)
#         NEW: round((near_me_score × 0.65) + (city_score × 0.35))
#       where near_me_score and city_score are each Peak+Breadth composites.
#     - Output: near_me_score and city_score stored separately in addition to
#       local_reach (avg) and regional_reach (avg) for diagnostic display.
#     - Diagnosis label unchanged — still based on avg gap for interpretability.
#     - Validated against La Rustica, Sapien, Doe Donuts dual-grid scan data.
#
# v4.15 changes (Moz DA, GBP Posts, Content Depth, Local/Regional Reach):
#
#   score_search_visibility():
#     - Rebuilt as Local Reach + Regional Reach split.
#     - keywords list (now list of dicts with "type": "near_me" | "city")
#       consumed directly from audit_data["keywords"].
#     - near_me keywords → Local Reach score (weighted across origins).
#     - city keywords    → Regional Reach score (weighted across origins).
#     - Category 1.2 score = (local_reach + regional_reach) / 2.
#     - Diagnosis label added: near me dominant / city stronger / balanced.
#     - Sub-scores stored: cat_1_2_local_reach, cat_1_2_regional_reach,
#       cat_1_2_diagnosis in output categories["mappack"].
#     - Competitor leaderboard logic unchanged (equal-weight, all keywords).
#
#   score_gbp():
#     - GBP post activity signal added (10 pts).
#     - Read from audit_data["gbp_posts"]["last_post_days_ago"].
#     - ≤7d=10, ≤30d=8, ≤90d=4, >90d/None=0.
#     - Photo signal reduced from 10 to 5 pts to keep total at 105 →
#       normalized to 100 via min(100, points).
#
#   score_domain() replaced by score_trust_authority():
#     - Renamed Category 1.4: "Domain Authority" → "Website Trust & Authority".
#     - New scoring model (100 pts):
#         DA              35 pts  (Moz domain_authority)
#         Referring domains 20 pts  (vertical-thresholded)
#         Directory presence 25 pts  (DEFERRED — placeholder 0 pending RD list)
#         HTTPS           10 pts
#         Domain age      10 pts  (reduced from 60 pts)
#     - Reads from audit_data["moz"]["client"].
#     - Competitor DA context stored in output for report use.
#
#   score_onpage_seo():
#     - Content depth signals added (+25 pts max → normalized to 100).
#     - Service page score (15 pts): % of owner services with dedicated page.
#     - City+keyword co-occurrence (10 pts): % of services with city+kw in body.
#     - Reads from audit_data["content_depth"].
#
#   calculate_scores():
#     - keywords, moz, gbp_posts, content_depth extracted from audit_data.
#     - score_domain() call replaced with score_trust_authority().
#     - score_search_visibility() call passes keywords list.
#     - score_gbp() call passes gbp_posts.
#     - score_onpage_seo() call passes content_depth.
#     - Output categories["domain"] renamed to categories["trust"].
#
# v4.14 changes (distance-weighted origin scoring):
#   _avg_origin_pts / _avg_lf_origin_pts replaced with
#   _weighted_origin_pts / _weighted_lf_origin_pts.
#   Scoring now weights each origin by 1/dist_mi (inverse distance).
#   Rationale: customer catchment data shows median diner travels 1.4mi,
#   average 3.1mi (AEA / Upside research). Equal-weight scoring across a
#   5mi trade area treats a 5mi-distant origin the same as a 0.8mi origin —
#   misrepresenting where the actual customer base lives.
#   Closer origins count proportionally more, reflecting commercial reality.
#   Falls back to equal-weight avg if dist_mi missing on any origin.
#   Validated impact on La Rustica: Category 1.2 score 11 → ~15.
#   Leaderboard (_build_competitor_leaderboard) unchanged — equal-weight
#   across the full trade area is correct for competitive landscape analysis.
#
# v4.13 changes:
#   - Stale "Labs hasn't confirmed" action card copy replaced with
#     avg-across-origins language (Labs retired v4.5)
#   - Stale Labs docstring references cleaned from retired functions
#
# v4.12 changes (category match — Option B):
#   score_search_visibility():
#     - Scoring method changed from best-position to avg-across-origins.
#       Best-position took the single strongest origin and ignored all others —
#       inflating the score by masking poor performance across the trade area.
#       Avg-across-origins scores each origin individually (None = 0 pts)
#       and averages across all 9 origins. This reflects true market coverage.
#     - Validated impact on La Rustica (Mar 12 scan):
#       best-position Category 1.2 = 33, avg-across-origins = 11.
#       P1 drops from 50 to ~44. The lower number is the honest one.
#     - Two new helpers added:
#         _avg_origin_pts(origins_dict, max_pts) — Maps scoring
#         _avg_lf_origin_pts(kw_lf_data, max_pts) — Local Finder scoring
#     - best_pos and lf_best retained in keyword_scores for display only
#       (shown in report keyword table — not used in scoring).
#     - Point allocation unchanged: Maps 50pts max / LF 35pts max / cap 85.
#
# v4.9 changes (Search Visibility — Local Finder + Keyword Volume):
#   score_search_visibility():
#     - Labs scoring logic removed (Labs stub retired v4.5 in rules engine —
#       dead code consuming empty dict every scan).
#     - Local Finder added as parallel scored signal alongside Maps.
#       Both surfaces use identical position scoring curve.
#       Maps: 50pts max per keyword.
#       Local Finder: 35pts max per keyword.
#       Per-keyword max: 85pts (unchanged from prior Labs-weighted model).
#     - Signature updated: accepts local_finder dict parallel to serp.
#     - _extract_lf_positions() helper added — mirrors _extract_positions()
#       for local_finder data shape.
#     - Scenario detection updated: S/A/C only (B retired with city-center Maps).
#     - keyword_scores dict expanded: maps_pts, lf_pts, lf_best_pos fields added.
#     - Competitor leaderboard computed from Local Finder top20 data:
#       aggregated across origins + keywords, deduplicated, sorted by
#       frequency × avg_position. Stored in output as competitor_leaderboard.
#   calculate_scores():
#     - local_finder extracted from audit_data.
#     - keyword_volume extracted from audit_data, passed through to output
#       (display-only — no scoring impact).
#     - score_search_visibility() call updated with local_finder arg.
#     - Output dict: keyword_volume added to mappack category block.
#     - total_labs_3pack reference removed (was referencing undefined variable).
#
# v4.8 changes (Mobile UX signal expansion):
#   score_mobile_ux(): Signature updated — now accepts html + psi_accessibility.
#     Three signal changes:
#       Viewport: source switches from html["viewport"] (HTML parse) to
#         psi_accessibility["psi_a11y_viewport"] (PSI Lighthouse audit).
#         PSI version checks for user-scalable=no violation; HTML parse
#         only checks for tag presence. Falls back to html["viewport"]
#         if PSI accessibility data unavailable.
#       Color contrast: replaces always-0/manual flag with real
#         psi_accessibility["psi_a11y_color_contrast"] score.
#         1.0 = pass (20pts), 0.0 = fail (0pts + finding), None = 0pts + finding.
#       Target size: new signal. psi_accessibility["psi_a11y_target_size"].
#         1.0 = pass (10pts), 0.0 = fail (0pts + finding), None = neutral (5pts).
#     CSS framework: new signal from html["css_framework_detected"].
#         True = 5pts (positive proxy for responsive design intent).
#     Point rebalancing (total still 100):
#       Viewport          20pts (unchanged)
#       Color contrast    20pts (now real data — was always 0)
#       Target size       10pts (new)
#       CSS framework      5pts (new)
#       WebP              15pts (unchanged)
#       Heading hierarchy 10pts (was 15pts)
#       Alt text          20pts (was 30pts)
#   run_score(): score_mobile_ux() call updated to pass psi_accessibility.
#
# v4.7 changes (Mobile Performance model rebuilt):
#   score_mobile_performance(): Complete rewrite.
#     Mobile PSI score retired — simulation artifact on throttled 4G /
#     mid-tier Android produces numbers unrepresentative of real visitors.
#     LCP retired alongside mobile PSI for same reason.
#     CrUX LCP override logic removed (no longer needed).
#     New scoring model (100pts):
#       Desktop PSI  30pts — reliable real-world site quality proxy
#       TTFB         20pts — device-agnostic server/hosting speed
#       CLS          25pts — layout shift affects all devices
#       TBT          15pts — interactivity affects all devices
#       Unused JS/CSS 10pts — concrete bloat signal, device-agnostic
#     data_source return value updated to "Desktop PSI + TTFB".
#     Findings rewritten to match new signals — plain English,
#     benchmark-referenced, owner-actionable.
#     crux parameter retained in signature for backward compatibility
#     but no longer consumed.
#
# v4.6 changes (Mar 2026):
#   score_onpage_seo(): Social proof — real social link detection replaces
#     fabricated 5/10 partial credit. Detects Instagram, Facebook, Yelp,
#     TikTok, Twitter/X, Google Maps links in HTML. 0pts if none, 10pts if any.
#     Requires social_links field in html dict (supplied by rules engine v4.8+).
#   score_mobile_ux(): Three updates —
#     WebP: multi-method detection (src extension + <picture> tag + inline CSS).
#       Consumes webp_by_extension, webp_by_picture, webp_by_css from html dict.
#     Alt text: real coverage scoring replaces fabricated 15pt credit.
#       Consumes alt_text_total_images + alt_text_with_alt from html dict.
#       Tiers: 90%+ = 30pts, 50–89% = 18pts, <50% = 8pts, 0% = 0pts.
#       Quality pro tip lives in report template only — not in scoring engine.
#     Docstring updated to reflect actual point allocation.
#
# v4.5 changes (Mar 2026):
#   score_search_visibility() updated to consume v4.4 trade area serp
#   structure. Previous single-origin fields (maps_local_pos, maps_city_pos,
#   local_origin_used) replaced by:
#     _extract_positions() helper derives home_pos + best_pos from
#     serp[kw]["origins"][zcta]["pos"] across all trade area origins.
#     home_pos = closest origin (dist_mi index 0)
#     best_pos = lowest position number seen across all origins
#   Backward compatible: falls back to flat structure if "origins" absent.
#   build_priority_actions() updated to use _extract_positions().
#
# v4.4 changes (Mar 2026):
#   Photo scoring simplified — single universal scale replaces
#   vertical-aware thresholds. Data-backed threshold is 15 photos
#   for engagement lift. Scale:
#     15+  → 10 pts (full credit)
#     10–14 →  5 pts
#     5–9   →  3 pts
#     0–4   →  0 pts + flag as immediate fix
#   photo_count now sourced from DFS my_business_info total_photos
#   (accurate count vs. Places API cap of 10).
#
# v4.3 changes (Mar 2026):
#   Category 1.1 GBP redesigned — now scores profile optimization only:
#     primary category accuracy (35), secondary categories (20),
#     profile completeness (20), schema (15), photo count (10).
#     Google rating + review count moved to Category 1.3.
#
#   Category 1.3 Review Ecosystem redesigned — now scores full reputation:
#     Google review count (28), Google rating (18), review velocity (18),
#     review recency (10), owner response rate (10), Yelp rating (7),
#     Yelp count (3), Google/Yelp gap (6).
#
# Input:  audit_data dict (from rules-engine-v4_15.py)
# Output: scores dict with P1, P2, profile, category breakdowns
# ════════════════════════════════════════════════════════════════


# ── TIER UTILITY ─────────────────────────────────────────────────

def get_tier(score):
    if score >= 75: return ("Leading",     "#4ade80")
    if score >= 50: return ("Competitive", "#60a5fa")
    if score >= 25: return ("Needs Work",  "#f59e0b")
    return              ("Critical",     "#f87171")



# ════════════════════════════════════════════════════════════════
# SCHEMA MAPPING -- GBP primary_type to schema.org type  [v4.33]
# ════════════════════════════════════════════════════════════════

GBP_TO_SCHEMA = {
    "restaurant": "Restaurant", "american_restaurant": "Restaurant",
    "italian_restaurant": "Restaurant", "mexican_restaurant": "Restaurant",
    "chinese_restaurant": "Restaurant", "japanese_restaurant": "Restaurant",
    "thai_restaurant": "Restaurant", "indian_restaurant": "Restaurant",
    "french_restaurant": "Restaurant", "mediterranean_restaurant": "Restaurant",
    "seafood_restaurant": "Restaurant", "steak_house": "Restaurant",
    "sushi_restaurant": "Restaurant", "pizza_restaurant": "Restaurant",
    "ramen_restaurant": "Restaurant", "vegetarian_restaurant": "Restaurant",
    "vegan_restaurant": "Restaurant", "brunch_restaurant": "Restaurant",
    "breakfast_restaurant": "Restaurant", "sandwich_shop": "Restaurant",
    "fast_food_restaurant": "FastFoodRestaurant",
    "hamburger_restaurant": "FastFoodRestaurant",
    "bakery": "Bakery", "donut_shop": "Bakery", "bagel_shop": "Bakery",
    "cafe": "CafeOrCoffeeShop", "coffee_shop": "CafeOrCoffeeShop",
    "tea_house": "CafeOrCoffeeShop", "bar": "BarOrPub", "pub": "BarOrPub",
    "wine_bar": "BarOrPub", "cocktail_bar": "BarOrPub",
    "sports_bar": "BarOrPub", "night_club": "BarOrPub",
    "brewery": "Brewery", "winery": "Winery", "distillery": "LocalBusiness",
    "food_truck": "Restaurant", "ice_cream_shop": "Restaurant",
    "juice_shop": "CafeOrCoffeeShop", "bubble_tea_store": "CafeOrCoffeeShop",
    "hair_salon": "HairSalon", "hair_care": "HairSalon",
    "barber_shop": "HairSalon", "nail_salon": "NailSalon",
    "beauty_salon": "BeautySalon", "day_spa": "DaySpa", "spa": "DaySpa",
    "massage_therapist": "HealthAndBeautyBusiness",
    "massage_spa": "HealthAndBeautyBusiness",
    "tanning_studio": "HealthAndBeautyBusiness",
    "waxing_hair_removal_service": "HealthAndBeautyBusiness",
    "eyebrow_bar": "BeautySalon", "eyelash_salon": "BeautySalon",
    "makeup_artist": "BeautySalon", "tattoo_shop": "HealthAndBeautyBusiness",
    "piercing_shop": "HealthAndBeautyBusiness",
    "medical_spa": "MedSpa", "med_spa": "MedSpa",
    "skin_care_clinic": "MedSpa", "dermatologist": "Physician",
    "plastic_surgeon": "Physician", "doctor": "Physician",
    "dentist": "Dentist", "orthodontist": "Dentist", "oral_surgeon": "Dentist",
    "optometrist": "MedicalBusiness", "chiropractor": "MedicalBusiness",
    "physical_therapist": "MedicalBusiness", "acupuncturist": "MedicalBusiness",
    "mental_health_clinic": "MedicalBusiness",
    "urgent_care_center": "MedicalBusiness", "hospital": "MedicalBusiness",
    "pharmacy": "MedicalBusiness", "veterinarian": "VeterinaryCare",
    "gym": "ExerciseGym", "fitness_center": "ExerciseGym",
    "health_club": "HealthClub", "yoga_studio": "SportsActivityLocation",
    "pilates_studio": "SportsActivityLocation",
    "cycling_studio": "SportsActivityLocation",
    "dance_studio": "SportsActivityLocation",
    "martial_arts_school": "SportsActivityLocation",
    "boxing_gym": "SportsActivityLocation", "crossfit_gym": "ExerciseGym",
    "personal_trainer": "LocalBusiness",
    "sports_club": "SportsActivityLocation",
    "swimming_pool": "SportsActivityLocation",
    "golf_course": "SportsActivityLocation",
    "tennis_court": "SportsActivityLocation",
    "climbing_gym": "SportsActivityLocation",
    "plumber": "Plumber", "electrician": "Electrician",
    "hvac_contractor": "HVACBusiness", "roofing_contractor": "RoofingContractor",
    "locksmith": "LocksmithBusiness", "moving_company": "MovingCompany",
    "house_painter": "HousePainter", "general_contractor": "GeneralContractor",
    "landscaper": "HomeAndConstructionBusiness",
    "lawn_care_service": "HomeAndConstructionBusiness",
    "cleaning_service": "HomeAndConstructionBusiness",
    "pest_control_service": "HomeAndConstructionBusiness",
    "window_cleaning_service": "HomeAndConstructionBusiness",
    "pool_cleaning_service": "HomeAndConstructionBusiness",
    "carpet_cleaning_service": "HomeAndConstructionBusiness",
    "handyman": "HomeAndConstructionBusiness",
    "interior_designer": "HomeAndConstructionBusiness",
    "flooring_store": "HomeAndConstructionBusiness",
    "car_dealer": "AutoDealer", "used_car_dealer": "AutoDealer",
    "auto_repair_shop": "AutoRepair", "car_wash": "AutoRepair",
    "tire_shop": "AutoRepair", "oil_change_service": "AutoRepair",
    "pet_store": "PetStore", "dog_groomer": "HealthAndBeautyBusiness",
    "pet_groomer": "HealthAndBeautyBusiness", "dog_trainer": "LocalBusiness",
    "kennel": "LocalBusiness", "animal_shelter": "AnimalShelter",
    "clothing_store": "ClothingStore", "shoe_store": "ClothingStore",
    "jewelry_store": "Store", "book_store": "Store", "gift_shop": "Store",
    "florist": "Store", "furniture_store": "FurnitureStore",
    "electronics_store": "Store", "toy_store": "Store",
    "sporting_goods_store": "Store",
    "accounting": "ProfessionalService", "lawyer": "ProfessionalService",
    "real_estate_agency": "ProfessionalService",
    "insurance_agency": "ProfessionalService",
    "financial_planner": "ProfessionalService",
    "marketing_agency": "ProfessionalService",
    "photographer": "ProfessionalService", "travel_agency": "ProfessionalService",
    "printing_service": "ProfessionalService",
    "tutoring_service": "ProfessionalService",
}

VALID_LOCAL_SCHEMA_TYPES = {
    "LocalBusiness", "ProfessionalService",
    "Restaurant", "FastFoodRestaurant", "Bakery", "CafeOrCoffeeShop",
    "BarOrPub", "Brewery", "Winery",
    "BeautySalon", "HairSalon", "NailSalon", "DaySpa", "HealthAndBeautyBusiness",
    "MedicalBusiness", "MedSpa", "Dentist", "Physician",
    "ExerciseGym", "HealthClub", "SportsActivityLocation",
    "HomeAndConstructionBusiness", "Plumber", "Electrician", "HVACBusiness",
    "RoofingContractor", "LocksmithBusiness", "MovingCompany",
    "HousePainter", "GeneralContractor",
    "AutoDealer", "AutoRepair",
    "AnimalShelter", "VeterinaryCare", "PetStore",
    "Store", "ClothingStore", "FurnitureStore",
}


def get_recommended_schema(primary_type):
    """Returns recommended schema.org type for a GBP primary_type string."""
    if not primary_type:
        return "LocalBusiness"
    normalized = primary_type.lower().strip().replace(" ", "_").replace("-", "_")
    return GBP_TO_SCHEMA.get(normalized, "LocalBusiness")


def evaluate_schema(primary_type, detected_schema_types):
    """
    Evaluates LocalBusiness schema presence against GBP primary_type.

    Returns dict with: status, score_pts, recommended, detected, finding.

    Status / points:
      present  = 25 pts  LBS detected (any valid local type)
      org_only =  8 pts  Organization only -- neutral but no local signals
      missing  =  0 pts  No schema at all

    Scoring philosophy: LBS present = full credit regardless of type match.
    Finding always shows detected type vs GBP category side by side so the
    owner can verify alignment. No scoring penalty for mismatch -- matching
    logic is unreliable at scale across 141 GBP types.
    """
    recommended    = get_recommended_schema(primary_type)
    gbp_label      = primary_type.replace("_", " ").title() if primary_type else "Unknown"
    detected_local = [t for t in (detected_schema_types or []) if t in VALID_LOCAL_SCHEMA_TYPES]
    has_org        = "Organization" in (detected_schema_types or [])

    if not detected_local and not has_org:
        return {
            "status":      "missing",
            "score_pts":   0,
            "recommended": recommended,
            "detected":    None,
            "finding": {
                "text": (
                    f"No LocalBusiness schema detected. Your GBP category is {gbp_label} -- "
                    f"add {recommended} schema to match. Schema tells Google exactly what "
                    f"your business is and where it operates. Under 30 minutes to implement."
                ),
                "severity": "critical",
                "kb_key":   "LBS_MISSING",
            },
        }

    if not detected_local and has_org:
        return {
            "status":      "org_only",
            "score_pts":   8,
            "recommended": recommended,
            "detected":    "Organization",
            "finding": {
                "text": (
                    f"Organization schema detected but no LocalBusiness type. "
                    f"Your GBP category is {gbp_label} -- add {recommended} schema to match. "
                    f"Organization carries no local entity signals: no address, no geo, "
                    f"no service area. Google cannot read it for Map Pack eligibility."
                ),
                "severity": "warning",
                "kb_key":   "LBS_MISSING",
            },
        }

    detected_type = detected_local[0]
    return {
        "status":      "present",
        "score_pts":   25,
        "recommended": recommended,
        "detected":    detected_type,
        "finding": {
            "text": (
                f"{detected_type} schema detected. Your GBP category is {gbp_label} -- "
                f"verify these align. Schema type and GBP category are two of Google's "
                f"primary entity confirmation sources; a mismatch between them sends "
                f"contradictory signals about what kind of business you are."
            ),
            "severity": "good",
        },
    }

# ════════════════════════════════════════════════════════════════
# PILLAR 1 SCORING
# ════════════════════════════════════════════════════════════════

def score_gbp_strength(gbp, gbp_posts=None, owner_services=None,
                       vertical="service", serp=None):
    """
    Category 1.1 — GBP Strength (20% of P1)  [v4.66]

    Merged replacement for score_gbp (35%) + score_review_ecosystem (20%).
    Clean 100-point pool — no normalization required.

    Primary category     20 pts  (10 = presence, 10 = competitive fit)
    Review velocity      20 pts  (30/60/90d consistency + minimum model)
    Review count         20 pts  (vertical-aware thresholds)
    Google rating        10 pts
    Secondary categories 10 pts
    Response rate        10 pts  (bumped from 5 — growing prominence signal)
    Photos                5 pts
    GBP posts             5 pts
    ─────────────────────────────
    Total               100 pts  (exact — no cap needed)

    Yelp signals removed from scoring (findings-only where relevant).
    Review recency removed — velocity already captures recency signal.
    Profile completeness removed — table-stakes signal, hidden by Google.
    """
    points   = 0
    findings = []

    # ── Primary category (20 pts) ────────────────────────────────
    # 10pts: category present (binary — guaranteed from intake)
    # 10pts: category fit vs. competitive set
    #   Fit scoring uses client's share of competitor top-3 category tally:
    #   - Market fragmented (no single category >30% of tally) → 10pts, no flag
    #   - Client category ≥15% of tally → 10pts, no flag
    #   - Client category <15% of tally, market not fragmented → 4pts + opportunity card
    #   - Category generic (in _GENERIC_PRIMARY) → 0pts fit, advisory finding
    #
    # Branch 1 (generic advisory) and Branch 2 (opportunity card) are
    # independent — both can fire on the same report.
    _GENERIC_PRIMARY = {
        "restaurant", "food", "establishment", "point_of_interest",
        "store", "bar", "cafe", "meal_delivery", "meal_takeaway",
        "food_and_drink", "local_food_and_drink",
    }
    _GENERIC_COMP = {
        "restaurant", "food", "establishment", "store", "bar",
        "cafe", "meal_delivery", "meal_takeaway",
        "food_and_drink", "local_food_and_drink", "point_of_interest",
    }

    primary_cat = (gbp.get("primary_category") or "").lower().replace(" ", "_")
    cat_pts     = 0
    cat_reason  = "no_primary"

    if not primary_cat:
        findings.append({"text": "No primary GBP category detected. Primary category is the strongest relevance signal in local search — set it immediately.", "severity": "critical", "kb_key": "GBP_CATEGORY_PRIMARY"})
    else:
        cat_pts   += 10
        cat_reason = "has_category"
        if primary_cat in _GENERIC_PRIMARY:
            # Branch 1 — generic advisory, 0pts fit
            cat_reason = "generic"
            findings.append({"text": f"Primary category '{primary_cat.replace('_',' ').title()}' is too broad. A more specific category significantly improves Map Pack relevance — log into Google Business Profile and select the most specific option available.", "severity": "warning", "kb_key": "GBP_CATEGORY_PRIMARY"})

    points += cat_pts

    # ── Competitor category tally + fit scoring ───────────────────
    # Produces top-5 leaderboard with near-me/city splits for report display.
    # Client match uses token overlap: any tally key that is a substring of
    # primary_cat or vice versa counts as the client's category in the tally.
    # This handles DFS truncation (e.g. "grill" matching "bar_and_grill").
    category_opportunity = None
    fit_pts = 0

    if primary_cat and serp:
        from collections import Counter

        tally_all  = Counter()
        tally_nm   = Counter()
        tally_city = Counter()

        for kw, kw_data in serp.items():
            kw_type = kw_data.get("type", "")
            for zcta, od in kw_data.get("origins", {}).items():
                for item in od.get("top3", []):
                    cat = (item.get("category") or "").strip().lower()
                    if cat and (cat not in _GENERIC_COMP or cat == primary_cat):
                        tally_all[cat] += 1
                        if kw_type == "near_me":
                            tally_nm[cat] += 1
                        else:
                            tally_city[cat] += 1

        def _client_match(cat_key, primary):
            # Three-step match after normalization (v4.50).
            # Replaces v4.44 exact-only match which failed for all cuisine/service
            # types where DFS Maps SERP returns short display labels ("japanese")
            # vs full primary_type strings ("japanese_restaurant").
            # Validated 52/52 business types across F&B, Beauty, Fitness, Service.
            ck = cat_key.lower().replace(" ", "_").replace("-", "_")
            pm = primary.lower().replace(" ", "_").replace("-", "_")
            # Step 1: exact match
            if ck == pm:
                return True
            # Step 2: underscore-stripped exact (steakhouse ↔ steak_house)
            if ck.replace("_", "") == pm.replace("_", ""):
                return True
            # Step 3: word-boundary prefix — prevents "bar" matching "barbershop"
            if pm.startswith(ck) and (len(pm) == len(ck) or pm[len(ck)] == "_"):
                return True
            return False

        def _build_leaderboard(tally, primary, top_n=5):
            total = sum(tally.values())
            rows  = []
            for cat, count in tally.most_common(top_n):
                pct       = round(count / total * 100) if total else 0
                is_client = _client_match(cat, primary)
                label     = cat.replace("_", " ").replace("-", " ").title()
                rows.append({
                    "category":  cat,
                    "label":     label,
                    "count":     count,
                    "pct":       pct,
                    "is_client": is_client,
                })
            return rows, total

        if not tally_all:
            fit_pts = 10
            category_opportunity = None
        else:
            leaderboard_all,  total_all  = _build_leaderboard(tally_all,  primary_cat)
            leaderboard_nm,   total_nm   = _build_leaderboard(tally_nm,   primary_cat)
            leaderboard_city, total_city = _build_leaderboard(tally_city, primary_cat)

            client_count = sum(
                count for cat, count in tally_all.items()
                if _client_match(cat, primary_cat)
            )
            client_pct    = round(client_count / total_all * 100) if total_all else 0
            top_comp_cat, top_comp_count = tally_all.most_common(1)[0]
            top_pct       = round(top_comp_count / total_all * 100) if total_all else 0
            market_fragmented = top_pct <= 30
            primary_clean = (gbp.get("primary_type") or primary_cat).replace("_", " ").title()

            client_in_board = any(r["is_client"] for r in leaderboard_all)

            if market_fragmented or client_pct >= 15:
                fit_pts    = 10
                cat_reason = "aligned"
            else:
                fit_pts    = 4
                cat_reason = "misaligned"

            # Finding: client absent from top-5 leaderboard entirely
            if not client_in_board:
                findings.append({
                    "text": (
                        f"Your primary GBP category \"{primary_clean}\" doesn't appear in the "
                        f"top 5 competitor categories across your scanned trade area — "
                        f"meaning competitors in other categories are winning the Map Pack slots "
                        f"your keywords should be capturing. Confirm your GBP category is "
                        f"correctly set to the most specific option available."
                    ),
                    "severity": "warning",
                    "kb_key": "GBP_CATEGORY_PRIMARY",
                })

            # Finding: client in board but dominant gap ≥ 30pts
            elif client_in_board and not market_fragmented and client_pct < 15:
                top_cat_clean = leaderboard_all[0]["category"].replace("_", " ").title() if leaderboard_all else ""
                dominant_gap  = top_pct - client_pct
                if dominant_gap >= 30:
                    findings.append({
                        "text": (
                            f"Your primary GBP category \"{primary_clean}\" represents only {client_pct}% "
                            f"of competitor slots while \"{top_cat_clean}\" dominates at {top_pct}%. "
                            f"If your business legitimately qualifies for \"{top_cat_clean}\" as a primary "
                            f"GBP category, switching may improve Map Pack visibility for your core keywords."
                        ),
                        "severity": "warning",
                        "kb_key": "GBP_CATEGORY_PRIMARY",
                    })

            category_opportunity = {
                "primary_clean":     primary_clean,
                "client_pct":        client_pct,
                "client_in_board":   client_in_board,
                "market_fragmented": market_fragmented,
                "top_pct":           top_pct,
                "leaderboard_all":   leaderboard_all,
                "leaderboard_nm":    leaderboard_nm,
                "leaderboard_city":  leaderboard_city,
                "total_all":         total_all,
                "total_nm":          total_nm,
                "total_city":        total_city,
            }

        points += fit_pts

    # ── Review velocity (20 pts) — consistency + minimum model ───
    # Scored across three discrete 30-day windows (not cumulative).
    # w1 = days 1–30 (most recent), w2 = days 31–60, w3 = days 61–90
    # Consistency (11 pts): activity in each window (any review ≥ 1)
    #   3/3=11, 2/3=7, 1/3=3, 0/3=0
    # Minimum (9 pts): each window meets vertical floor
    #   3/3=9, 2/3=6, 1/3=2, 0/3=0
    VELOCITY_MINIMUMS = {
        "restaurant":          5,
        "salon":               2,
        "medspa":              2,
        "gym":                 2,
        "personal_trainer":    1,
        "home_service":        1,
        "home_trade":          2,   # TODO: calibrate after 3-5 home trade scans — v1 estimate
        "professional_service": 1,  # TODO: calibrate after 3-5 prof service scans — v1 estimate
        "real_estate":         2,   # TODO: calibrate after 3-5 real estate scans — v1 estimate
        "service":             1,
        # TODO: calibrate "fitness" after 3-5 real fitness scans — using "service" fallback (1/mo) intentionally
    }
    CONSISTENCY_PTS = {3: 11, 2: 7, 1: 3, 0: 0}
    MINIMUM_PTS     = {3: 9,  2: 6, 1: 2, 0: 0}

    vel_min   = VELOCITY_MINIMUMS.get(vertical, 1)
    w1        = gbp.get("reviews_w1") or 0
    w2        = gbp.get("reviews_w2") or 0
    w3        = gbp.get("reviews_w3") or 0
    vel_null  = (gbp.get("reviews_w1") is None and
                 gbp.get("reviews_w2") is None and
                 gbp.get("reviews_w3") is None)

    if vel_null:
        findings.append({"text": "Review velocity data unavailable — DFS Reviews API not yet collected.", "severity": "warning"})
        vel_pts = 0
    else:
        w1_active = w1 >= 1
        w2_active = w2 >= 1
        w3_active = w3 >= 1
        consistency_score = sum([w1_active, w2_active, w3_active])

        w1_min = w1 >= vel_min
        w2_min = w2 >= vel_min
        w3_min = w3 >= vel_min
        min_score = sum([w1_min, w2_min, w3_min])

        cons_pts = CONSISTENCY_PTS[consistency_score]
        min_pts  = MINIMUM_PTS[min_score]
        vel_pts  = cons_pts + min_pts
        points  += vel_pts

        if consistency_score == 0:
            findings.append({"text": f"No new reviews across any of the past three 30-day windows (0 / 0 / 0 for days 1–30 / 31–60 / 61–90). Google treats an inactive review profile as a signal the business may no longer be operating.", "severity": "critical", "kb_key": "REVIEW_VELOCITY_LOW"})
        elif consistency_score == 1:
            findings.append({"text": f"Reviews in only 1 of the past three 30-day windows — sporadic activity ({w1} / {w2} / {w3} for days 1–30 / 31–60 / 61–90). Google rewards consistent monthly review flow, not occasional spikes.", "severity": "critical", "kb_key": "REVIEW_VELOCITY_LOW"})
        elif consistency_score == 2:
            findings.append({"text": f"Reviews missing in 1 of the past three 30-day windows ({w1} / {w2} / {w3} for days 1–30 / 31–60 / 61–90). A steady monthly cadence is a stronger Google signal than high volume with gaps.", "severity": "warning", "kb_key": "REVIEW_VELOCITY_LOW"})
        elif min_score < 3:
            findings.append({"text": f"Consistent review activity across all three windows ({w1} / {w2} / {w3} for days 1–30 / 31–60 / 61–90), but some windows fell below the {vel_min}+ minimum for this vertical. A structured ask-at-checkout process closes this gap.", "severity": "warning", "kb_key": "REVIEW_VELOCITY_LOW"})

    # ── Review count (20 pts) — vertical-aware ───────────────────
    COUNT_THRESHOLDS = {
        "restaurant":          (800, 300, 150),
        "medspa":              (250, 100,  50),
        "salon":               (300, 150,  75),
        "service":             (200,  80,  40),
        "home_trade":          (150,  60,  25),   # TODO: calibrate after 3-5 home trade scans — v1 estimate
        "professional_service": (75,  30,  15),   # TODO: calibrate after 3-5 prof service scans — v1 estimate
        "real_estate":         (200,  80,  40),   # TODO: calibrate after 3-5 real estate scans — mirrors service default
        # TODO: calibrate "fitness" after 3-5 real fitness scans — using "service" fallback intentionally
    }
    r_lead, r_comp, r_nw = COUNT_THRESHOLDS.get(vertical, COUNT_THRESHOLDS["service"])
    g_rev = gbp.get("review_count", 0) or 0

    if g_rev >= r_lead:
        points += 20
        # Leading — no finding
    elif g_rev >= r_comp:
        points += 14
        findings.append({"text": f"{g_rev} Google reviews — competitive range, but {r_lead}+ is the leading threshold for this market. Consistent review generation keeps you moving in the right direction.", "severity": "warning", "kb_key": "REVIEW_COUNT_LOW"})
    elif g_rev >= r_nw:
        points += 8
        findings.append({"text": f"{g_rev} Google reviews — below the competitive threshold of {r_comp}+ for this vertical. Review volume is one of Google's top three local ranking signals.", "severity": "warning", "kb_key": "REVIEW_COUNT_LOW"})
    else:
        points += 2
        findings.append({"text": f"{g_rev} Google reviews — below the {r_nw}+ threshold for this vertical. Review volume is one of the strongest local ranking signals.", "severity": "critical", "kb_key": "REVIEW_COUNT_LOW"})

    # ── Google rating (10 pts) ───────────────────────────────────
    g_rating = gbp.get("rating", 0) or 0
    if   g_rating >= 4.8: points += 10
    elif g_rating >= 4.5: points += 7
    elif g_rating >= 4.3: points += 4
    else:
        findings.append({"text": f"Google rating {g_rating}★ — below 4.3★ actively suppresses Map Pack eligibility and click-through from search results.", "severity": "critical", "kb_key": "REVIEW_RATING_LOW"})

    # ── Response rate (10 pts) ───────────────────────────────────
    resp = gbp.get("owner_response_rate")
    if resp is None:
        pass
    elif resp >= 0.75:
        points += 10
    elif resp >= 0.50:
        points += 6
        findings.append({"text": f"Responding to {round(resp*100)}% of reviews — strong, but 75%+ is the benchmark. Response rate is a confirmed Google engagement signal.", "severity": "warning", "kb_key": "REVIEW_RESPONSE_RATE_LOW"})
    elif resp >= 0.25:
        points += 3
        findings.append({"text": f"Only {round(resp*100)}% of reviews have an owner response. Responding to reviews is free, takes minutes, and is a confirmed Google engagement signal.", "severity": "warning", "kb_key": "REVIEW_RESPONSE_RATE_LOW"})
    else:
        findings.append({"text": f"Owner response rate critically low ({round(resp*100)}%). Unanswered reviews signal an unengaged business to Google and to potential customers reading them.", "severity": "critical", "kb_key": "REVIEW_RESPONSE_RATE_LOW"})

    # ── GBP posts (5 pts) ────────────────────────────────────────
    posts      = gbp_posts or {}
    days_since = posts.get("last_post_days_ago")
    post_count = posts.get("post_count", 0)

    if post_count == 0 or days_since is None:
        post_pts = 0
        findings.append({"text": "No GBP posts detected. Weekly posts signal active listing management to Google — a factor in city-modifier rankings. 10 minutes/week, costs nothing.", "severity": "critical", "kb_key": "GBP_POSTS_MISSING"})
    elif days_since <= 7:
        post_pts = 5
    elif days_since <= 30:
        post_pts = 4
    elif days_since <= 90:
        post_pts = 2
        findings.append({"text": f"Last GBP post was {days_since} days ago. Posting at least monthly maintains the active listing signal Google factors into local rankings.", "severity": "warning", "kb_key": "GBP_POSTS_MISSING"})
    else:
        post_pts = 0
        findings.append({"text": f"Last GBP post was {days_since} days ago — listing appears inactive. Resume weekly or monthly GBP posts.", "severity": "critical", "kb_key": "GBP_POSTS_MISSING"})
    points += post_pts

    # ── Photos (5 pts) ──────────────────────────────────────────
    photo_count = gbp.get("photo_count")
    if photo_count is None:
        pass
    elif photo_count >= 15:
        points += 5
    elif photo_count >= 10:
        points += 3
        findings.append({"text": f"{photo_count} GBP photos — add {15 - photo_count} more to reach the 15-photo engagement threshold.", "severity": "warning", "kb_key": "GBP_PHOTOS_LOW"})
    elif photo_count >= 5:
        points += 1
        findings.append({"text": f"{photo_count} GBP photos — below the 15-photo benchmark. Add interior, exterior, and service photos.", "severity": "warning", "kb_key": "GBP_PHOTOS_LOW"})
    else:
        findings.append({"text": f'{"No" if photo_count == 0 else str(photo_count)} GBP photos — add at least 15 covering interior, exterior, and services.', "severity": "critical", "kb_key": "GBP_PHOTOS_LOW"})

    # ── Secondary categories (10 pts) ───────────────────────────
    sec_count = len(gbp.get("secondary_categories", []) or [])
    if sec_count >= 3:
        points += 10
        # Leading — no finding
    elif sec_count >= 1:
        points += 4
        needed = 3 - sec_count
        cat_word = "category" if sec_count == 1 else "categories"
        findings.append({"text": f"{sec_count} secondary {cat_word} set — add {needed} more to reach the 3+ threshold. Each additional category expands the search queries your GBP is eligible to rank for.", "severity": "warning", "kb_key": "GBP_SECONDARY_CATEGORIES"})
    else:
        findings.append({"text": "No secondary GBP categories set. Adding 3+ secondary categories expands your ranking surface across more search queries.", "severity": "warning", "kb_key": "GBP_SECONDARY_CATEGORIES"})

    # ── Signal points dict ───────────────────────────────────────
    # Recalculate velocity earned for signal_pts reporting
    _vel_min  = VELOCITY_MINIMUMS.get(vertical, 1)
    _w1       = gbp.get("reviews_w1") or 0
    _w2       = gbp.get("reviews_w2") or 0
    _w3       = gbp.get("reviews_w3") or 0
    if gbp.get("reviews_w1") is None and gbp.get("reviews_w2") is None and gbp.get("reviews_w3") is None:
        vel_e = 0
    else:
        _cons = sum([_w1>=1, _w2>=1, _w3>=1])
        _mins = sum([_w1>=_vel_min, _w2>=_vel_min, _w3>=_vel_min])
        vel_e = CONSISTENCY_PTS[_cons] + MINIMUM_PTS[_mins]
    g_rev_v     = gbp.get("review_count", 0) or 0
    # Use r_lead/r_comp/r_nw already computed above via COUNT_THRESHOLDS (all verticals covered)
    rct_e       = 20 if g_rev_v>=r_lead else 14 if g_rev_v>=r_comp else 8 if g_rev_v>=r_nw else 2
    g_rat_v     = gbp.get("rating", 0) or 0
    rat_e       = 10 if g_rat_v>=4.8 else 7 if g_rat_v>=4.5 else 4 if g_rat_v>=4.3 else 0
    resp_v      = gbp.get("owner_response_rate")
    resp_e      = 0 if resp_v is None else 10 if resp_v>=0.75 else 6 if resp_v>=0.50 else 3 if resp_v>=0.25 else 0
    photo_v     = gbp.get("photo_count") or 0
    photo_e     = 5 if photo_v>=15 else 3 if photo_v>=10 else 1 if photo_v>=5 else 0
    sec_v       = len(gbp.get("secondary_categories", []) or [])
    sec_e       = 10 if sec_v>=3 else 4 if sec_v>=1 else 0

    signal_pts = {
        "primary_category":  {"earned": cat_pts + fit_pts, "max": 20},
        "review_velocity":   {"earned": vel_e,             "max": 20},
        "review_count":      {"earned": rct_e,             "max": 20},
        "google_rating":     {"earned": rat_e,             "max": 10},
        "secondary_categories": {"earned": sec_e,          "max": 10},
        "response_rate":     {"earned": resp_e,            "max": 10},
        "photos":            {"earned": photo_e,           "max": 5},
        "gbp_posts":         {"earned": post_pts,          "max": 5},
    }

    return min(100, points), findings, category_opportunity, signal_pts
    """
    DEPRECATED v4.25 — use score_gbp_strength() instead.
    Retained as thin wrapper for any external callers during transition.
    """
    score, findings, cat_opp, _signal_pts = score_gbp_strength(
        gbp, gbp_posts=gbp_posts, owner_services=owner_services,
        vertical=vertical, serp=serp
    )
    return score, findings, cat_opp


def _extract_positions(kw_data):
    """
    Extract position signals from v4.4 trade area serp structure.

    serp[kw] = {
        "origins": { zcta: { "pos": int|None, "dist_mi": float, ... } },
        "labs_3pack": bool,
        "labs_volume": int|None,
    }

    Returns:
      home_pos   — position from closest origin (index 0 by distance)
      best_pos   — best (lowest) position across all origins
      any_visible — True if visible from any origin
    """
    origins = kw_data.get("origins", {})
    if not origins:
        # Legacy flat structure fallback (pre-v4.3)
        return kw_data.get("maps_local_pos"), kw_data.get("maps_local_pos"), False

    # Sort origins by dist_mi to get home block first
    sorted_origins = sorted(origins.values(), key=lambda o: o.get("dist_mi", 99))

    home_pos = sorted_origins[0]["pos"] if sorted_origins else None

    all_positions = [o["pos"] for o in sorted_origins if o["pos"] is not None]
    best_pos      = min(all_positions) if all_positions else None
    any_visible   = bool(all_positions)

    return home_pos, best_pos, any_visible


def _extract_lf_positions(kw_lf_data):
    """
    Extract position signals from local_finder dict for one keyword.

    local_finder[kw] = {
        "origins": {
            zcta: { "pos": int|None, "dist_mi": float, "top20": list, ... }
        }
    }

    Returns:
      lf_best_pos  — best (lowest) position across all origins, or None
      lf_any       — True if visible from any origin
      top20_all    — flat list of all top20 entries across all origins
                     (deduplicated by title for leaderboard use)
    """
    origins = kw_lf_data.get("origins", {})
    if not origins:
        return None, False, []

    all_positions = []
    top20_all     = []
    seen_titles   = set()

    for origin_data in origins.values():
        pos = origin_data.get("pos")
        if pos is not None:
            all_positions.append(pos)
        for entry in origin_data.get("top20", []):
            title = (entry.get("title") or "").strip()
            if title and title not in seen_titles:
                seen_titles.add(title)
                top20_all.append(entry)

    lf_best_pos = min(all_positions) if all_positions else None
    lf_any      = bool(all_positions)

    return lf_best_pos, lf_any, top20_all


def _score_position(pos, max_pts):
    """
    Universal position → points curve, scaled to max_pts.
    Used for both Maps and Local Finder scoring.

    Position bands:
      #1–3   → 100% of max_pts
      #4–6   → 60%
      #7–10  → 40%
      #11–20 → 20%
      None   → 0
    """
    if pos is None:
        return 0
    if pos <= 3:
        return max_pts
    if pos <= 6:
        return round(max_pts * 0.60)
    if pos <= 10:
        return round(max_pts * 0.40)
    if pos <= 20:
        return round(max_pts * 0.20)
    return 0


def _weighted_origin_pts(origins_dict, max_pts):
    """
    Score each Maps origin individually, weighted by 1/dist_mi (inverse distance).

    Closer origins contribute proportionally more to the score — mirrors real
    customer catchment data: median diner travels 1.4mi, average 3.1mi
    (AEA / Upside research). Equal-weight scoring across a 5mi trade area
    treats a 0.8mi origin the same as a 5.2mi origin, misrepresenting where
    the actual customer base lives.

    dist_mi floored at 0.1 to prevent division by zero for businesses
    scanning from their own block.

    Falls back to equal-weight avg if dist_mi is missing on any origin
    (backward compatible with pre-v4.4 scan data).

    Origins with no position (None) count as 0 pts.

    v4.14: Replaces _avg_origin_pts equal-weight method.
    """
    if not origins_dict:
        return 0
    origins = list(origins_dict.values())

    # Fall back to equal-weight if dist_mi missing on any origin
    if any(o.get("dist_mi") is None for o in origins):
        scores = [_score_position(o.get("pos"), max_pts) for o in origins]
        return round(sum(scores) / len(scores)) if scores else 0

    weights      = [1.0 / max(o["dist_mi"], 0.1) for o in origins]
    total_weight = sum(weights)
    weighted_sum = sum(
        _score_position(o.get("pos"), max_pts) * w
        for o, w in zip(origins, weights)
    )
    return round(weighted_sum / total_weight)


def _weighted_lf_origin_pts(kw_lf_data, max_pts):
    """
    Local Finder equivalent of _weighted_origin_pts.

    Same 1/dist_mi weighting logic applied to Local Finder origins.
    Falls back to equal-weight avg if dist_mi missing on any origin.
    Origins with no position (None) count as 0 pts.

    v4.14: Replaces _avg_lf_origin_pts equal-weight method.
    """
    origins_dict = kw_lf_data.get("origins", {})
    if not origins_dict:
        return 0
    origins = list(origins_dict.values())

    # Fall back to equal-weight if dist_mi missing on any origin
    if any(o.get("dist_mi") is None for o in origins):
        scores = [_score_position(o.get("pos"), max_pts) for o in origins]
        return round(sum(scores) / len(scores)) if scores else 0

    weights      = [1.0 / max(o["dist_mi"], 0.1) for o in origins]
    total_weight = sum(weights)
    weighted_sum = sum(
        _score_position(o.get("pos"), max_pts) * w
        for o, w in zip(origins, weights)
    )
    return round(weighted_sum / total_weight)


def _build_competitor_leaderboard(local_finder):
    """
    Aggregate Local Finder top20 entries across all keywords and origins.
    Returns ranked list of competitors by dominance:
      - frequency: how many keyword/origin combinations they appear in
      - avg_pos: average position across appearances
      - rating + review_count from Local Finder data

    Equal-weight across all origins — correct for competitive landscape
    analysis. Distance-weighting is not applied here; a competitor who
    dominates at 5mi is as relevant as one who dominates at 0.8mi.

    Output: list of dicts, sorted by frequency desc, avg_pos asc.
    Max 10 entries.
    """
    from collections import defaultdict

    tally = defaultdict(lambda: {"appearances": 0, "positions": [], "rating": None, "review_count": None})

    for kw_data in local_finder.values():
        for origin_data in kw_data.get("origins", {}).values():
            for entry in origin_data.get("top20", []):
                title = (entry.get("title") or "").strip()
                if not title:
                    continue
                tally[title]["appearances"] += 1
                rank = entry.get("rank")
                if rank is not None:
                    tally[title]["positions"].append(rank)
                if tally[title]["rating"] is None and entry.get("rating") is not None:
                    tally[title]["rating"] = entry["rating"]
                if tally[title]["review_count"] is None and entry.get("review_count") is not None:
                    tally[title]["review_count"] = entry["review_count"]

    leaderboard = []
    for title, data in tally.items():
        avg_pos = round(sum(data["positions"]) / len(data["positions"]), 1) if data["positions"] else None
        leaderboard.append({
            "title":        title,
            "appearances":  data["appearances"],
            "avg_pos":      avg_pos,
            "rating":       data["rating"],
            "review_count": data["review_count"],
        })

    leaderboard.sort(key=lambda x: (-x["appearances"], x["avg_pos"] or 99))
    return leaderboard[:10]


def score_search_visibility(serp, local_finder, vertical="service", keywords=None):
    """
    Category 1.2 — Search Visibility Rankings (30% of P1)  [v4.16]

    Dual-grid scoring: near me keywords × near me origins, city keywords × city origins.
    Two scoring model changes from v4.15:

    1. PEAK + BREADTH per reach type (replaces pure average):
         peak_score   = best single keyword total for that reach type
         breadth_score = avg across all keywords for that reach type
         reach_score  = (peak × 0.70) + (breadth × 0.30)   # v4.69 (was 0.65/0.35)
       Rationale: pure avg crushes a business ranking #1 on its primary keyword
       when its other keywords are zero. Peak+Breadth rewards dominant performance
       without ignoring breadth entirely.

    2. NEAR ME / CITY WEIGHTING changed from 50/50 to 65/35:
         category_score = (near_me_score × 0.65) + (city_score × 0.35)
       Rationale: ~80% of customers come from within 5mi for most local businesses
       (AEA: avg diner 3.1mi, median 1.4mi; CDC/RAND: 5mi buffer = 80% of visits).
       Near me visibility is where revenue lives.

    Maps max 50 pts / LF max 35 pts per keyword per origin (unchanged).
    Near me origins: inverse distance weighting (1/dist_mi).
    City origins: equal weighting across all origins.

    Backward compatible: falls back to equal treatment of all keywords if type
    field absent (pre-v4.16 scan data).

    Output: local_reach and regional_reach are pure avgs (for diagnosis display).
            near_me_score and city_score are Peak+Breadth composites (for scoring).
    """
    keyword_scores   = {}
    kw_local_visible = set()
    kw_invisible     = set()

    MAPS_MAX = 50
    LF_MAX   = 50  # equal weight with Maps -- see v4.34 changelog

    # Build type lookup from keywords list if provided
    kw_types = {}
    if keywords:
        for kw_dict in keywords:
            kw_types[kw_dict["keyword"]] = kw_dict.get("type", "unknown")

    near_me_totals = []  # raw per-keyword totals for near me keywords
    city_totals    = []  # raw per-keyword totals for city keywords

    for kw, data in serp.items():
        home_pos, best_pos, maps_any = _extract_positions(data)

        lf_data            = local_finder.get(kw, {})
        lf_best, lf_any, _ = _extract_lf_positions(lf_data)

        # ── Origin weighting by keyword type ─────────────────────────────
        # Near me: inverse distance (1/dist_mi) — closer origins weighted more
        # City:    equal weight — all origins equally valid authority tests
        kw_type = kw_types.get(kw, "unknown")

        if kw_type == "city":
            # Equal-weight for city origins
            origins_dict = data.get("origins", {})
            if origins_dict:
                origins_list = list(origins_dict.values())
                maps_scores  = [_score_position(o.get("pos"), MAPS_MAX) for o in origins_list]
                maps_pts     = round(sum(maps_scores) / len(maps_scores)) if maps_scores else 0
            else:
                maps_pts = _weighted_origin_pts(data.get("origins", {}), MAPS_MAX)

            lf_origins = lf_data.get("origins", {})
            if lf_origins:
                lf_list   = list(lf_origins.values())
                lf_scores = [_score_position(o.get("pos"), LF_MAX) for o in lf_list]
                lf_pts    = round(sum(lf_scores) / len(lf_scores)) if lf_scores else 0
            else:
                lf_pts = _weighted_lf_origin_pts(lf_data, LF_MAX)
        else:
            # Near me (or unknown): EQUAL weight across origins (v4.69).
            # The v4.57 near-me grid samples 0-5mi evenly by design; equal
            # weight measures how far ranking actually HOLDS across that
            # range. Inverse-distance (the old method) collapsed the score
            # onto the closest origin (up to 83% on the home ZCTA for dense
            # urban businesses) and double-counted the proximity preference
            # already expressed by the 65/35 near-me/city pillar weight.
            # See Decisions v4.36.
            origins_dict = data.get("origins", {})
            if origins_dict:
                origins_list = list(origins_dict.values())
                maps_scores  = [_score_position(o.get("pos"), MAPS_MAX) for o in origins_list]
                maps_pts     = round(sum(maps_scores) / len(maps_scores)) if maps_scores else 0
            else:
                maps_pts = 0

            lf_origins = lf_data.get("origins", {})
            if lf_origins:
                lf_list   = list(lf_origins.values())
                lf_scores = [_score_position(o.get("pos"), LF_MAX) for o in lf_list]
                lf_pts    = round(sum(lf_scores) / len(lf_scores)) if lf_scores else 0
            else:
                lf_pts = 0

        total = min(100, maps_pts + lf_pts)

        keyword_scores[kw] = {
            "home_pos":  home_pos,
            "best_pos":  best_pos,
            "maps_pts":  maps_pts,
            "lf_best":   lf_best,
            "lf_pts":    lf_pts,
            "total":     total,
            "type":      kw_type,
        }

        if maps_any or lf_any:
            kw_local_visible.add(kw)
        else:
            kw_invisible.add(kw)

        # Bucket by keyword type
        if kw_type == "near_me":
            near_me_totals.append(total)
        elif kw_type == "city":
            city_totals.append(total)
        else:
            # Unknown type — backward compat: contribute to both
            near_me_totals.append(total)
            city_totals.append(total)

    # ── Pure averages (used for diagnosis display only) ───────────────────
    local_reach    = round(sum(near_me_totals) / len(near_me_totals)) if near_me_totals else 0
    regional_reach = round(sum(city_totals)    / len(city_totals))    if city_totals    else 0

    # ── Peak + Breadth per reach type ────────────────────────────────────
    # peak   = best single keyword score (70% weight) — rewards dominant performers
    # breadth = avg across all keywords (30% weight) — rewards consistent coverage
    # v4.69: peak raised 65->70. A business strong on its core service is doing
    # broad SEO right; weaker non-core-service keywords shouldn't drag the score.
    if near_me_totals:
        nm_peak    = max(near_me_totals)
        nm_breadth = round(sum(near_me_totals) / len(near_me_totals))
        near_me_score = round(nm_peak * 0.70 + nm_breadth * 0.30)
    else:
        near_me_score = 0

    if city_totals:
        city_peak    = max(city_totals)
        city_breadth = round(sum(city_totals) / len(city_totals))
        city_score   = round(city_peak * 0.70 + city_breadth * 0.30)
    else:
        city_score = 0

    # ── Final category score: 65% near me, 35% city ──────────────────────
    # Data-backed: ~80% of customers within 5mi for most local businesses.
    if near_me_totals or city_totals:
        category_score = round(near_me_score * 0.65 + city_score * 0.35)
    else:
        category_score = 0

    # ── Diagnosis (based on pure avgs for interpretability) ──────────────
    gap = local_reach - regional_reach
    if   gap > 20:   diagnosis = "Near me dominant — strong proximity, weak regional reach"
    elif gap > 10:   diagnosis = "Near me stronger — local visibility leads regional"
    elif gap < -10:  diagnosis = "City modifier dominant — regional authority exceeds local"
    elif gap < 0:    diagnosis = "City modifier slightly stronger — regional signals healthy"
    else:            diagnosis = "Balanced local and regional reach"

    # Scenario detection
    if kw_local_visible:
        scenario = "A"
    else:
        scenario = "C"

    # Competitor leaderboard (equal-weight — intentional for competitive landscape)
    competitor_leaderboard = _build_competitor_leaderboard(local_finder)

    # ── Findings ──────────────────────────────────────────────────────────
    findings      = []
    visible_count = len(kw_local_visible)
    total_kw      = len(serp)

    if visible_count == 0:
        findings.append({"text": "No Maps or Local Finder visibility detected for any owner-stated keyword. Category recognition gap — Google is not associating this business with these search terms.", "severity": "critical"})
    elif visible_count < total_kw:
        invisible_list = ", ".join(list(kw_invisible)[:3])
        findings.append({"text": f"Visible on {visible_count} of {total_kw} keywords. Zero visibility for: {invisible_list}.", "severity": "warning"})
    else:
        findings.append({"text": f"Maps or Local Finder visibility confirmed on all {total_kw} scanned keywords.", "severity": "good"})

    findings.append({"text": f"Local Reach (near me avg): {local_reach}/100 — Regional Reach (city avg): {regional_reach}/100. {diagnosis}.", "severity": "good" if local_reach >= 50 and regional_reach >= 50 else "warning" if local_reach >= 25 or regional_reach >= 25 else "critical"})

    # Highlight peak keyword for each reach type
    if near_me_totals:
        best_nm_kw = max(
            (kw for kw, ks in keyword_scores.items() if ks["type"] == "near_me"),
            key=lambda kw: keyword_scores[kw]["total"],
            default=None,
        )
        if best_nm_kw and keyword_scores[best_nm_kw]["total"] > 0:
            findings.append({"text": f"Strongest near me keyword: '{best_nm_kw}' (score {keyword_scores[best_nm_kw]['total']}/100) — this keyword drives your near me score.", "severity": "good" if keyword_scores[best_nm_kw]["total"] >= 50 else "warning"})

    if city_totals:
        best_city_kw = max(
            (kw for kw, ks in keyword_scores.items() if ks["type"] == "city"),
            key=lambda kw: keyword_scores[kw]["total"],
            default=None,
        )
        if best_city_kw and keyword_scores[best_city_kw]["total"] > 0:
            findings.append({"text": f"Strongest city keyword: '{best_city_kw}' (score {keyword_scores[best_city_kw]['total']}/100) — this keyword drives your regional reach score.", "severity": "good" if keyword_scores[best_city_kw]["total"] >= 50 else "warning"})

    for kw, ks in keyword_scores.items():
        if ks["best_pos"] is not None and ks["lf_best"] is None:
            findings.append({"text": f"'{kw}': ranked #{ks['best_pos']} in Maps but absent from Local Finder top 20. May indicate thin category signal in Google Search index.", "severity": "warning"})
        elif ks["lf_best"] is not None and ks["best_pos"] is None:
            findings.append({"text": f"'{kw}': ranked #{ks['lf_best']} in Local Finder but absent from Maps. Unusual — Local Finder presence without Maps presence.", "severity": "warning"})

    kw_3pack         = set()
    kw_city_visible  = set()
    near_miss        = []
    unexpected_3pack = []

    return (
        category_score,
        scenario,
        kw_3pack,
        kw_city_visible,
        kw_local_visible,
        kw_invisible,
        findings,
        keyword_scores,
        unexpected_3pack,
        near_miss,
        competitor_leaderboard,
        local_reach,
        regional_reach,
        diagnosis,
        near_me_score,
        city_score,
    )


def score_onpage_relevance(html=None, city="Seattle", content_depth=None, primary_type=None):
    """
    Category 1.4a — On-Page Relevance (15% of P1)  [v4.24]

    Topical authority signals — what the site tells Google about what
    and where the business is. Owner-controlled, high actionability.

    Title tag             25 pts  (city + category match — length not scored)
    LocalBusiness schema  25 pts  (moved from 1.1 GBP — scored here only)
    Service pages         25 pts  (dedicated page per owner service)
    H1                    15 pts  (presence + uniqueness)
    City+keyword cooc     10 pts  (city + service in body text)
    ─────────────────────────────────
    Max                  100 pts  (clean budget — no normalization needed)

    Signals removed vs. old 1.4 (v4.23):
      Meta description: no ranking impact → findings only
      Social proof links: weak signal → findings only
    """
    points   = 0
    findings = []
    html     = html or {}

    # ── Title tag (25 pts) ────────────────────────────────────────
    # Scoring: city + category both present = 25, city only = 15,
    # category only = 10, title present but neither = 5, missing = 0.
    # Length is not scored — homepage title benchmark is what+where.
    # Service keywords scored on service pages, not here.
    title_len      = html.get("title_length") or 0
    title_text     = (html.get("title_text") or "").lower()
    has_city       = city.lower() in title_text
    _pt_normalized = (primary_type or "").lower().replace("_", " ")
    _pt_tokens     = [t for t in _pt_normalized.split() if len(t) > 2]
    has_category   = any(t in title_text for t in _pt_tokens) if _pt_tokens else False

    if title_len == 0:
        title_e = 0
        findings.append({"text": "Title tag missing — critical on-page gap.", "severity": "critical", "kb_key": "TITLE_TAG_NO_CITY"})
    elif has_city and has_category:
        title_e = 25
        findings.append({"text": "Title tag confirmed — city and business category both present. Strong homepage identity signal.", "severity": "good"})
    elif has_city:
        title_e = 15
        findings.append({"text": f"Title tag includes '{city}' but missing a category keyword (e.g. '{_pt_normalized.title()}'). Adding your business type strengthens what-and-where signal.", "severity": "warning", "kb_key": "TITLE_TAG_NO_CITY"})
    elif has_category:
        title_e = 10
        findings.append({"text": f"Title tag includes your business category but missing city keyword '{city}'. Local search requires both what and where.", "severity": "warning", "kb_key": "TITLE_TAG_NO_CITY"})
    else:
        title_e = 5
        findings.append({"text": f"Title tag present but missing both city ('{city}') and business category. Homepage title should establish what you are and where you are.", "severity": "warning", "kb_key": "TITLE_TAG_NO_CITY"})
    points += title_e

    # ── LocalBusiness schema (25 pts) ─────────────────────────────
    # Moved from Category 1.1 GBP (v4.24). Scored and surfaced here only.
    # v4.33: evaluate_schema() replaces hardcoded 6-type list.
    #   present=25pts, org_only=8pts, missing=0pts.
    #   Finding always shows detected type vs GBP category for owner verification.
    schema_types  = html.get("schema_types", [])
    schema_result = evaluate_schema(primary_type, schema_types)
    points       += schema_result["score_pts"]
    findings.append(schema_result["finding"])
    local_schema  = schema_result["status"] == "present"  # retained for signal_pts

    # ── Service pages (25 pts) ────────────────────────────────────
    cd         = content_depth or {}
    svc_pages  = cd.get("service_pages", {})
    city_cooc  = cd.get("city_keyword_cooccurrence", {})
    total_svcs = len(svc_pages) if svc_pages else 0

    if total_svcs > 0:
        pages_found = sum(1 for v in svc_pages.values() if v.get("found"))
        page_pct    = pages_found / total_svcs
        if   page_pct >= 1.0:  svc_pts = 25
        elif page_pct >= 0.67: svc_pts = 17
        elif page_pct >= 0.33: svc_pts = 8
        else:                  svc_pts = 0
        points += svc_pts

        missing_pages = [s for s, v in svc_pages.items() if not v.get("found")]
        if missing_pages:
            findings.append({"text": f"No dedicated service page for: {', '.join(missing_pages)}. Google ranks pages, not websites — a dedicated page per service strengthens topical authority and city-modifier rankings.", "severity": "critical" if pages_found == 0 else "warning", "kb_key": "SERVICE_PAGE_MISSING"})

    # ── H1 (15 pts) ───────────────────────────────────────────────
    h1_count = html.get("h1_count") or 0
    if h1_count == 1:
        points += 15
    elif h1_count > 1:
        points += 6
        findings.append({"text": f"{h1_count} H1 tags detected — only one per page. Extra H1s dilute keyword signal.", "severity": "warning", "kb_key": "H1_MISSING"})
    else:
        findings.append({"text": "No H1 tag detected.", "severity": "critical", "kb_key": "H1_MISSING"})

    # ── Meta description — findings only (no points) ──────────────
    # Google confirmed: no ranking impact. CTR signal only.
    meta_missing = html.get("meta_desc_missing", True)
    meta_text    = html.get("meta_desc") or ""
    meta_len     = len(meta_text)
    if meta_missing:
        findings.append({"text": "Meta description missing. While not a ranking signal, a well-written meta description improves click-through from search results.", "severity": "warning", "kb_key": "META_DESCRIPTION_MISSING"})
    elif meta_len < 140 or meta_len > 160:
        findings.append({"text": f"Meta description {meta_len} chars — benchmark is 140–160 chars for optimal display.", "severity": "warning", "kb_key": "META_DESCRIPTION_MISSING"})

    # ── City + keyword co-occurrence (10 pts) ─────────────────────
    if total_svcs > 0:
        cooc_found = sum(1 for v in city_cooc.values() if v.get("found"))
        cooc_pct   = cooc_found / total_svcs
        if   cooc_pct >= 1.0:  cooc_pts = 10
        elif cooc_pct >= 0.67: cooc_pts = 6
        elif cooc_pct >= 0.33: cooc_pts = 2
        else:                  cooc_pts = 0
        points += cooc_pts

        if cooc_pct < 1.0:
            missing_cooc = [s for s, v in city_cooc.items() if not v.get("found")]
            if missing_cooc:
                findings.append({"text": f"City + service keyword not co-occurring for: {', '.join(missing_cooc)}. Including city name alongside service keywords in body content reinforces local relevance signals.", "severity": "warning", "kb_key": "CITY_KW_ABSENT"})

    # ── Social proof links — findings only (no points) ────────────
    # Weak ranking signal. NAP consistency proxy surfaced as informational.
    social_patterns = ["instagram.com", "facebook.com", "yelp.com", "tiktok.com",
                       "twitter.com", "x.com", "google.com/maps"]
    social_links = html.get("social_links", [])
    has_social   = any(
        any(p in link.lower() for p in social_patterns)
        for link in social_links
    ) if social_links else False

    if not has_social:
        findings.append({"text": "No social media links detected. Linking to active profiles strengthens cross-platform NAP consistency.", "severity": "warning"})

    # ── Signal points dict ───────────────────────────────────────
    # title_e already computed above via city+category model
    schema_e     = schema_result["score_pts"]
    svc_e        = svc_pts if total_svcs > 0 else 0
    h1_e         = 15 if h1_count==1 else 6 if h1_count>1 else 0
    cooc_e       = cooc_pts if total_svcs > 0 else 0

    onpage_signal_pts = {
        "title_tag":          {"earned": title_e, "max": 25},
        "schema":             {"earned": schema_e, "max": 25},
        "service_pages":      {"earned": svc_e,   "max": 25},
        "h1":                 {"earned": h1_e,    "max": 15},
        "city_keyword_cooc":  {"earned": cooc_e,  "max": 10},
    }

    return min(100, points), findings, onpage_signal_pts


def score_domain_trust(whois, moz=None, vertical="service"):
    """
    Category 1.4b — Domain Trust (10% of P1)  [v4.24]

    External validation signals — competitive diagnostic context.
    Slow-moving, low owner actionability within 90 days.
    Note: citations not yet collected — when added, this category
    justifies a weight increase to 12–13%.

    DA (Moz)              50 pts  (scaled from 35/145 in old combined 1.4)
    Referring domains     30 pts  (scaled from 20/145, same vertical thresholds)
    HTTPS                 10 pts
    Domain age            10 pts
    ─────────────────────────────────
    Max                  100 pts  (clean budget — no normalization needed)
    """
    points     = 0
    findings   = []
    moz_client = (moz or {}).get("client") or {}
    da         = moz_client.get("da") or 0
    rd         = moz_client.get("referring_domains") or 0
    whois_age  = whois.get("age_years") or 0
    https      = whois.get("https", False)

    # ── Domain Authority (50 pts) ─────────────────────────────────
    if   da >= 40: da_pts = 50
    elif da >= 25: da_pts = 35
    elif da >= 15: da_pts = 20
    elif da >= 5:  da_pts = 10
    else:          da_pts = 0
    points += da_pts

    if da >= 30:
        pass  # Leading threshold — no finding
    elif da >= 20:
        findings.append({"text": f"Domain Authority {da}/100 — you're in competitive range. Consistent directory citations and local press mentions are the path to 30+, which is the leading threshold for most local markets.", "severity": "warning", "kb_key": "DA_LOW"})
    elif da >= 10:
        findings.append({"text": f"Domain Authority {da}/100 — below the competitive threshold. Directory listings (Yelp, BBB, industry directories, chamber of commerce) are the fastest lever — each adds a referring domain and strengthens category authority.", "severity": "warning", "kb_key": "DA_LOW"})
    elif da > 0:
        findings.append({"text": f"Domain Authority {da}/100 — critically low. Your backlink profile has not been established. Start with free directory citations: Yelp, BBB, Google Business Profile, chamber of commerce, and any industry-specific directories. Each one adds a referring domain and builds the foundation.", "severity": "critical", "kb_key": "DA_LOW"})
    elif not moz_client:
        findings.append({"text": "Domain Authority data unavailable — Moz API may not have indexed this domain yet.", "severity": "warning"})

    # ── Referring domains (30 pts) — vertical-thresholded ─────────
    RD_THRESHOLDS = {
        "restaurant":          [(200, 30), (100, 22), (40, 14), (15, 7)],
        "medspa":              [(150, 30), (60,  22), (25, 14), (10, 7)],
        "salon":               [(200, 30), (80,  22), (30, 14), (12, 7)],
        "service":             [(100, 30), (40,  22), (20, 14), (8,  7)],
        "home_trade":          [(80,  30), (35,  22), (15, 14), (6,  7)],   # TODO: calibrate after 3-5 home trade scans — v1 estimate
        "professional_service":[(60,  30), (25,  22), (10, 14), (4,  7)],   # TODO: calibrate after 3-5 prof service scans — v1 estimate
        "real_estate":         [(80,  30), (35,  22), (15, 14), (6,  7)],   # TODO: calibrate after 3-5 real estate scans — mirrors home_trade
        # TODO: calibrate "fitness" after 3-5 real fitness scans — using "service" fallback intentionally
    }
    tiers  = RD_THRESHOLDS.get(vertical, RD_THRESHOLDS["service"])
    rd_pts = 0
    for threshold, pts in tiers:
        if rd >= threshold:
            rd_pts = pts
            break
    points += rd_pts

    if rd < tiers[-1][0] and rd > 0:
        findings.append({"text": f"{rd} unique sites linking to your domain. Claiming free high-authority directory listings is the fastest path to more referring domains — each adds a link and strengthens category authority.", "severity": "warning" if rd >= 10 else "critical", "kb_key": "REFERRING_DOMAINS_LOW"})
    elif rd == 0 and not moz_client:
        pass  # Moz data unavailable — already flagged above

    # ── HTTPS (10 pts) ────────────────────────────────────────────
    if https:
        points += 10
    else:
        findings.append({"text": "HTTPS not detected. Security gap and ranking signal missing.", "severity": "critical"})

    # ── Domain age (10 pts) ───────────────────────────────────────
    if   whois_age >= 5: age_pts = 10
    elif whois_age >= 3: age_pts = 7
    elif whois_age >= 1: age_pts = 4
    else:                age_pts = 1
    points += age_pts

    if whois_age < 3:
        findings.append({"text": f"Domain age {whois_age:.1f} years — below 3-year threshold for established authority signal.", "severity": "warning", "kb_key": "DOMAIN_AGE_YOUNG"})

    trust_signal_pts = {
        "domain_authority":  {"earned": da_pts,              "max": 50},
        "referring_domains": {"earned": rd_pts,              "max": 30},
        "https":             {"earned": 10 if https else 0,  "max": 10},
        "domain_age":        {"earned": age_pts,             "max": 10},
    }

    return min(100, points), findings, {"da": da, "referring_domains": rd}, trust_signal_pts


# ════════════════════════════════════════════════════════════════
# PILLAR 2 SCORING
# ════════════════════════════════════════════════════════════════

def score_mobile_performance(psi):
    """
    Category 2.1 — Website Performance (35% of P2)  [v4.53]

    Desktop PSI   30 pts  — reliable real-world site quality proxy
    TTFB          20 pts  — device-agnostic server/hosting speed
    CLS           25 pts  — layout shift affects all devices
    TBT           15 pts  — interactivity affects all devices
    Unused JS/CSS  5 pts  — concrete bloat signal, device-agnostic
    WebP images    5 pts  — image format optimization

    Total: exactly 100 pts. No cap needed.
    Mobile PSI retired — simulation artifact on throttled 4G / mid-tier
    Android produces numbers unrepresentative of real visitor experience.
    LCP retired alongside mobile PSI for same reason.
    """
    points   = 0
    findings = []

    desk       = psi.get("performance") or 0
    ttfb       = psi.get("ttfb_ms")
    cls        = psi.get("cls") or 0
    tbt        = psi.get("tbt_ms") or 0
    unused_js  = psi.get("unused_js_kib") or 0
    unused_css = psi.get("unused_css_kib") or 0

    # ── Desktop PSI (30 pts) ──────────────────────────────────
    if   desk >= 90: points += 30
    elif desk >= 75: points += 22
    elif desk >= 60: points += 14
    elif desk >= 40: points += 7
    else:            points += 0

    findings.append({"text": f"Desktop PSI: {desk}/100 — " + ("strong site performance." if desk >= 75 else "moderate performance — opportunities to improve load speed." if desk >= 60 else "performance needs attention — visitors may experience slow loads."), "severity": "good" if desk >= 75 else "warning" if desk >= 60 else "critical", **({"kb_key": "MOBILE_PERFORMANCE_LOW"} if desk < 75 else {})})

    # ── TTFB (20 pts) ─────────────────────────────────────────
    if ttfb is not None:
        if   ttfb <= 200:  points += 20
        elif ttfb <= 600:  points += 14
        elif ttfb <= 1500: points += 6
        else:              points += 0

        if ttfb <= 200:
            findings.append({"text": f"Server response time: {ttfb}ms — excellent hosting speed.", "severity": "good"})
        elif ttfb <= 600:
            findings.append({"text": f"Server response time: {ttfb}ms — acceptable, but upgrade hosting or enable CDN for improvement.", "severity": "warning"})
        else:
            findings.append({"text": f"Server response time: {ttfb}ms — slow server. Upgrading hosting plan or enabling a CDN is the highest-leverage fix.", "severity": "critical"})
    else:
        points += 10  # neutral if not returned
        findings.append({"text": "Server response time: not available for this site.", "severity": "warning"})

    # ── CLS (25 pts) ──────────────────────────────────────────
    if   cls <= 0.05: points += 25
    elif cls <= 0.10: points += 18
    elif cls <= 0.25: points += 8
    else:             points += 0

    if cls > 0.10:
        findings.append({"text": f"Layout shift (CLS): {round(cls, 3)} — page elements move during load. Common causes: images without set dimensions, late-loading fonts, injected banners. Benchmark: ≤0.05.", "severity": "critical", "kb_key": "CLS_HIGH"})
    elif cls > 0.05:
        findings.append({"text": f"Layout shift (CLS): {round(cls, 3)} — minor shift detected. Benchmark: ≤0.05.", "severity": "warning", "kb_key": "CLS_HIGH"})

    # ── TBT (15 pts) ──────────────────────────────────────────
    if   tbt <= 200: points += 15
    elif tbt <= 400: points += 10
    elif tbt <= 600: points += 5
    else:            points += 0

    if tbt > 400:
        findings.append({"text": f"Interactivity (TBT): {tbt}ms — page slow to respond to taps and clicks. Usually caused by large JavaScript bundles. Benchmark: ≤200ms.", "severity": "critical"})

    # ── Unused JS / CSS (5 pts) ───────────────────────────────
    total_bloat = unused_js + unused_css
    if   total_bloat == 0:   points += 5
    elif total_bloat <= 100: points += 3
    elif total_bloat <= 300: points += 1
    else:                    points += 0

    if unused_js > 100:
        findings.append({"text": f"Unused JavaScript: {unused_js} KiB — code loaded but never used. Each KiB adds page weight for every visitor. Defer or remove unused scripts.", "severity": "warning", "kb_key": "UNUSED_JS_HIGH"})
    if unused_css > 50:
        findings.append({"text": f"Unused CSS: {unused_css} KiB — stylesheet bloat contributing to load overhead.", "severity": "warning"})

    desk_e  = 30 if desk>=90 else 22 if desk>=75 else 14 if desk>=60 else 7 if desk>=40 else 0
    ttfb_e  = 20 if (ttfb is not None and ttfb<=200) else 14 if (ttfb is not None and ttfb<=600) else 6 if (ttfb is not None and ttfb<=1500) else 10 if ttfb is None else 0
    cls_e   = 25 if cls<=0.05 else 18 if cls<=0.10 else 8 if cls<=0.25 else 0
    tbt_e   = 15 if tbt<=200 else 10 if tbt<=400 else 5 if tbt<=600 else 0
    bloat_e = 5 if total_bloat==0 else 3 if total_bloat<=100 else 1 if total_bloat<=300 else 0

    # ── WebP images (5 pts) ───────────────────────────────────
    webp_detected = (
        psi.get("webp_by_extension", False) or
        psi.get("webp_by_picture",   False) or
        psi.get("webp_by_css",       False)
    )
    if webp_detected:
        points += 5
    else:
        findings.append({"text": "No WebP images detected. Converting JPEG/PNG to WebP reduces image payload 25–35% at identical quality — direct load time improvement for all visitors.", "severity": "warning", "kb_key": "WEBP_MISSING"})
    webp_e = 5 if webp_detected else 0

    perf_signal_pts = {
        "desktop_psi":  {"earned": desk_e,  "max": 30},
        "ttfb":         {"earned": ttfb_e,  "max": 20},
        "cls":          {"earned": cls_e,   "max": 25},
        "tbt":          {"earned": tbt_e,   "max": 15},
        "unused_code":  {"earned": bloat_e, "max": 5},
        "webp_images":  {"earned": webp_e,  "max": 5},
    }

    return min(100, points), findings, "Desktop PSI + TTFB", perf_signal_pts


def score_conversion_infrastructure(html, vertical="service"):
    """
    Category 2.2 — Conversion Infrastructure (30% of P2)

    Booking platform  40 pts
    Click-to-call     20 pts
    Analytics         40 pts
    """
    points   = 0
    findings = []

    # Membership-model fitness businesses: contact/inquiry IS the conversion
    # path — not a gap. Treat contact_form_only as 25pts instead of 10pts.
    MEMBERSHIP_TYPES = {"gym", "fitness", "yoga_studio", "pilates_studio",
                        "crossfit_gym", "fitness_center", "boxing_gym", "health_club"}
    # Home trade and professional service: contact/quote form IS the standard
    # conversion path. Same 25pt treatment as membership fitness.
    HOME_TRADE_TYPES  = {"home_trade"}
    PROF_SERVICE_TYPES = {"professional_service", "real_estate"}

    is_membership_model = vertical in MEMBERSHIP_TYPES
    is_medspa           = vertical == "medspa"
    is_quote_model      = vertical in HOME_TRADE_TYPES | PROF_SERVICE_TYPES

    booking_path_type       = html.get("booking_path_type", "none")
    booking_detection_method = html.get("booking_detection_method")  # "cta_hash" | "external_url" | "internal_slug" | None
    booking_internal_slug   = html.get("booking_internal_slug")      # matched slug, e.g. "/scorpion-scheduling/"
    lead_capture_platforms  = html.get("lead_capture_platforms", [])
    platforms = html.get("booking_platforms", [])
    ctc       = html.get("click_to_call", False)
    ga4       = html.get("ga4", False)
    gtm       = html.get("gtm", False)

    # ── Booking path scoring ─────────────────────────────────────
    # Point table by vertical (v4.64):
    #
    #   Vertical      named   generic  quote   contact  none
    #   home_trade      40      25      35       10       0
    #   prof_service    40      25      35       10       0
    #   membership      40      30      10       25       0
    #   medspa          40      30      10       10       0
    #   all others      40      30      10       10       0
    #
    # Rationale for home_trade rebalance:
    #   quote_form (35) > generic_booking (25) because a structured
    #   quote/estimate form captures job details and generates a qualified
    #   lead — better conversion outcome than a generic JS booking modal
    #   with no job context. Named FSM platforms (40) remain gold standard.
    if booking_path_type == "named_platform":
        points += 40
        platform_label = ', '.join(p for p in platforms if p not in ("generic", "contact_form", "quote_form")) or "detected"
        findings.append({"text": f"Booking path confirmed ({platform_label}). CTA visibility requires manual mobile verification.", "severity": "good"})

    elif booking_path_type == "generic_booking":
        if is_quote_model:
            points += 25 if booking_detection_method in ("cta_hash", "external_url") else 30
            if booking_detection_method == "internal_slug":
                slug_display = booking_internal_slug or "a dedicated scheduling page"
                findings.append({"text": f"Dedicated scheduling page detected ({slug_display}). Verify the page loads a working scheduler — if it does, your booking path is solid. Confirm a prominent button links to it above the fold on mobile.", "severity": "good"})
            elif booking_detection_method == "cta_hash":
                findings.append({"text": "Online booking detected — visitors can self-schedule directly from your homepage. The platform isn't identified. Verify the booking flow works on mobile and that the button is visible above the fold without scrolling.", "severity": "good"})
            else:
                findings.append({"text": "A scheduling link was detected. For service businesses, a dedicated quote or estimate request form converts better than a generic booking link — it captures job details upfront and sets clearer expectations before the first call.", "severity": "warning", "kb_key": "BOOKING_PATH_MISSING"})
        else:
            points += 30
            if booking_detection_method == "internal_slug":
                slug_display = booking_internal_slug or "a dedicated scheduling page"
                findings.append({"text": f"Dedicated scheduling page detected ({slug_display}). Verify the page loads a working scheduler and is prominently linked above the fold on mobile.", "severity": "good"})
            elif booking_detection_method == "cta_hash":
                findings.append({"text": "Online booking detected — visitors can self-schedule directly from your homepage. Platform not identified. Verify the booking flow works on mobile and is prominently placed above the fold.", "severity": "good"})
            else:
                findings.append({"text": "A scheduling link was detected, but no industry-specific booking platform was identified. Most competitors in this space use dedicated platforms (Mindbody, Boulevard, Vagaro, Zenoti, Fresha) that offer integrated scheduling, reminders, and client management. Worth evaluating whether a platform upgrade would improve booking conversion.", "severity": "warning", "kb_key": "BOOKING_PATH_MISSING"})

    elif booking_path_type == "quote_form":
        if is_quote_model:
            points += 35  # Raised from 30 — structured quote form is the vertical best practice
            if lead_capture_platforms:
                platform_names = ", ".join(p.replace("_", " ").title() for p in lead_capture_platforms)
                findings.append({"text": f"Quote or estimate request form detected ({platform_names}) — the right conversion path for a service business. The form is the right tool. The gap is what happens next: 50% of service jobs go to whoever responds first. Set up immediate SMS/email alerts on every submission and aim to respond within 1 hour during business hours.", "severity": "warning", "kb_key": "QUOTE_FORM_DETECTED"})
            else:
                findings.append({"text": "Quote request form detected — the right conversion path for a service business. The gap isn't the form, it's response time. Studies show 50% of service jobs go to the first business that responds. Aim to respond to every inquiry within 1 hour during business hours.", "severity": "warning", "kb_key": "QUOTE_FORM_DETECTED"})
        else:
            # Non-service vertical with quote form signals — treat as contact_form_only
            points += 10
            findings.append({"text": "Contact form detected but no dedicated booking path. Visitors who want to schedule must wait for a callback — adding a self-scheduling link removes that friction.", "severity": "warning", "kb_key": "BOOKING_PATH_MISSING"})

    elif booking_path_type == "contact_form_only":
        if is_membership_model:
            points += 25
            findings.append({"text": "Contact/inquiry form detected. For membership-based fitness businesses, this is the expected conversion path — ensure the form is prominent on mobile and above the fold.", "severity": "good"})
        elif is_quote_model:
            points += 10
            findings.append({"text": "Contact form only — no quote or estimate request path detected. Service businesses convert significantly better when the form explicitly invites a quote or estimate. Rename your form, update the CTA button text, and add a project description field. This signals clear intent and sets visitor expectations before they submit.", "severity": "warning", "kb_key": "CONTACT_FORM_ONLY_SERVICE"})
        elif is_medspa:
            points += 10
            findings.append({"text": "No online booking platform detected. For a medical spa offering appointment-based services, a contact form creates unnecessary friction — visitors who are ready to book now have to wait for a callback. Platforms like Boulevard, Vagaro, and Fresha offer medspa-specific scheduling and are standard in this space.", "severity": "critical", "kb_key": "BOOKING_PATH_MISSING"})
        else:
            points += 10
            findings.append({"text": "Contact form detected but no dedicated booking path. Visitors who want to schedule must wait for a callback — adding a self-scheduling link removes that friction. Note: a booking platform may not be applicable if your business primarily serves walk-in customers.", "severity": "warning", "kb_key": "BOOKING_PATH_MISSING"})
    else:
        if is_quote_model:
            findings.append({"text": "No contact form or quote request path detected. For service businesses, this is a critical conversion gap — visitors who want to reach out have no frictionless way to do so. A simple contact form with a response time promise is the minimum viable fix.", "severity": "critical", "kb_key": "BOOKING_PATH_MISSING"})
        else:
            findings.append({"text": "No booking path detected. If your business takes appointments or reservations, this is a critical conversion gap — visitors have no way to self-schedule. Note: a booking platform may not be applicable if your business primarily serves walk-in customers. If your site has a working form, this finding may not apply.", "severity": "critical", "kb_key": "BOOKING_PATH_MISSING"})

    # Click-to-call (20 pts)
    if ctc:
        points += 20
    else:
        findings.append({"text": "No click-to-call link detected on your homepage. This scan checks the homepage only — if your phone number is linked elsewhere on your site, ensure it is also prominently accessible on the homepage header or above the fold. See appendix for best practices.", "severity": "critical", "kb_key": "CLICK_TO_CALL_MISSING"})

    # Analytics (40 pts)
    if ga4 and gtm:
        points += 40
        findings.append({"text": "GA4 via GTM detected — strongest analytics setup. Verify conversion events are configured.", "severity": "good"})
    elif ga4:
        points += 25
        findings.append({"text": "GA4 detected without GTM. Conversion event configuration should be verified.", "severity": "warning", "kb_key": "ANALYTICS_MISSING"})
    else:
        findings.append({"text": "No GA4 detected. Business is blind to website performance.", "severity": "critical", "kb_key": "ANALYTICS_MISSING"})

    # booking_e — reflects point table (v4.65)
    # home_trade/professional_service: internal_slug=30, cta_hash/external_url=25
    if booking_path_type == "named_platform":
        booking_e = 40
    elif booking_path_type == "generic_booking":
        if is_quote_model and booking_detection_method in ("cta_hash", "external_url"):
            booking_e = 25
        else:
            booking_e = 30
    elif booking_path_type == "quote_form":
        booking_e = 35 if is_quote_model else 10
    elif booking_path_type == "contact_form_only":
        booking_e = 25 if is_membership_model else 10
    else:
        booking_e = 0
    ctc_e       = 20 if ctc else 0
    analytics_e = 40 if (ga4 and gtm) else 25 if ga4 else 0

    conv_signal_pts = {
        "booking":      {"earned": booking_e,   "max": 40},
        "click_to_call":{"earned": ctc_e,       "max": 20},
        "analytics":    {"earned": analytics_e, "max": 40},
    }

    return min(100, points), findings, conv_signal_pts



def score_mobile_ux(html, psi_accessibility=None):
    """
    Category 2.3 — Mobile UX Signals (25% of P2)  [v4.51]

    Rebuilt scoring model — four signals, 100 pts max.

    Viewport          40 pts  HTML parse — parsed meta tag
      Clean (exists + width=device-width + no zoom block) → 40
      Blocks zoom (exists + width=device-width + zoom blocked) → 35
      No width=device-width + responsive_score ≥ 2             → 20
      No width=device-width + responsive_score < 2             →  0
      No meta tag at all                                       →  0

    Responsive impl   35 pts  HTML parse — 4 signals (0–4 score)
      4/4 → 35, 3/4 → 26, 2/4 → 18, 1/4 → 9, 0/4 → 0

    Tap targets       15 pts  PSI a11y target-size
      Pass → 15, None → 7 (neutral partial), Fail → 0

    Color contrast    10 pts  PSI a11y color-contrast
      Pass → 10, None → 0, Fail → 0

    Max: 100 pts (no normalization required)
    """
    points   = 0
    findings = []
    a11y     = psi_accessibility or {}

    # ── Viewport (40 pts) — HTML parse (v4.51) ───────────────────
    vp_exists      = html.get("viewport_exists", html.get("viewport", False))
    vp_width_dev   = html.get("viewport_has_width_device", False)
    vp_blocks_zoom = html.get("viewport_blocks_zoom", False)
    resp_score     = html.get("responsive_score", 0)

    if not vp_exists:
        vp_pts = 0
        findings.append({
            "text": "Viewport not configured — your site is not set up to render correctly on mobile screens. This is the foundational mobile fix. Add <meta name='viewport' content='width=device-width, initial-scale=1'> to your site's <head> section.",
            "severity": "critical",
            "kb_key": "VIEWPORT_MISCONFIGURED",
        })
    elif vp_width_dev and not vp_blocks_zoom:
        vp_pts = 40   # clean viewport
    elif vp_width_dev and vp_blocks_zoom:
        vp_pts = 35   # good but blocks zoom
        findings.append({
            "text": "Your site's viewport disables pinch-to-zoom on mobile. Google flags this in mobile accessibility audits. Ask your web developer to remove user-scalable=no from the viewport meta tag — a five-minute fix.",
            "severity": "warning",
            "kb_key": "VIEWPORT_MISCONFIGURED",
        })
    else:
        # Tag exists but no width=device-width — use responsive as tiebreaker
        if resp_score >= 2:
            vp_pts = 20
            findings.append({
                "text": "Your viewport configuration is non-standard — it doesn't declare a device-width setting. Your site shows responsive signals but this misconfiguration may affect how Google evaluates your mobile setup. A developer can correct the viewport meta tag in under five minutes.",
                "severity": "warning",
                "kb_key": "VIEWPORT_MISCONFIGURED",
            })
        else:
            vp_pts = 0
            findings.append({
                "text": "Viewport not properly configured — your site is missing the device-width declaration that tells mobile browsers how to render the page. Add <meta name='viewport' content='width=device-width, initial-scale=1'> to your site's <head> section.",
                "severity": "critical",
                "kb_key": "VIEWPORT_MISCONFIGURED",
            })
    points += vp_pts

    # ── Responsive implementation (35 pts) — HTML parse ──────────
    resp_pts_map = {4: 35, 3: 26, 2: 18, 1: 9, 0: 0}
    resp_pts     = resp_pts_map.get(resp_score, 0)
    points      += resp_pts

    has_media_queries      = html.get("has_media_queries",      False)
    has_responsive_markers = html.get("has_responsive_markers", False)
    has_responsive_images  = html.get("has_responsive_images",  False)
    has_mobile_nav         = html.get("has_mobile_nav",         False)

    if resp_score == 4:
        pass  # 4/4 — no finding needed

    else:
        # Per-signal findings — fire for each failed signal regardless of score
        if not has_media_queries:
            findings.append({
                "text": "No CSS media queries detected — the code that adapts your layout for different screen sizes may be missing or loaded externally. Verify your site stacks and resizes correctly on mobile by checking it in Chrome DevTools (F12 → device icon → select a phone).",
                "severity": "warning" if resp_score == 3 else "critical",
                "kb_key": "RESPONSIVE_NO_MEDIA_QUERIES",
            })
        if not has_responsive_markers:
            findings.append({
                "text": "No responsive framework detected. If your site wasn't built with a mobile-first framework, verify the layout adapts correctly on common phone screen sizes (375px, 390px, 414px wide).",
                "severity": "warning" if resp_score == 3 else "critical",
                "kb_key": "RESPONSIVE_NO_MARKERS",
            })
        if not has_responsive_images:
            findings.append({
                "text": "Images aren't configured to scale for different screen sizes (no srcset detected). This can cause oversized images on mobile — slower loads and layout issues for smartphone visitors.",
                "severity": "warning" if resp_score == 3 else "critical",
                "kb_key": "RESPONSIVE_NO_IMAGES",
            })
        if not has_mobile_nav:
            findings.append({
                "text": "No mobile navigation detected. Confirm your menu is accessible and usable on small screens — a hamburger or collapsible nav is standard for mobile visitors.",
                "severity": "warning" if resp_score == 3 else "critical",
                "kb_key": "RESPONSIVE_NO_NAV",
            })

        # Additional critical finding for ≤2/4 — conversion impact
        if resp_score <= 2:
            findings.append({
                "text": "A responsive mobile experience is the single highest-leverage conversion factor for smartphone visitors — over 70% of local searches happen on mobile. Visitors who encounter a broken or difficult layout leave immediately. Fixing responsive design gaps should be prioritized ahead of any other website improvement.",
                "severity": "critical",
                "kb_key": "RESPONSIVE_DESIGN_WEAK",
            })

    # ── Tap targets (15 pts) — PSI a11y ──────────────────────────
    target_score = a11y.get("psi_a11y_target_size")
    if target_score == 1.0:
        points += 15
        target_pts = 15
    elif target_score == 0.0:
        target_pts = 0
        findings.append({
            "text": "Tap targets too small — buttons and links are below the recommended 48×48px minimum. On mobile, small tap targets cause mis-taps and frustrated visitors. Increase button padding and spacing between clickable elements.",
            "severity": "critical",
        })
    else:
        # None — PSI not available, award neutral partial
        points    += 7
        target_pts = 7

    # ── Color contrast (10 pts) — PSI a11y ───────────────────────
    contrast_score = a11y.get("psi_a11y_color_contrast")
    if contrast_score == 1.0:
        points      += 10
        contrast_pts = 10
    elif contrast_score == 0.0:
        contrast_pts = 0
        findings.append({
            "text": "Color contrast fails accessibility standards — text is not legible enough against its background. Low contrast is harder to read on mobile screens in sunlight. Use WebAIM's contrast checker (webaim.org/resources/contrastchecker) to identify and fix failing text/background combinations.",
            "severity": "warning",
        })
    else:
        # None — PSI not available, no partial credit (signal untestable)
        contrast_pts = 0

    ux_signal_pts = {
        "viewport":        {"earned": vp_pts,       "max": 40},
        "responsive":      {"earned": resp_pts,      "max": 35},
        "tap_targets":     {"earned": target_pts,    "max": 15},
        "color_contrast":  {"earned": contrast_pts,  "max": 10},
    }

    return min(100, points), findings, ux_signal_pts


# ════════════════════════════════════════════════════════════════
# PRIORITY ACTIONS
# ════════════════════════════════════════════════════════════════

def build_priority_actions(
    html, serp, labs_data,
    kw_3pack, kw_city_visible, kw_local_visible, kw_invisible,
    near_miss, unexpected_3pack, vertical="service", primary_type=None,
):
    actions = []

    def add(pillar, action, effort, impact, why_now):
        actions.append({
            "rank":    len(actions) + 1,
            "pillar":  pillar,
            "action":  action,
            "effort":  effort,
            "impact":  impact,
            "why_now": why_now,
        })

    # ── ALWAYS CRITICAL ───────────────────────────────────────────
    if not html.get("ga4"):
        add("P2",
            "Install GA4 via GTM with conversion events",
            "Low", "High",
            "You are completely blind to what's working on your website.")

    if not kw_3pack:
        # No confirmed 3-pack presence
        if kw_city_visible or kw_local_visible:
            # Maps visible — two-action pattern
            best_kw  = None
            best_pos = 99
            for kw in (kw_city_visible | kw_local_visible):
                _, pos, _ = _extract_positions(serp.get(kw, {}))
                pos = pos or 99
                if pos < best_pos:
                    best_pos = pos
                    best_kw  = kw
            if best_kw:
                why_now_text = (
                    f"You're ranking on '{best_kw}' from your closest origins but visibility "
                    f"drops off with distance. Building review velocity and strengthening "
                    f"category signals will extend your Map Pack presence across more of your trade area."
                )
                add("P1",
                    f"Push '{best_kw}' into Map Pack top 3 — review velocity + content signals",
                    "Medium", "High",
                    why_now_text)
            if kw_invisible:
                add("P1",
                    f"Expand category signal for zero-visibility keywords — GBP services list + website content",
                    "Low", "High",
                    f"No Maps presence for: {', '.join(list(kw_invisible)[:2])}. "
                    f"Google doesn't associate you with these terms yet.")
        else:
            # Completely invisible
            add("P1",
                "GBP optimization + review generation campaign",
                "Medium", "High",
                "Zero Maps presence for any keyword tested. Category recognition problem.")

    booking_path_type = html.get("booking_path_type", "none")
    if booking_path_type == "contact_form_only":
        add("P2",
            "Replace contact form with self-scheduling link",
            "Medium", "High",
            "A contact form requires a callback before a visitor can book — "
            "every friction point costs conversions. A self-scheduling link converts immediately.")
    elif booking_path_type == "none":
        add("P2",
            "Implement booking path with above-fold CTA",
            "Medium", "High",
            "No booking path detected. Visitors have no way to self-schedule.")

    # ── ALWAYS HIGH ───────────────────────────────────────────────
    if html.get("ga4") and not html.get("gtm"):
        add("P2",
            "Verify GA4 conversion events — add GTM for proper event tracking",
            "Low", "High",
            "GA4 without GTM likely misses conversion events entirely.")

    if not html.get("click_to_call"):
        add("P2",
            "Add click-to-call (tel: link) to header and mobile nav",
            "Low", "High",
            "Mobile visitors cannot call directly. Direct conversion path missing.")

    schema_types  = html.get("schema_types", [])
    schema_result = evaluate_schema(primary_type, schema_types)
    if schema_result["status"] != "present":
        add("P1",
            f"Add {schema_result['recommended']} schema markup to website",
            "Low", "Medium",
            schema_result["finding"]["text"])

    # ── NEAR-MISS OPPORTUNITY ─────────────────────────────────────
    if near_miss and len(actions) < 7:
        top_nm = near_miss[0]
        add("P1",
            f"Convert near-miss keyword '{top_nm['keyword']}' to Map Pack — "
            f"targeted content + review push",
            "Medium", "High",
            f"Ranking position #{top_nm['rank']} with {top_nm.get('volume', '?')} monthly searches. "
            f"One review push from the top 3.")

    if not html.get("webp") and len(actions) < 8:
        add("P2",
            "Convert images to WebP format",
            "Low", "Medium",
            "WebP reduces image payload 25–35%. Direct mobile load time improvement.")

    # Cap at 8, renumber
    actions = actions[:8]
    for i, a in enumerate(actions):
        a["rank"] = i + 1

    return actions


# ════════════════════════════════════════════════════════════════
# MAIN SCORING FUNCTION
# ════════════════════════════════════════════════════════════════

def identify_primary_competitor(audit_data, keyword_scores, client_reviews, client_da, client_rating):
    """
    Identifies the single most dominant competitor from dual-grid scan data,
    builds their profile using available DFS top3 data, and generates the
    WHY they're winning narrative.

    Decision tree for why_winning:
      1. If comp reviews > client reviews × 2 AND comp_da > client_da × 1.4:
         → review volume + domain authority both gaps
      2. If comp reviews > client reviews × 2:
         → review volume is primary gap
      3. If comp_da > client_da × 1.4 AND comp reviews < client reviews:
         → domain authority gap despite fewer reviews (category/content signals)
      4. If comp reviews < client reviews AND comp_da ≈ client_da:
         → GBP category / content structure gap

    Returns dict for competitor_intel or None if no data.
    """
    from collections import defaultdict

    client_domain = (audit_data.get("url", "").replace("https://","").replace("http://","")
                     .split("/")[0].replace("www.", ""))

    serp_data = audit_data.get("serp", {})
    nm_tally  = defaultdict(lambda: {"count": 0, "rating": None,
                                      "review_count": None, "domain": None,
                                      "category": None, "positions": {}})
    city_tally = defaultdict(lambda: {"count": 0})

    for kw, kw_data in serp_data.items():
        kw_type = keyword_scores.get(kw, {}).get("type", "unknown")
        svc     = keyword_scores.get(kw, {}).get("service", "")
        tally   = nm_tally if kw_type == "near_me" else city_tally

        for zcta, od in kw_data.get("origins", {}).items():
            for item in od.get("top3", []):
                item_domain = (item.get("domain") or "").replace("www.", "")
                if client_domain and client_domain in item_domain:
                    continue
                title = (item.get("title") or "").strip()
                if not title:
                    continue
                if item.get("rank") == 1:
                    tally[title]["count"] += 1
                if kw_type == "near_me":
                    # store position per service for surface_positions
                    if svc and "maps_nm" not in nm_tally[title]["positions"].get(svc, {}):
                        nm_tally[title]["positions"].setdefault(svc, {})["maps_nm"] = item.get("rank")
                    if nm_tally[title]["rating"] is None and item.get("rating"):
                        nm_tally[title]["rating"] = item["rating"]
                    if nm_tally[title]["review_count"] is None and item.get("review_count"):
                        nm_tally[title]["review_count"] = item["review_count"]
                    if nm_tally[title]["domain"] is None and item.get("domain"):
                        nm_tally[title]["domain"] = item["domain"]
                    if nm_tally[title]["category"] is None and item.get("category"):
                        nm_tally[title]["category"] = item["category"]

    if not nm_tally:
        return None

    # Pick top competitor by near me frequency, break tie by city frequency
    top_name = max(nm_tally.keys(),
                   key=lambda t: (nm_tally[t]["count"], city_tally.get(t, {}).get("count", 0)))
    data = nm_tally[top_name]

    comp_rev  = data["review_count"] or 0
    comp_da   = 0   # filled by Moz call in rules engine (not available here)
    comp_rd   = 0   # same
    comp_rating = data["rating"]
    comp_domain = data["domain"] or "—"
    comp_cat    = data["category"] or "—"
    freq_nm     = data["count"]
    freq_city   = city_tally.get(top_name, {}).get("count", 0)

    # WHY they're winning (data-driven where available, content-based fallback)
    cr = client_reviews or 0
    cd = client_da or 0
    if comp_rev > cr * 2 and comp_da > cd * 1.4:
        why = (f"<strong>{top_name}'s advantage compounds two gaps: review volume and domain authority.</strong> "
               f"With {comp_rev:,} reviews vs. your {cr}, they have a {round(comp_rev/max(cr,1),1)}× review advantage. "
               f"Combined with higher domain authority, Google's local ranking algorithm weights both signals heavily "
               f"for searchers beyond your immediate block. Closing either gap narrows this lead.")
    elif comp_rev > cr * 2:
        why = (f"<strong>Review volume is the primary gap.</strong> {top_name} has {comp_rev:,} reviews vs. your {cr} — "
               f"a {round(comp_rev/max(cr,1),1)}× difference. At the same proximity from a searcher, "
               f"Google's algorithm weights review count as a trust signal. Your quality signals (rating, GBP) "
               f"are competitive. Closing the review gap to within ~50 reviews is the primary lever.")
    elif comp_da > cd * 1.4 and comp_rev < cr:
        why = (f"<strong>Domain authority is the gap — not reviews.</strong> {top_name} outranks you despite having "
               f"fewer reviews ({comp_rev:,} vs. your {cr}). Their domain carries more weight from backlinks and "
               f"directory citations. GBP category signals and content structure may also play a role. "
               f"Study their directory presence and service page architecture.")
    else:
        why = (f"<strong>GBP category and content structure are the likely gaps.</strong> {top_name} appears "
               f"{freq_nm} times as the #1 near me result. Their review count ({comp_rev:,}) is comparable "
               f"to yours. The advantage likely comes from GBP primary category selection and dedicated "
               f"service page structure with city-targeted content — neither requires an agency to fix.")

    # Build surface_positions from collected data
    surface_positions = {}
    for svc, pos_data in data["positions"].items():
        surface_positions[svc] = {
            "maps_nm":       pos_data.get("maps_nm"),
            "lf_nm":         pos_data.get("lf_nm"),
            "maps_city":     None,  # city positions not tracked per competitor in current data
            "lf_city":       None,
            "client_maps_nm": None,  # filled by report generator from client keyword_scores
        }

    return {
        "name":              top_name,
        "domain":            comp_domain,
        "rating":            comp_rating,
        "review_count":      comp_rev,
        "da":                comp_da,       # 0 until Moz enrichment in rules engine
        "referring_domains": comp_rd,       # 0 until Moz enrichment in rules engine
        "gbp_category":      comp_cat,
        "frequency_near_me": freq_nm,
        "frequency_city":    freq_city,
        "why_winning":       why,
        "surface_positions": surface_positions,
        "action_callout":    None,  # generated by report builder using domain
    }


# ════════════════════════════════════════════════════════════════
# VERTICAL NORMALIZATION
# ════════════════════════════════════════════════════════════════

def normalize_vertical(biz_vertical, primary_type=None, biz_type=None):
    """
    Maps BIZ_VERTICAL strings from intake form to scoring engine keys.

    Intake strings                    → Scoring key
    ──────────────────────────────────────────────────
    "Food & Beverage"                 → "restaurant"
    "Beauty & Wellness"               → "medspa" or "salon" (via primary_type)
    "Fitness & Training"              → "fitness" (falls back to "service" in threshold dicts)
    "Home & Professional Services"    → "home_trade" / "professional_service" / "real_estate"
    anything else                     → "service"

    primary_type (GBP primaryType) used as tiebreaker for Beauty sub-verticals.
    biz_type (BIZ_TYPE from intake) used to route Home & Professional Services sub-types.
    """
    v  = (biz_vertical or "").strip()
    pt = (primary_type or "").lower()
    bt = (biz_type or "").lower()

    if "food" in v.lower() or "beverage" in v.lower():
        return "restaurant"

    if "beauty" in v.lower() or "wellness" in v.lower():
        MEDSPA_TYPES = {"medical_spa", "med_spa", "skin_care_clinic",
                        "laser_hair_removal_service", "aesthetics"}
        return "medspa" if pt in MEDSPA_TYPES else "salon"

    if "fitness" in v.lower() or "training" in v.lower() or "health" in v.lower():
        return "fitness"

    if "home" in v.lower() or "professional" in v.lower():
        # Route to real_estate key
        if "real estate" in bt or "real_estate" in bt or "realtor" in bt:
            return "real_estate"
        # Route to professional_service key
        PROF_BIZ_TYPES = {
            "accounting", "cpa", "legal", "law", "attorney", "financial",
            "insurance", "marketing", "it support", "it_support", "tutoring",
            "photography",
        }
        if any(p in bt for p in PROF_BIZ_TYPES):
            return "professional_service"
        # Default home & professional → home_trade
        return "home_trade"

    # Direct scoring key passthrough (already normalized)
    KNOWN_KEYS = {"restaurant", "medspa", "salon", "gym", "fitness", "service",
                  "home_trade", "professional_service", "real_estate"}
    if v.lower() in KNOWN_KEYS:
        return v.lower()

    return "service"


# ════════════════════════════════════════════════════════════════
# MAIN ORCHESTRATOR
# ════════════════════════════════════════════════════════════════

def calculate_scores(audit_data):
    """
    Main entry point. Orchestrates all category scoring functions
    and assembles the complete scores dict consumed by the report generator.

    audit_data must contain:
      gbp, yelp, serp, local_finder, labs_data, whois, html,
      pagespeed, crux, psi_accessibility, keywords,
      moz, gbp_posts, content_depth, vertical, city, owner_services

    Returns complete scores dict.
    """
    gbp            = audit_data.get("gbp", {})
    serp           = audit_data.get("serp", {})
    labs_data      = audit_data.get("labs_data", {})
    local_finder   = audit_data.get("local_finder", {})
    whois          = audit_data.get("whois", {})
    html           = audit_data.get("html", {})
    psi            = audit_data.get("pagespeed", {})
    crux           = audit_data.get("crux", {})
    vertical       = normalize_vertical(
                         audit_data.get("vertical", "service"),
                         primary_type=audit_data.get("gbp", {}).get("primary_type"),
                         biz_type=audit_data.get("biz_type", ""))
    city           = audit_data.get("city", "Seattle").split(",")[0].strip()
    keywords       = audit_data.get("keywords", [])
    moz            = audit_data.get("moz", {})
    gbp_posts      = audit_data.get("gbp_posts", {})
    content_depth  = audit_data.get("content_depth", {})
    # ── PILLAR 1 ─────────────────────────────────────────────────
    gbp_score, gbp_findings, gbp_cat_opportunity, gbp_signal_pts = score_gbp_strength(
        gbp,
        gbp_posts=gbp_posts,
        owner_services=audit_data.get("owner_services", []),
        vertical=vertical,
        serp=serp,
    )
    onpage_score,  onpage_findings, onpage_signal_pts            = score_onpage_relevance(
        html, city, content_depth,
        primary_type=gbp.get("primary_type") or gbp.get("primary_category"))
    trust_score,   trust_findings, trust_meta, trust_signal_pts  = score_domain_trust(whois, moz, vertical)

    (mappack_score,
     scenario,
     kw_3pack,
     kw_city_visible,
     kw_local_visible,
     kw_invisible,
     mappack_findings,
     keyword_scores,
     unexpected_3pack,
     near_miss,
     competitor_leaderboard,
     local_reach,
     regional_reach,
     diagnosis,
     near_me_score,
     city_score) = score_search_visibility(serp, local_finder, vertical, keywords)

    p1 = round(
        gbp_score     * 0.20 +
        mappack_score * 0.60 +
        onpage_score  * 0.10 +
        trust_score   * 0.10
    )

    # ── PILLAR 2 ─────────────────────────────────────────────────
    # Inject WebP keys from html into psi so score_mobile_performance can read them.
    # WebP is detected by the rules engine HTML fetch, not PSI. (v4.41)
    psi_with_webp = dict(psi)
    psi_with_webp["webp_by_extension"] = html.get("webp_by_extension", False)
    psi_with_webp["webp_by_picture"]   = html.get("webp_by_picture",   False)
    psi_with_webp["webp_by_css"]       = html.get("webp_by_css",       False)
    perf_score,   perf_findings,  data_source, perf_signal_pts = score_mobile_performance(psi_with_webp)
    conv_score,   conv_findings,  conv_signal_pts              = score_conversion_infrastructure(html, vertical=vertical)
    ux_score,     ux_findings,    ux_signal_pts                = score_mobile_ux(html, audit_data.get("psi_accessibility"))

    # PSI failure detection: performance=None means fetch_psi() returned the null
    # dict (timeout or API error). performance=0 is a real (bad) score — still scored.
    psi_failed = psi.get("performance") is None

    if psi_failed:
        # Exclude performance from P2 entirely.
        # Reweight conv:ux preserving original 0.40:0.25 ratio → 0.615:0.385
        p2 = round(
            conv_score * 0.615 +
            ux_score   * 0.385
        )
        perf_findings = [{
            "text":     "PageSpeed data unavailable for this scan — website performance scoring excluded from this analysis. Re-run the scan to collect performance data.",
            "severity": "warning",
        }]
        perf_signal_pts = {}
    else:
        p2 = round(
            perf_score * 0.35 +
            conv_score * 0.40 +
            ux_score   * 0.25
        )

    # ── PROFILE ──────────────────────────────────────────────────
    if   p1 >= 70 and p2 >= 70: profile = "The Leader"
    elif p1 >= 50 and p2 >= 50: profile = "The Contender"
    elif p1 >= 50 and p2 <  50: profile = "The Leaky Bucket"
    elif p1 <  50 and p2 >= 50: profile = "The Hidden Gem"
    else:                        profile = "The Invisible Closer"

    # ── PRIORITY ACTIONS ─────────────────────────────────────────
    actions = build_priority_actions(
        html, serp, labs_data,
        kw_3pack, kw_city_visible, kw_local_visible, kw_invisible,
        near_miss, unexpected_3pack, vertical,
        primary_type=gbp.get("primary_type") or gbp.get("primary_category"),
    )

    return {
        "p1":        p1,
        "p2":        p2,
        "profile":   profile,
        "p1_tier":   get_tier(p1),
        "p2_tier":   get_tier(p2),
        "categories": {
            "gbp_strength": {
                "score":                gbp_score,
                "tier":                 get_tier(gbp_score),
                "weight":               "55%",
                "findings":             gbp_findings,
                "category_opportunity": gbp_cat_opportunity,
                "signal_pts":           gbp_signal_pts,
            },
            "mappack": {
                "score":                mappack_score,
                "tier":                 get_tier(mappack_score),
                "weight":               "20%",
                "findings":             mappack_findings,
                "scenario":             scenario,
                "kw_3pack":             list(kw_3pack),
                "kw_city_visible":      list(kw_city_visible),
                "kw_local_visible":     list(kw_local_visible),
                "kw_invisible":         list(kw_invisible),
                "keyword_scores":       keyword_scores,
                "unexpected_3pack":     unexpected_3pack,
                "near_miss":            near_miss,
                "competitor_leaderboard": competitor_leaderboard,
                "local_reach":          local_reach,
                "regional_reach":       regional_reach,
                "near_me_score":        near_me_score,
                "city_score":           city_score,
                "diagnosis":            diagnosis,
            },
            "onpage": {
                "score":       onpage_score,
                "tier":        get_tier(onpage_score),
                "weight":      "15%",
                "findings":    onpage_findings,
                "signal_pts":  onpage_signal_pts,
            },
            "trust": {
                "score":             trust_score,
                "tier":              get_tier(trust_score),
                "weight":            "10%",
                "findings":          trust_findings,
                "da":                trust_meta.get("da"),
                "referring_domains": trust_meta.get("referring_domains"),
                "signal_pts":        trust_signal_pts,
            },
            "performance": {
                "score":       perf_score,
                "tier":        get_tier(perf_score),
                "weight":      "35%",
                "findings":    perf_findings,
                "data_source": data_source,
                "signal_pts":  perf_signal_pts,
            },
            "conversion": {
                "score":      conv_score,
                "tier":       get_tier(conv_score),
                "weight":     "40%",
                "findings":   conv_findings,
                "signal_pts": conv_signal_pts,
            },
            "ux": {
                "score":      ux_score,
                "tier":       get_tier(ux_score),
                "weight":     "25%",
                "findings":   ux_findings,
                "signal_pts": ux_signal_pts,
            },
        },
        "actions":         actions,
        "serp_data":       serp,
        "labs_data":       labs_data,
        "competitor_intel": identify_primary_competitor(
            audit_data,
            keyword_scores,
            client_reviews = gbp.get("review_count", 0),
            client_da      = trust_meta.get("da", 0),
            client_rating  = gbp.get("rating", 0),
        ),
    }


# ════════════════════════════════════════════════════════════════
# RUN
# ════════════════════════════════════════════════════════════════

scores = calculate_scores(audit_data)
cats = scores["categories"]
trust = cats.get("trust", {})
print(f"Scoring complete — P1: {scores['p1']}  P2: {scores['p2']}  Profile: {scores['profile']}")
print(f"  GBP Strength:    {cats['gbp_strength']['score']}/100  (55%)")
print(f"  Map Pack:        {cats['mappack']['score']}/100  (20%)")
print(f"    Near Me Score: {cats['mappack']['near_me_score']}/100  (Peak+Breadth)")
print(f"    City Score:    {cats['mappack']['city_score']}/100  (Peak+Breadth)")
print(f"    Diagnosis:     {cats['mappack']['diagnosis']}")
print(f"  On-Page:         {cats['onpage']['score']}/100  (15%)")
print(f"  Domain Trust:    {trust.get('score','?')}/100  (10%)  DA={trust.get('da','?')}  RD={trust.get('referring_domains','?')}")
print(f"  P2 Performance:  {cats['performance']['score']}/100  (45%)")
print(f"  P2 Conversion:   {cats['conversion']['score']}/100  (35%)")
print(f"  P2 UX:           {cats['ux']['score']}/100  (20%)")
ci = scores.get("competitor_intel")
if ci:
    print(f"  Primary Competitor: {ci['name']}  ({ci['frequency_near_me']} near me appearances · {ci['frequency_city']} city)")
else:
    print(f"  Primary Competitor: None identified from scan data")
