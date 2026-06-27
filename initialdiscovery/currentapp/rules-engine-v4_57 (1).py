# ════════════════════════════════════════════════════════════════
# GROWTHPATH ENGINE v4.58
#
# v4.58 changes (fetch_html Playwright render — JS/DOM + network capture):
#   fetch_html(): Always renders homepage via headless Playwright Chromium
#     (async API + nest_asyncio for Colab). Existing signal extraction moved
#     to extract_html_signals(); static requests.get() retained as fallback.
#   Network request capture ORs into named_platforms fingerprints (booking
#     widgets that phone home without visible DOM). Additive keys:
#     render_used, render_ok, html_source, booking_source.
#   HTML_FETCH_DEBUG_DIFF config toggle prints static vs rendered diff.
#
# GROWTHPATH ENGINE v4.57
#
# v4.57 changes (Trade-area selection redesign — radial near-me + banded-radial city):
#   resolve_trade_area(): unified v4.56 sector-rotation dispersion REPLACED by
#     two independent passes sharing a used-set.
#   - NEAR-ME (<5mi, all tiers identical): home ZCTA (geocoded postal_code) is
#     always slot 1 and pop-exempt; remaining picks via select_near_me_radial()
#     — radial farthest-point on the DISTANCE axis from business coords, pop>0
#     guard, directional-spread + pop tiebreak. Samples 0->5mi at even radial
#     intervals (the near-me visibility-reach curve) instead of clustering.
#   - CITY (>=5mi, tier-scoped): select_city_banded() allocates city_target
#     slots across city_bands by candidate availability, then _radial_bearing()
#     fills each band by even angular spread (pop seed + tiebreak). Retires the
#     N-first sector rotation that under-covered SW/W in low-quota bands.
#   - SELECTION distance is measured from the business's real coords (front
#     door); SCAN origins remain centroids (preserves the Sapien finding that
#     front-door near-me scans win on proximity alone and are non-diagnostic).
#   - select_dispersed_origins() removed. New: select_near_me_radial(),
#     select_city_banded(), _radial_bearing(), _quadrant_of(), _ang_dist().
#   - TRADE_AREA_TIER_CONFIG restructured: near_me_cap + city_target + city_bands.
#       basic:            5 near-me + up to 5 city  (bands 5-7.5 / 7.5-10)
#       advanced_premium: 5 near-me + up to 15 city (bands 5-9 / 9-13 / 13-16 / 16-20)
#   - Return dict adds home_zcta and _ring_info (diagnostic). near_me_origins /
#     city_origins / origins(alias) / near_me_cumul_pop / nm_stop_reason unchanged.
#   - Stale print version strings fixed (v4.43/v4.39 -> v4.57).
#   Validated in isolation on Sapien (dense, 21 near-me cands), Metamorphosis
#   (suburban large-ZCTA, 4), Sushi Blossom Spokane (sparse, 7, one empty dir) —
#   even dual-axis dispersion, no intra-grid dupes, contract intact.
#   KNOWN UNTESTED: basic tier on real data (near-me identical; city is same
#   function w/ different params). FOLLOW-UP: scoring-engine near-me inverse-
#   distance weighting may interact differently with evenly-spread origins —
#   flagged in Decisions v4.35, not changed here.
#
# GROWTHPATH ENGINE v4.56
#
# v4.56 changes:
#   resolve_trade_area(): Rebuilt as tier-aware sector-rotation dispersion.
#   Replaces the v4.55 population-cap-variable / two-pass-band-first logic.
#
#   New SCAN_TIER config constant (set by intake form, mirrors VERTICAL_KEY
#   pattern): "basic" or "advanced_premium". Selects a fixed-target grid
#   config from TRADE_AREA_TIER_CONFIG instead of static module constants.
#
#     basic:            10 ZCTAs total, city-modifier reach to 10mi
#     advanced_premium: 20 ZCTAs total, city-modifier reach to 20mi
#
#   Near-me boundary (<5mi) is IDENTICAL across both tiers — unchanged
#   from v4.55 behavior. Only city-modifier reach scales by tier.
#   Advanced and Premium intentionally share one grid config; Premium's
#   differentiator is GA4/GSC analysis access (Product doc), not trade
#   area reach.
#
#   Selection algorithm — sector-rotation dispersion (replaces population-
#   cap-stop near-me + two-pass band-first city selection):
#     1. One unified candidate pool gathered out to the tier's max_mi.
#     2. Slots allocated across the tier's distance bands proportional to
#        each band's qualifying-candidate availability (more populous bands
#        get more slots; bands with no candidates get none — no forced
#        scans into water/forest/empty terrain).
#     3. Each band filled by rotating through 8 compass sectors (N/NE/E/SE/
#        S/SW/W/NW), taking the highest-population unused ZCTA per sector,
#        looping until the band's quota is met or candidates exhausted.
#     4. Selected origins split into near_me_origins (<5mi) / city_origins
#        (>=5mi) — same keyword-type boundary as v4.55, applied post-hoc
#        and independent of which allocation band a ZCTA came from.
#
#   Rationale: naive population-ranked selection (the v4.55 approach)
#   clusters toward whichever direction has the densest population,
#   regardless of business location — confirmed on La Rustica (clustered
#   N/NE), Well & Table (clustered NW/W), and structurally validated a
#   third time on M.J. Frick Co. (Nashville — sparser, more concentrated
#   market). Sector-rotation achieved 7-8/8 compass sectors covered across
#   all three test businesses vs. 5/8 for naive selection. The platform's
#   core value (the decay plot showing where visibility falls off) requires
#   measuring real low-population directions, not hiding them behind a
#   population floor — so TRADE_AREA_MIN_POP also drops 1,000 → 250 in this
#   version, now functioning purely as a within-sector population tiebreak,
#   not a coverage gate.
#
#   KNOWN OPEN ISSUE (not fixed in this version): water-crossing candidates.
#   Distance is haversine (straight-line) — for coastal/peninsula businesses
#   this can select a ZCTA that is geographically close but practically
#   unreachable (confirmed: La Rustica selecting Gig Harbor/Bremerton across
#   Puget Sound). Needs land-mask filtering against a coastline polygon.
#   Logged in Decisions v4.34, not yet built.
#
#   Validated via three isolated Colab tests prior to this port:
#   zcta_distribution_test.py, zcta_dispersion_test.py, tier_comparison_test.py
#   — see SEO-Engine-Decisions-v4_34.md for full validation detail.
#
#   Return shape UNCHANGED for backward compatibility — still returns
#   near_me_origins / city_origins / origins (alias) / near_me_cumul_pop /
#   nm_stop_reason. Origin dict fields unchanged: zcta, lat, lng, dist_mi,
#   pop, name, band, zoom_override (near-me only). Viewport zoom_override
#   correction step and reverse-geocoding step both preserved unmodified.
#   Downstream consumers (generate_report_v6_58.py, scoring-engine-v4_68.py)
#   require no changes — confirmed via dependency check before this rewrite.
#
# ════════════════════════════════════════════════════════════════
# GROWTHPATH ENGINE v4.55
#
# v4.55 changes:
#   resolve_trade_area(): Grid origin selection redesigned.
#
#   Near me grid:
#     TRADE_AREA_NM_CAP reduced 8 → 5. Rationale: 8 origins within
#     5mi overshoots the meaningful proximity trade area for most ICP
#     businesses and inflates scan cost. 5 captures the full near-me
#     story while reducing surface calls per keyword by 3 origins.
#     Cumulative population cap (200k) and distance cap (5mi) unchanged.
#
#   City grid — new two-pass band-first selection (replaces 2-per-band):
#     Previous logic: top 2 ZCTAs by population per band → up to 8 origins.
#     New logic targets 5 origins with geographic coverage guaranteed first:
#
#     Pass 1 (band guarantee): 1 origin per populated distance band,
#     selected by highest population within that band. Ensures at least
#     one scan origin per distance ring (5–9mi, 9–13mi, 13–17mi, 17–20mi)
#     regardless of where metro population concentrates. Max 4 origins.
#
#     Pass 2 (fill to target): Remaining unused city candidates sorted by
#     population desc. Each candidate checked against ALL already-selected
#     origins using 2mi minimum spacing guard. First candidate that clears
#     spacing is added until target (5) is reached or candidates exhausted.
#
#     Rationale: population density is the selection filter (which ZCTAs
#     represent real search demand) but geographic distance spread is the
#     goal (showing business owners where they rank across their trade area).
#     Band-first guarantee ensures the map and rank grid tell a complete
#     geographic story. Pass 2 fills with the highest-value remaining
#     candidate, spacing guard prevents clustering.
#
#     Validated on two test businesses (Raleigh NC, Woodinville WA):
#     correct geographic spread, spacing validation clean on all pairs,
#     trim/promotion logic firing as designed.
#
#   resolve_trade_area(): Census API key parameter added.
#     ACS endpoint (api.census.gov/data/2023/acs/acs5) now requires API key.
#     New parameter: census_api_key (str). Passed as "key" in ACS request.
#     Free key available at https://api.census.gov/data/key_signup.html
#     New config constant: CENSUS_API_KEY. Must be set before running.
#     ACS fallback (synthetic min_pop) retained for cases where ACS is
#     unavailable — key failure logs a WARNING and falls back gracefully.
#
# v4.54 changes:
#   fetch_gbp(): DFS reviews task_post timeout raised 30s → 60s.
#     Production failure confirmed on TMRW Aesthetics scan: task_post
#     timed out at 30s before task_id was returned. Test (v1.1) showed
#     task_post succeeds in 0.5s but poll queue takes ~17s to resolve.
#     Root cause: 30s timeout was too tight on slow DFS queue days.
#     Fix: task_post timeout raised to 60s. Poll timeout unchanged at 30s.
#   fetch_gbp(): DFS reviews poll loop hardened.
#     Old loop only checked for status_code == 20000 to break.
#     Any other status (40601 Task Handed, 40602 Task In Queue) caused
#     the loop to sleep and retry correctly, but unexpected codes had
#     no handling. New loop: explicit pending set {40100, 40101, 40601,
#     40602} continues polling; terminal set {40400, 40401, 40500, 50000}
#     breaks with warning; unknown codes log and continue. sleep(5)
#     moved to top of loop so first poll waits before hitting API.
#
# v4.53 changes:
#
# v4.53 changes:
#   fetch_html(): Estimate/quote slug patterns added to _BOOKING_SLUG_INTERNAL.
#
#   Problem: Businesses using /get-an-estimate, /free-estimate, /quote-form,
#   or similar slugs as their primary conversion page were falling through to
#   contact_form_only. These slugs are unambiguous estimate/quote intent but
#   were absent from the internal slug regex, which only covered book*/
#   schedul*/appointment*/online-booking/scorpion-scheduling patterns.
#   Confirmed false negative: Central Washington Heating and Air — homepage
#   nav contains href="/get-an-estimate" (visible in static HTML via web_fetch)
#   but scanner returned contact_form_only.
#
#   Fix: four new patterns added to _BOOKING_SLUG_INTERNAL:
#     /get-an-estimate, /get-a-estimate  (get[-_]an?[-_](estimate|quote))
#     /request-an-estimate, /request-a-quote  (request[-_]an?[-_](estimate|quote))
#     /free-estimate, /free-quote  (free[-_](estimate|quote)s?)
#     /estimates, /quotes, /quote-form  ((estimate|quote)s?(?:[-_]form)?)
#
#   Scope: all verticals — estimate/quote slugs are unambiguous intent
#   signals with no vertical-specific false positive risk.
#
#   Classification: booking_path_type = "generic_booking",
#   booking_detection_method = "internal_slug" (same as existing slug logic).
#   Points: 30pts for home_trade/professional_service (consistent with
#   existing internal_slug scoring — dedicated page is real infrastructure).
#
#   Validated: 12/12 test cases pass (7 true positives, 5 false positive
#   guards) in isolated Colab test. No false positives on /electrical-services/,
#   /service-area/, /blog/how-to-get-estimate, /about, /financing.
#
# v4.52 changes:
#   fetch_html(): Athena Health scheduling added to named_platforms.
#   Fingerprint: "scheduling.athena.io" in html_lower.
#   Used by medical spas and medical-adjacent practices.
#   Confirmed booking URL pattern: consumer.scheduling.athena.io/?locationId=...
#   Added to BEAUTY_WELLNESS_PLATFORMS to gate correctly on beauty/wellness vertical.
#   Previously: Athena booking URL detected as generic_booking (external_url)
#   because platform wasn't fingerprinted. Now scores as named_platform.
#
# v4.51 changes:
#   fetch_html(): _is_beauty and _is_beauty_vertical checks fixed.
#   Both previously matched against normalized scoring keys
#   ("medspa", "salon", etc.) — but fetch_html() receives BIZ_VERTICAL
#   (the raw intake string, e.g. "Beauty & Wellness"), not VERTICAL_KEY.
#   Fix: switched to substring match consistent with _is_fb pattern:
#     OLD: _is_beauty = vertical in ("medspa", "salon", "beauty", "spa", "day_spa")
#     NEW: _is_beauty = "beauty" in (vertical or "").lower() or "wellness" in (vertical or "").lower()
#   Same fix applied to _is_beauty_vertical (subdomain fallback scope).
#   Impact: Mangomint, MyAestheticsPro, and all BEAUTY_WELLNESS_PLATFORMS
#   now correctly score as named_platform for "Beauty & Wellness" vertical.
#   Previously fell through to generic_booking ("Scheduling link ✓").
#
# v4.50 changes:
#   fetch_html(): Platform library expansion + two detection fixes.
#
#   (1) Boulevard detection hardened — blvd.co added as fingerprint.
#       Previous detection: "boulevard" in html_lower (text string only).
#       Problem: Boulevard booking widget embeds link to blvd.co (confirmed
#       via Boulevard/create-booking-flow GitHub repo — dev-support@blvd.co,
#       NEXT_PUBLIC_BLVD_PLATFORM env var). Sites using the widget embed may
#       have blvd.co hrefs in HTML with no "boulevard" word present at all.
#       Fix: boulevard_present = "blvd.co" in html_lower OR
#            "boulevard" in html_lower. Either signal fires detection.
#
#   (2) Acuity detection hardened — as.me short URL added.
#       Previous detection: "acuityscheduling.com" in html_lower only.
#       Problem: Acuity booking pages use as.me as their short booking URL
#       (e.g. {biz}.as.me). Sites often only expose this in HTML hrefs —
#       the full acuityscheduling.com domain may never appear.
#       Fix: "acuityscheduling.com" in html_lower OR "as.me" in html_lower.
#
#   (3) New beauty/spa/medspa platforms added to named_platforms (v4.50):
#       mangomint   — mangomint.com — fast-growing medspa/salon platform
#       glossgenius — glossgenius.com — popular with independent salons/medspas
#       phorest     — phorest.com — salon/spa, growing US presence
#       simplybook  — simplybook.me — multi-vertical, common in smaller markets
#       daysmart    — daysmartspa.com / daysmart.com — spa/salon, legacy installs
#       All 5 added to BEAUTY_WELLNESS_PLATFORMS vertical filter to block
#       false positives on non-beauty verticals.
#
#   (4) Wodify added to fitness platforms:
#       wodify — wodify.com — CrossFit/functional fitness specific
#
# v4.49 changes:
#   fetch_html(): Two booking detection upgrades.
#
#   (1) MyAestheticsPro added to named_platforms (beauty/wellness block).
#       Confirmed false negative: Face KC Medical Spa (Kansas City) uses
#       MyAestheticsPro booking platform — multiple "Book Now" links in HTML
#       routing to web2.myaestheticspro.com. Domain fingerprint:
#       "myaestheticspro.com" in html_lower. Root cause: platform not in
#       named_platforms library — scanner fell through to quote_form.
#       Added to BEAUTY_WELLNESS_PLATFORMS vertical-aware filter to block
#       false positives on non-beauty verticals (same pattern as boulevard
#       false positive on Southern Insurance Group, v4.19).
#
#   (2) External booking subdomain fallback detection added (medspa/salon scope).
#       Problem: external booking platforms that host on non-standard URL paths
#       (e.g. /BN/index.cfm, /webstoreNew/services) are invisible to the path-
#       keyword regex in has_booking_url. These platforms use booking-adjacent
#       subdomains (web2., book., app., booking., schedule., portal., client.)
#       that are a reliable proxy for real scheduling infrastructure — even when
#       the path contains no booking keyword.
#       Fix: new _BOOKING_SUBDOMAIN_FALLBACK check scans all external hrefs for
#       booking-adjacent subdomain patterns. Scoped to medspa and salon verticals
#       only to minimize false positives on home services (where app. and portal.
#       subdomains serve non-booking purposes). Fires AFTER has_booking_url (path-
#       matched external URL) and BEFORE has_booking_cta_hash — sits between them
#       in the detection hierarchy.
#       Detection pattern:
#         ^https?://(web\d+|book|app|booking|schedule|portal|client)\.
#       Classification: booking_path_type = "generic_booking",
#       booking_detection_method = "external_subdomain".
#       Points: same as generic_booking external_url (30pts for medspa/salon,
#       standard generic_booking points for all other verticals).
#       Confirmed fix: Face KC Medical Spa — web2.myaestheticspro.com now
#       caught by BOTH named_platform (fix 1) AND subdomain fallback (fix 2).
#       Fix 2 provides structural defense for any future unknown platform
#       using the same URL architecture.
#
#   Detection hierarchy (updated):
#     named_platform → generic_booking (external URL, path-matched) →
#     generic_booking (external URL, subdomain-matched, medspa/salon) → NEW
#     generic_booking (CTA hash) → generic_booking (internal slug) →
#     quote_form → contact_form_only → none
#
# v4.48 changes:
#   fetch_html(): Internal booking slug detection added.
#
#   Problem: Businesses on white-label website platforms (Scorpion,
#   Broadly, etc.) link to scheduling pages on their own domain using
#   platform-specific slugs (e.g. /scorpion-scheduling/). These are
#   internal links — not caught by external URL detection — but clearly
#   indicate a real scheduling page, not just a contact form.
#   Confirmed false negative: TruTec Electric (Austin TX) — has a 6-step
#   Scorpion scheduling widget at /scorpion-scheduling/, but scanner
#   returned quote_form (misfired on "Get a Quote!" text) instead of
#   generic_booking.
#
#   Fix: new BOOKING_SLUG_INTERNAL regex scans all internal hrefs for
#   dedicated scheduling page patterns. Matches on full path segments
#   (not substrings) to avoid false positives from /electrical-services/,
#   /service-area/, etc. Blog/FAQ/informational exclusion list applied.
#
#   Detection patterns (internal paths):
#     /book[ing|-now|-online|-appointment|-service]
#     /schedul[e|ing][-service|-appointment|-now]
#     /appointment[s]
#     /online[-_]booking
#     /scorpion[-_]scheduling  (Scorpion white-label)
#
#   Exclusion: paths containing /blog/, /faq/, /about/, /review/,
#   /coupon/, /financ/, /career/, /press/, /tip/, /guide/ are skipped.
#
#   Classification: booking_path_type = "generic_booking",
#   booking_detection_method = "internal_slug".
#
#   Points: 30pts for home_trade/professional_service (dedicated page
#   is stronger signal than cta_hash at 25pts, weaker than confirmed
#   quote_form at 35pts or named_platform at 40pts).
#   All other verticals: 30pts (same as other generic_booking).
#
#   Validated: TruTec Electric (fires correctly on /scorpion-scheduling/),
#   Ace Plumbing (does not fire on /contact-us/), Epic Electric (does
#   not fire on /contact-us/), /electrical-services/ (no fire),
#   /blog/how-to-schedule (no fire — excluded). 14/14 test cases pass.
#
#   New output field: booking_detection_method = "internal_slug".
#   Scoring engine: new finding copy branch for "internal_slug" method.
#
# v4.47 changes:
#
# v4.47 changes:
#   fetch_html(): Three booking detection upgrades.
#
#   (1) CTA hash detection — new booking_path_type sub-signal.
#       Detects "Book Online", "Schedule Now", and similar CTAs
#       inside <a href="#"> or <button> tags — the JS modal pattern
#       used by ServiceTitan, Housecall Pro, and other FSM platforms
#       whose widgets are JS-rendered and invisible to static HTML parsing.
#       Pattern: booking CTA text inside tag with href="#" or href="".
#       Classification: sets booking_path_type = "generic_booking" when
#       no named platform or external booking URL found first.
#       New output field: booking_detection_method = "cta_hash" |
#       "external_url" | None — consumed by scoring engine to branch
#       finding copy correctly (existing tool vs. missing tool).
#       Validated: Armstrong Plumbing (ServiceTitan modal → cta_hash),
#       Mainstream Electric (ST modal → cta_hash), Lee's Air (cta_hash),
#       Epic Electric (/contact-us href → stays contact_form_only),
#       Sturm Heating (/contact-us href → stays contact_form_only).
#       Zero false positives across 5 Spokane/Sacramento test sites.
#
#   (2) High-confidence FSM widget fingerprints added to named_platforms.
#       ServiceTitan: static.servicetitan.com/webscheduler/shim.js +
#         STWidgetManager JS global (catches sites that never expose
#         servicetitan.com domain string directly).
#       Housecall Pro: online-booking.housecallpro.com/script.js +
#         HCPWidget JS global + hcp-lead-iframe pattern.
#       Jobber: clienthub.getjobber.com + CloudFront asset pair
#         d3ey4dbjkt2f6s.cloudfront.net (confirmed embed fingerprint).
#       Source: ChatGPT deep research report "Online Booking and Form
#       Platform Fingerprinting for Home Service Websites", Apr 2026.
#
#   (3) Lead-capture form platforms added as quote_form elevators for
#       home_trade vertical. Jotform (form.jotform.com/jsform/),
#       Typeform (embed.typeform.com), HubSpot Forms (js.hsforms.net +
#       hbspt.forms.create) — widely used by mid-tier service businesses
#       as structured quote/estimate capture. Detected in raw HTML;
#       classified as quote_form (not named_platform) since they are
#       lead-capture tools, not scheduling platforms.
#       New output field: lead_capture_platform = list of detected
#       platforms (jotform, typeform, hubspot_forms).
#       Scoring engine uses this to elevate quote_form to 35pts for
#       home_trade (structured lead capture is the vertical best practice).
#
#   Detection hierarchy (updated):
#     named_platform → generic_booking (external URL) →
#     generic_booking (CTA hash) → quote_form → contact_form_only → none
#
# v4.45 changes:
#   fetch_html(): Quote/estimate form detection added.
#     New booking_path_type value: "quote_form" — sits between
#     generic_booking and contact_form_only in the detection hierarchy.
#     Two signals detected:
#       (1) CTA text match — button/link text containing "free quote",
#           "request a quote", "free estimate", "request an estimate",
#           "free inspection", "free consultation", "schedule service",
#           "get a bid". Case-insensitive regex.
#       (2) Form attribute match — form id/class/name/action containing
#           "quote", "estimate", "get-started", or "free-".
#     Either signal firing sets booking_path_type = "quote_form" and
#     scoring_platforms = ["quote_form"].
#     Detection order: named_platform → generic_booking → quote_form
#     → contact_form_only → none. Quote form takes precedence over
#     contact_form_only — both may coexist on same page.
#     Vertical-aware scoring applied in scoring engine v4.62.
#     Validated against: Wildcat Painting (CTA + form attr),
#     Salt City Plumbing (CTA), Richmond VA Roofing (CTA).
#
# v4.44 changes:
#   fetch_psi(): Hardened against scan abort on PSI failure.
#     sleep(3) removed — was causing cache misses, adding ~3s dead wait.
#     timeout raised 60s → 90s — covers slow-site cold runs (Squatch: 42s).
#     try/except added — previously unhandled exceptions aborted run_scan().
#     1 retry on any failure before returning null dict.
#     Null dict uses None for all fields (not 0) — allows scoring engine
#     to distinguish PSI failure from a real PSI=0 score.
#     Empirical basis: 5-business test (psi_fetch_logic_test_v1_0.py),
#     5/5 success on attempt 1, zero retries needed, Squatch worst-case 86s.
#   fetch_psi_accessibility(): sleep(3) removed. timeout raised 60s → 90s.
#     Already had try/except — no structural change needed.
#
# v4.43 changes:
#   fetch_keyword_volume() removed entirely. Step 6 eliminated.
#     Benchmarked at 22–27s per scan (12s enforced sleep + ~11–16s
#     network latency). Data was display-only, fed no scoring pillar,
#     and was not surfaced meaningfully in the report.
#   load_dfs_locations() removed — only used by fetch_keyword_volume().
#   resolve_market_codes() removed — only used by fetch_keyword_volume().
#   _extract_state_abbr(), _loc_segments() helpers removed.
#   run_scan() signature: dfs_locations param removed.
#   audit_data: keyword_volume key removed.
#   RUN block: load_dfs_locations() call removed.
#   Time savings: ~22–27s per scan.
#
# v4.42 changes:
#   fetch_moz(): Competitor fetches parallelized (ThreadPoolExecutor, 6 workers).
#     Client domain fetched sequentially first. Validated: 9.4x speedup,
#     identical DA+RD vs sequential across 10 domains, no rate limiting.
#   fetch_gbp_posts(): Accepts cid param. Uses cid:NNNN keyword when available
#     for deterministic DFS matching. Timeout 90s → 20s, poll interval 5s → 2s.
#     Empirical basis: CID max resolution 11s, name+city max 19s across 5 tests.
#     Falls back to "biz_name, city" when CID unavailable.
#   fetch_crux(): Removed entirely. ~25% availability for SMB ICP, never
#     overrides PSI scoring in practice. Dead code — zero data quality impact.
#   audit_data["crux"]: Set to {} for backward compatibility.
#
# v4.41 changes (Mobile UX — viewport + responsive signal upgrade):
#   fetch_html(): Mobile UX detection rebuilt.
#
#   Viewport: raw string search replaced with DOM parse.
#     Old: 'name="viewport"' in html_lower  (false positives on JS vars,
#          theme data attributes, comments — confirmed on Bellingham Fitness)
#     New: soup.find("meta", attrs={"name": "viewport"}) — actual <head> tag.
#     Additional signals extracted from viewport content attribute:
#       viewport_has_width_device: "width=device-width" in content
#       viewport_blocks_zoom:      "user-scalable=no" or "maximum-scale=1" in content
#       viewport_content:          raw content string for debugging
#     Old "viewport" bool key retained for backward compat — now set True
#     only when exists=True AND has_width_device=True (clean or zoom-blocked).
#
#   Responsive signals: four new HTML-parse signals added.
#     responsive_score: int 0–4, sum of four binary signals:
#       1. has_media_queries: @media present in inline <style> tags
#       2. has_responsive_markers: vc_responsive, elementor, data-responsive,
#          bootstrap, tailwind, col-sm-, col-md-, container-fluid,
#          flex-wrap, grid-cols- detected in HTML
#       3. has_responsive_images: any <img> has srcset or sizes attribute
#       4. has_mobile_nav: hamburger/mobile-nav/off-canvas pattern detected
#     All four bool fields returned individually for scoring engine consumption.
#
#   Print output updated: Viewport line now shows parsed signals.
#   Return dict updated: new keys viewport_has_width_device,
#     viewport_blocks_zoom, viewport_content, responsive_score,
#     has_media_queries, has_responsive_markers, has_responsive_images,
#     has_mobile_nav added. Old "viewport" bool preserved.
#
# v4.39 changes:
#
# v4.39 changes:
#   fetch_gbp() — query strategy rebuilt based on 7-business test:
#   Primary query: BIZ_NAME + CITY (correct 6/7 in testing).
#   Fallback query: domain only (correct for single-location unique domains).
#   Domain-only as primary fails for multi-location chains (wrong city),
#   generic domains (wrong country), and domains that don't resolve as
#   Places search terms (zero results — confirmed: lilysboston.com).
#   Match tiers updated: (1) street + city, (2) domain + city,
#   (3) name tokens + city, (4) city only, (5) first result fallback.
#   Street address is Tier 1 — only signal unique per location.
#   fetch_gbp() signature gains biz_name and biz_city params.
#   Call site: fetch_gbp(URL, GOOGLE_API_KEY, biz_name=BIZ_NAME, biz_city=CITY).
#   Match method logged to scan output for every GBP fetch.
#
# v4.35 changes:
#     DFS my_business_info category override: primary_category, primary_type,
#     and secondary_categories now sourced from DFS (ground truth) instead of
#     Places API (lossy enum mapping). Fixes Medical Spa -> spa collapse.
#
# v4.34 changes:
#   fetch_html(): Vertical-aware booking platform filtering.
#     Restaurant-specific platforms (toast, slice, chownow, bentobox,
#     popmenu, otter, flipdish, owner, olo, incentivio, thanx) are
#     detected and logged but excluded from booking_path_type scoring
#     when vertical is not food/beverage. Prevents in-club café links
#     (e.g. Toast on a gym site) from triggering "named_platform".
#     Confirmed false positive: West Seattle Health Club — toasttab.com
#     href present for café ordering, not gym membership conversion.
#     fetch_html() now accepts optional vertical param (default "service").
#     Call site updated: fetch_html(URL, vertical=BIZ_VERTICAL).
#
# v4.33 changes:
#   Booking platform detection expanded (three categories):
#   Owner.com: white-label — "owner.com" never in HTML. Detected via
#     ImageKit workspace ID (awwybhhmo) and ordering slug pattern.
#     Confirmed against Luciano's Pizza scan.
#   Food & Beverage additions: olo, square_restaurants, incentivio, thanx.
#   Fitness & Training additions: glofox, pike13, zen_planner,
#     wellnessliving, teamup.
#
# v4.32 changes:
#   fetch_gbp() — GBP match logic upgraded to city tiebreaker:
#   Multi-location chains share a root domain, so domain-only matching
#   returns the wrong listing. New priority order:
#   (1) domain + city in address, (2) city-only, (3) domain-only, (4) first result.
#   CITY config var is now the authoritative signal for GBP location selection.
#   Tested against El Gaucho (Tacoma) and Cafe Hagen (Bellevue) — 4/4 correct.
#
# v4.31 changes:
#   GBP data collection rebuilt for reliability (GBP Strength fix):
#
#   fetch_gbp() — three changes:
#   1. Google Places API field mask: added "places.id" so place_id is
#      returned directly from the Places call (was None previously).
#   2. Google Place Details CID fetch added (new step 2b): uses place_id
#      from Google Places to call Place Details and extract CID from the
#      Maps URL. CID now secured from Google before any DFS call.
#      Replaces CID dependency on my_business_info which is slow (~10s)
#      and prone to timeouts. Place Details is fast (~200ms) and reliable.
#   3. my_business_info (step 2c): keyword changed from name+address string
#      to "cid:NNNN" for deterministic lookup. No fuzzy matching.
#      Falls back to name+address if CID unavailable.
#   4. Reviews task_post (step 2d): language_name="English" replaces
#      language_code="en" — language_code is invalid for this endpoint
#      and was causing silent 40501 task failures on every scan.
#      CID now passed as integer (was string).
#
# v4.30 changes:
#   fetch_local_finder(): Parallelized using ThreadPoolExecutor (6 workers).
#     Replaces sequential loop + 0.5s throttle. Validated against sequential
#     baseline — identical positions across all origins, 2x+ speedup confirmed.
#     Same pattern as fetch_serp() (Maps). max_workers=6 param added.
#     Print header updated: "Workers: 6" replaces "(sequential, 0.5s throttle)".
#
# v4.29 changes:
#   fetch_serp(): zoom level now stored on serp[kw]["origins"][zcta]
#     dict and logged in print output alongside pos. Enables zoom
#     validation in scan output, matches existing Local Finder behavior.
#     zoom returned from _task(), passed through results_map tuple.
#
# v4.26 changes:
#   Near me origin count cap added: TRADE_AREA_NM_CAP = 8.
#   Stops near me grid at 8 ZCTAs regardless of ACS status, matching
#   city grid max (2 per band × 4 bands). Prevents unbounded origin
#   expansion when ACS is unavailable and synthetic min_pop fallback
#   prevents the 200k population cap from triggering.
#   resolve_trade_area(): nm_count_cap param added (default 8).
#   Loop stop reason: "count cap (8 origins)" printed when triggered.
#   TRADE_AREA_NM_CAP config constant added.
#
#   Near me viewport validation added (4a-post):
#   Large ZCTAs can have centroids far from the business even when
#   dist_mi is small — e.g. 98225 Bellingham centroid is 3.6mi from
#   Keenan's at the Pier despite dist_mi=2.23mi. At 14z (~2.5mi radius)
#   the business falls outside the DFS viewport → false pos=- result.
#   Fix: after building nm_included, compute actual haversine distance
#   from each origin centroid to the business. If that distance exceeds
#   viewport_radius_miles() * 0.85 at the assigned zoom (15% safety margin
#   accounts for rectangular viewport aspect ratio and edge clipping),
#   step down zoom until business fits. Stores zoom_override on origin dict.
#   fetch_serp() and fetch_local_finder() use zoom_override when present,
#   falling back to zoom_for_origin(dist_mi) otherwise.
#   Validated: Keenan's at the Pier 98225 — 14z→13z fix confirmed.
#   gbp_category_confirmed: fixed — was True whenever intake field non-empty,
#     regardless of whether intake matched GBP scan. Now True only when
#     re.sub-normalized intake value equals normalized primary_type from GBP.
#   gbp_category_mismatch: new field — True when intake is non-empty AND
#     does not match GBP scan. Consumed by scoring engine finding copy and
#     report generator display logic.
#   reviews_w1/w2/w3: added — 30/60/90 day review count buckets derived from
#     individual review timestamps in the DFS reviews loop. Fixes "Review
#     velocity data unavailable" false positive in scoring engine v4.30+
#     which expects these fields instead of reviews_last_30 alone.
#
# v4.24 changes (HTTP 429 clean failure — fetch_html + fetch_content_depth):
#
#   Two changes to prevent 429 rate-limit responses from being silently
#   processed as real HTML, which produced corrupt P2 signals (GA4=False,
#   booking=none, 0/N service pages). Root cause confirmed on Sapien Skin
#   (Mar 2026) — server CDN rate-limits repeated same-IP fetches.
#
#   1. fetch_html: HTTP-level bail-out added immediately after requests.get().
#      If r.status_code >= 400, prints WARNING and returns
#      {"html_fetch_error": True, "html_fetch_status": code} before any
#      HTML parsing. Fires before the title-based error page check.
#      Also added "429" and "too many requests" to _ERROR_PAGE_PATTERNS
#      as a belt-and-suspenders fallback for CDNs that return 200 with
#      an error page body.
#
#   2. fetch_content_depth: HTTP bail-out added to sitemap candidate loop
#      and sub-sitemap loop (status >= 400 → skip with WARNING print).
#      Homepage crawl fallback: HTTP bail-out added (status >= 400 →
#      WARNING print + return _NULL_RESULT).
#      Per-page co-occurrence fetch: HTTP bail-out added (status >= 400
#      → skip that page with WARNING).
#
#   Both functions now produce clean, traceable failure output instead of
#   silently returning all-False/zero signals.
#
# v4.23 changes (Sitemap-first content depth — deterministic service page detection):
#
#   fetch_content_depth() rebuilt around sitemap-first URL discovery.
#   Previous approach: homepage crawl with BeautifulSoup. Unreliable on
#   JS-rendered nav — returned 3 links on Sapien despite full service menu.
#
#   New approach:
#     1. Fetch sitemap.xml (with sitemap_index and sub-sitemap support).
#        Tries: sitemap.xml → sitemap_index.xml → page-sitemap.xml → pages-sitemap.xml.
#        Skips image/video/news sub-sitemaps automatically.
#     2. Homepage crawl fallback — only when no sitemap found or returns 0 URLs.
#
#   Matching rebuilt with depth-sorted two-pass logic:
#     - All URLs sorted by path depth ascending before matching (shallowest wins).
#       /facials/ (depth 1) beats /blog/benefits-of-facials/ (depth 3).
#     - Pass 1: full stem-based match (existing keyword_matches_path logic).
#     - Pass 2: first-word fallback for multi-word alias cases where slug uses
#       a synonym (e.g. "laser treatments" → "/laser-services/"). Only fires
#       when first word is ≥5 chars to prevent false positives on short terms.
#
#   New output keys added to content_depth dict:
#     sitemap_url:       str|None  — sitemap source URL used (None if crawl fallback)
#     sitemap_url_count: int       — total URLs found in sitemap
#
#   Validated against: Sapien (265 URLs, all 3 services matched at depth 1),
#   Well and Table (13 URLs), G&G Heating (134 URLs, sitemap index).
#
# v4.22 changes (Intake form wiring — category confirmation + vertical passthrough):
#
#   Business config block expanded to match intake form output exactly.
#   Paste the generated config from the intake form directly into Cell 1.
#
#   New config variables:
#     BIZ_NAME            — business name (was inferred from GBP fetch)
#     BIZ_VERTICAL        — owner-stated vertical (e.g. "Beauty & Wellness")
#     BIZ_TYPE            — owner-stated business type + subtype
#     GBP_PRIMARY_CATEGORY — owner-confirmed GBP primary category (free text)
#
#   URL is now derived from BIZ_DOMAIN automatically — no longer set manually.
#
#   audit_data changes:
#     gbp_category_confirmed: True when GBP_PRIMARY_CATEGORY is non-empty.
#       Bypasses token matching in scoring engine — awards full 25pts.
#     vertical: now reads BIZ_VERTICAL (owner-stated) instead of
#       gbp.get("primary_type") — eliminates GBP type inference mismatch.
#     biz_type: new key — passes BIZ_TYPE through to report.
#
# v4.21 changes (Local Finder zoom + identity matching fix):
#   _lf_match_client(): New helper — address-first identity matching for LF results.
#     DFS Local Finder does not populate domain/url fields. Previous domain-based
#     matching silently returned None for all businesses. Cascade: (1) address match
#     from description first line vs BIZ_ADDRESS street portion, (2) domain if
#     present, (3) name token overlap fallback with generic word stripping.
#   local_finder_search(): zoom parameter added. Previously no zoom was passed,
#     causing DFS to default to 17z (street-level ~200m viewport). All LF results
#     across all prior scans were unreliable. Now uses same zoom_for_origin() logic
#     as Maps. biz_address_street parameter added for _lf_match_client().
#   fetch_local_finder(): biz_address_street parameter added, threaded through to
#     local_finder_search(). zoom calculated per origin via zoom_for_origin(dist_mi).
#     Print output now includes zoom level per origin for validation.
#   run_scan() call site: extracts street portion of BIZ_ADDRESS (split on comma)
#     and passes as biz_address_street to fetch_local_finder().
#
# v4.19 changes (Moz multi-domain competitor enrichment + ACS fallback):
#
#   Step 4b rewritten: collects all unique competitor domains from top3 across
#   all keywords and origins (both near_me and city), excludes client domain,
#   then calls fetch_moz() once with all domains. Stores full list in
#   moz["competitors"] so the report generator moz_by_domain lookup populates
#   DA/RD/backlinks for all leaderboard entries, not just the top near-me competitor.
#
#   Trade area resolution: ACS fallback added. When api.census.gov is unreachable
#   and pop_map is empty after all batch attempts, assigns synthetic min_pop to all
#   Gazetteer candidates so distance-only filtering proceeds normally. Validated
#   Mar 17 2026 against Tacoma 98444 — produces 14 near me + 6 city origins.
#
# v4.20 changes (Stem-based service page matching, trade booking platforms, booking path type classification):
#   keyword_matches_path(): New helper — stem-based URL matching handles plumber/plumbing,
#     electrician/electrical, roofer/roofing etc. without a lookup table. 4-char stem on
#     words ≥5 chars, tokenized on / - _. Replaces slug+all-words-in-path logic.
#   named_platforms: Added trade FSM platforms — servicetitan, jobber, workiz, fieldedge,
#     kickserv, servicefusion. These are dominant for HVAC/plumbing/electrical/trades.
#   booking_path_type: New output key. Values: "named_platform", "generic_booking",
#     "contact_form_only", "none". Replaces binary booking_detected for scoring granularity.
#     /contact or /contact-us without a /book|schedule|appointment URL → "contact_form_only".
#
# v4.18 changes (Full browser headers, error page detection, booking platform expansion, top3 stub filtering):
#
#   CONFIG:
#     - BIZ_DOMAIN added (required — domain only, no https:// or www).
#       Used for identity matching in DFS Maps and Local Finder results.
#       Replaces fragile name token matching which failed on name variations
#       (validated failure: Sapien Skin + Beauty not matched by "sapien skincare").
#
#   zoom_for_origin() added:
#     - Computes DFS Maps zoom level so the business always falls within
#       the viewport from a given origin distance.
#     - Logic: viewport_radius_miles(zoom, lat) >= dist_mi, stepping 14z→11z.
#     - Typical assignments at Seattle lat (~47.5°):
#         < ~2.5mi → 14z,  ~2.5–5mi → 13z,  ~5–10mi → 12z,  > ~10mi → 11z
#     - Replaces fixed "13z" passed to maps_search().
#     - Validated: 14z at home block, 13z at mid-range, 12z/11z at city origins.
#
#   resolve_trade_area() rebuilt as dual-grid:
#     - Runs same Census pipeline but produces TWO origin lists:
#         near_me_origins:  strictly < 5mi, pop cap 200k (same as prior single grid)
#         city_origins:     strictly > 5mi banded to 20mi, 2 ZCTAs per 4mi band
#                           by highest population (8 origins total)
#     - 5mi boundary is hard — no ZCTA appears in both grids.
#     - Return dict adds near_me_origins, city_origins, near_me_cumul_pop.
#     - "origins" key retained as alias for near_me_origins (backward compat).
#
#   maps_search() updated:
#     - Signature gains biz_domain param (default "").
#     - Identity matching: domain field match replaces name token substring match.
#       item.get("domain") compared to BIZ_DOMAIN (both www-stripped).
#     - top3 capture: collects top 3 non-client result items with fields:
#       rank, title, domain, rating, review_count, category.
#       Used by scoring engine identify_primary_competitor() and report Section 4.
#     - Returns (pos, top3, cost) — was (pos, top5, cost).
#     - zoom param now set per-call by zoom_for_origin(dist_mi) in fetch_serp().
#
#   local_finder_search() updated:
#     - Same domain matching and top3 capture as maps_search().
#     - Signature gains biz_domain param.
#     - top20 list retained alongside top3.
#     - Returns (pos, top3, top20, cost) — was (pos, top20, cost).
#
#   fetch_serp() updated:
#     - Signature gains biz_domain param.
#     - Keyword-type routing: near_me keywords → near_me_origins,
#       city keywords → city_origins.
#     - zoom passed per-origin via zoom_for_origin(origin["dist_mi"]).
#     - Storage: top5 key replaced by top3.
#
#   fetch_local_finder() updated:
#     - Same keyword-type routing and biz_domain param as fetch_serp().
#     - Storage: top3 added alongside top20.
#
#   run_scan() updated:
#     - BIZ_DOMAIN passed to fetch_serp() and fetch_local_finder().
#     - Moz competitor enrichment: after serp scan, identifies top near-me
#       competitor domain from top3 frequency and calls fetch_moz() a second
#       time to populate DA and referring_domains for competitor_intel.
#     - audit_data: engine field updated to v4.17. trade_area now contains
#       near_me_origins and city_origins.
#     - Print summary updated to show dual-grid origin counts.
#     - RUN block: if __name__ guard removed (never executes in Colab).
#       Replaced with appended RUN block at bottom of file.
#
# v4.16 changes (Moz DA, GBP Posts, Content Depth):
#   CONFIG:
#     - MOZ_API_KEY added to config block (single pre-encoded token
#       from moz.com/api/dashboard — not separate access ID / secret key).
#   normalize_keywords():
#     - Now returns list of dicts: {keyword, service, type}.
#     - Two variants per service: "[service] near me" (type: "near_me")
#       and "[service] [city]" (type: "city").
#   fetch_serp():
#     - Updated to handle keyword dicts. Stores service + type in output.
#   fetch_local_finder():
#     - Updated to handle keyword dicts. Stores service + type in output.
#   fetch_keyword_volume():
#     - Extracts kw_strings list from dicts for API call.
#     - Output keyed by keyword string (backward compatible).
#   fetch_moz() added:
#     - Calls api.moz.com/jsonrpc, method data.site.metrics.fetch.
#     - Auth via x-moz-token header using MOZ_API_KEY (pre-encoded token).
#     - Returns {"client": {domain, da, referring_domains, ...}, "competitors": []}.
#   fetch_gbp_posts() added:
#     - Async my_business_updates/task_post → task_get flow.
#     - Uses business name (not CID). Returns post_count, last_post_days_ago,
#       last_post_date, posts[].
#   fetch_content_depth() added:
#     - Crawls internal links 1 level deep (cap 30).
#     - Checks URL paths for service keyword match.
#     - Spot-checks 5 pages for city+keyword co-occurrence.
#     - Returns {service_pages{}, city_keyword_cooccurrence{},
#       internal_links_crawled, pages_spot_checked}.
#   run_scan():
#     - Step 2d: fetch_moz() called after GBP fetch.
#     - Step 2e: fetch_gbp_posts() called after Moz.
#     - Step 9b: fetch_content_depth() called after HTML fetch.
#     - audit_data updated with moz, gbp_posts, content_depth fields.
#     - Data sources list updated to 14 sources.
#     - Engine version strings updated to v4.16.
#
# v4.15 changes (Keyword normalization removed):
#   normalize_keywords():
#     - All normalization logic removed. Appends "near me" to each
#       owner-stated service term verbatim. No LLM, no pluralization,
#       no synonym generation.
#     - Owner is responsible for correct spelling and phrasing.
#
# v4.14 changes (Keyword normalizer — deterministic):
#   normalize_keywords():
#     - LLM removed entirely. Deterministic singular+plural generation.
#     - _make_plural() helper: handles -s (skip), -y→ies, else +s.
#     - Eliminates all synonym/modifier invention regardless of prompt wording.
#     - anthropic_key param retained for backward compatibility — unused.
#
# v4.13 changes (Keyword normalizer — suppress invention):
#   normalize_keywords():
#     - Prompt rewritten to prevent synonym substitution and adjective variants.
#     - "italian food near me" and "fresh pasta near me" style outputs eliminated.
#     - Rule: use owner's exact wording + plural only. No rephrasing, no modifiers.
#     - Max 2 keywords per service, 6 total (down from 7).
#
# v4.12 changes (Name match fix):
#   maps_search(), local_finder_search(), my_business_info():
#     - name_token = biz_name.lower() replaces biz_name.lower().split()[0]
#     - Prior logic matched first word only — "la" matched "La Pasta Seattle",
#       "La Paloma" etc., producing false positive position detections.
#     - Full name match eliminates false positives. Validated against
#       La Rustica "pasta near me" from West Queen Anne (5.13mi).
#
# v4.11 changes (Mobile UX signal expansion):
#   fetch_html(): CSS framework detection added.
#     Checks <link> stylesheet hrefs and <script> src attributes
#     for Bootstrap, Tailwind, Foundation, Bulma, Materialize.
#     Returns css_framework (str | None) and css_framework_detected (bool).
#   fetch_psi_accessibility(): New Step 10b function.
#     Single PSI call with strategy=mobile, category=accessibility.
#     Extracts three Lighthouse audit scores (1.0/0.0/None):
#       psi_a11y_viewport      — meta-viewport (replaces html viewport parse)
#       psi_a11y_target_size   — target-size (modern tap target signal)
#       psi_a11y_color_contrast — color-contrast (replaces manual 0/flag)
#     3-second sleep before call to respect PSI rate limits.
#   run_scan(): Step 10b added after Step 10.
#     audit_data["psi_accessibility"] added.
#   Engine version string updated to v4.11.
#
# v4.10 changes (syntax fix):
#   rules-engine-v4.10: Fixed literal newline in print statement (line 1585).
#
# v4.9 changes (PSI model — mobile retired):
#   extract_psi(): Mobile PSI and LCP retired. Added TTFB via
#     audits["server-response-time"]["numericValue"]. Desktop run
#     is now the sole PSI call. Fields removed: lcp_s, fcp_s.
#     Field added: ttfb_ms.
#   fetch_psi(): Three mobile runs + median logic removed entirely.
#     Single desktop run replaces all prior mobile logic. Device gap
#     calculation and device_gap_label removed. simulated_note removed.
#     Print banner updated: Desktop PSI + TTFB + CLS + TBT + bloat.
#     Side effect: scan runtime reduced ~45s (3 mobile runs × ~15s each).
#
# v4.8 changes (fetch_html enhancements):
#   WebP detection: upgraded from single string search to multi-method.
#     webp_by_extension — any img src/srcset contains .webp
#     webp_by_picture   — any <source type="image/webp"> in <picture> tags
#     webp_by_css       — any inline style contains .webp
#     All three fields returned. webp = True if any method detects.
#   Alt text: real coverage detection via BeautifulSoup img parsing.
#     Excludes data URIs, pixel/spacer/icon patterns.
#     Returns alt_text_total_images + alt_text_with_alt.
#     Scoring engine consumes these for tiered 0/8/18/30pt score.
#   Social links: detects platform URLs in <a href> tags.
#     Patterns: instagram, facebook, yelp, tiktok, twitter/x, google maps.
#     Returns social_links list. Scoring engine awards 0 or 10pts.
#   Print banner updated to show all new fields.
#   BeautifulSoup imported inside fetch_html (already a dependency).
#
# v4.7 changes (dynamic location resolution):
#   Removed MARKET_LOCATION_CODES hardcoded lookup table entirely.
#   Removed get_market_codes() function.
#   Added load_dfs_locations() — fetches full DFS locations list once
#     at session start (~226k entries). Same pattern as load_gazetteer().
#   Added resolve_market_codes() — dynamically finds city + county + DMA
#     codes for any US city using state abbreviation from BIZ_ADDRESS.
#     Matching logic: City (type=City, name starts with city, state in name),
#     County (type=County, state in name, prefers county named after city),
#     DMA (type=DMA Region, city or state abbr in name).
#     All matches logged for auditability.
#   fetch_keyword_volume() updated to accept dfs_locations + biz_address,
#     call resolve_market_codes() internally, log resolved codes.
#   run_scan() updated to accept dfs_locations parameter (parallel to
#     gazetteer). Loads on first call, pass in for multi-biz sessions.
#   Step 0a added: load_dfs_locations() in scan banner.
#   Engine field, banners updated to v4.7.
#
# v4.6 changes (Local Finder + Keyword Volume):
#   New Step 5: DataForSEO Local Finder — sequential scan
#     - fetch_local_finder() runs same origins × same keywords as Maps
#     - Returns positions 1-20+ per keyword per ZCTA origin
#     - Local Finder = Google Search "More places" surface (different
#       algorithm than Maps — same coordinate can yield different ranks)
#     - Stored as local_finder in audit_data parallel to serp
#     - Sequential for now (parallelization logged as DEFERRED)
#
#   New Step 6: DataForSEO Keywords Data — search volume
#     - fetch_keyword_volume() runs once per scan at three geo levels:
#         city, county, DMA
#     - Returns monthly volume + CPC per keyword per level
#     - City code = metro-level (most complete for local businesses)
#     - County code = drive-area market
#     - DMA code = full media market / regional ceiling
#     - Stored as keyword_volume in audit_data
#     - MARKET_LOCATION_CODES lookup table maps CITY config var to codes
#
#   Engine housekeeping:
#     - Data sources list updated (Labs removed, Local Finder + Keywords added)
#     - engine field and print header updated to v4.6
#     - Steps renumbered: Yelp=7, WHOIS=8, HTML=9, PSI=10, CrUX=11
#
# v4.5 changes (Labs removal):
#   Labs ranked_keywords removed entirely — returns 0 local_pack results
#   for all local proximity businesses tested. Labs indexes national chain
#   domains only. labs_data stub retained in audit_data for compatibility.
#
# v4.4 changes (parallel Maps calls):
#   Step 3 (Location resolution) replaced:
#     - ZIP centroid approach retired
#     - Census-based trade area pipeline now auto-generates named
#       scan origins from real neighborhood ZCTAs
#     - Three-step pipeline:
#         1. Census Geocoder → business coords → county FIPS (free)
#         2. Gazetteer + ACS → nearby ZCTAs ranked by distance,
#            filtered by pop ≥ 1,000, stopped at 200k cumulative pop
#            or 10mi hard cap (safety net)
#         3. Google Geocoding → ZCTA centroid → human-readable name
#     - Gazetteer loaded ONCE at session start, reused across all
#       businesses (pass gazetteer_df into resolve_trade_area)
#     - Returns list of named origin dicts instead of single ZIP dict
#
#   Step 5 (Maps SERP) updated:
#     - Now loops over all trade area origins (vs single ZIP centroid)
#     - Each origin produces a position per keyword
#     - Results stored as origin-keyed dict inside each keyword entry
#
#   audit_data changes:
#     - "location" field now contains trade_area list + biz_lat/lng
#     - Removed: zip, zip_lat, zip_lng, zip_centroid_sep_mi,
#       local_origin_used, city_center fields
#
# v4.2 changes (from v4.1):
#   Step 2 (GBP fetch) updated:
#     - Replaced broken reviews/live endpoint with validated flow:
#         my_business_info/live → extract CID → reviews/task_post
#         → poll reviews/task_get/{id}
#     - photo_count now sourced from my_business_info total_photos
#     - owner_response_rate stored as 0.0–1.0
#     - parse_review_dt() handles all known DFS timestamp formats
#     - has_owner_reply() checks all known DFS owner reply field names
#
# Data sources:
#   1.  Google PageSpeed Insights (desktop + accessibility)
#   2.  Chrome UX Report
#   3.  Google Business Profile (Places API — core fields)
#   4.  DataForSEO my_business_info/live (photo count, CID)
#   5.  DataForSEO reviews/task_post + task_get (velocity, recency, response rate)
#   6.  DataForSEO my_business_updates/task_post + task_get (GBP post activity)
#   7.  Yelp Fusion
#   8.  DataForSEO Maps — Census trade area origins × keywords (local visibility)
#   9.  DataForSEO Local Finder — Census trade area origins × keywords (Search surface)
#   10. DataForSEO Keywords Data — city + county + state search volume
#   11. US Census Geocoder + Gazetteer + ACS (trade area generation, free)
#   12. WHOIS
#   13. HTML surface checks + content depth crawl
#   14. Moz API — Domain Authority + referring domains
#
# Input:  website URL + owner service intake
# Output: audit_data dict → scoring_engine_v4.calculate_scores()
#
# Run in Google Colab. Set API keys in the CONFIG section below.
# ════════════════════════════════════════════════════════════════

# ── Install dependencies ──────────────────────────────────────
# Run this cell first in Colab before executing the engine.
import subprocess
subprocess.run(["pip", "install", "python-whois", "playwright", "nest_asyncio", "--quiet"], check=False)
subprocess.run(["playwright", "install", "chromium"], check=False)
subprocess.run(["playwright", "install-deps", "chromium"], check=False)

import asyncio
import nest_asyncio
nest_asyncio.apply()

import requests
import base64
import json
import re
import statistics
import time
import math
import io
import zipfile
import whois as whois_lib
from datetime import datetime, timezone, timedelta


# ════════════════════════════════════════════════════════════════
# CONFIG — fill in before running
# ════════════════════════════════════════════════════════════════

GOOGLE_API_KEY  = "YOUR_GOOGLE_API_KEY"
CENSUS_API_KEY  = "YOUR_CENSUS_API_KEY"   # free key: https://api.census.gov/data/key_signup.html
DFS_LOGIN       = "YOUR_DFS_LOGIN"
DFS_PASSWORD    = "YOUR_DFS_PASSWORD"
MOZ_API_KEY     = "YOUR_MOZ_API_KEY"   # pre-encoded token from moz.com/api/dashboard

# HTML fetch debug — set True to print static vs Playwright-rendered signal diff
HTML_FETCH_DEBUG_DIFF = False

# ── Business input ────────────────────────────────────────────
# Paste the config block generated by the GrowthPath intake form here.
# All fields below are populated by the intake form output.
# ─────────────────────────────────────────────────────────────

BIZ_NAME        = "Secret Burger Kitchen"
BIZ_ADDRESS     = "8402 S Hosmer St, Tacoma, WA 98444"
BIZ_DOMAIN      = "secretburgerkitchen.com"   # domain only — no https:// or www
BIZ_CITY        = "Tacoma"

# Business profile — from intake form
BIZ_VERTICAL    = "Food & Beverage"
BIZ_TYPE        = "Burger Restaurant"
VERTICAL_KEY    = "restaurant"          # resolved scoring key — set by intake form
GBP_PRIMARY_CATEGORY = ""   # owner-confirmed GBP primary category as shown in Google

# Scan tier — from intake form. Drives trade-area grid size (v4.56).
# BIZ_TIER:  raw label, for report display / billing — "Basic" | "Advanced" | "Premium"
# SCAN_TIER: resolved grid-logic key — "basic" | "advanced_premium"
#            Advanced and Premium share one grid; Premium's differentiator
#            is GA4/GSC access, not trade-area reach. See Decisions v4.34.
BIZ_TIER        = "Advanced"
SCAN_TIER       = "advanced_premium"

# Scan keywords — 3 services used for Maps + Local Finder scan
# (normalized to 6 keywords: near_me + city variants each)
OWNER_SERVICES  = [
    "burger",
    "smash burger",
    "craft burger",
]

# Derived — do not edit
CITY            = BIZ_CITY
URL             = f"https://www.{BIZ_DOMAIN}"

# ── Census trade area config — tier-aware (v4.57) ───────────────
# SCAN_TIER (above) selects which config below is used.
# Two independent selection passes (v4.57 — replaces v4.56 unified
# sector-rotation dispersion):
#   NEAR-ME (<5mi) — IDENTICAL across tiers. Home ZCTA always slot 1
#     (pop-exempt), then radial farthest-point on the DISTANCE axis to
#     near_me_cap, measured from business coords. pop>0 guard on the
#     non-home picks. Selection geometry is front-door distance; SCAN
#     origins remain centroids (Sapien front-door-proximity finding).
#   CITY (>=5mi) — tier-scoped reach + count. Target slots allocated
#     across city_bands by candidate availability (largest-remainder),
#     then radial farthest-point on the BEARING axis within each band
#     (pop seed + pop tiebreak). Replaces the v4.56 N-first sector
#     rotation, which under-covered SW/W in low-quota bands.
# See Decisions v4.35.
TRADE_AREA_MIN_POP = 250   # city-ring floor + near-me pop>0 guard floor.
                            # Tiebreaker, not a coverage gate. See Decisions v4.35.

TRADE_AREA_TIER_CONFIG = {
    "basic": {
        "near_me_cap": 5,
        "city_target": 5,
        "city_bands":  [(5.0, 7.5), (7.5, 10.0)],
        "max_mi":      10.0,
    },
    "advanced_premium": {
        "near_me_cap": 5,
        "city_target": 15,
        "city_bands":  [(5.0, 9.0), (9.0, 13.0), (13.0, 16.0), (16.0, 20.0)],
        "max_mi":      20.0,
    },
}

# ════════════════════════════════════════════════════════════════
# CREDENTIALS
# ════════════════════════════════════════════════════════════════

dfs_cred    = base64.b64encode(f"{DFS_LOGIN}:{DFS_PASSWORD}".encode()).decode()
dfs_headers = {
    "Authorization": f"Basic {dfs_cred}",
    "Content-Type":  "application/json",
}

# ════════════════════════════════════════════════════════════════
# STEP 1: KEYWORD BUILDER
# Two variants per service: "[service] near me" (type: near_me)
# and "[service] [city]" (type: city).
# Returns list of dicts: {keyword, service, type}.
# Owner is responsible for correct spelling and phrasing.
# ════════════════════════════════════════════════════════════════

def normalize_keywords(owner_services, city=None):
    """
    Generates 2 keyword variants per service:
      - "[service] near me"  → type: "near_me"
      - "[service] [city]"   → type: "city"
    Returns list of dicts: {keyword, service, type}.
    city is required for the city-modifier variant.
    """
    print("\n── Step 1: Keywords ───────────────────────────────────")
    print(f"  Owner services: {owner_services}")

    keywords = []
    city_str = (city or "").strip()
    for svc in owner_services:
        svc_clean = svc.strip().lower()
        keywords.append({
            "keyword": f"{svc_clean} near me",
            "service": svc_clean,
            "type":    "near_me",
        })
        if city_str:
            keywords.append({
                "keyword": f"{svc_clean} {city_str.lower()}",
                "service": svc_clean,
                "type":    "city",
            })

    print(f"  Keywords ({len(keywords)}):")
    for kw in keywords:
        print(f"    [{kw['type']:<8}]  {kw['keyword']}")

    return keywords


# ════════════════════════════════════════════════════════════════
# STEP 2: GBP FETCH (Google Places API + DFS my_business_info + DFS Reviews)
# ════════════════════════════════════════════════════════════════

# Generic Google Places types that add no category signal
_GENERIC_TYPES = {
    "point_of_interest", "establishment", "food", "store",
    "premise", "geocode",
}

def _parse_review_dt(review):
    """Parse DFS review timestamp — handles all known format variants."""
    for key in ["timestamp", "datetime", "time"]:
        val = review.get(key)
        if val is None:
            continue
        if isinstance(val, (int, float)):
            return datetime.fromtimestamp(val, tz=timezone.utc)
        if isinstance(val, str):
            try:
                return datetime.fromisoformat(val.replace("Z", "+00:00"))
            except Exception:
                pass
    return None

def _has_owner_reply(review):
    """Check all known DFS field names for owner reply."""
    for key in ["owner_answer", "owner_reply", "review_reply", "reply"]:
        val = review.get(key)
        if isinstance(val, str) and val.strip():
            return True
        if isinstance(val, dict) and val:
            return True
    return False

def fetch_gbp(url, google_api_key, biz_name="", biz_city=""):
    """
    Fetches GBP data via three sources:
      1. Google Places API      — core fields (name, rating, address, etc.)
      2. DFS my_business_info   — total_photos (accurate count), CID, place_id
      3. DFS reviews task/poll  — velocity, recency, owner response rate

    Returns gbp dict including:
      Core:       name, rating, review_count, address, phone, hours, website
      Categories: primary_type, primary_category, types, secondary_categories
      Identity:   cid, place_id
      Photos:     photo_count (from my_business_info total_photos)
      Reviews:    reviews_last_30, last_review_days_ago, owner_response_rate
    """
    print("\n── Step 2: GBP fetch ──────────────────────────────────")

    domain = url.replace("https://", "").replace("http://", "").replace("www.", "").split("/")[0]

    # ── 2a: Google Places API — core fields ──────────────────────
    # Query strategy (v4.39):
    # Q1: biz_name + city  — primary. Proven correct 6/7 in testing.
    # Q2: domain only      — fallback if Q1 returns nothing.
    # Domain-only as primary fails for multi-location chains (wrong city),
    # generic domains (wrong country), and unique domains that don't resolve
    # as Places search terms (zero results).
    def _places_query(text_query):
        r = requests.post(
            "https://places.googleapis.com/v1/places:searchText",
            headers={
                "Content-Type":     "application/json",
                "X-Goog-Api-Key":   google_api_key,
                "X-Goog-FieldMask": (
                    "places.id,"
                    "places.displayName,"
                    "places.rating,"
                    "places.userRatingCount,"
                    "places.primaryType,"
                    "places.types,"
                    "places.formattedAddress,"
                    "places.nationalPhoneNumber,"
                    "places.regularOpeningHours,"
                    "places.websiteUri"
                ),
            },
            json={"textQuery": text_query},
            timeout=15,
        )
        return r.json().get("places", [])

    places = []
    q1 = f"{biz_name} {biz_city}".strip() if biz_name and biz_city else ""
    if q1:
        places = _places_query(q1)
        if places:
            print(f"  Query:             \"{q1}\" → {len(places)} candidate(s)")
        else:
            print(f"  WARNING: Q1 \"{q1}\" returned no results — trying domain fallback")

    if not places:
        places = _places_query(domain)
        if places:
            print(f"  Query:             \"{domain}\" (domain fallback) → {len(places)} candidate(s)")
        else:
            print(f"  WARNING: GBP fetch failed — no results for \"{q1 or domain}\"")
            return {}

    # Match logic (v4.39):
    # Street address is the only signal unique to a single location.
    # Priority: (1) street + city, (2) domain + city, (3) name tokens + city,
    #           (4) city only, (5) first result fallback.
    city_lower   = (biz_city or CITY).lower()
    domain_clean = domain.replace("www.", "").lower()
    street_lower = (BIZ_ADDRESS or "").split(",")[0].strip().lower()

    def _name_tokens_match(candidate):
        cname  = (candidate.get("displayName") or {}).get("text", "").lower()
        tokens = [t for t in (biz_name or "").lower().split() if len(t) > 3]
        return bool(tokens) and any(t in cname for t in tokens)

    p            = None
    match_method = None

    # Pass 1: street + city (unambiguous — unique per location)
    if street_lower:
        for candidate in places:
            addr = (candidate.get("formattedAddress") or "").lower()
            if street_lower in addr and city_lower in addr:
                p = candidate
                match_method = "street + city"
                break

    # Pass 2: domain + city
    if not p:
        for candidate in places:
            site = (candidate.get("websiteUri") or "").lower()
            addr = (candidate.get("formattedAddress") or "").lower()
            if domain_clean in site and city_lower in addr:
                p = candidate
                match_method = "domain + city"
                break

    # Pass 3: name tokens + city
    if not p:
        for candidate in places:
            addr = (candidate.get("formattedAddress") or "").lower()
            if _name_tokens_match(candidate) and city_lower in addr:
                p = candidate
                match_method = "name + city"
                break

    # Pass 4: city only
    if not p:
        for candidate in places:
            addr = (candidate.get("formattedAddress") or "").lower()
            if city_lower in addr:
                p = candidate
                match_method = "city only"
                break

    # Pass 5: first result fallback
    if not p:
        p = places[0]
        match_method = "first result fallback"

    print(f"  Match method:      {match_method}")

    # Categories
    primary_type = p.get("primaryType", "")
    all_types    = p.get("types", [])
    secondary    = [
        t for t in all_types
        if t != primary_type and t not in _GENERIC_TYPES
    ]

    gbp = {
        # Core
        "name":                 p.get("displayName", {}).get("text", ""),
        "rating":               p.get("rating"),
        "review_count":         p.get("userRatingCount"),
        "address":              p.get("formattedAddress", ""),
        "phone":                p.get("nationalPhoneNumber", ""),
        "hours":                bool(p.get("regularOpeningHours")),
        "website":              p.get("websiteUri", ""),
        # Categories
        "primary_type":         primary_type,
        "primary_category":     primary_type,   # alias used by scoring engine
        "types":                all_types,
        "secondary_categories": secondary,
        # Identity — populated below
        "cid":                  None,
        "place_id":             p.get("id") or None,   # from Google Places API (v4.31)
        # Photos — populated by DFS my_business_info below
        "photo_count":          None,
        # Review signals — populated by DFS reviews below
        "reviews_last_30":      None,
        "last_review_days_ago": None,
        "owner_response_rate":  None,
    }

    print(f"  Name:              {gbp['name']}")
    print(f"  Rating:            {gbp['rating']}★ ({gbp['review_count']} reviews)")
    print(f"  Primary type:      {gbp['primary_type']}")
    print(f"  Secondary cats:    {len(secondary)} — {secondary[:4]}")
    print(f"  Address:           {gbp['address']}")
    print(f"  Phone:             {gbp['phone'] or 'MISSING'}")
    print(f"  Hours set:         {'Yes' if gbp['hours'] else 'MISSING'}")
    print(f"  Website:           {gbp['website'] or 'MISSING'}")

    # ── 2b: Google Place Details — CID fetch (v4.31) ──────────────
    # Fetches CID from Google Place Details using place_id returned above.
    # CID is the stable Google business identifier — used as the primary
    # key for all subsequent DFS calls (my_business_info, reviews, posts).
    # This replaces CID dependency on my_business_info, which is slower
    # and prone to timeouts. Place Details is fast (~200ms) and reliable.
    if gbp.get("place_id"):
        try:
            pd_r = requests.get(
                "https://maps.googleapis.com/maps/api/place/details/json",
                params={
                    "place_id": gbp["place_id"],
                    "fields":   "url",
                    "key":      google_api_key,
                },
                timeout=10,
            )
            pd_url = pd_r.json().get("result", {}).get("url", "")
            if "cid=" in pd_url:
                gbp["cid"] = pd_url.split("cid=")[1].split("&")[0]
                print(f"  CID:               {gbp['cid']} (Google Place Details)")
            else:
                print("  WARNING: Place Details returned no CID in URL")
        except Exception as e:
            print(f"  WARNING: Place Details CID fetch failed — {e}")
    else:
        print("  WARNING: No place_id from Google Places — CID fetch skipped")

    # ── 2c: DFS my_business_info — total_photos  ─────────────────
    # Uses cid:NNNN keyword for deterministic lookup (v4.31).
    # CID already secured from Google Place Details above — no fuzzy
    # name+address matching. Photos accurate (Places API caps at 10).
    print("  Fetching DFS my_business_info (photos)...")
    try:
        mbi_keyword = f"cid:{gbp['cid']}" if gbp.get("cid") else f"{gbp['name']}, {gbp['address']}"
        mbi_r = requests.post(
            "https://api.dataforseo.com/v3/business_data/google/my_business_info/live",
            headers=dfs_headers,
            json=[{
                "keyword":       mbi_keyword,
                "location_code": 2840,
                "language_code": "en",
            }],
            timeout=45,
        )
        mbi_data   = mbi_r.json()
        mbi_tasks  = mbi_data.get("tasks") or []
        mbi_result = (mbi_tasks[0].get("result") or []) if mbi_tasks else []
        mbi_items  = (mbi_result[0].get("items") or []) if mbi_result else []
        mbi_item   = mbi_items[0] if mbi_items else None

        if mbi_item:
            # CID from DFS as confirmation; prefer Google CID already stored
            if not gbp.get("cid"):
                gbp["cid"] = str(mbi_item.get("cid") or "")
            if not gbp.get("place_id"):
                gbp["place_id"] = mbi_item.get("place_id") or ""
            gbp["photo_count"] = mbi_item.get("total_photos")
            print(f"  Total photos:      {gbp['photo_count']}")

            # Override Places API category fields with DFS ground truth (v4.35).
            # Places API primaryType uses a fixed enum that collapses GBP
            # dashboard categories — e.g. "Medical Spa" -> "spa". DFS scrapes
            # the public GBP panel and returns exactly what the owner set.
            # category_ids[0] is the primary; additional_categories are secondaries.
            mbi_cat     = mbi_item.get("category")            # "Medical spa"
            mbi_cat_ids = mbi_item.get("category_ids") or []  # ["medical_spa", ...]
            mbi_add_cat = mbi_item.get("additional_categories") or []  # ["Day spa", ...]

            if mbi_cat:
                gbp["primary_category"] = mbi_cat
                print(f"  Primary category:  {mbi_cat} (DFS override)")
            if mbi_cat_ids:
                gbp["primary_type"] = mbi_cat_ids[0]
                print(f"  Primary type ID:   {mbi_cat_ids[0]} (DFS override)")
            if mbi_add_cat:
                gbp["secondary_categories"] = mbi_add_cat
                print(f"  Secondary cats:    {len(mbi_add_cat)} — {mbi_add_cat[:4]} (DFS override)")
        else:
            print("  WARNING: DFS my_business_info returned no items")

    except Exception as e:
        print(f"  WARNING: DFS my_business_info failed — {e}")

    # ── 2d: DFS Reviews — velocity, recency, response rate ────────
    # task_post → poll task_get — validated flow (v4.2).
    # v4.31: language_name="English" (language_code invalid for this endpoint).
    #        CID passed as integer. CID now sourced from Google Place Details
    #        (reliable) — reviews task no longer depends on my_business_info.
    if gbp.get("cid"):
        print("  Fetching DFS reviews (velocity / recency / response rate)...")
        try:
            # POST task — timeout raised 30s → 60s (v4.54)
            task_r = requests.post(
                "https://api.dataforseo.com/v3/business_data/google/reviews/task_post",
                headers=dfs_headers,
                json=[{
                    "cid":           int(gbp["cid"]),   # integer required
                    "location_code": 2840,
                    "language_name": "English",          # language_code invalid here
                    "depth":         100,
                    "sort_by":       "newest",
                }],
                timeout=60,
            )
            task_id = task_r.json()["tasks"][0]["id"]

            # Poll with 90s timeout — hardened v4.54
            # Pending codes: keep polling. Terminal codes: stop.
            _REVIEWS_PENDING  = {40100, 40101, 40601, 40602}
            _REVIEWS_TERMINAL = {40400, 40401, 40500, 50000}
            poll_start   = time.time()
            reviews_resp = None
            while True:
                time.sleep(5)  # wait before each poll (moved to top — v4.54)
                if time.time() - poll_start > 90:
                    print("  WARNING: Reviews task timed out after 90s")
                    break
                poll_r = requests.get(
                    f"https://api.dataforseo.com/v3/business_data/google/reviews/task_get/{task_id}",
                    headers=dfs_headers,
                    timeout=30,
                )
                poll_data = poll_r.json()
                poll_task = (poll_data.get("tasks") or [{}])[0]
                sc = poll_task.get("status_code")
                if sc == 20000 and poll_task.get("result"):
                    reviews_resp = poll_data
                    break
                elif sc in _REVIEWS_PENDING:
                    continue
                elif sc in _REVIEWS_TERMINAL:
                    print(f"  WARNING: Reviews task terminal error {sc}: {poll_task.get('status_message','')}")
                    break
                else:
                    print(f"  WARNING: Reviews task unknown status {sc} — continuing to poll")

            # Derive metrics
            if reviews_resp:
                result = reviews_resp["tasks"][0].get("result") or []
                items  = (result[0].get("items") or []) if result else []
                now    = datetime.now(timezone.utc)

                reviews_last_30 = 0
                reviews_w1      = 0   # last 30 days
                reviews_w2      = 0   # 31–60 days
                reviews_w3      = 0   # 61–90 days
                latest_dt       = None
                replies         = 0

                for review in items:
                    dt = _parse_review_dt(review)
                    if dt:
                        age_days = (now - dt).days
                        if age_days <= 30:
                            reviews_last_30 += 1
                            reviews_w1      += 1
                        elif age_days <= 60:
                            reviews_w2 += 1
                        elif age_days <= 90:
                            reviews_w3 += 1
                        if latest_dt is None or dt > latest_dt:
                            latest_dt = dt
                    if _has_owner_reply(review):
                        replies += 1

                gbp["reviews_last_30"]      = reviews_last_30
                gbp["reviews_w1"]           = reviews_w1
                gbp["reviews_w2"]           = reviews_w2
                gbp["reviews_w3"]           = reviews_w3
                gbp["last_review_days_ago"] = (now - latest_dt).days if latest_dt else None
                gbp["owner_response_rate"]  = round(replies / len(items), 3) if items else None

                print(f"  Reviews last 30d:  {gbp['reviews_last_30']}")
                print(f"  Last review:       {gbp['last_review_days_ago']} days ago")
                print(f"  Response rate:     {round((gbp['owner_response_rate'] or 0) * 100, 1)}%")

        except Exception as e:
            print(f"  WARNING: DFS Reviews task failed — {e}")
            # gbp review fields remain None; scoring engine stubs them at 0
    else:
        print("  WARNING: No CID available — skipping reviews task")

    return gbp


# ════════════════════════════════════════════════════════════════
# STEP 3: CENSUS TRADE AREA PIPELINE
#
# Auto-generates named scan origins from real neighborhood ZCTAs.
# No hardcoded coords — adapts to any US business address.
#
# Step 3a: load_gazetteer()       — call once at session start
# Step 3b: resolve_trade_area()   — call per business scan
# ════════════════════════════════════════════════════════════════

def load_gazetteer():
    """
    Downloads and parses the 2023 Census ZCTA Gazetteer file.
    Returns a list of dicts: {zcta, lat, lng, pop_land_sqmi}

    Call ONCE at session start — takes ~3s, ~1MB download.
    Pass the returned list into resolve_trade_area().
    """
    print("\n── Step 3a: Loading Census Gazetteer ───────────────────")
    url = "https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2023_Gazetteer/2023_Gaz_zcta_national.zip"

    r = requests.get(url, timeout=30)
    z = zipfile.ZipFile(io.BytesIO(r.content))
    fname = [n for n in z.namelist() if n.endswith(".txt")][0]
    lines = z.read(fname).decode("utf-8").splitlines()

    header = [h.strip() for h in lines[0].split("\t")]
    records = []
    for line in lines[1:]:
        parts = line.split("\t")
        if len(parts) < len(header):
            continue
        row = dict(zip(header, [p.strip() for p in parts]))
        try:
            records.append({
                "zcta": row["GEOID"],
                "lat":  float(row["INTPTLAT"]),
                "lng":  float(row["INTPTLONG"]),
            })
        except (KeyError, ValueError):
            continue

    print(f"  Loaded {len(records):,} ZCTAs from Gazetteer")
    return records


def _haversine_mi(lat1, lng1, lat2, lng2):
    """Great-circle distance in miles between two lat/lng points."""
    R = 3958.8
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlng / 2) ** 2)
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


# ── Sector-rotation dispersion helpers (v4.56) ──────────────────
_SECTOR_NAMES = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]


def _bearing_deg(lat1, lng1, lat2, lng2):
    """Compass bearing from point 1 to point 2, degrees, 0=N/90=E."""
    dlng = math.radians(lng2 - lng1)
    y = math.sin(dlng) * math.cos(math.radians(lat2))
    x = (math.cos(math.radians(lat1)) * math.sin(math.radians(lat2)) -
         math.sin(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.cos(dlng))
    return (math.degrees(math.atan2(y, x)) + 360) % 360


def _sector_of(bearing):
    """Maps a compass bearing to one of 8 sector names (N/NE/E/.../NW)."""
    return _SECTOR_NAMES[int(((bearing + 22.5) % 360) // 45)]


def _quadrant_of(bearing):
    """4-quadrant bucket for directional-spread tiebreaking. NE/SE/SW/NW."""
    return ["NE", "SE", "SW", "NW"][int(bearing // 90) % 4]


def _ang_dist(a, b):
    """Smallest angular separation between two compass bearings (degrees)."""
    return min(abs(a - b), 360 - abs(a - b))


def select_near_me_radial(pool, seed, cap, used,
                          dist_eps=0.05):
    """
    Near-me origin selection (v4.57). Radial farthest-point on the
    DISTANCE axis: repeatedly add the candidate whose nearest already-
    chosen origin (by distance-from-business) is farthest away. This
    samples 0->5mi at even radial intervals — the "how far does my
    near-me visibility reach" curve — instead of clustering.

    seed:  pre-chosen origins (home ZCTA, slot 1). NOT re-selected.
    cap:   total near-me origins including seed.
    used:  shared set of already-claimed ZCTAs (mutated). Prevents a
           boundary ZCTA from also landing in the city ring.
    Ties (within dist_eps) break by least-used quadrant, then larger pop.

    pool MUST already be filtered to <5mi and pop>0 (home is pop-exempt
    and passed via seed). Each candidate needs dist_mi, bearing, pop.
    Adds "band"="near_me" and "sector" to each non-seed pick.
    """
    chosen = list(seed)
    p = [c for c in pool if c["zcta"] not in used]
    while len(chosen) < cap and p:
        scored = [(min(abs(c["dist_mi"] - ch["dist_mi"]) for ch in chosen), c)
                  for c in p]
        best = max(s for s, _ in scored)
        tied = [c for s, c in scored if s >= best - dist_eps]
        if len(tied) > 1:
            qcount = {}
            for ch in chosen:
                q = _quadrant_of(ch["bearing"])
                qcount[q] = qcount.get(q, 0) + 1
            tied.sort(key=lambda c: (qcount.get(_quadrant_of(c["bearing"]), 0),
                                     -c["pop"]))
        pick = tied[0]
        pick["band"] = pick.get("band", "near_me")
        pick["sector"] = _sector_of(pick["bearing"])
        chosen.append(pick)
        used.add(pick["zcta"])
        p.remove(pick)
    return chosen


def _radial_bearing(pool, cap, ang_eps=1.0):
    """
    Within-band city selection: radial farthest-point on the BEARING
    axis. Seeds with the most-populous candidate in the band, then adds
    whichever candidate is most angularly separated from those already
    chosen, breaking ties by larger population. Produces an even
    directional fan inside the band without a fixed sector-rotation
    order (which biased N/E in the v4.56 logic).
    """
    if not pool or cap <= 0:
        return []
    chosen = [max(pool, key=lambda c: c["pop"])]
    p = [c for c in pool if c["zcta"] != chosen[0]["zcta"]]
    while len(chosen) < cap and p:
        scored = [(min(_ang_dist(c["bearing"], ch["bearing"]) for ch in chosen), c)
                  for c in p]
        best = max(s for s, _ in scored)
        tied = [c for s, c in scored if s >= best - ang_eps]
        tied.sort(key=lambda c: -c["pop"])
        pick = tied[0]
        chosen.append(pick)
        p.remove(pick)
    return chosen


def select_city_banded(candidates, bands, target, used,
                       min_pop=250, nm_city_split_mi=5.0):
    """
    City-modifier origin selection (v4.57). Two stages:
      1. Allocate `target` slots across `bands` proportional to each
         band's qualifying-candidate count (largest-remainder rounding,
         capped at availability — empty bands get none).
      2. Fill each band via _radial_bearing() — even directional fan.

    Guarantees both axes: every populated band represented (distance)
    and an even directional spread within each band (direction).

    candidates: full pool out to max_mi (with dist_mi, bearing, pop).
    used:       shared set (mutated) — excludes near-me picks so a
                boundary ZCTA can't be selected twice.
    Returns (picked, ring_info) where ring_info maps band label ->
    (n_candidates, n_slots) for diagnostics.
    """
    pool = [c for c in candidates
            if c["pop"] >= min_pop
            and c["dist_mi"] >= nm_city_split_mi
            and c["zcta"] not in used]
    band_pool = {b: [c for c in pool if b[0] <= c["dist_mi"] < b[1]] for b in bands}
    total_avail = sum(len(v) for v in band_pool.values())
    if total_avail == 0:
        return [], {f"{b[0]:.0f}-{b[1]:.0f}": (0, 0) for b in bands}

    raw = {b: target * len(v) / total_avail for b, v in band_pool.items()}
    alloc = {b: int(math.floor(v)) for b, v in raw.items()}
    rem = target - sum(alloc.values())
    for b in sorted(raw, key=lambda k: raw[k] - alloc[k], reverse=True)[:rem]:
        alloc[b] += 1
    for b in alloc:
        alloc[b] = min(alloc[b], len(band_pool[b]))

    picked, ring_info = [], {}
    for b in bands:
        lo, hi = b
        ring = _radial_bearing(band_pool[b], alloc[b])
        for c in ring:
            c["band"] = f"{lo:.0f}-{hi:.0f}mi"
            c["sector"] = _sector_of(c["bearing"])
            used.add(c["zcta"])
        picked.extend(ring)
        ring_info[f"{lo:.0f}-{hi:.0f}"] = (len(band_pool[b]), alloc[b])
    return picked, ring_info


def resolve_trade_area(
    biz_address,
    google_api_key,
    gazetteer,
    census_api_key="",
    scan_tier="advanced_premium",
    min_pop=250,
    nm_city_split_mi=5.0,
):
    """
    Generates a tier-sized origin grid for a business using Census data,
    via sector-rotation dispersion (v4.56 — see Decisions v4.34).

    scan_tier selects a fixed-target config from TRADE_AREA_TIER_CONFIG:
      "basic":            10 ZCTAs total, city-modifier reach to 10mi
      "advanced_premium": 20 ZCTAs total, city-modifier reach to 20mi

    Selection (one unified pass across the tier's full 0→max_mi range):
      1. Candidate pool gathered out to the tier's max_mi, ACS-filtered
         by min_pop (250 — tiebreaker only, not a coverage gate).
      2. Slots allocated per distance band proportional to each band's
         qualifying-candidate availability (more populous bands get more
         slots; empty bands get none).
      3. Each band filled by rotating through 8 compass sectors, taking
         the highest-population unused ZCTA per sector, looping to quota.
         Replaces v4.55's population-cap-stop (near-me) and two-pass
         band-first-then-population-fill (city) logic — naive population
         ranking was confirmed to cluster toward whichever direction has
         the densest population regardless of business location (5/8
         compass sectors covered vs. 7-8/8 for sector-rotation, validated
         on three structurally different test businesses).

    near_me_origins / city_origins split:
      Applied AFTER selection, independent of which allocation band a
      ZCTA came from. <5mi (nm_city_split_mi) = near_me, >=5mi = city.
      This boundary is IDENTICAL across both tiers — confirmed unchanged
      from v4.55 behavior; only city-modifier reach scales by tier.

    Args:
      census_api_key: Census API key for ACS population data.
                      Free at https://api.census.gov/data/key_signup.html
                      Falls back to synthetic min_pop if unavailable.
      scan_tier: "basic" or "advanced_premium" — set by intake form
                 (SCAN_TIER config constant).
      min_pop: ACS population floor per ZCTA. 250 default — excludes only
               genuine near-zero-population tracts (airports, parkland,
               water-only Gazetteer entries), not legitimate sparse
               communities. See Decisions v4.34 for full rationale.

    Returns dict (UNCHANGED shape from v4.55 for backward compatibility):
      biz_lat, biz_lng, biz_address, biz_county,
      near_me_origins: [{zcta, lat, lng, dist_mi, pop, name, band, sector}]
      city_origins:    [{zcta, lat, lng, dist_mi, pop, name, band, sector}]
      origins:         alias for near_me_origins (backward compat)
      near_me_cumul_pop: int
      nm_stop_reason:  str (diagnostic — describes tier + selection result)

    KNOWN OPEN ISSUE: water-crossing candidates (haversine straight-line
    distance can select geographically-close-but-practically-unreachable
    ZCTAs for coastal/peninsula businesses). Not fixed in this version.
    See Decisions v4.34.
    """
    print("\n── Step 3b: Trade area resolution (sector-rotation, tier-aware) ──")

    if scan_tier not in TRADE_AREA_TIER_CONFIG:
        raise ValueError(
            f"Unknown scan_tier '{scan_tier}' — must be one of "
            f"{list(TRADE_AREA_TIER_CONFIG.keys())}"
        )
    tier_cfg = TRADE_AREA_TIER_CONFIG[scan_tier]
    print(f"  Tier: {scan_tier}  (up to {tier_cfg['near_me_cap']} near-me + "
          f"{tier_cfg['city_target']} city, to {tier_cfg['max_mi']}mi)")

    # 1. Geocode business address
    r = requests.get(
        "https://maps.googleapis.com/maps/api/geocode/json",
        params={"address": biz_address, "key": google_api_key},
        timeout=15,
    )
    geo = r.json()
    if not geo.get("results"):
        raise RuntimeError(f"Geocoding failed for '{biz_address}': {geo.get('status')}")

    biz_lat = geo["results"][0]["geometry"]["location"]["lat"]
    biz_lng = geo["results"][0]["geometry"]["location"]["lng"]
    print(f"  Business coords: {biz_lat:.6f}, {biz_lng:.6f}")

    # Extract county + home ZCTA (postal_code) from address components.
    # home_zcta is the business's own ZIP — always slot 1 of the near-me
    # grid (v4.57). Uses the geocoded postal_code, NOT nearest centroid:
    # downtown the nearest centroid is often not the containing ZCTA.
    biz_county = None
    home_zcta = None
    for comp in geo["results"][0].get("address_components", []):
        if "administrative_area_level_2" in comp["types"]:
            biz_county = comp["long_name"]
        if "postal_code" in comp["types"]:
            home_zcta = comp["long_name"]
    if biz_county:
        print(f"  County: {biz_county}")
    if home_zcta:
        print(f"  Home ZCTA: {home_zcta}")

    # 2. Find all ZCTAs within the tier's max_mi and compute distance + bearing
    all_candidates = []
    for rec in gazetteer:
        dist = _haversine_mi(biz_lat, biz_lng, rec["lat"], rec["lng"])
        if dist <= tier_cfg["max_mi"]:
            bearing = _bearing_deg(biz_lat, biz_lng, rec["lat"], rec["lng"])
            all_candidates.append({**rec, "dist_mi": round(dist, 3),
                                    "bearing": round(bearing, 1)})
    all_candidates.sort(key=lambda x: x["dist_mi"])
    print(f"  ZCTAs within {tier_cfg['max_mi']}mi: {len(all_candidates)}")

    # 3. Fetch ACS population for all candidates (batched by 50)
    zcta_codes = [c["zcta"] for c in all_candidates]
    pop_map = {}
    batch_size = 50
    for i in range(0, len(zcta_codes), batch_size):
        batch = zcta_codes[i:i + batch_size]
        try:
            r2 = requests.get(
                "https://api.census.gov/data/2023/acs/acs5",
                params={
                    "get": "NAME,B01003_001E",
                    "for": f"zip code tabulation area:{','.join(batch)}",
                    "key": census_api_key,
                },
                timeout=20,
            )
            rows = r2.json()
            if not isinstance(rows, list):
                print(f"  WARNING: ACS batch {i//batch_size + 1} unexpected response "
                      f"(check CENSUS_API_KEY): {str(rows)[:100]}")
                continue
            for row in rows[1:]:
                pop_map[row[2]] = int(row[1]) if row[1] else 0
        except Exception as e:
            print(f"  WARNING: ACS batch {i//batch_size + 1} failed: {e}")

    # ACS fallback: if all batches failed, assign synthetic min_pop to all candidates
    # so distance-only filtering proceeds. Validated Mar 17 2026 — produces correct
    # origins for Tacoma 98444 (14 near me, 6 city).
    # v4.55: ACS now requires API key — check CENSUS_API_KEY if fallback fires.
    if not pop_map:
        print(f"  WARNING: ACS unavailable — falling back to distance-only origin selection")
        print(f"  (If this is unexpected, verify CENSUS_API_KEY is set correctly)")
        pop_map = {c["zcta"]: min_pop for c in all_candidates}

    # 4. Two-pass origin selection (v4.57 — replaces v4.56 unified
    #    sector-rotation dispersion). Near-me and city are selected
    #    independently with a SHARED used-set so a boundary ZCTA can
    #    never land in both rings.
    #    See Decisions v4.35 / select_near_me_radial() + select_city_banded().

    # Attach pop to every candidate once.
    for c in all_candidates:
        c["pop"] = pop_map.get(c["zcta"], 0)

    used = set()

    # --- Near-me pass: home slot 1 (pop-exempt) + radial-distance fill ---
    nm_pool = [c for c in all_candidates if c["dist_mi"] < nm_city_split_mi]
    home = next((c for c in nm_pool if c["zcta"] == home_zcta), None)
    if home is None and nm_pool:
        # Fallback: geocoded postal_code centroid not in range (rare for
        # large home ZCTAs). Use nearest <5mi candidate as the anchor.
        home = nm_pool[0]
        print(f"  NOTE: home ZCTA {home_zcta} centroid not <{nm_city_split_mi}mi "
              f"— anchoring near-me on nearest ({home['zcta']})")
    nm_included = []
    if home is not None:
        home["band"] = "home"
        home["sector"] = _sector_of(home["bearing"])
        used.add(home["zcta"])
        nm_rest = [c for c in nm_pool
                   if c["pop"] > 0 and c["zcta"] != home["zcta"]]
        nm_included = select_near_me_radial(
            nm_rest, [home], tier_cfg["near_me_cap"], used
        )
    nm_included = sorted(nm_included, key=lambda x: x["dist_mi"])

    # --- City pass: banded allocation + radial-bearing within band ---
    city_included, ring_info = select_city_banded(
        all_candidates, tier_cfg["city_bands"], tier_cfg["city_target"],
        used, min_pop=min_pop, nm_city_split_mi=nm_city_split_mi,
    )
    city_included = sorted(city_included, key=lambda x: x["dist_mi"])

    cumul_pop = sum(c["pop"] for c in nm_included)
    nm_stop = (
        f"radial near-me ({len(nm_included)}/{tier_cfg['near_me_cap']}) + "
        f"banded-radial city ({len(city_included)}/{tier_cfg['city_target']}) "
        f"— tier={scan_tier}"
    )

    print(f"\n  Near me origins (<{nm_city_split_mi}mi): {len(nm_included)}")
    print(f"  Cumulative pop: {cumul_pop:,}")
    print(f"  City ring allocation (cands -> slots): " +
          "  ".join(f"{k}mi:{v[0]}->{v[1]}" for k, v in ring_info.items()))

    # 4a-post. Viewport validation — ensure business falls within each origin's viewport.
    # Problem: large ZCTAs can have centroids far from the business even when dist_mi
    # is small (e.g. 98225 Bellingham centroid is 3.6mi from Keenan's at the Pier
    # despite dist_mi=2.23mi). At 14z (~2.5mi radius), the business falls outside the
    # DFS viewport → false pos=- result.
    # Fix: for each near me origin, check whether the actual distance from origin centroid
    # to business exceeds the viewport radius at the assigned zoom. If so, step down zoom
    # until the business fits. Store result as zoom_override on the origin dict.
    # Scan functions (fetch_serp, fetch_local_finder) use zoom_override when present.
    # UNCHANGED from v4.55 — applies to near-me origins only (tightest zoom levels,
    # most sensitive to centroid-vs-actual-location mismatch).
    for origin in nm_included:
        assigned_zoom = int(zoom_for_origin(origin["dist_mi"], lat=biz_lat).rstrip("z"))
        actual_dist   = _haversine_mi(biz_lat, biz_lng, origin["lat"], origin["lng"])
        final_zoom    = assigned_zoom
        for z in range(assigned_zoom, 10, -1):
            if viewport_radius_miles(z, lat=biz_lat) * 0.85 >= actual_dist:
                final_zoom = z
                break
        if final_zoom != assigned_zoom:
            origin["zoom_override"] = f"{final_zoom}z"
            print(f"  Viewport fix: {origin['zcta']} actual_dist={actual_dist:.2f}mi "
                  f"zoom {assigned_zoom}z→{final_zoom}z")

    print(f"  City origins ({nm_city_split_mi:.0f}-{tier_cfg['max_mi']:.0f}mi): "
          f"{len(city_included)}")
    for c in city_included:
        print(f"    {c['zcta']}  {c['dist_mi']:.2f}mi  sector={c['sector']}  "
              f"band={c['band']}  pop={c['pop']:,}")

    # 5. Reverse geocode all origins
    all_to_geocode = nm_included + city_included
    print(f"\n  Reverse geocoding {len(all_to_geocode)} origins...")
    for origin in all_to_geocode:
        try:
            r3 = requests.get(
                "https://maps.googleapis.com/maps/api/geocode/json",
                params={
                    "latlng": f"{origin['lat']},{origin['lng']}",
                    "key": google_api_key,
                },
                timeout=10,
            )
            results = r3.json().get("results", [])
            name = origin["zcta"]
            for res in results:
                for comp in res.get("address_components", []):
                    types = comp.get("types", [])
                    if any(t in types for t in ["neighborhood", "sublocality_level_1",
                                                 "sublocality", "locality"]):
                        name = comp["long_name"]
                        break
                if name != origin["zcta"]:
                    break
            origin["name"] = name
        except Exception:
            origin["name"] = origin["zcta"]
        time.sleep(0.05)

    print("\n  Near me origins:")
    for o in nm_included:
        print(f"    {o['zcta']}  {o['name']:<25}  {o['dist_mi']:.2f}mi  pop={o['pop']:,}")
    print("  City origins:")
    for o in city_included:
        print(f"    {o['zcta']}  {o['name']:<25}  {o['dist_mi']:.2f}mi  band={o['band']}  pop={o['pop']:,}")

    return {
        "biz_lat":            biz_lat,
        "biz_lng":            biz_lng,
        "biz_county":         biz_county,
        "biz_address":        biz_address,
        "home_zcta":          home_zcta,
        "near_me_origins":    nm_included,
        "city_origins":       city_included,
        "origins":            nm_included,    # backward compat alias
        "near_me_cumul_pop":  cumul_pop,
        "nm_stop_reason":     nm_stop,
        "_ring_info":         ring_info,      # diagnostic: band -> (cands, slots)
    }


# ════════════════════════════════════════════════════════════════
# STEP 4: DATAFORSEO LABS STUB (removed v4.5 — see labs_data in audit_data)
# ════════════════════════════════════════════════════════════════

    three_pack = []
    near_miss  = []

    for item in items:
        kw_data   = item.get("keyword_data", {})
        kw        = kw_data.get("keyword", "")
        volume    = (kw_data.get("keyword_info") or {}).get("search_volume") or 0
        rank_data = item.get("ranked_serp_element", {}).get("serp_item", {})
        rank_type = rank_data.get("type", "")
        rank_pos  = rank_data.get("rank_group") or rank_data.get("position")

        if rank_type == "local_pack":
            if rank_pos and rank_pos <= 3:
                three_pack.append({"keyword": kw, "rank": rank_pos, "volume": volume})
            elif rank_pos and rank_pos <= 20 and volume >= 200:
                near_miss.append({"keyword": kw, "rank": rank_pos, "volume": volume})

    three_pack.sort(key=lambda x: x["volume"], reverse=True)
    near_miss.sort(key=lambda x: x["volume"], reverse=True)

    top_vol_kw = three_pack[0]["keyword"] if three_pack else None

    print(f"  Domain:          {clean_domain}")
    print(f"  3-pack keywords: {len(three_pack)}")
    if three_pack:
        for k in three_pack[:5]:
            print(f"    #{k['rank']} '{k['keyword']}' ({k['volume']} vol)")
    print(f"  Near-miss:       {len(near_miss)}")
    if near_miss:
        for k in near_miss[:3]:
            print(f"    #{k['rank']} '{k['keyword']}' ({k['volume']} vol)")
    print(f"  Cost:            ${cost:.4f}")

    return {
        "all_3pack_keywords": three_pack,
        "near_miss_keywords": near_miss,
        "total_3pack_count":  len(three_pack),
        "top_volume_keyword": top_vol_kw,
    }


# ════════════════════════════════════════════════════════════════
# STEP 4: DATAFORSEO MAPS — Per keyword
# ════════════════════════════════════════════════════════════════

# ── Zoom helper ───────────────────────────────────────────────

def viewport_radius_miles(zoom, lat=47.5):
    """Approximate viewport radius in miles for a given Maps zoom level."""
    world_width_px = 256 * (2 ** zoom)
    meters_per_px  = (40_075_016.7 * math.cos(math.radians(lat))) / world_width_px
    return ((1280 * meters_per_px) / 2) / 1609.34


def zoom_for_origin(dist_mi, lat=47.5):
    """
    Returns the tightest zoom level whose viewport radius covers dist_mi.
    Ensures the business always falls within the DFS Maps search viewport.

    Typical results at Seattle lat ~47.5°:
      < ~2.5mi  → 14z  (near me home block)
      ~2.5–5mi  → 13z  (near me outer)
      ~5–10mi   → 12z  (city inner)
      > ~10mi   → 11z  (city outer)
    """
    for z in range(14, 10, -1):
        if viewport_radius_miles(z, lat) >= dist_mi:
            return f"{z}z"
    return "11z"


def maps_search(keyword, lat, lng, biz_name, biz_domain="", zoom="13z", depth=20, retries=2):
    """
    Searches Google Maps from a coordinate origin.

    Identity matching: domain field match (v4.17+).
      item.get("domain") compared to biz_domain (both www-stripped).
      Replaces name token substring match which failed on name variations.

    Returns (position, top3, cost).
      position: 1–20 or None
      top3:     list of top 3 non-client results with rank, title, domain,
                rating, review_count, category — for competitor intelligence
    """
    coord            = f"{lat},{lng},{zoom}"
    clean_biz_domain = biz_domain.replace("www.", "").lower()

    for attempt in range(retries + 1):
        try:
            r = requests.post(
                "https://api.dataforseo.com/v3/serp/google/maps/live/advanced",
                headers=dfs_headers,
                json=[{
                    "keyword":             keyword,
                    "location_coordinate": coord,
                    "language_code":       "en",
                    "depth":               depth,
                }],
                timeout=45,
            )
            data  = r.json()
            cost  = data.get("cost", 0.002)
            items = data["tasks"][0]["result"][0].get("items") or []

            pos  = None
            top3 = []
            for item in items:
                item_domain = (item.get("domain") or "").replace("www.", "").lower()
                rank        = item.get("rank_group", 99)

                # Client identity: domain field match
                if clean_biz_domain and clean_biz_domain in item_domain and pos is None:
                    pos = rank

                # Top3 non-client competitors
                # Skip stub items (no domain, no category) — DFS returns incomplete
                # rank_group items alongside full rank_absolute items for the same result.
                item_cat = (item.get("category") or "").strip()
                is_stub  = not item_domain and not item_cat
                if len(top3) < 3 and not (clean_biz_domain and clean_biz_domain in item_domain) and not is_stub:
                    rating_obj = item.get("rating") or {}
                    top3.append({
                        "rank":         rank,
                        "title":        item.get("title") or item.get("name") or "",
                        "domain":       item.get("domain") or "",
                        "rating":       rating_obj.get("value"),
                        "review_count": rating_obj.get("votes_count"),
                        "category":     item_cat,
                    })

            return pos, top3, cost

        except Exception as e:
            if attempt < retries:
                time.sleep(3)
            else:
                print(f"    Maps search failed after {retries+1} attempts: {e}")
                return None, [], 0.002


def fetch_serp(keywords, trade_area, biz_name, dfs_headers, biz_domain="", max_workers=6):
    """
    Runs Maps searches for each keyword × each trade area origin.
    keywords: list of dicts {keyword, service, type} from normalize_keywords().

    Keyword-type routing (v4.17):
      near_me keywords → near_me_origins (< 5mi, inverse-distance weighted in scoring)
      city keywords    → city_origins    (> 5mi, equal-weighted in scoring)

    Zoom per origin (v4.17):
      zoom_for_origin(dist_mi) replaces fixed "13z". Ensures business falls
      within the Maps viewport from every scan origin.

    Domain matching (v4.17):
      biz_domain passed to maps_search() for identity detection.

    Parallelization: 6 workers max (validated ceiling).

    serp[keyword_string] = {
        "service": str, "type": str,
        "origins": {
            "ZCTA_CODE": {
                "name": str, "dist_mi": float, "pop": int,
                "pos": int|None, "top3": list
            }
        }
    }
    """
    from concurrent.futures import ThreadPoolExecutor, as_completed

    print("\n-- Step 5: Maps SERP (dual-grid) ------------------------")

    serp       = {}
    total_cost = 0.0
    biz_lat    = trade_area.get("biz_lat", 47.5)

    nm_origins   = trade_area.get("near_me_origins", trade_area.get("origins", []))
    city_origins = trade_area.get("city_origins", [])
    print(f"  Near me origins: {len(nm_origins)}  City origins: {len(city_origins)}")
    print(f"  Keywords: {len(keywords)}  Workers: {max_workers}")

    for kw_dict in keywords:
        kw      = kw_dict["keyword"]
        service = kw_dict["service"]
        kw_type = kw_dict["type"]

        # Route to correct origin grid
        origins = nm_origins if kw_type == "near_me" else city_origins
        if not origins:
            print(f"\n  [{kw}] — no origins for type '{kw_type}', skipping")
            serp[kw] = {"service": service, "type": kw_type, "origins": {}}
            continue

        print(f"\n  [{kw}]  ({kw_type}, {len(origins)} origins)")
        serp[kw] = {"service": service, "type": kw_type, "origins": {}}

        def _task(origin, _kw=kw):
            zoom = origin.get("zoom_override") or zoom_for_origin(origin["dist_mi"], lat=biz_lat)
            pos, top3, cost = maps_search(
                _kw, origin["lat"], origin["lng"], biz_name,
                biz_domain=biz_domain, zoom=zoom,
            )
            return origin, pos, top3, cost, zoom

        results_map = {}
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = {executor.submit(_task, origin): origin for origin in origins}
            for future in as_completed(futures):
                origin, pos, top3, cost, zoom = future.result()
                results_map[origin["zcta"]] = (origin, pos, top3, cost, zoom)

        for origin in origins:
            o, pos, top3, cost, zoom = results_map[origin["zcta"]]
            total_cost += cost
            serp[kw]["origins"][origin["zcta"]] = {
                "name":    origin["name"],
                "dist_mi": origin["dist_mi"],
                "pop":     origin["pop"],
                "pos":     pos,
                "top3":    top3,
                "zoom":    zoom,
            }
            status = f"#{pos}" if pos else "-"
            print(f"    {origin['zcta']} {origin['name']:<22} {origin['dist_mi']:.2f}mi  zoom={zoom}  pos={status}")

    print(f"\n  Total Maps cost: ${total_cost:.4f}")
    return serp, total_cost


# ════════════════════════════════════════════════════════════════
# STEP 5: DATAFORSEO LOCAL FINDER — Google Search "More places" surface
# Sequential scan: same origins × same keywords as Maps.
# Parallelization logged as DEFERRED (same pattern as Maps when ready).
#
# local_finder[keyword] = {
#     "origins": {
#         "ZCTA_CODE": {
#             "name": str, "dist_mi": float, "pop": int,
#             "pos": int|None, "top20": list
#         }
#     }
# }
# ════════════════════════════════════════════════════════════════

def _lf_match_client(item, biz_address_street, biz_name, biz_domain):
    """
    Address-first identity matching for Local Finder results.  [v4.21]
    LF does not reliably populate domain/url fields — address is the primary signal.

    Cascade:
      1. Address — parse first line of description, compare street number + street name
      2. Domain  — if LF does populate domain field (rare), use as confirmation
      3. Name    — token overlap fallback, distinctive tokens only

    Returns True if item matches the client business.
    """
    import re as _re

    def _norm(s):
        return _re.sub(r'\s+', ' ', _re.sub(r'[^a-z0-9 ]', '', s.lower())).strip()

    # 1. Address match — first line of description field
    desc     = item.get("description") or ""
    lf_addr  = desc.split("\n")[0].strip() if desc else ""
    if lf_addr and biz_address_street:
        lf_tokens  = set(_norm(lf_addr).split())
        gbp_tokens = set(_norm(biz_address_street).split())
        if lf_tokens and gbp_tokens:
            overlap = lf_tokens & gbp_tokens
            ratio   = len(overlap) / max(len(lf_tokens), len(gbp_tokens))
            if ratio >= 0.8:
                return True

    # 2. Domain match — for any LF responses that do populate domain
    item_domain = (item.get("domain") or "").replace("www.", "").lower()
    clean_dom   = biz_domain.replace("www.", "").lower()
    if clean_dom and item_domain and clean_dom in item_domain:
        return True

    # 3. Name token overlap — strip generic category words, require >=1 distinctive token
    _GENERIC = {"restaurant", "bar", "grill", "cafe", "the", "and", "kitchen",
                "steakhouse", "steak", "house", "prime", "pub", "grille", "of",
                "at", "in", "a", "an"}
    lf_title   = (item.get("title") or "").lower()
    lf_tokens  = set(lf_title.split()) - _GENERIC
    biz_tokens = set(biz_name.lower().split()) - _GENERIC
    if lf_tokens and biz_tokens:
        overlap = lf_tokens & biz_tokens
        ratio   = len(overlap) / max(len(lf_tokens), len(biz_tokens))
        if ratio >= 0.5 and overlap:
            return True

    return False


def local_finder_search(keyword, lat, lng, biz_name, biz_domain="",
                        biz_address_street="", zoom="14z", depth=20, retries=2):
    """
    Searches Google Local Finder from a coordinate origin.  [v4.21]

    Changes from v4.17:
      - zoom parameter added — passed as lat,lng,zoom coordinate string.
        Previously omitted, causing DFS to default to 17z (street-level viewport)
        which excluded the client from results at all non-home origins.
      - Identity matching rebuilt: address-first cascade via _lf_match_client().
        DFS Local Finder does not populate domain/url fields — previous domain
        match silently returned None for all businesses where LF omits domain.

    Returns (position, top3, top20, cost).
      position: 1–20 or None
      top3:     top 3 non-client competitor items
      top20:    full top 20 for leaderboard aggregation in scoring engine
    """
    coord = f"{lat},{lng},{zoom}"

    for attempt in range(retries + 1):
        try:
            r = requests.post(
                "https://api.dataforseo.com/v3/serp/google/local_finder/live/advanced",
                headers=dfs_headers,
                json=[{
                    "keyword":             keyword,
                    "location_coordinate": coord,
                    "language_code":       "en",
                    "depth":               depth,
                }],
                timeout=45,
            )
            data  = r.json()
            cost  = data.get("cost", 0.002)
            items = data["tasks"][0]["result"][0].get("items") or []

            pos   = None
            top3  = []
            top20 = []

            for item in items:
                rank      = item.get("rank_group") or item.get("rank_absolute") or 99
                is_client = _lf_match_client(item, biz_address_street, biz_name, biz_domain)

                if is_client and pos is None:
                    pos = rank

                # Top20 — full list for leaderboard (scoring engine)
                if len(top20) < 20:
                    rating_obj = item.get("rating") or {}
                    top20.append({
                        "rank":         rank,
                        "title":        item.get("title") or item.get("name") or "",
                        "domain":       item.get("domain") or "",
                        "rating":       rating_obj.get("value"),
                        "review_count": rating_obj.get("votes_count"),
                    })

                # Top3 non-client competitors
                item_cat = (item.get("category") or "").strip()
                item_dom = (item.get("domain") or "").replace("www.", "").lower()
                is_stub  = not item_dom and not item_cat
                if len(top3) < 3 and not is_client and not is_stub:
                    rating_obj = item.get("rating") or {}
                    top3.append({
                        "rank":         rank,
                        "title":        item.get("title") or item.get("name") or "",
                        "domain":       item.get("domain") or "",
                        "rating":       rating_obj.get("value"),
                        "review_count": rating_obj.get("votes_count"),
                        "category":     item_cat,
                    })

            return pos, top3, top20, cost

        except Exception as e:
            if attempt < retries:
                time.sleep(3)
            else:
                print(f"    Local Finder search failed after {retries+1} attempts: {e}")
                return None, [], [], 0.002


def fetch_local_finder(keywords, trade_area, biz_name, biz_domain="", biz_address_street="",
                       max_workers=6):
    """
    Runs Local Finder searches for each keyword × each trade area origin.  [v4.30]
    keywords: list of dicts {keyword, service, type} from normalize_keywords().

    v4.30: Parallelized using ThreadPoolExecutor (6 workers, no throttle).
      Validated against sequential baseline — identical positions, 2x+ speedup.
      Same pattern as fetch_serp() (Maps). 0.5s throttle removed.

    v4.21: biz_address_street param added — address-first identity matching.
      zoom calculated per origin via zoom_for_origin(dist_mi).

    Keyword-type routing:
      near_me keywords → near_me_origins
      city keywords    → city_origins

    local_finder[keyword_string] = {
        "service": str, "type": str,
        "origins": {
            "ZCTA_CODE": {
                "name": str, "dist_mi": float, "pop": int,
                "pos": int|None,
                "top20": list,   # full list for scoring engine leaderboard
                "top3":  list,   # non-client top 3 for competitor intel
            }
        }
    }
    """
    from concurrent.futures import ThreadPoolExecutor, as_completed

    print("\n-- Step 5b: Local Finder (dual-grid) --------------------")

    local_finder = {}
    total_cost   = 0.0

    nm_origins   = trade_area.get("near_me_origins", trade_area.get("origins", []))
    city_origins = trade_area.get("city_origins", [])
    print(f"  Near me origins: {len(nm_origins)}  City origins: {len(city_origins)}")
    print(f"  Keywords: {len(keywords)}  Workers: {max_workers}")

    for kw_dict in keywords:
        kw      = kw_dict["keyword"]
        service = kw_dict["service"]
        kw_type = kw_dict["type"]

        origins = nm_origins if kw_type == "near_me" else city_origins
        if not origins:
            print(f"\n  [{kw}] — no origins for type '{kw_type}', skipping")
            local_finder[kw] = {"service": service, "type": kw_type, "origins": {}}
            continue

        print(f"\n  [{kw}]  ({kw_type}, {len(origins)} origins)")
        local_finder[kw] = {"service": service, "type": kw_type, "origins": {}}

        def _task(origin, _kw=kw):
            zoom = origin.get("zoom_override") or zoom_for_origin(origin["dist_mi"])
            pos, top3, top20, cost = local_finder_search(
                _kw, origin["lat"], origin["lng"], biz_name,
                biz_domain=biz_domain,
                biz_address_street=biz_address_street,
                zoom=zoom,
            )
            return origin, pos, top3, top20, cost, zoom

        results_map = {}
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = {executor.submit(_task, origin): origin for origin in origins}
            for future in as_completed(futures):
                origin, pos, top3, top20, cost, zoom = future.result()
                results_map[origin["zcta"]] = (origin, pos, top3, top20, cost, zoom)

        for origin in origins:
            o, pos, top3, top20, cost, zoom = results_map[origin["zcta"]]
            total_cost += cost
            local_finder[kw]["origins"][origin["zcta"]] = {
                "name":    origin["name"],
                "dist_mi": origin["dist_mi"],
                "pop":     origin["pop"],
                "pos":     pos,
                "top20":   top20,
                "top3":    top3,
            }
            status = f"#{pos}" if pos else "-"
            print(f"    {origin['zcta']} {origin['name']:<22} {origin['dist_mi']:.2f}mi  zoom={zoom}  pos={status}")

    print(f"\n  Total Local Finder cost: ${total_cost:.4f}")
    return local_finder, total_cost


# ════════════════════════════════════════════════════════════════
# STEP 8: WHOIS
# ════════════════════════════════════════════════════════════════

def fetch_whois(url):
    print("\n── Step 8: WHOIS ───────────────────────────────────────")
    domain = url.replace("https://", "").replace("http://", "").replace("www.", "").split("/")[0]

    try:
        w       = whois_lib.whois(domain)
        created = w.creation_date
        if isinstance(created, list):
            created = created[0]

        now     = datetime.now(timezone.utc) if created and created.tzinfo else datetime.now()
        age_yrs = round((now - created).days / 365.25, 1) if created else None

        print(f"  Domain:  {domain}")
        print(f"  Age:     {age_yrs} years")
        print(f"  HTTPS:   {url.startswith('https://')}")

        return {
            "domain":    domain,
            "age_years": age_yrs,
            "created":   str(created),
            "registrar": w.registrar,
            "https":     url.startswith("https://"),
        }
    except Exception as e:
        print(f"  WARNING: WHOIS failed — {e}")
        return {"domain": domain, "age_years": None, "https": url.startswith("https://")}


# ════════════════════════════════════════════════════════════════
# STEP 9: HTML SURFACE CHECKS
# ════════════════════════════════════════════════════════════════

_BROWSER_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
}

_ERROR_PAGE_PATTERNS = [
    "not acceptable", "403 forbidden", "404 not found",
    "access denied", "just a moment", "attention required",
    "bad gateway", "503 service",
    "429", "too many requests",
]

_RENDER_TIMEOUT_MS = 25000
_RENDER_SETTLE_MS = 2500

# Network needles keyed by platform — OR'd into DOM detection in extract_html_signals
_PLATFORM_NET_NEEDLES = {
    "boulevard": ["blvd.co"],
    "vagaro": ["vagaro.com/"],
    "mindbody": ["mindbodyonline.com"],
    "zenoti": ["zenoti.com"],
    "booksy": ["booksy.com"],
    "fresha": ["fresha.com"],
    "acuity": ["acuityscheduling.com", "as.me"],
    "calendly": ["calendly.com"],
    "square": ["squareup.com/appointments", "squareup.com/l/"],
    "jane": ["janeapp.com"],
    "mangomint": ["mangomint.com"],
    "glossgenius": ["glossgenius.com"],
    "phorest": ["phorest.com"],
    "simplybook": ["simplybook.me"],
    "daysmart": ["daysmartspa.com", "daysmart.com"],
    "toast": ["toasttab.com"],
    "otter": ["tryotter.com", "otterco.com"],
    "bentobox": ["getbento.com", "bentobox.com"],
    "slice": ["slicelife.com"],
    "owner": ["owner.com", "awwybhhmo"],
    "popmenu": ["popmenu.com"],
    "flipdish": ["flipdish.com"],
    "chownow": ["chownow.com"],
    "olo": ["olo.com", "olosolutions.com"],
    "incentivio": ["incentivio.com"],
    "thanx": ["thanx.com"],
    "clover": ["clover.com/online-ordering"],
    "square_restaurants": ["squareup.com/restaurants", "squareup.com/online/checkout"],
    "lightspeed": ["lightspeedpos.com", "lightspeedhq.com"],
    "squarespace": ["squarespace.com/book"],
    "wix": ["wixsite.com/booking", "wix.com/booking"],
    "meevo": ["meevo.com"],
    "setmore": ["setmore.com"],
    "housecall": ["housecallpro.com", "online-booking.housecallpro.com", "hcp-lead-iframe"],
    "zocdoc": ["zocdoc.com"],
    "opentable": ["opentable.com"],
    "resy": ["resy.com"],
    "tock": ["exploretock.com"],
    "spoton": ["spoton.com"],
    "sevenrooms": ["sevenrooms.com"],
    "myaestheticspro": ["myaestheticspro.com"],
    "athena": ["scheduling.athena.io"],
    "servicetitan": ["servicetitan.com", "static.servicetitan.com/webscheduler"],
    "jobber": ["getjobber.com", "jobber.com", "clienthub.getjobber.com", "d3ey4dbjkt2f6s.cloudfront.net"],
    "workiz": ["workiz.com"],
    "fieldedge": ["fieldedge.com"],
    "kickserv": ["kickserv.com"],
    "servicefusion": ["servicefusion.com"],
    "glofox": ["glofox.com"],
    "pike13": ["pike13.com"],
    "zen_planner": ["zenplanner.com"],
    "wellnessliving": ["wellnessliving.com"],
    "teamup": ["teamup.com"],
    "wodify": ["wodify.com"],
}


def _net_has(needle, network_urls):
    needle = needle.lower()
    return any(needle in u.lower() for u in (network_urls or []))


def _check_html_fetch_error(html, status_code):
    """Return error dict if page is blocked/error; else None."""
    if status_code >= 400:
        print(f"  WARNING: HTTP {status_code} on HTML fetch — skipping HTML analysis (clean failure)")
        return {"html_fetch_error": True, "html_fetch_status": status_code}

    title_check = re.search(r'<title[^>]*>([^<]+)</title>', html, re.IGNORECASE)
    title_lower = title_check.group(1).strip().lower() if title_check else ""
    if any(pat in title_lower for pat in _ERROR_PAGE_PATTERNS):
        print(f"  WARNING: Error page detected (title: '{title_lower}', status: {status_code}) — skipping HTML analysis")
        return {"html_fetch_error": True, "html_fetch_status": status_code}
    return None


def _fetch_static_html(url):
    """Fetch raw HTML via requests. Returns (html, status_code). Raises on transport failure."""
    r = requests.get(url, timeout=20, headers=_BROWSER_HEADERS)
    return r.text, r.status_code


async def _render_page(url, timeout_ms=_RENDER_TIMEOUT_MS):
    """Render homepage in headless Chromium; capture DOM + network URLs."""
    from playwright.async_api import async_playwright

    network_urls = []
    browser = None
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(
                user_agent=_BROWSER_HEADERS["User-Agent"],
                locale="en-US",
                viewport={"width": 1366, "height": 768},
                extra_http_headers={
                    "Accept": _BROWSER_HEADERS["Accept"],
                    "Accept-Language": _BROWSER_HEADERS["Accept-Language"],
                },
            )
            page = await context.new_page()

            def _on_request(request):
                network_urls.append(request.url)

            page.on("request", _on_request)

            async def _route_handler(route):
                if route.request.resource_type in ("image", "font", "media"):
                    await route.abort()
                else:
                    await route.continue_()

            await page.route("**/*", _route_handler)

            response = await page.goto(
                url,
                wait_until="domcontentloaded",
                timeout=timeout_ms,
            )
            try:
                await page.wait_for_load_state("networkidle", timeout=_RENDER_SETTLE_MS)
            except Exception:
                await page.wait_for_timeout(_RENDER_SETTLE_MS)

            html = await page.content()
            status = response.status if response else 200
            final_url = page.url

            await context.close()
            await browser.close()
            browser = None

            return {
                "html": html,
                "network_urls": network_urls,
                "status": status,
                "final_url": final_url,
                "ok": True,
                "error": None,
            }
    except Exception as e:
        if browser:
            try:
                await browser.close()
            except Exception:
                pass
        return {
            "html": "",
            "network_urls": network_urls,
            "status": 0,
            "final_url": url,
            "ok": False,
            "error": str(e),
        }


def _render_sync(url, timeout_ms=_RENDER_TIMEOUT_MS):
    loop = asyncio.get_event_loop()
    return loop.run_until_complete(_render_page(url, timeout_ms))


def _apply_network_platforms(named_platforms, network_urls, dom_platforms_before_net):
    """OR network fingerprints into named_platforms; return set of network-only hits."""
    network_only = set()
    for platform, needles in _PLATFORM_NET_NEEDLES.items():
        if named_platforms.get(platform):
            continue
        if any(_net_has(n, network_urls) for n in needles):
            named_platforms[platform] = True
            if platform not in dom_platforms_before_net:
                network_only.add(platform)
    return network_only


def extract_html_signals(html, url, vertical="service", network_urls=None):
    """Pure signal extraction from HTML string (+ optional network request URLs)."""
    raw = html
    html_lower = html.lower()
    network_urls = network_urls or []

    # ── Analytics ───────────────────────────────────────────────
    ga4            = bool(re.search(r'G-[A-Z0-9]{6,}', raw))
    gtm            = bool(re.search(r'GTM-[A-Z0-9]+', raw))
    facebook_pixel = "fbq(" in raw
    clarity        = "clarity.ms" in html_lower or "microsoft.clarity" in html_lower

    # ── Booking detection ────────────────────────────────────────
    boulevard_present = "blvd.co" in html_lower or "boulevard" in html_lower
    vagaro_detected   = bool(re.search(r'vagaro\.com/[a-z]', html_lower))
    vagaro_confirmed  = vagaro_detected and not boulevard_present

    named_platforms = {
        "boulevard":  boulevard_present,
        "vagaro":     vagaro_confirmed,
        "mindbody":   "mindbodyonline.com" in html_lower,
        "zenoti":     "zenoti.com" in html_lower,
        "booksy":     "booksy.com" in html_lower,
        "fresha":     "fresha.com" in html_lower,
        "acuity":     "acuityscheduling.com" in html_lower or "as.me" in html_lower,
        "calendly":   "calendly.com" in html_lower,
        "square":     "squareup.com/appointments" in html_lower or "squareup.com/l/" in html_lower,
        "jane":       "janeapp.com" in html_lower,
        "mangomint":    "mangomint.com" in html_lower,
        "glossgenius":  "glossgenius.com" in html_lower,
        "phorest":      "phorest.com" in html_lower,
        "simplybook":   "simplybook.me" in html_lower,
        "daysmart":     "daysmartspa.com" in html_lower or "daysmart.com" in html_lower,
        "toast":        "toasttab.com" in html_lower,
        "otter":        "tryotter.com" in html_lower or "otterco.com" in html_lower,
        "bentobox":     "getbento.com" in html_lower or "bentobox.com" in html_lower,
        "slice":        "slicelife.com" in html_lower,
        "owner":        "owner.com" in html_lower or "awwybhhmo" in html_lower or bool(re.search(r'/[a-z0-9]{7,8}/[^/]+-order-online', html_lower)),
        "popmenu":      "popmenu.com" in html_lower,
        "flipdish":     "flipdish.com" in html_lower,
        "chownow":      "chownow.com" in html_lower,
        "olo":          "olo.com" in html_lower or "olosolutions.com" in html_lower,
        "incentivio":   "incentivio.com" in html_lower,
        "thanx":        "thanx.com" in html_lower,
        "clover":       "clover.com/online-ordering" in html_lower,
        "square_restaurants": "squareup.com/restaurants" in html_lower or "squareup.com/online/checkout" in html_lower,
        "lightspeed":   "lightspeedpos.com" in html_lower or "lightspeedhq.com" in html_lower,
        "squarespace":  "squarespace.com/book" in html_lower,
        "wix":          "wixsite.com/booking" in html_lower or "wix.com/booking" in html_lower,
        "meevo":      "meevo.com" in html_lower,
        "setmore":    "setmore.com" in html_lower,
        "housecall":  "housecallpro.com" in html_lower,
        "zocdoc":     "zocdoc.com" in html_lower,
        "opentable":  "opentable.com" in html_lower,
        "resy":       "resy.com" in html_lower,
        "tock":       "exploretock.com" in html_lower,
        "spoton":     "spoton.com" in html_lower,
        "sevenrooms": "sevenrooms.com" in html_lower,
        "myaestheticspro": "myaestheticspro.com" in html_lower,
        "athena":          "scheduling.athena.io" in html_lower,
    }
    named_platforms["servicetitan"] = (
        "servicetitan.com" in html_lower or
        "static.servicetitan.com/webscheduler" in html_lower or
        "STWidgetManager" in raw
    )
    named_platforms["housecall"] = (
        "housecallpro.com" in html_lower or
        "online-booking.housecallpro.com" in html_lower or
        "HCPWidget" in raw or
        "hcp-lead-iframe" in html_lower
    )
    named_platforms["jobber"] = (
        "getjobber.com" in html_lower or
        "jobber.com" in html_lower or
        "clienthub.getjobber.com" in html_lower or
        "d3ey4dbjkt2f6s.cloudfront.net" in html_lower
    )
    named_platforms["workiz"]       = "workiz.com" in html_lower
    named_platforms["fieldedge"]    = "fieldedge.com" in html_lower
    named_platforms["kickserv"]     = "kickserv.com" in html_lower
    named_platforms["servicefusion"]= "servicefusion.com" in html_lower

    _lead_capture = []
    if "form.jotform.com/jsform/" in html_lower or bool(re.search(r'iframe[^>]+src=["\'][^"\']*jotform\.com', html_lower)):
        _lead_capture.append("jotform")
    if "embed.typeform.com" in html_lower or "data-tf-widget" in html_lower or "data-tf-popup" in html_lower:
        _lead_capture.append("typeform")
    if ("js.hsforms.net" in html_lower and "hbspt.forms.create" in raw) or "meetings-iframe-container" in html_lower:
        _lead_capture.append("hubspot_forms")

    named_platforms["glofox"]         = "glofox.com" in html_lower
    named_platforms["pike13"]         = "pike13.com" in html_lower
    named_platforms["zen_planner"]    = "zenplanner.com" in html_lower
    named_platforms["wellnessliving"] = "wellnessliving.com" in html_lower
    named_platforms["teamup"]         = "teamup.com" in html_lower
    named_platforms["wodify"]         = "wodify.com" in html_lower

    dom_platforms_before_net = {k for k, v in named_platforms.items() if v}
    network_only_platforms = _apply_network_platforms(named_platforms, network_urls, dom_platforms_before_net)

    booking_platforms = [k for k, v in named_platforms.items() if v]

    RESTAURANT_PLATFORMS = {
        "toast", "slice", "chownow", "bentobox", "popmenu", "otter",
        "flipdish", "owner", "olo", "incentivio", "thanx", "square_restaurants",
    }
    BEAUTY_WELLNESS_PLATFORMS = {
        "boulevard", "vagaro", "mindbody", "zenoti", "booksy", "fresha",
        "meevo", "myaestheticspro", "mangomint", "glossgenius", "phorest",
        "simplybook", "daysmart", "athena",
    }
    _is_fb     = "food" in (vertical or "").lower() or "beverage" in (vertical or "").lower()
    _is_beauty = "beauty" in (vertical or "").lower() or "wellness" in (vertical or "").lower()
    scoring_platforms = [
        p for p in booking_platforms
        if (p not in RESTAURANT_PLATFORMS or _is_fb)
        and (p not in BEAUTY_WELLNESS_PLATFORMS or _is_beauty)
    ]

    from urllib.parse import urlparse as _urlparse
    _client_domain = _urlparse(url).netloc.lower().replace("www.", "")
    _all_hrefs = re.findall(r'href=["\']([^"\']+)["\']', html_lower)
    _external_booking_hrefs = [
        h for h in _all_hrefs
        if h.startswith("http")
        and _client_domain not in h
        and re.search(r'/(book|schedule|appointment|reserve)', h)
    ]
    has_booking_url  = bool(_external_booking_hrefs)
    has_contact_only = bool(re.search(r'/(contact|contact-us|get-in-touch|reach-us|request)', html_lower))

    _BOOKING_SUBDOMAIN_FALLBACK = re.compile(
        r'^https?://(web\d+|book|app|booking|schedule|portal|client)\.',
        re.IGNORECASE
    )
    _is_beauty_vertical = "beauty" in (vertical or "").lower() or "wellness" in (vertical or "").lower()
    _subdomain_booking_hrefs = []
    if _is_beauty_vertical:
        _subdomain_booking_hrefs = [
            h for h in _all_hrefs
            if h.startswith("http")
            and _client_domain not in h
            and _BOOKING_SUBDOMAIN_FALLBACK.match(h)
        ]
    has_booking_subdomain = bool(_subdomain_booking_hrefs)

    _BOOKING_CTA_HASH = re.compile(
        r'<(a|button)[^>]+href=["\']#["\'][^>]*>\s*([^<]*'
        r'(book\s+online|book\s+now|book\s+an?\s+appointment|book\s+a?\s*service|'
        r'book\s+your\s+service|schedule\s+now|schedule\s+online|'
        r'schedule\s+your\s+service|schedule\s+today|easy\s+online\s+booking)'
        r'[^<]*)\s*</(?:a|button)>',
        re.IGNORECASE
    )
    has_booking_cta_hash = bool(_BOOKING_CTA_HASH.search(raw))

    _BOOKING_SLUG_INTERNAL = re.compile(
        r'/('
        r'book(?:ing|[-_]now|[-_]online|[-_]appointment|[-_]service)?'
        r'|schedul(?:e|ing)(?:[-_]service|[-_]appointment|[-_]now)?'
        r'|appointment(?:s)?'
        r'|online[-_]booking'
        r'|scorpion[-_]scheduling'
        r'|get[-_]an?[-_](estimate|quote)'
        r'|request[-_]an?[-_](estimate|quote)'
        r'|free[-_](estimate|quote)s?'
        r'|(estimate|quote)s?(?:[-_]form)?'
        r')(?:/|$|\?)',
        re.IGNORECASE
    )
    _BOOKING_SLUG_EXCLUSIONS = re.compile(
        r'/(blog|news|faq|about|review|coupon|financ|career|press|tip|guide)',
        re.IGNORECASE
    )
    _internal_slug_match = None
    for _href in _all_hrefs:
        _is_internal = (
            _href.startswith('/') or
            (_href.startswith('http') and _client_domain in _href)
        )
        if not _is_internal:
            continue
        if not _BOOKING_SLUG_INTERNAL.search(_href):
            continue
        if _BOOKING_SLUG_EXCLUSIONS.search(_href):
            continue
        _internal_slug_match = _href
        break
    has_internal_slug = _internal_slug_match is not None

    booking_detection_method = None

    _quote_cta = bool(re.search(
        r'(get\s+a?\s*free\s+(quote|estimate)|request\s+a?\s*(free\s+)?(quote|estimate)|'
        r'free\s+(quote|estimate)|get\s+a?\s*(quote|estimate)|'
        r'free\s+inspection|free\s+consultation|schedule\s+service|get\s+a\s+bid)',
        html_lower
    ))
    _quote_form_attrs = bool(re.search(
        r'(form[^>]+(id|class|name|action)=["\'][^"\']*'
        r'(quote|estimate|get-started|free-)[^"\']*["\'])',
        html_lower
    ))
    has_quote_form = _quote_cta or _quote_form_attrs

    if scoring_platforms:
        booking_path_type = "named_platform"
    elif has_booking_url:
        scoring_platforms = ["generic"]
        booking_path_type = "generic_booking"
        booking_detection_method = "external_url"
    elif has_booking_subdomain:
        scoring_platforms = ["generic"]
        booking_path_type = "generic_booking"
        booking_detection_method = "external_subdomain"
    elif has_booking_cta_hash:
        scoring_platforms = ["generic"]
        booking_path_type = "generic_booking"
        booking_detection_method = "cta_hash"
    elif has_internal_slug:
        scoring_platforms = ["generic"]
        booking_path_type = "generic_booking"
        booking_detection_method = "internal_slug"
    elif has_quote_form or _lead_capture:
        scoring_platforms = ["quote_form"] + _lead_capture
        booking_path_type = "quote_form"
    elif has_contact_only:
        scoring_platforms = ["contact_form"]
        booking_path_type = "contact_form_only"
    else:
        booking_path_type = "none"

    booking_detected = booking_path_type in ("named_platform", "generic_booking")

    click_to_call = bool(re.search(r'href=["\']tel:', html_lower))

    title_match = re.search(r'<title[^>]*>([^<]+)</title>', raw, re.IGNORECASE)
    title_text  = title_match.group(1).strip() if title_match else ""
    title_len   = len(title_text)

    h1_matches = re.findall(r'<h1[^>]*>(.*?)</h1>', raw, re.IGNORECASE | re.DOTALL)
    h1_count   = len(h1_matches)

    meta_match = re.search(
        r'<meta[^>]+name=["\'"]description["\'"][^>]+content=["\'"]([^"\']+)',
        raw, re.IGNORECASE
    )
    meta_desc         = meta_match.group(1).strip() if meta_match else ""
    meta_desc_missing = not bool(meta_desc)

    schema_types = []
    for match in re.finditer(r'"@type"\s*:\s*"([^"]+)"', raw):
        t = match.group(1)
        if t not in schema_types:
            schema_types.append(t)

    from bs4 import BeautifulSoup
    soup = BeautifulSoup(raw, "html.parser")

    video_autoplay = bool(re.search(r'<video[^>]+autoplay', html_lower))

    _vp_tag     = soup.find("meta", attrs={"name": lambda v: v and v.lower() == "viewport"})
    _vp_content = (_vp_tag.get("content") or "").lower() if _vp_tag else ""
    viewport_exists          = _vp_tag is not None
    viewport_has_width_device = "width=device-width" in _vp_content
    viewport_blocks_zoom     = (
        "user-scalable=no" in _vp_content or "maximum-scale=1" in _vp_content
    )
    viewport_content         = _vp_content
    viewport = viewport_exists and viewport_has_width_device

    _style_text       = " ".join(t.get_text() for t in soup.find_all("style")).lower()
    has_media_queries = "@media" in _style_text

    _RESP_MARKERS = [
        "vc_responsive", "elementor", "data-responsive",
        "bootstrap", "tailwind", "col-sm-", "col-md-",
        "container-fluid", "flex-wrap", "grid-cols-",
    ]
    has_responsive_markers = any(m in html_lower for m in _RESP_MARKERS)

    _all_imgs              = soup.find_all("img")
    has_responsive_images  = any(img.get("srcset") or img.get("sizes") for img in _all_imgs)

    _MOBILE_NAV_TOKENS = [
        "hamburger", "mobile-menu", "mobile-nav", "nav-toggle",
        "menu-toggle", "lines-button", "slide-out-widget",
        "off-canvas", "navbar-toggler", "menu-icon",
    ]
    has_mobile_nav = any(t in html_lower for t in _MOBILE_NAV_TOKENS)

    responsive_score = sum([
        has_media_queries,
        has_responsive_markers,
        has_responsive_images,
        has_mobile_nav,
    ])

    all_imgs          = _all_imgs
    webp_by_extension = any(
        ".webp" in (img.get("src", "") + img.get("srcset", "")).lower()
        for img in all_imgs
    )
    webp_by_picture = any(
        soup.find_all("source", type="image/webp")
    )
    webp_by_css = any(
        ".webp" in tag.get("style", "").lower()
        for tag in soup.find_all(style=True)
    )
    webp = webp_by_extension or webp_by_picture or webp_by_css

    content_imgs = [
        img for img in all_imgs
        if img.get("src", "")
        and not img.get("src", "").startswith("data:")
        and "pixel" not in img.get("src", "").lower()
        and "spacer" not in img.get("src", "").lower()
        and "icon" not in img.get("src", "").lower()
    ]
    imgs_with_alt    = [img for img in content_imgs if img.get("alt", "").strip()]
    alt_text_total   = len(content_imgs)
    alt_text_with    = len(imgs_with_alt)

    social_patterns = [
        "instagram.com", "facebook.com", "yelp.com",
        "tiktok.com", "twitter.com", "x.com", "google.com/maps"
    ]
    all_links    = [a.get("href", "") for a in soup.find_all("a", href=True)]
    social_links = [l for l in all_links if any(p in l.lower() for p in social_patterns)]

    CSS_FRAMEWORKS = {
        "Bootstrap":   ["bootstrap.min.css", "bootstrap.css", "bootstrap.bundle"],
        "Tailwind":    ["tailwind.min.css", "tailwind.css", "cdn.tailwindcss.com"],
        "Foundation":  ["foundation.min.css", "foundation.css"],
        "Bulma":       ["bulma.min.css", "bulma.css"],
        "Materialize": ["materialize.min.css", "materialize.css"],
    }
    link_hrefs  = [tag.get("href", "").lower() for tag in soup.find_all("link", rel="stylesheet")]
    script_srcs = [tag.get("src", "").lower() for tag in soup.find_all("script", src=True)]
    all_sources = link_hrefs + script_srcs

    css_framework = None
    for fw_name, patterns in CSS_FRAMEWORKS.items():
        if any(p.lower() in src for p in patterns for src in all_sources):
            css_framework = fw_name
            break
    css_framework_detected = css_framework is not None

    print(f"  GA4: {ga4}  GTM: {gtm}  Clarity: {clarity}  Pixel: {facebook_pixel}")
    print(f"  Booking: {booking_path_type} | platforms: {booking_platforms or 'none'} | method: {booking_detection_method or 'n/a'} | slug: {_internal_slug_match or 'n/a'} | lead_capture: {_lead_capture or 'none'}")
    if network_only_platforms:
        print(f"  Network-only platforms: {sorted(network_only_platforms)}")
    print(f"  Click-to-call: {click_to_call}")
    print(f"  Title: {title_text[:60]} ({title_len} chars)")
    print(f"  H1 count: {h1_count}")
    print(f"  Meta desc: {'present' if not meta_desc_missing else 'MISSING'} ({len(meta_desc)} chars)")
    print(f"  Schema types: {schema_types[:6]}")
    print(f"  WebP: {webp} (ext={webp_by_extension} picture={webp_by_picture} css={webp_by_css})")
    print(f"  Viewport: exists={viewport_exists}  width=device-width={viewport_has_width_device}  blocks_zoom={viewport_blocks_zoom}")
    print(f"  Responsive: {responsive_score}/4  (media_q={has_media_queries}  markers={has_responsive_markers}  images={has_responsive_images}  nav={has_mobile_nav})")
    print(f"  Alt text: {alt_text_with}/{alt_text_total} images tagged")
    print(f"  Social links: {social_links[:4] or 'none'}")
    print(f"  CSS framework: {css_framework or 'none'}")

    return {
        "ga4":                  ga4,
        "gtm":                  gtm,
        "facebook_pixel":       facebook_pixel,
        "clarity":              clarity,
        "booking_platforms":        scoring_platforms,
        "all_detected_platforms":   booking_platforms,
        "booking_detected":         booking_detected,
        "booking_path_type":        booking_path_type,
        "booking_detection_method": booking_detection_method,
        "booking_internal_slug":    _internal_slug_match,
        "lead_capture_platforms":   _lead_capture,
        "click_to_call":        click_to_call,
        "title_text":           title_text,
        "title_length":         title_len,
        "h1_count":             h1_count,
        "h1_multiple_flag":     h1_count > 1,
        "meta_desc":            meta_desc,
        "meta_desc_missing":    meta_desc_missing,
        "schema_types":         schema_types,
        "viewport":                  viewport,
        "viewport_exists":           viewport_exists,
        "viewport_has_width_device": viewport_has_width_device,
        "viewport_blocks_zoom":      viewport_blocks_zoom,
        "viewport_content":          viewport_content,
        "responsive_score":          responsive_score,
        "has_media_queries":         has_media_queries,
        "has_responsive_markers":    has_responsive_markers,
        "has_responsive_images":     has_responsive_images,
        "has_mobile_nav":            has_mobile_nav,
        "webp":                 webp,
        "webp_by_extension":    webp_by_extension,
        "webp_by_picture":      webp_by_picture,
        "webp_by_css":          webp_by_css,
        "video_autoplay":       video_autoplay,
        "alt_text_total_images": alt_text_total,
        "alt_text_with_alt":    alt_text_with,
        "social_links":         social_links,
        "css_framework":        css_framework,
        "css_framework_detected": css_framework_detected,
        "_network_only_platforms": network_only_platforms,
    }


def _debug_diff_static_rendered(url, vertical):
    """Compare static vs rendered extraction — for HTML_FETCH_DEBUG_DIFF."""
    _DIFF_KEYS = (
        "booking_path_type", "booking_platforms", "all_detected_platforms",
        "ga4", "gtm", "facebook_pixel", "clarity", "responsive_score",
    )
    print("\n  ── HTML_FETCH_DEBUG_DIFF ─────────────────────────────")
    try:
        static_html, static_status = _fetch_static_html(url)
        static_err = _check_html_fetch_error(static_html, static_status)
        static_signals = {} if static_err else extract_html_signals(static_html, url, vertical, [])
    except Exception as e:
        print(f"  Static fetch failed: {e}")
        static_signals = {}

    render_result = _render_sync(url)
    if render_result["ok"] and not _check_html_fetch_error(render_result["html"], render_result["status"]):
        rendered_signals = extract_html_signals(
            render_result["html"], url, vertical, render_result["network_urls"]
        )
    else:
        print(f"  Render failed: {render_result.get('error') or 'blocked/error page'}")
        rendered_signals = {}

    for key in _DIFF_KEYS:
        s_val = static_signals.get(key)
        r_val = rendered_signals.get(key)
        if s_val != r_val:
            print(f"  DIFF {key}: static={s_val!r}  rendered={r_val!r}")
    if static_signals.get("booking_path_type") == rendered_signals.get("booking_path_type"):
        print("  booking_path_type unchanged")
    print("  ── end diff ──────────────────────────────────────────\n")


def fetch_html(url, vertical="service"):
    print("\n── Step 9: HTML checks ─────────────────────────────────")

    if HTML_FETCH_DEBUG_DIFF:
        _debug_diff_static_rendered(url, vertical)

    render_used = True
    render_ok = False
    html_source = "static_fallback"
    network_urls = []
    html_body = ""
    status_code = 0

    print("  Rendering homepage (Playwright)...")
    render_result = _render_sync(url)
    render_ok = render_result["ok"]

    if render_ok:
        html_body = render_result["html"]
        status_code = render_result["status"]
        network_urls = render_result["network_urls"]
        fetch_err = _check_html_fetch_error(html_body, status_code)
        if fetch_err is None:
            html_source = "rendered"
            print(f"  Render OK (status {status_code}, {len(network_urls)} network requests)")
        else:
            print(f"  Render blocked/error page — falling back to static fetch")
            render_ok = False
            html_body = ""
    else:
        print(f"  Render failed — {render_result.get('error')} — falling back to static fetch")

    if html_source != "rendered":
        try:
            html_body, status_code = _fetch_static_html(url)
        except Exception as e:
            print(f"  ERROR: HTML fetch failed — {e}")
            return {
                "html_fetch_error": True,
                "render_used": render_used,
                "render_ok": render_ok,
                "html_source": "static_fallback",
                "booking_source": "static",
            }

        fetch_err = _check_html_fetch_error(html_body, status_code)
        if fetch_err:
            fetch_err.update({
                "render_used": render_used,
                "render_ok": render_ok,
                "html_source": "static_fallback",
                "booking_source": "static",
            })
            return fetch_err
        network_urls = []
        html_source = "static_fallback"
        print(f"  Static fallback OK (status {status_code})")

    signals = extract_html_signals(html_body, url, vertical, network_urls)

    network_only = signals.pop("_network_only_platforms", set())
    scoring_platforms = signals.get("booking_platforms") or []
    if html_source == "static_fallback":
        booking_source = "static"
    elif network_only & set(scoring_platforms):
        booking_source = "network"
    else:
        booking_source = "dom"

    signals.update({
        "render_used": render_used,
        "render_ok": render_ok,
        "html_source": html_source,
        "booking_source": booking_source,
        "network_request_count": len(network_urls),
    })

    print(f"  HTML source: {html_source}  booking_source: {booking_source}")
    return signals

# ════════════════════════════════════════════════════════════════
# STEP 10: PAGESPEED (3-run mobile + 1 desktop)
# ════════════════════════════════════════════════════════════════

def extract_psi(data):
    lh     = data.get("lighthouseResult", {})
    cats   = lh.get("categories", {})
    audits = lh.get("audits", {})
    perf   = cats.get("performance", {}).get("score")
    ttfb   = audits.get("server-response-time", {}).get("numericValue")
    return {
        "performance":    round(perf * 100) if perf else 0,
        "accessibility":  round(cats.get("accessibility", {}).get("score", 0) * 100),
        "best_practices": round(cats.get("best-practices", {}).get("score", 0) * 100),
        "seo_score":      round(cats.get("seo", {}).get("score", 0) * 100),
        "ttfb_ms":        round(ttfb) if ttfb else None,
        "cls":            audits.get("cumulative-layout-shift", {}).get("numericValue"),
        "tbt_ms":         round(audits.get("total-blocking-time", {}).get("numericValue", 0)),
        "unused_js_kib":  round(audits.get("unused-javascript", {}).get("details", {}).get("overallSavingsBytes", 0) / 1024),
        "unused_css_kib": round(audits.get("unused-css-rules", {}).get("details", {}).get("overallSavingsBytes", 0) / 1024),
    }


def fetch_psi(url, google_api_key):
    print("\n── Step 10: PageSpeed Insights ──────────────────────────")

    # None values (not 0) allow scoring engine to distinguish PSI failure
    # from a real PSI=0 score and exclude performance from P2 scoring entirely.
    _null = {
        "performance":    None,
        "accessibility":  None,
        "best_practices": None,
        "seo_score":      None,
        "ttfb_ms":        None,
        "cls":            None,
        "tbt_ms":         None,
        "unused_js_kib":  None,
        "unused_css_kib": None,
    }

    for attempt in range(1, 3):
        try:
            r = requests.get(
                "https://www.googleapis.com/pagespeedonline/v5/runPagespeed",
                params={"url": url, "key": google_api_key, "strategy": "desktop"},
                timeout=90,
            )
            psi = extract_psi(r.json())
            print(f"  Desktop PSI:  {psi['performance']}/100")
            print(f"  TTFB:         {psi['ttfb_ms']}ms")
            print(f"  CLS:          {psi['cls']}  TBT: {psi['tbt_ms']}ms")
            print(f"  Unused JS:    {psi['unused_js_kib']} KiB  Unused CSS: {psi['unused_css_kib']} KiB")
            return psi
        except Exception as e:
            print(f"  WARNING: PSI attempt {attempt}/2 failed — {e}")

    print("  PSI unavailable — scan continues, performance scoring excluded")
    return _null


# ════════════════════════════════════════════════════════════════
# STEP 10b: PSI ACCESSIBILITY (mobile UX signals)
# ════════════════════════════════════════════════════════════════

def fetch_psi_accessibility(url, google_api_key):
    print("\n── Step 10b: PSI Accessibility ──────────────────────────")

    try:
        r = requests.get(
            "https://www.googleapis.com/pagespeedonline/v5/runPagespeed",
            params={
                "url":      url,
                "key":      google_api_key,
                "strategy": "mobile",
                "category": "accessibility",
            },
            timeout=90,
        )
        audits = r.json().get("lighthouseResult", {}).get("audits", {})

        viewport_score       = audits.get("meta-viewport",   {}).get("score")
        target_size_score    = audits.get("target-size",     {}).get("score")
        color_contrast_score = audits.get("color-contrast",  {}).get("score")

        result = {
            "psi_a11y_viewport":       viewport_score,
            "psi_a11y_target_size":    target_size_score,
            "psi_a11y_color_contrast": color_contrast_score,
        }

        print(f"  Viewport:       {viewport_score}")
        print(f"  Target size:    {target_size_score}")
        print(f"  Color contrast: {color_contrast_score}")
        return result

    except Exception as e:
        print(f"  WARNING: PSI accessibility failed — {e}")
        return {
            "psi_a11y_viewport":       None,
            "psi_a11y_target_size":    None,
            "psi_a11y_color_contrast": None,
        }


# ════════════════════════════════════════════════════════════════
# STEP 11: CHROME UX REPORT
# ════════════════════════════════════════════════════════════════

# ════════════════════════════════════════════════════════════════
# STEP 2d: MOZ — Domain Authority + Referring Domains
# ════════════════════════════════════════════════════════════════

def fetch_moz(url, competitor_domains=None, moz_api_key=None):
    """
    Fetches Moz Domain Authority and referring domains for the client domain
    and any competitor domains provided.

    Auth: x-moz-token header = MOZ_API_KEY (pre-encoded token from moz.com/api/dashboard)
    Endpoint: https://api.moz.com/jsonrpc
    Method: data.site.metrics.fetch

    v4.42: Competitor fetches parallelized (6 workers). Client fetched first
      sequentially. Validated: 9.4x speedup, identical DA+RD, no rate limiting.

    Returns:
      {
        "client":      {domain, da, referring_domains, external_pages, spam_score},
        "competitors": [{domain, da, referring_domains, ...}, ...]
      }
    """
    from concurrent.futures import ThreadPoolExecutor, as_completed

    print("\n── Step 2d: Moz DA ─────────────────────────────────────")

    if not moz_api_key:
        print("  WARNING: MOZ_API_KEY not set — skipping")
        return {"client": {}, "competitors": []}

    moz_headers = {
        "x-moz-token":  moz_api_key,
        "Content-Type": "application/json",
    }

    def _fetch_one(domain, idx):
        try:
            r = requests.post(
                "https://api.moz.com/jsonrpc",
                headers=moz_headers,
                json={
                    "jsonrpc": "2.0",
                    "id":      f"growthpath-{idx:024d}",
                    "method":  "data.site.metrics.fetch",
                    "params":  {"data": {"site_query": {"query": domain, "scope": "domain"}}},
                },
                timeout=20,
            )
            result = r.json().get("result", {}).get("site_metrics", {})
            return {
                "domain":            domain,
                "da":                result.get("domain_authority"),
                "referring_domains": result.get("root_domains_to_root_domain"),
                "external_pages":    result.get("external_pages_to_root_domain"),
                "spam_score":        result.get("spam_score"),
            }
        except Exception as e:
            print(f"  WARNING: Moz fetch failed for {domain} — {e}")
            return {"domain": domain}

    client_domain  = url.replace("https://", "").replace("http://", "").replace("www.", "").split("/")[0]
    comp_domains   = competitor_domains or []

    # Client: sequential
    client_data = _fetch_one(client_domain, 0)
    print(f"  Client: {client_domain}")
    print(f"    DA:                {client_data.get('da')}")
    print(f"    Referring domains: {client_data.get('referring_domains')}")
    print(f"    Spam score:        {client_data.get('spam_score')}")

    # Competitors: parallel (6 workers — validated, 9.4x speedup, no rate limiting)
    competitor_data = []
    if comp_domains:
        print(f"  Competitors ({len(comp_domains)}) — parallel 6 workers:")
        with ThreadPoolExecutor(max_workers=6) as executor:
            futures = {executor.submit(_fetch_one, d, i+1): d for i, d in enumerate(comp_domains)}
            for future in as_completed(futures):
                metrics = future.result()
                competitor_data.append(metrics)
                print(f"    {metrics.get('domain')}  DA={metrics.get('da')}  RD={metrics.get('referring_domains')}")

    return {"client": client_data, "competitors": competitor_data}


# ════════════════════════════════════════════════════════════════
# STEP 2e: GBP POST ACTIVITY
# ════════════════════════════════════════════════════════════════

def fetch_gbp_posts(biz_name, city, cid=None):
    """
    Fetches GBP post activity via DFS my_business_updates async flow.

    v4.42: Accepts cid param. Uses cid:NNNN as keyword when available —
      deterministic matching, faster resolution (~7s vs ~19s), eliminates
      silent 40102 failures caused by fuzzy name matching.
      Timeout reduced 90s → 20s based on empirical testing:
      CID max observed 11s, name+city max 19s. 20s covers both with buffer.
      Falls back to "biz_name, city" when CID unavailable.

    Flow: task_post → poll task_get with status_code==20000

    Returns:
      {
        "post_count":        int,
        "last_post_days_ago": int|None,
        "last_post_date":    str|None,
        "posts":             list
      }
    """
    print("\n── Step 2e: GBP Posts ──────────────────────────────────")

    try:
        # CID-based keyword preferred — deterministic match, faster resolution
        # Falls back to "biz_name, city" when CID unavailable
        keyword = f"cid:{cid}" if cid else f"{biz_name}, {city}"
        print(f"  Keyword: {keyword}")
        task_r = requests.post(
            "https://api.dataforseo.com/v3/business_data/google/my_business_updates/task_post",
            headers=dfs_headers,
            json=[{
                "keyword":       keyword,
                "location_code": 2840,
                "language_code": "en",
                "depth":         10,
            }],
            timeout=30,
        )
        task_data = task_r.json()
        task_id   = task_data["tasks"][0]["id"]
        print(f"  Task ID: {task_id}")

        # Poll — 2s interval, 20s timeout
        # 40602 = Task In Queue — keep polling
        # 20000 = Ok — result ready
        # 4xxxx (other) = error — exit early
        poll_start   = time.time()
        updates_resp = None
        while True:
            time.sleep(2)
            poll_r = requests.get(
                f"https://api.dataforseo.com/v3/business_data/google/my_business_updates/task_get/{task_id}",
                headers=dfs_headers,
                timeout=15,
            )
            poll_data   = poll_r.json()
            status_code = poll_data["tasks"][0].get("status_code")
            if status_code == 20000:
                updates_resp = poll_data
                break
            if status_code == 40102:
                # No Search Results — business has no GBP posts, exit cleanly
                print("  No GBP posts found for this business")
                break
            if status_code and status_code >= 40000 and status_code != 40602:
                print(f"  WARNING: GBP posts task error — status {status_code}")
                break
            if time.time() - poll_start > 20:
                print("  WARNING: GBP posts poll timed out (20s)")
                break

        if not updates_resp:
            return {"post_count": 0, "last_post_days_ago": None, "last_post_date": None, "posts": []}

        result = updates_resp["tasks"][0].get("result") or []
        items  = (result[0].get("items") or []) if result else []

        posts = []
        for item in items:
            post_dt = None
            for key in ["timestamp", "datetime", "publish_time", "create_time"]:
                val = item.get(key)
                if val:
                    try:
                        if isinstance(val, (int, float)):
                            post_dt = datetime.fromtimestamp(val, tz=timezone.utc)
                        else:
                            post_dt = datetime.fromisoformat(str(val).replace("Z", "+00:00"))
                        break
                    except Exception:
                        pass
            posts.append({
                "type":    item.get("post_type") or item.get("type"),
                "summary": (item.get("summary") or item.get("text") or "")[:120],
                "dt":      str(post_dt) if post_dt else None,
            })

        last_post_days_ago = None
        last_post_date     = None
        if posts and posts[0].get("dt"):
            try:
                lp_dt = datetime.fromisoformat(posts[0]["dt"])
                if lp_dt.tzinfo is None:
                    lp_dt = lp_dt.replace(tzinfo=timezone.utc)
                last_post_days_ago = (datetime.now(timezone.utc) - lp_dt).days
                last_post_date     = lp_dt.strftime("%B %d, %Y")
            except Exception:
                pass

        print(f"  Posts found:       {len(posts)}")
        print(f"  Last post:         {last_post_date or 'N/A'} ({last_post_days_ago} days ago)")

        return {
            "post_count":         len(posts),
            "last_post_days_ago": last_post_days_ago,
            "last_post_date":     last_post_date,
            "posts":              posts,
        }

    except Exception as e:
        print(f"  WARNING: GBP posts fetch failed — {e}")
        return {"post_count": 0, "last_post_days_ago": None, "last_post_date": None, "posts": []}


# ════════════════════════════════════════════════════════════════
# STEP 9b: CONTENT DEPTH CRAWL
# ════════════════════════════════════════════════════════════════

def fetch_content_depth(url, owner_services, city, max_pages=30, spot_check=5):
    """
    Step 9b: Content Depth — sitemap-first URL discovery with homepage crawl fallback.

    Discovery order:
      1. Sitemap (sitemap.xml → sitemap_index.xml → page-sitemap.xml → pages-sitemap.xml)
         Returns complete URL inventory — consistent, JS-independent, deterministic.
      2. Homepage crawl fallback — used only if no sitemap found or sitemap returns 0 URLs.

    Service page matching (depth-sorted):
      Pass 1: Full stem-based match against all URLs, sorted by path depth ascending
              (shallowest path wins — /facials/ beats /blog/benefits-of-facials/).
      Pass 2: First-word fallback for multi-word keywords where slug uses synonym
              (e.g. "laser treatments" → "/laser-services/"). Only fires if first
              word is ≥5 chars to prevent false positives on short terms.

    Returns:
      {
        "service_pages":              {service: {"found": bool, "url": str|None}},
        "city_keyword_cooccurrence":  {service: {"found": bool, "url": str|None}},
        "internal_links_crawled":     int,
        "pages_spot_checked":         int,
        "sitemap_url":                str|None,   # sitemap source used
        "sitemap_url_count":          int,        # total URLs in sitemap
      }
    """
    print("\n── Step 9b: Content Depth ──────────────────────────────")

    import xml.etree.ElementTree as ET
    from urllib.parse import urljoin, urlparse
    from bs4 import BeautifulSoup

    domain         = urlparse(url).netloc
    services_lower = [s.strip().lower() for s in (owner_services or [])]
    city_lower     = city.strip().lower() if city else ""
    ns             = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}

    _HEADERS = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/124.0.0.0 Safari/537.36"
        ),
        "Accept":                  "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language":         "en-US,en;q=0.9",
        "Accept-Encoding":         "gzip, deflate, br",
        "Connection":              "keep-alive",
        "Upgrade-Insecure-Requests": "1",
    }

    _NULL_RESULT = {
        "service_pages":             {s: {"found": False, "url": None} for s in services_lower},
        "city_keyword_cooccurrence": {s: {"found": False, "url": None} for s in services_lower},
        "internal_links_crawled":    0,
        "pages_spot_checked":        0,
        "sitemap_url":               None,
        "sitemap_url_count":         0,
    }

    # ── Helpers ──────────────────────────────────────────────────

    def path_depth(u):
        """Number of non-empty path segments. /facials/ = 1, /blog/post/slug/ = 3."""
        return len([s for s in urlparse(u).path.split("/") if s])

    def keyword_matches_path(keyword, path):
        """Stem-based match — handles plumber/plumbing, roofer/roofing etc."""
        kw_words   = keyword.lower().split()
        path_lower = path.lower()
        slug       = keyword.replace(" ", "-")
        if slug in path_lower:
            return True
        if all(w in path_lower for w in kw_words):
            return True
        for word in kw_words:
            if len(word) >= 5:
                stem        = word[:4]
                path_tokens = re.split(r'[/\-_]', path_lower)
                if any(tok.startswith(stem) for tok in path_tokens):
                    return True
        return False

    def keyword_matches_firstword(keyword, path):
        """
        Fallback for multi-word alias cases (e.g. "laser treatments" → "/laser-services/").
        Only fires when first word is ≥5 chars to avoid false positives on short terms.
        """
        first = keyword.lower().split()[0]
        if len(first) < 5:
            return False
        path_tokens = re.split(r'[/\-_]', path.lower())
        stem        = first[:4]
        return any(tok.startswith(stem) for tok in path_tokens)

    def match_services(all_urls):
        """Depth-sorted two-pass matching. Returns {svc: {"found": bool, "url": str|None}}."""
        sorted_urls = sorted(all_urls, key=path_depth)
        results = {}
        for svc in services_lower:
            matched = None
            # Pass 1: full match
            for u in sorted_urls:
                if keyword_matches_path(svc, urlparse(u).path):
                    matched = u
                    break
            # Pass 2: first-word fallback
            if not matched:
                for u in sorted_urls:
                    if keyword_matches_firstword(svc, urlparse(u).path):
                        matched = u
                        break
            results[svc] = {"found": bool(matched), "url": matched}
        return results

    # ── Step 1: Sitemap fetch ────────────────────────────────────
    base        = urlparse(url).scheme + "://" + domain
    sitemap_candidates = [
        f"{base}/sitemap.xml",
        f"{base}/sitemap_index.xml",
        f"{base}/page-sitemap.xml",
        f"{base}/pages-sitemap.xml",
    ]
    sitemap_urls   = []
    sitemap_source = None

    for sitemap_url in sitemap_candidates:
        try:
            r  = requests.get(sitemap_url, timeout=10, headers=_HEADERS)
            ct = r.headers.get("Content-Type", "")
            if r.status_code >= 400:
                print(f"  WARNING: HTTP {r.status_code} on sitemap fetch ({sitemap_url}) — skipping")
                continue
            if r.status_code != 200 or ("html" in ct and "xml" not in ct):
                continue
            root     = ET.fromstring(r.content)
            sub_locs = root.findall(".//sm:sitemap/sm:loc", ns)

            if sub_locs:
                # Sitemap index — recurse into sub-sitemaps, skip media sitemaps
                for sub in sub_locs:
                    sub_url = sub.text.strip()
                    if any(x in sub_url for x in ["image", "video", "news"]):
                        continue
                    try:
                        sr      = requests.get(sub_url, timeout=10, headers=_HEADERS)
                        if sr.status_code >= 400:
                            print(f"  WARNING: HTTP {sr.status_code} on sub-sitemap — skipping")
                            continue
                        sr_root = ET.fromstring(sr.content)
                        sitemap_urls.extend(
                            u.text.strip() for u in sr_root.findall(".//sm:url/sm:loc", ns)
                        )
                    except Exception:
                        continue
            else:
                sitemap_urls = [u.text.strip() for u in root.findall(".//sm:url/sm:loc", ns)]

            if sitemap_urls:
                sitemap_source = sitemap_url
                break

        except Exception:
            continue

    # ── Step 2: Homepage crawl fallback ─────────────────────────
    crawl_urls = []
    if not sitemap_urls:
        print(f"  Sitemap: not found — falling back to homepage crawl")
        try:
            r    = requests.get(url, timeout=20, headers=_HEADERS)
            if r.status_code >= 400:
                print(f"  WARNING: HTTP {r.status_code} on homepage — cannot crawl (clean failure)")
                return _NULL_RESULT
            soup = BeautifulSoup(r.text, "html.parser")
            raw  = set()
            for a in soup.find_all("a", href=True):
                full   = urljoin(url, a["href"])
                parsed = urlparse(full)
                if parsed.netloc == domain and parsed.scheme in ("http", "https"):
                    clean = f"{parsed.scheme}://{parsed.netloc}{parsed.path}"
                    if clean != url:
                        raw.add(clean)
            crawl_urls = list(raw)[:max_pages]
        except Exception as e:
            print(f"  WARNING: Homepage crawl failed — {e}")
            return _NULL_RESULT
    else:
        print(f"  Sitemap: {sitemap_source} ({len(sitemap_urls)} URLs)")

    all_urls = sitemap_urls if sitemap_urls else crawl_urls
    print(f"  URL inventory: {len(all_urls)} URLs ({'sitemap' if sitemap_urls else 'homepage crawl'})")

    # ── Step 3: Service page matching ───────────────────────────
    service_pages = match_services(all_urls)

    print(f"  Service pages found:")
    for svc, data in service_pages.items():
        url_short = data["url"].replace(base, "") if data["url"] else ""
        print(f"    {svc:<30} {'✓ ' + url_short if data['found'] else '✗ not found'}")

    # ── Step 4: City + keyword co-occurrence ─────────────────────
    # Spot-check: prioritize matched service page URLs, fill remainder from list
    matched_urls   = [v["url"] for v in service_pages.values() if v["url"]]
    other_urls     = [u for u in all_urls if u not in matched_urls]
    pages_to_check = (matched_urls + other_urls)[:spot_check]

    cooc          = {s: {"found": False, "url": None} for s in services_lower}
    pages_checked = 0
    for page_url in pages_to_check:
        try:
            pr   = requests.get(page_url, timeout=15, headers=_HEADERS)
            if pr.status_code >= 400:
                print(f"  WARNING: HTTP {pr.status_code} on page fetch — skipping {page_url}")
                continue
            text = BeautifulSoup(pr.text, "html.parser").get_text(separator=" ").lower()
            pages_checked += 1
            for svc in services_lower:
                if cooc[svc]["found"]:
                    continue
                has_svc  = all(w in text for w in svc.split())
                has_city = city_lower in text if city_lower else False
                if has_svc and has_city:
                    cooc[svc] = {"found": True, "url": page_url}
            time.sleep(0.3)
        except Exception:
            continue

    print(f"  City+keyword co-occurrence (spot-checked {pages_checked} pages):")
    for svc, data in cooc.items():
        print(f"    {svc:<30} {'✓ found' if data['found'] else '✗ not found'}")

    return {
        "service_pages":             service_pages,
        "city_keyword_cooccurrence": cooc,
        "internal_links_crawled":    len(all_urls),
        "pages_spot_checked":        pages_checked,
        "sitemap_url":               sitemap_source,
        "sitemap_url_count":         len(sitemap_urls),
    }


# ════════════════════════════════════════════════════════════════
# MAIN — runs all steps and assembles audit_data
# ════════════════════════════════════════════════════════════════

def run_scan(gazetteer=None):
    """
    Main scan orchestration.

    gazetteer: pre-loaded Gazetteer list from load_gazetteer().
    If None, it is loaded here (less efficient for multi-business runs).
    Pass pre-loaded for multi-business session runs.
    """
    print(f"\n{'═'*60}")
    print(f"  GROWTHPATH ENGINE v4.57")
    print(f"  URL: {URL}")
    print(f"{'═'*60}")

    scan_start = time.time()
    total_cost = 0.0

    # Step 3a: Load Gazetteer (once per session — pass in for multi-biz runs)
    if gazetteer is None:
        gazetteer = load_gazetteer()

    # Step 1: Normalize keywords
    keywords = normalize_keywords(OWNER_SERVICES, CITY)

    # Step 2: GBP + DFS Reviews
    gbp      = fetch_gbp(URL, GOOGLE_API_KEY, biz_name=BIZ_NAME, biz_city=CITY)
    biz_name = gbp.get("name") or BIZ_NAME or URL

    # Step 2d: Moz — DA + referring domains (client only at this stage)
    # Competitor domain enrichment runs after scan (Step 4b below)
    moz = fetch_moz(URL, competitor_domains=[], moz_api_key=MOZ_API_KEY)

    # Step 2e: GBP Post Activity
    gbp_posts = fetch_gbp_posts(biz_name, CITY, cid=gbp.get("cid"))

    # Step 3b: Trade area resolution — tier-aware sector-rotation dispersion (v4.56)
    trade_area = resolve_trade_area(
        BIZ_ADDRESS,
        GOOGLE_API_KEY,
        gazetteer,
        census_api_key = CENSUS_API_KEY,
        scan_tier      = SCAN_TIER,
        min_pop        = TRADE_AREA_MIN_POP,
    )

    # Step 4: Maps SERP — dual-grid, keyword-type routing, domain matching
    serp, maps_cost = fetch_serp(
        keywords, trade_area, biz_name, dfs_headers, biz_domain=BIZ_DOMAIN,
    )
    total_cost += maps_cost

    # Step 4b: Moz competitor enrichment
    # Collect all unique competitor domains from top3 across all keywords/origins,
    # then fetch Moz metrics in a single call. Stores full list in moz["competitors"]
    # so the report generator moz_by_domain lookup works for all leaderboard entries.
    _seen_domains  = set()
    _comp_domains  = []
    clean_biz_d    = BIZ_DOMAIN.replace("www.", "").lower()
    for kw, kw_data in serp.items():
        for od in kw_data.get("origins", {}).values():
            for item in od.get("top3", []):
                item_d = (item.get("domain") or "").replace("www.", "").lower()
                if item_d and item_d not in _seen_domains and clean_biz_d not in item_d:
                    _seen_domains.add(item_d)
                    _comp_domains.append(item_d)
    print(f"\n── Step 4b: Moz competitor enrichment ──────────────────")
    if _comp_domains:
        print(f"  Domains to enrich ({len(_comp_domains)}): {', '.join(_comp_domains)}")
        moz_comp = fetch_moz(f"https://{_comp_domains[0]}", competitor_domains=_comp_domains[1:], moz_api_key=MOZ_API_KEY)
        all_comp_metrics = [moz_comp.get("client", {})] + moz_comp.get("competitors", [])
        moz["competitors"] = all_comp_metrics
        for m in all_comp_metrics:
            print(f"  {m.get('domain')}  DA={m.get('da')}  RD={m.get('referring_domains')}")
    else:
        print("  No competitor domains found in top3 — skipping")

    # Step 5: Local Finder — dual-grid, sequential
    # biz_address_street: street portion only (no city/state) for LF description matching
    _biz_street = BIZ_ADDRESS.split(",")[0].strip() if BIZ_ADDRESS else ""
    local_finder, lf_cost = fetch_local_finder(
        keywords, trade_area, biz_name,
        biz_domain=BIZ_DOMAIN,
        biz_address_street=_biz_street,
    )
    total_cost += lf_cost

    # Step 8: WHOIS
    whois_data = fetch_whois(URL)

    # Step 9: HTML
    html = fetch_html(URL, vertical=BIZ_VERTICAL)

    # Step 9b: Content Depth Crawl
    content_depth = fetch_content_depth(URL, OWNER_SERVICES, CITY)

    # Step 10: PSI
    psi = fetch_psi(URL, GOOGLE_API_KEY)

    # Step 10b: PSI Accessibility (mobile UX signals)
    psi_accessibility = fetch_psi_accessibility(URL, GOOGLE_API_KEY)

    elapsed = round(time.time() - scan_start)

    # Assemble audit_data
    audit_data = {
        "business":        biz_name,
        "url":             URL,
        "city":            CITY,
        "vertical":        VERTICAL_KEY,   # normalized scoring key from intake form
        "biz_type":        BIZ_TYPE,
        "scan_date":       datetime.now().strftime("%B %d, %Y"),
        "engine":          "v4.58",
        "gbp_category_confirmed": (
            bool(GBP_PRIMARY_CATEGORY.strip()) and
            re.sub(r"[\s_\-]+", "", GBP_PRIMARY_CATEGORY.strip().lower()) ==
            re.sub(r"[\s_\-]+", "", (gbp.get("primary_type") or gbp.get("primary_category") or "").lower())
        ),
        "gbp_category_mismatch":  (
            bool(GBP_PRIMARY_CATEGORY.strip()) and
            re.sub(r"[\s_\-]+", "", GBP_PRIMARY_CATEGORY.strip().lower()) !=
            re.sub(r"[\s_\-]+", "", (gbp.get("primary_type") or gbp.get("primary_category") or "").lower())
        ),
        "gbp_primary_category":   GBP_PRIMARY_CATEGORY.strip() or None,
        "owner_services":  OWNER_SERVICES,
        "keywords":        keywords,
        "trade_area":      trade_area,      # contains near_me_origins + city_origins
        "gbp":             gbp,
        "gbp_posts":       gbp_posts,
        "moz":             moz,             # client DA + competitor DA (after step 4b)
        "serp":            serp,            # Maps: dual-grid, top3 per origin
        "local_finder":    local_finder,    # LF: dual-grid, top3 + top20 per origin
        "labs_data":       {"all_3pack_keywords": [], "near_miss_keywords": [], "total_3pack_count": 0},
        "whois":           whois_data,
        "html":            html,
        "content_depth":   content_depth,
        "pagespeed":       psi,
        "psi_accessibility": psi_accessibility,
        "crux":            {},
    }

    nm_count   = len(trade_area.get("near_me_origins", []))
    city_count = len(trade_area.get("city_origins", []))
    print(f"\n{'═'*60}")
    print(f"  SCAN COMPLETE — v4.58")
    print(f"  Runtime: {elapsed}s")
    print(f"  DFS cost: ${total_cost:.4f}")
    print(f"  Keywords scanned: {len(keywords)}")
    print(f"  Near me origins: {nm_count}  City origins: {city_count}")
    print(f"  Near me cumul pop: {trade_area.get('near_me_cumul_pop', 0):,}")
    print(f"  GBP photos: {gbp.get('photo_count')}")
    print(f"  Secondary categories: {len(gbp.get('secondary_categories', []))}")
    print(f"  Reviews last 30d: {gbp.get('reviews_last_30')}")
    print(f"  Owner response rate: {gbp.get('owner_response_rate')}")
    print(f"  GBP last post: {gbp_posts.get('last_post_date') or 'N/A'} ({gbp_posts.get('last_post_days_ago')} days ago)")
    print(f"  Moz client DA: {moz.get('client', {}).get('da')}  RD: {moz.get('client', {}).get('referring_domains')}")
    comp_da = (moz.get('competitors') or [{}])[0].get('da') if isinstance(moz.get('competitors'), list) else moz.get('competitors', {}).get('da')
    print(f"  Moz competitor DA: {comp_da}  ({_comp_domains[0] if _comp_domains else 'none identified'})")
    print(f"  Content depth — service pages: {sum(1 for v in content_depth.get('service_pages', {}).values() if v.get('found'))}/{len(content_depth.get('service_pages', {}))}")
    print(f"{'═'*60}\n")

    return audit_data


# ════════════════════════════════════════════════════════════════
# RUN
# ════════════════════════════════════════════════════════════════

# ════════════════════════════════════════════════════════════════
# RUN
# Note: if __name__ == "__main__": guards never execute in Colab.
# This appended block runs automatically when the cell is executed.
# ════════════════════════════════════════════════════════════════

gazetteer  = load_gazetteer()
audit_data = run_scan(gazetteer=gazetteer)

# For multi-business runs — reuse the loaded gazetteer:
# audit_data_2 = run_scan(gazetteer=gazetteer)

# Optional: inspect full audit_data as JSON
# import json
# print(json.dumps(audit_data, indent=2, default=str))
