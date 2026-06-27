# ════════════════════════════════════════════════════════════════
# GROWTHPATH — COMPETITIVE INTEL ENGINE v2.0
#
# v2.0 changes (Apr 18, 2026):
#   PDF generation merged into engine. generate_pdf() added using
#   identical screenshot-slice method as generate_report_v6.58:
#   Playwright headless Chromium at 2x scale, numpy smart-break
#   slicer, PIL multi-page PDF at 200 DPI. System deps (libatk,
#   libgdk, etc.) installed automatically — assumes clean Colab.
#   Both HTML and PDF download at end of run(). Standalone
#   comp-intel-pdf-generator retired.
#   100px background spacer injected between Tab 1 and Tab 2
#   before screenshot to prevent Tab 2 bleeding onto page 1.
#   NOTE: spacer may need adjustment for clients with significantly
#   more or fewer keywords than the baseline (12 keywords).
#
# v1.5 changes (Apr 16, 2026):
#   - Position grid: redesigned from per-service cards to ZCTA column layout.
#     Two-row header: scope group (Near Me / City) spans ZCTAs, bottom row
#     shows individual ZCTA code + neighborhood + distance. Each cell has
#     M (Maps) and LF (Local Finder) stacked vertically. Vertical divider
#     separates Near Me from City columns.
#   - GrowthPath tier colors applied throughout (brand guide canonical values):
#     Leading #1-3: #4ade80 green
#     Competitive #4-5: #60a5fa blue (corrected from #378ADD)
#     Needs Work #6-20: #f59e0b amber
#     Critical N/A: #f87171 red
#   - Client row in detail tab: 4-tier color logic based on actual rank.
#     #1-3 → green, #4-5 → blue, #6-20 → amber (with separator), N/A → red.
#     Previously only green/red. Amber and blue tiers now distinguish
#     competitive from gap positions.
#   - Legend updated: Leading/Competitive/Needs Work/Critical labels replace
#     generic Top3/Mid/Lower/Tail labels.
#   - pos_badge tier thresholds updated to match GrowthPath scoring:
#     #1-3 green, #4-5 blue, #6-10 amber, #11+ red.
#
# v1.4 changes (Apr 16, 2026):
#   - Est. DFS cost removed from report header.
#   - Origin panels: distance removed from city origins, ZCTA shown for all.
#   - Position grid redesigned: per-service card layout showing each origin
#     as a labeled row (name + ZCTA) with Maps/LF position side-by-side.
#     Far more readable than side-by-side tile columns.
#   - Leaderboard: client row injected at correct rank position if in top 5,
#     or appended with actual rank if outside top 5. Gold highlight + "(you)" label.
#   - Detail tab: client injected into each keyword table at their rank.
#     If ranked in top 5 → inserted in position, others reordered.
#     If ranked 6–20 → appended below top 5, rank shown, gold border.
#     If not ranked (>20 / not found) → appended with N/A row.
#
# v1.3 changes (Apr 16, 2026):
#   - Near-me origin selection: distance-spread logic replaces
#     "closest 3". Now selects one ZCTA from each of three bands
#     within 5mi (0–1.5mi, 1.5–3.5mi, 3.5–5mi) to ensure geographic
#     spread. Falls back gracefully if fewer than 3 ZCTAs exist.
#   - NM_DIST_CAP raised from 2.0mi → 5.0mi to accommodate spread logic.
#   - City bands expanded from 3 to 4 bands, 2 origins per band:
#     (5-10mi ×2, 10-15mi ×2, 15-20mi ×2, (new) 15-20mi already = 2)
#     Final: [(5,10),(5,10),(10,15),(10,15),(15,20),(15,20)] = 9 origins max
#     Wait — corrected per spec: 2+2+2+2 = 8 city origins total.
#     CITY_BANDS_PAIRS = [(5,10),(10,15),(15,20),(15,20)] with 2 per band = 8.
#     Implementation: select top 2 by pop per band.
#   - TOP_N reduced 10→5 (top 5 competitors per keyword).
#   - Default sort: frequency (total_appearances desc). Engine constant
#     DEFAULT_SORT read from config block.
#   - HTML report fully rebuilt to GrowthPath design system:
#     dark bg (#09090e), gold accent (#c8a96e), Bebas Neue headers,
#     DM Sans body, DM Mono labels. Matches intake form aesthetic.
#   - Two-tab report: Tab 1 = client position grid + top competitor
#     leaderboard (sortable). Tab 2 = full competitor detail by keyword.
#   - Position grid built in-engine from maps_results + lf_results —
#     no manual rebuild step required. Fully automated.
#   - Legend panel: color/symbol key for position tiles, surface badges,
#     sort options. Default sort labeled clearly.
#   - Report header: scan stats, origin grid summary, cost.
#
# v1.2 changes (Apr 16, 2026):
#   - Step 7 (service page URL resolver) removed entirely.
#   - Competitor website URL sourced from DFS Maps url field directly.
#   - GBP primary category surfaced prominently.
#   - Steps renumbered: 7=build rows, 8=CSV, 9=positions, 10=HTML.
#
# v1.8 changes (Apr 18, 2026):
#   - CSV exports removed entirely (Steps 8 & 9 dropped).
#   - Steps renumbered: 7=build rows, 8=HTML.
#   - csv import removed.
#
# v1.9 changes (Apr 18, 2026):
#   - BUG FIX: vis_score was always 0 for competitors — rank_group → rank
#     in aggregate_competitors slot lookup (top20 items store "rank" not "rank_group").
#   - BUG FIX: Leaderboard client rank computed positionally vs. appearances,
#     not by domain lookup in rows (client domain never in rows).
#   - BUG FIX: Detail tab rank overlap when client inserts — competitors after
#     client now correctly shift rank labels; loop capped at TOP_N_COMPETITORS.
#   - Detail tab competitor row rank color unified to #6b6b88 (no rank-tier tiers).
#   - Client row still uses vis_score-tiered color.
#
# ORIGIN GRID (v1.3 — up to 11 origins):
#   - 3 near-me ZCTAs within 5mi (spread: ~0-1.5mi, ~1.5-3.5mi, ~3.5-5mi)
#   - 2 ZCTAs per city band: 5-10mi, 10-15mi, 15-20mi (6 city, 2 per band)
#     Wait — per spec: 2+2+2+2 = 8 city = 4 bands. Added 4th: keep 15-20 as
#     separate 2-ZCTA band and add nothing else. 3nm + 8city = 11 total.
#
# VALIDATED COST MODEL (10 services, v1.3):
#   20 keywords x 3 nm_origins x 2 surfaces = 120 nm calls
#   20 keywords x 8 city_origins x 2 surfaces = 320 city calls
#   Total: 440 DFS calls x $0.002 = $0.88
#   ~50 unique domains x ~$0.01 Moz = ~$0.50
#   Total per run: ~$1.38
#
# OUTPUT:
#   - {domain}_comp_intel.html     two-tab GrowthPath-branded report
#
# ENVIRONMENT: Google Colab (Python 3.x)
# Paste entire file into one Colab cell and run.
# ════════════════════════════════════════════════════════════════


import base64, io, math, time, zipfile
from concurrent.futures import ThreadPoolExecutor, as_completed
from collections import defaultdict
from datetime import datetime

import requests


# ════════════════════════════════════════════════════════════════
# CONFIG — paste from Comp Intel intake form
# ════════════════════════════════════════════════════════════════

GOOGLE_API_KEY  = "YOUR_GOOGLE_API_KEY"
DFS_LOGIN       = "YOUR_DFS_LOGIN"
DFS_PASSWORD    = "YOUR_DFS_PASSWORD"
MOZ_API_KEY     = "YOUR_MOZ_API_KEY"   # pre-encoded token from moz.com/api/dashboard

BIZ_NAME        = "Sapien Skin + Beauty"
BIZ_ADDRESS     = "1823 Eastlake Ave E Unit 157, Seattle, WA 98102"
BIZ_DOMAIN      = "sapienskinseattle.com"
BIZ_CITY        = "Seattle"
BIZ_URL         = "https://sapienskinseattle.com"
BIZ_VERTICAL    = "Beauty & Wellness"
GBP_PRIMARY_CATEGORY = "Medical Spa"

OWNER_SERVICES  = [
    "HydraFacial",
    "microneedling",
    "chemical peel",
    "laser hair removal",
    "skin tightening",
    "RF microneedling",
    "IPL photofacial",
    "laser resurfacing",
    "waxing",
    "IV therapy",
]

# ── Engine constants (do not edit) ────────────────────────────
TOP_N_COMPETITORS = 5
DEFAULT_SORT      = "frequency"   # frequency | avg_rank | total_reviews | da
NM_COUNT          = 3
NM_DIST_CAP       = 5.0
NM_BANDS          = [(0.0, 1.5), (1.5, 3.5), (3.5, 5.0)]   # spread bands for near-me
CITY_BAND_DEF     = [(5, 10), (10, 15), (15, 20)]            # 2 ZCTAs picked per band
CITY_PER_BAND     = 2
MIN_POP           = 1_000
MAPS_DEPTH        = 20
LF_DEPTH          = 20
MAX_WORKERS       = 6

# ── Derived ────────────────────────────────────────────────────
CITY            = BIZ_CITY
_OUTPUT_STEM    = BIZ_DOMAIN.replace("www.", "").split(".")[0]
dfs_cred        = base64.b64encode(f"{DFS_LOGIN}:{DFS_PASSWORD}".encode()).decode()
dfs_headers     = {"Authorization": f"Basic {dfs_cred}", "Content-Type": "application/json"}


# ════════════════════════════════════════════════════════════════
# UTILITY
# ════════════════════════════════════════════════════════════════

def _haversine_mi(lat1, lng1, lat2, lng2):
    R = 3958.8
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlng / 2) ** 2)
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def viewport_radius_miles(zoom, lat=47.5):
    meters_per_px = 156_543.03 * math.cos(math.radians(lat)) / (2 ** zoom)
    return (meters_per_px * 512) / 1609.34 / 2


def zoom_for_origin(dist_mi, lat=47.5):
    for z in range(14, 10, -1):
        if viewport_radius_miles(z, lat) >= dist_mi:
            return f"{z}z"
    return "11z"


# ════════════════════════════════════════════════════════════════
# STEP 1 — KEYWORD BUILDER
# ════════════════════════════════════════════════════════════════

def build_keywords(services, city):
    keywords = []
    for svc in services:
        s = svc.strip().lower()
        keywords.append({"keyword": f"{s} near me",        "service": s, "type": "near_me"})
        keywords.append({"keyword": f"{s} {city.lower()}", "service": s, "type": "city"})
    print(f"  Keywords built: {len(keywords)} ({len(services)} services x 2 variants)")
    return keywords


# ════════════════════════════════════════════════════════════════
# STEP 2 — ORIGIN GRID BUILDER
# Near-me: distance-spread selection (one per band within 5mi)
# City: top 2 by population per band (5-10, 10-15, 15-20mi)
# ════════════════════════════════════════════════════════════════

def load_gazetteer():
    print("\n── Loading Census Gazetteer ─────────────────────────────────")
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
    print(f"  Loaded {len(records):,} ZCTAs")
    return records


def build_origins(biz_address, google_api_key, gazetteer):
    print("\n── Building Origin Grid ─────────────────────────────────────")

    r = requests.get(
        "https://maps.googleapis.com/maps/api/geocode/json",
        params={"address": biz_address, "key": google_api_key}, timeout=15,
    )
    geo = r.json()
    if not geo.get("results"):
        raise RuntimeError(f"Geocoding failed: {geo.get('status')}")
    biz_lat = geo["results"][0]["geometry"]["location"]["lat"]
    biz_lng = geo["results"][0]["geometry"]["location"]["lng"]
    print(f"  Business geocoded: {biz_lat:.6f}, {biz_lng:.6f}")

    # All ZCTAs within 20mi, sorted by distance
    candidates = sorted(
        [{**rec, "dist_mi": round(_haversine_mi(biz_lat, biz_lng, rec["lat"], rec["lng"]), 3)}
         for rec in gazetteer
         if _haversine_mi(biz_lat, biz_lng, rec["lat"], rec["lng"]) <= 20.0],
        key=lambda x: x["dist_mi"]
    )

    # ACS population fetch (batched)
    zcta_codes = [c["zcta"] for c in candidates]
    pop_map = {}
    for i in range(0, len(zcta_codes), 50):
        batch = zcta_codes[i:i+50]
        try:
            r2 = requests.get(
                "https://api.census.gov/data/2023/acs/acs5",
                params={"get": "NAME,B01003_001E",
                        "for": f"zip code tabulation area:{','.join(batch)}"},
                timeout=20,
            )
            for row in r2.json()[1:]:
                pop_map[row[2]] = int(row[1]) if row[1] else 0
        except Exception as e:
            print(f"  WARNING: ACS batch failed — {e}")
    if not pop_map:
        print("  WARNING: ACS unavailable — distance-only selection")
        pop_map = {c["zcta"]: MIN_POP for c in candidates}

    # ── Near-me: one ZCTA per distance band (spread logic) ────────
    # Bands: 0-1.5mi, 1.5-3.5mi, 3.5-5.0mi
    # Picks the highest-population ZCTA within each band (pop >= MIN_POP)
    nm_included = []
    for (lo, hi) in NM_BANDS:
        in_band = [
            {**c, "pop": pop_map.get(c["zcta"], 0)}
            for c in candidates
            if lo <= c["dist_mi"] < hi and pop_map.get(c["zcta"], 0) >= MIN_POP
        ]
        in_band.sort(key=lambda x: -x["pop"])   # highest pop first within band
        if in_band:
            nm_included.append({**in_band[0], "nm_band": f"{lo:.1f}–{hi:.1f}mi"})

    # Fallback: if a band was empty, fill from any remaining <5mi ZCTAs not yet selected
    if len(nm_included) < NM_COUNT:
        selected_zctas = {o["zcta"] for o in nm_included}
        remaining = [
            {**c, "pop": pop_map.get(c["zcta"], 0)}
            for c in candidates
            if c["dist_mi"] <= NM_DIST_CAP
            and c["zcta"] not in selected_zctas
            and pop_map.get(c["zcta"], 0) >= MIN_POP
        ]
        remaining.sort(key=lambda x: x["dist_mi"])
        for c in remaining:
            if len(nm_included) >= NM_COUNT:
                break
            nm_included.append({**c, "nm_band": "fallback"})
        nm_included.sort(key=lambda x: x["dist_mi"])

    # Viewport validation for near-me origins
    for origin in nm_included:
        az = int(zoom_for_origin(max(origin["dist_mi"], 0.1), lat=biz_lat).rstrip("z"))
        ad = _haversine_mi(biz_lat, biz_lng, origin["lat"], origin["lng"])
        fz = az
        for z in range(az, 10, -1):
            if viewport_radius_miles(z, lat=biz_lat) * 0.85 >= ad:
                fz = z
                break
        if fz != az:
            origin["zoom_override"] = f"{fz}z"
            print(f"  Viewport fix: {origin['zcta']} {az}z→{fz}z")

    # ── City: top 2 by population per band ────────────────────────
    city_included = []
    for (lo, hi) in CITY_BAND_DEF:
        in_band = sorted(
            [{**c, "pop": pop_map.get(c["zcta"], 0)}
             for c in candidates
             if lo < c["dist_mi"] <= hi and pop_map.get(c["zcta"], 0) >= MIN_POP],
            key=lambda x: -x["pop"]
        )
        for chosen in in_band[:CITY_PER_BAND]:
            city_included.append({**chosen, "band": f"{lo:.0f}–{hi:.0f}mi"})

    # Reverse geocode all origins for human-readable names
    all_origins = nm_included + city_included
    print(f"  Reverse geocoding {len(all_origins)} origins...")
    for origin in all_origins:
        try:
            r3 = requests.get(
                "https://maps.googleapis.com/maps/api/geocode/json",
                params={"latlng": f"{origin['lat']},{origin['lng']}", "key": google_api_key},
                timeout=10,
            )
            name = origin["zcta"]
            for res in r3.json().get("results", []):
                for comp in res.get("address_components", []):
                    if any(t in comp["types"] for t in
                           ["neighborhood", "sublocality_level_1", "sublocality", "locality"]):
                        name = comp["long_name"]
                        break
                if name != origin["zcta"]:
                    break
            origin["name"] = name
        except Exception:
            origin["name"] = origin["zcta"]
        time.sleep(0.05)

    print(f"\n  Near-me origins (spread, ≤{NM_DIST_CAP}mi):")
    for o in nm_included:
        print(f"    {o['zcta']}  {o.get('name',''):<25}  {o['dist_mi']:.2f}mi  "
              f"band={o.get('nm_band','')}  pop={o.get('pop',0):,}")
    print(f"  City origins (2 per band):")
    for o in city_included:
        print(f"    {o['zcta']}  {o.get('name',''):<25}  {o['dist_mi']:.2f}mi  "
              f"band={o.get('band','')}  pop={o.get('pop',0):,}")

    return {
        "biz_lat":         biz_lat,
        "biz_lng":         biz_lng,
        "near_me_origins": nm_included,
        "city_origins":    city_included,
    }


# ════════════════════════════════════════════════════════════════
# STEP 3 — MAPS SCAN
# ════════════════════════════════════════════════════════════════

def maps_search(keyword, lat, lng, biz_domain="", zoom="13z", retries=2):
    coord            = f"{lat},{lng},{zoom}"
    clean_biz_domain = biz_domain.replace("www.", "").lower()

    for attempt in range(retries + 1):
        try:
            r = requests.post(
                "https://api.dataforseo.com/v3/serp/google/maps/live/advanced",
                headers=dfs_headers,
                json=[{"keyword": keyword, "location_coordinate": coord,
                       "language_code": "en", "depth": MAPS_DEPTH}],
                timeout=45,
            )
            data  = r.json()
            cost  = data.get("cost", 0.002)
            items = data["tasks"][0]["result"][0].get("items") or []

            client_pos    = None
            client_rating = None
            client_reviews = None
            top_n      = []
            for item in items:
                item_domain = (item.get("domain") or "").replace("www.", "").lower()
                rank        = item.get("rank_group", 99)
                item_cat    = (item.get("category") or "").strip()
                is_stub     = not item_domain and not item_cat

                if clean_biz_domain and clean_biz_domain in item_domain and client_pos is None:
                    client_pos = rank
                    rating_obj = item.get("rating") or {}
                    client_rating  = rating_obj.get("value")
                    client_reviews = rating_obj.get("votes_count")

                if len(top_n) < 20 and not (clean_biz_domain and clean_biz_domain in item_domain) and not is_stub:
                    rating_obj = item.get("rating") or {}
                    top_n.append({
                        "rank":         rank,
                        "name":         item.get("title") or item.get("name") or "",
                        "domain":       item_domain,
                        "url":          item.get("url") or "",
                        "rating":       rating_obj.get("value"),
                        "review_count": rating_obj.get("votes_count"),
                        "category":     item_cat,
                    })

            return client_pos, client_rating, client_reviews, top_n, cost

        except Exception as e:
            if attempt < retries:
                time.sleep(3)
            else:
                print(f"    Maps failed: {e}")
                return None, [], 0.002


def fetch_maps(keywords, origins_data, biz_domain=""):
    print("\n── Step 3: Maps Scan ────────────────────────────────────────")
    nm_origins   = origins_data["near_me_origins"]
    city_origins = origins_data["city_origins"]
    biz_lat      = origins_data["biz_lat"]
    results      = {}
    total_cost   = 0.0
    # Accumulate client rating/reviews across all scan results
    client_ratings  = []
    client_reviews_list = []

    for kw_dict in keywords:
        kw      = kw_dict["keyword"]
        kw_type = kw_dict["type"]
        origins = nm_origins if kw_type == "near_me" else city_origins
        results[kw] = {"service": kw_dict["service"], "type": kw_type, "origins": {}}
        if not origins:
            continue
        print(f"\n  [{kw}] ({kw_type}, {len(origins)} origins)")

        def _task(origin, _kw=kw):
            zoom = origin.get("zoom_override") or zoom_for_origin(
                max(origin["dist_mi"], 0.1), lat=biz_lat)
            pos, c_rating, c_reviews, top_n, cost = maps_search(
                _kw, origin["lat"], origin["lng"], biz_domain=biz_domain, zoom=zoom)
            return origin, pos, c_rating, c_reviews, top_n, cost

        with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
            futures = {executor.submit(_task, o): o for o in origins}
            for future in as_completed(futures):
                o, pos, c_rating, c_reviews, top_n, cost = future.result()
                total_cost += cost
                results[kw]["origins"][o["zcta"]] = {
                    "name": o.get("name", o["zcta"]), "dist_mi": o["dist_mi"],
                    "client_pos": pos, "top20": top_n,
                }
                if c_rating is not None:
                    client_ratings.append(c_rating)
                if c_reviews is not None:
                    client_reviews_list.append(c_reviews)
                print(f"    {o['zcta']} {o.get('name',''):<22} {o['dist_mi']:.2f}mi  "
                      f"client={'#'+str(pos) if pos else '–'}  comps={len(top_n)}")

    print(f"\n  Maps total cost: ${total_cost:.4f}")
    # Best client metrics from scan
    client_meta = {
        "rating":       max(client_ratings,  key=lambda x: x) if client_ratings  else None,
        "review_count": max(client_reviews_list) if client_reviews_list else None,
    }
    return results, total_cost, client_meta


# ════════════════════════════════════════════════════════════════
# STEP 4 — LOCAL FINDER SCAN
# ════════════════════════════════════════════════════════════════

def lf_search(keyword, lat, lng, biz_name="", biz_domain="",
              biz_address_street="", zoom="14z", retries=2):
    coord          = f"{lat},{lng},{zoom}"
    clean_biz_dom  = biz_domain.replace("www.", "").lower()
    biz_name_lower = biz_name.lower()
    street_lower   = biz_address_street.lower()

    def _is_client(item):
        desc  = (item.get("description") or "").lower()
        title = (item.get("title") or item.get("name") or "").lower()
        dom   = (item.get("domain") or "").replace("www.", "").lower()
        if clean_biz_dom and clean_biz_dom in dom:      return True
        if street_lower and street_lower in desc:        return True
        if biz_name_lower and biz_name_lower in title:  return True
        return False

    for attempt in range(retries + 1):
        try:
            r = requests.post(
                "https://api.dataforseo.com/v3/serp/google/local_finder/live/advanced",
                headers=dfs_headers,
                json=[{"keyword": keyword, "location_coordinate": coord,
                       "language_code": "en", "depth": LF_DEPTH}],
                timeout=45,
            )
            data  = r.json()
            cost  = data.get("cost", 0.002)
            items = data["tasks"][0]["result"][0].get("items") or []

            client_pos = None
            top_n      = []
            for item in items:
                rank     = item.get("rank_group") or item.get("rank_absolute") or 99
                is_cli   = _is_client(item)
                item_dom = (item.get("domain") or "").replace("www.", "").lower()
                item_cat = (item.get("category") or "").strip()
                is_stub  = not item_dom and not item_cat

                if is_cli and client_pos is None:
                    client_pos = rank

                if len(top_n) < 20 and not is_cli and not is_stub:
                    rating_obj = item.get("rating") or {}
                    top_n.append({
                        "rank":         rank,
                        "name":         item.get("title") or item.get("name") or "",
                        "domain":       item_dom,
                        "url":          item.get("url") or "",
                        "rating":       rating_obj.get("value"),
                        "review_count": rating_obj.get("votes_count"),
                        "category":     item_cat,
                    })

            return client_pos, top_n, cost

        except Exception as e:
            if attempt < retries:
                time.sleep(3)
            else:
                print(f"    LF failed: {e}")
                return None, [], 0.002


def fetch_local_finder(keywords, origins_data, biz_name="", biz_domain="", biz_address_street=""):
    print("\n── Step 4: Local Finder Scan ────────────────────────────────")
    nm_origins   = origins_data["near_me_origins"]
    city_origins = origins_data["city_origins"]
    biz_lat      = origins_data["biz_lat"]
    results      = {}
    total_cost   = 0.0

    for kw_dict in keywords:
        kw      = kw_dict["keyword"]
        kw_type = kw_dict["type"]
        origins = nm_origins if kw_type == "near_me" else city_origins
        results[kw] = {"service": kw_dict["service"], "type": kw_type, "origins": {}}
        if not origins:
            continue
        print(f"\n  [{kw}] ({kw_type}, {len(origins)} origins)")

        def _task(origin, _kw=kw):
            zoom = origin.get("zoom_override") or zoom_for_origin(
                max(origin["dist_mi"], 0.1), lat=biz_lat)
            pos, top_n, cost = lf_search(
                _kw, origin["lat"], origin["lng"],
                biz_name=biz_name, biz_domain=biz_domain,
                biz_address_street=biz_address_street, zoom=zoom,
            )
            return origin, pos, top_n, cost

        with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
            futures = {executor.submit(_task, o): o for o in origins}
            for future in as_completed(futures):
                o, pos, top_n, cost = future.result()
                total_cost += cost
                results[kw]["origins"][o["zcta"]] = {
                    "name": o.get("name", o["zcta"]), "dist_mi": o["dist_mi"],
                    "client_pos": pos, "top20": top_n,
                }
                print(f"    {o['zcta']} {o.get('name',''):<22} {o['dist_mi']:.2f}mi  "
                      f"client={'#'+str(pos) if pos else '–'}  comps={len(top_n)}")

    print(f"\n  Local Finder total cost: ${total_cost:.4f}")
    return results, total_cost


# ════════════════════════════════════════════════════════════════
# STEP 5 — COMPETITOR FREQUENCY AGGREGATION
# Aggregates across all origins + surfaces per keyword.
# Caps at TOP_N_COMPETITORS (5) after ranking.
# Maps tallied first so url/category values prefer Maps over LF.
# ════════════════════════════════════════════════════════════════

def visibility_score(ranks_list, n_origins, n_surfaces=2):
    """
    Compute 0-100 visibility score for a business given its position ranks
    across all origin × surface slots for one keyword.

    Points per position:
      #1 → 10, #2 → 8, #3 → 7, #4 → 6, #5 → 5,
      #6 → 4,  #7 → 3, #8-10 → 2, #11-20 → 1, absent → 0

    Max possible = n_origins × n_surfaces × 10
    Score = earned / max × 100, rounded to 1 decimal.
    """
    def _pts(pos):
        if pos is None: return 0
        if pos == 1:    return 10
        if pos == 2:    return 8
        if pos == 3:    return 7
        if pos == 4:    return 6
        if pos == 5:    return 5
        if pos == 6:    return 4
        if pos == 7:    return 3
        if pos <= 10:   return 2
        if pos <= 20:   return 1
        return 0

    max_pts = n_origins * n_surfaces * 10
    if max_pts == 0:
        return 0.0
    earned = sum(_pts(r) for r in ranks_list)
    return round(earned / max_pts * 100, 1)


def aggregate_competitors(maps_results, lf_results, origins_data):
    print("\n── Step 5: Aggregating Competitor Frequency ─────────────────")
    nm_origins   = origins_data["near_me_origins"]
    city_origins = origins_data["city_origins"]
    all_kws = set(list(maps_results.keys()) + list(lf_results.keys()))
    agg      = {}
    agg_full = {}

    for kw in all_kws:
        # Determine origin count for this keyword type
        kw_type   = maps_results.get(kw, lf_results.get(kw, {})).get("type", "near_me")
        n_origins = len(nm_origins) if kw_type == "near_me" else len(city_origins)

        domain_data = {}

        def _tally(source_dict, surface_key):
            for zcta, od in source_dict.get(kw, {}).get("origins", {}).items():
                for item in od.get("top20", []):
                    dom = (item.get("domain") or "").replace("www.", "").lower().strip()
                    if not dom:
                        continue
                    if dom not in domain_data:
                        domain_data[dom] = {
                            "name": item.get("name", ""), "ranks": [],
                            "maps_ranks": [], "lf_ranks": [],
                            "maps_count": 0, "lf_count": 0,
                            "url": item.get("url", ""),
                            "category": item.get("category", ""),
                            "rating": item.get("rating"),
                            "review_count": item.get("review_count"),
                        }
                    rank = item.get("rank", 99)
                    domain_data[dom]["ranks"].append(rank)
                    domain_data[dom][surface_key.replace("count","ranks")].append(rank)
                    domain_data[dom][surface_key] += 1
                    for field in ("name", "url", "category", "rating", "review_count"):
                        if item.get(field) and not domain_data[dom][field]:
                            domain_data[dom][field] = item[field]

        _tally(maps_results, "maps_count")
        _tally(lf_results,   "lf_count")

        ranked = []
        for dom, d in domain_data.items():
            apps     = d["maps_count"] + d["lf_count"]
            avg_rank = round(sum(d["ranks"]) / len(d["ranks"]), 1) if d["ranks"] else 99

            # Build full slot list: one entry per origin × surface, None if absent
            # Maps slots
            maps_slot_ranks = []
            for zcta_od in maps_results.get(kw, {}).get("origins", {}).values():
                found = next((i.get("rank") for i in zcta_od.get("top20",[]) if (i.get("domain") or "").replace("www.","").lower().strip() == dom), None)
                maps_slot_ranks.append(found)
            # LF slots
            lf_slot_ranks = []
            for zcta_od in lf_results.get(kw, {}).get("origins", {}).values():
                found = next((i.get("rank") for i in zcta_od.get("top20",[]) if (i.get("domain") or "").replace("www.","").lower().strip() == dom), None)
                lf_slot_ranks.append(found)

            vis = visibility_score(maps_slot_ranks + lf_slot_ranks, n_origins)

            ranked.append({
                "domain": dom, "name": d["name"], "url": d["url"],
                "appearances": apps, "maps_appearances": d["maps_count"],
                "lf_appearances": d["lf_count"], "avg_rank": avg_rank,
                "vis_score": vis,
                "category": d["category"], "rating": d["rating"],
                "review_count": d["review_count"],
            })

        # Sort by visibility score DESC, then appearances DESC, then avg_rank ASC
        ranked.sort(key=lambda x: (-x["vis_score"], -x["appearances"], x["avg_rank"]))
        agg[kw]      = ranked[:TOP_N_COMPETITORS]   # top-5 for rows/Moz
        agg_full[kw] = ranked                        # full list for client rank lookup

    print(f"  Aggregated {len(agg)} keywords, top {TOP_N_COMPETITORS} competitors each")
    return agg, agg_full


# ════════════════════════════════════════════════════════════════
# STEP 6 — MOZ DA + REFERRING DOMAINS
# ════════════════════════════════════════════════════════════════

def fetch_moz_bulk(all_domains, moz_api_key):
    print(f"\n── Step 6: Moz DA ({len(all_domains)} domains) ──────────────────────")
    if not moz_api_key or moz_api_key == "YOUR_MOZ_API_KEY":
        print("  WARNING: MOZ_API_KEY not set — skipping")
        return {}

    moz_headers = {"x-moz-token": moz_api_key, "Content-Type": "application/json"}

    def _fetch_one(domain, idx):
        try:
            r = requests.post(
                "https://api.moz.com/jsonrpc",
                headers=moz_headers,
                json={"jsonrpc": "2.0", "id": f"growthpath-{idx:024d}",
                      "method": "data.site.metrics.fetch",
                      "params": {"data": {"site_query": {"query": domain, "scope": "domain"}}}},
                timeout=20,
            )
            result = r.json().get("result", {}).get("site_metrics", {})
            return domain, {
                "da":                result.get("domain_authority"),
                "referring_domains": result.get("root_domains_to_root_domain"),
                "spam_score":        result.get("spam_score"),
            }
        except Exception as e:
            print(f"  WARNING: Moz failed for {domain} — {e}")
            return domain, {}

    moz_data = {}
    with ThreadPoolExecutor(max_workers=6) as executor:
        futures = {executor.submit(_fetch_one, d, i): d for i, d in enumerate(all_domains)}
        for future in as_completed(futures):
            domain, metrics = future.result()
            moz_data[domain] = metrics
            print(f"  {domain:<45}  DA={metrics.get('da','?')}  RD={metrics.get('referring_domains','?')}")
    return moz_data


# ════════════════════════════════════════════════════════════════
# STEP 7 — BUILD OUTPUT ROWS
# ════════════════════════════════════════════════════════════════

def build_output_rows(keywords, competitor_agg, moz_data):
    rows = []
    for kw_dict in keywords:
        kw      = kw_dict["keyword"]
        service = kw_dict["service"]
        kw_type = kw_dict["type"]
        for rank_i, comp in enumerate(competitor_agg.get(kw, []), start=1):
            dom = comp.get("domain", "").replace("www.", "").lower()
            moz = moz_data.get(dom, {})
            rows.append({
                "keyword":           kw,
                "service":           service,
                "keyword_type":      kw_type,
                "competitor_rank":   rank_i,
                "competitor_name":   comp.get("name", ""),
                "domain":            dom,
                "website_url":       comp.get("url", ""),
                "maps_appearances":  comp.get("maps_appearances", 0),
                "lf_appearances":    comp.get("lf_appearances", 0),
                "total_appearances": comp.get("appearances", 0),
                "avg_rank":          comp.get("avg_rank", ""),
                "vis_score":         comp.get("vis_score", 0.0),
                "da":                moz.get("da", ""),
                "referring_domains": moz.get("referring_domains", ""),
                "spam_score":        moz.get("spam_score", ""),
                "category":          comp.get("category", ""),
                "rating":            comp.get("rating", ""),
                "review_count":      comp.get("review_count", ""),
            })
    return rows


# ════════════════════════════════════════════════════════════════
# STEP 8 — HTML REPORT (GrowthPath design system)
# Two-tab: Tab 1 = client position grid + leaderboard (sortable)
#          Tab 2 = full competitor detail by keyword
# Fully automated — no manual rebuild step.
# ════════════════════════════════════════════════════════════════

def export_html(rows, keywords, origins_data, maps_results, lf_results, run_meta, client_meta=None, competitor_agg_full=None):
    if client_meta is None:
        client_meta = {"da": "", "referring_domains": "", "rating": "", "review_count": ""}
    if competitor_agg_full is None:
        competitor_agg_full = {}
    filepath = f"{_OUTPUT_STEM}_comp_intel.html"

    nm_origins   = origins_data["near_me_origins"]
    city_origins = origins_data["city_origins"]
    all_origins  = nm_origins + city_origins
    n_orig       = len(all_origins)
    max_apps     = n_orig * 2
    now_str      = run_meta.get("timestamp", datetime.now().strftime("%B %d, %Y %I:%M %p"))

    services_list = sorted(set(r["service"] for r in rows))

    # ── Client position lookup ─────────────────────────────────
    def client_pos_for(kw, zcta, surface_dict):
        return surface_dict.get(kw, {}).get("origins", {}).get(zcta, {}).get("client_pos")

    def pos_badge(pos):
        if pos is None:
            return ('<span style="display:inline-block;min-width:38px;padding:4px 8px;border-radius:3px;'
                    'background:#1a1a26;border:1px solid #2a2a3a;font-size:12px;font-weight:600;'
                    'color:#3a3a5a;text-align:center;font-family:\'DM Mono\',monospace;">–</span>')
        try:
            p = int(pos)
            if p <= 3:   bg,color,border = "#0f2818","#4ade80","#4ade8040"
            elif p <= 5: bg,color,border = "#0d1f3a","#60a5fa","#60a5fa40"
            elif p <= 10:bg,color,border = "#2a1a00","#f59e0b","#f59e0b40"
            else:        bg,color,border = "#2a0a0a","#f87171","#f8717140"
            return (f'<span style="display:inline-block;min-width:38px;padding:4px 8px;border-radius:3px;'
                    f'background:{bg};border:1px solid {border};font-size:12px;font-weight:700;'
                    f'color:{color};text-align:center;font-family:\'DM Mono\',monospace;">#{p}</span>')
        except:
            return ('<span style="display:inline-block;min-width:38px;padding:4px 8px;border-radius:3px;'
                    'background:#1a1a26;border:1px solid #2a2a3a;font-size:12px;font-weight:600;'
                    'color:#3a3a5a;text-align:center;font-family:\'DM Mono\',monospace;">–</span>')

    # ── Build position grid: ZCTA columns ─────────────────────
    # Rows = services. Columns = individual ZCTA origins.
    # Two-row header: scope group spans ZCTAs, bottom row = ZCTA + name + dist.
    # Each cell: M (Maps) and LF (Local Finder) stacked vertically.
    # Vertical divider column separates Near Me from City.
    def build_position_grid():
        nm_span   = len(nm_origins)
        city_span = len(city_origins)
        TH = "font-family:'DM Mono',monospace;font-size:9px;letter-spacing:0.1em;text-transform:uppercase;"

        scope_row = (
            '<tr style="background:#0f1f0f;">'
            '<th style="' + TH + 'padding:8px 12px;text-align:left;color:#6b6b88;" rowspan="2">Service</th>'
            '<th colspan="' + str(nm_span) + '" style="' + TH + 'padding:7px 10px;text-align:center;color:#4ade80;">'
            'Near Me &middot; ' + str(nm_span) + ' origins</th>'
            '<th style="width:1px;padding:0;background:#2a2a3a;" rowspan="2"></th>'
            '<th colspan="' + str(city_span) + '" style="' + TH + 'padding:7px 10px;text-align:center;color:#c8a96e;background:#1a140a;">'
            'City &middot; ' + CITY + ' &middot; ' + str(city_span) + ' origins</th>'
            '</tr>'
        )

        nm_th = ""
        for o in nm_origins:
            name_short = o.get("name", o["zcta"])[:13]
            nm_th += (
                '<th style="' + TH + 'padding:6px 8px;text-align:center;color:#6b6b88;'
                'min-width:70px;border-bottom:2px solid #2a2a3a;">'
                '<span style="color:#c8c8e0;font-weight:500;font-size:12px;">' + o["zcta"] + '</span><br>'
                '<span style="font-size:10px;color:#4a4a6a;font-weight:400;">'
                + name_short + ' &middot; ' + f'{o["dist_mi"]:.1f}' + 'mi</span></th>'
            )
        city_th = ""
        for o in city_origins:
            name_short = o.get("name", o["zcta"])[:13]
            city_th += (
                '<th style="' + TH + 'padding:6px 8px;text-align:center;color:#6b6b88;'
                'min-width:70px;border-bottom:2px solid #2a2a3a;">'
                '<span style="color:#c8c8e0;font-weight:500;font-size:12px;">' + o["zcta"] + '</span><br>'
                '<span style="font-size:10px;color:#4a4a6a;font-weight:400;">' + name_short + '</span></th>'
            )
        zcta_row = (
            '<tr style="background:#111118;">'
            + nm_th
            + city_th
            + '</tr>'
        )

        data_rows = ""
        for svc in services_list:
            nm_kw   = svc + " near me"
            city_kw = svc + " " + CITY.lower()

            all_pos = (
                [client_pos_for(nm_kw,   o["zcta"], maps_results) for o in nm_origins] +
                [client_pos_for(city_kw, o["zcta"], maps_results) for o in city_origins] +
                [client_pos_for(nm_kw,   o["zcta"], lf_results)   for o in nm_origins] +
                [client_pos_for(city_kw, o["zcta"], lf_results)   for o in city_origins]
            )
            any_ranked = any(p is not None for p in all_pos)
            row_bg = "rgba(200,169,110,0.02)" if any_ranked else "transparent"

            def _cell(kw, zcta):
                mp = client_pos_for(kw, zcta, maps_results)
                lp = client_pos_for(kw, zcta, lf_results)
                return (
                    '<td style="padding:8px 6px;text-align:center;border-bottom:1px solid #1a1a26;">'
                    '<div style="display:flex;flex-direction:column;gap:3px;align-items:center;">'
                    '<div style="display:flex;align-items:center;gap:3px;">'
                    '<span style="font-size:10px;font-weight:500;color:#818cf8;width:16px;text-align:right;">M</span>'
                    + pos_badge(mp) +
                    '</div>'
                    '<div style="display:flex;align-items:center;gap:3px;">'
                    '<span style="font-size:10px;font-weight:500;color:#c8a96e;width:16px;text-align:right;">LF</span>'
                    + pos_badge(lp) +
                    '</div>'
                    '</div></td>'
                )

            nm_cells   = "".join(_cell(nm_kw,   o["zcta"]) for o in nm_origins)
            city_cells = "".join(_cell(city_kw, o["zcta"]) for o in city_origins)

            data_rows += (
                '<tr style="background:' + row_bg + ';">'
                '<td style="padding:10px 14px;font-size:13px;font-weight:500;color:#e8e8f0;'
                'text-transform:capitalize;white-space:nowrap;border-bottom:1px solid #1a1a26;">'
                + svc +
                '</td>'
                + nm_cells
                + '<td style="width:1px;background:#2a2a3a;padding:0;border-bottom:1px solid #1a1a26;"></td>'
                + city_cells
                + '</tr>'
            )

        return (
            '<div style="overflow-x:auto;border-radius:4px;border:1px solid var(--border);margin-bottom:40px;">'
            '<table style="width:100%;border-collapse:collapse;min-width:600px;">'
            '<thead>' + scope_row + zcta_row + '</thead>'
            '<tbody>' + data_rows + '</tbody>'
            '</table></div>'
        )


    # ── Build leaderboard: top 5 competitors + client row ─────
    def build_leaderboard():
        global_agg = {}
        for row in rows:
            dom = row["domain"]
            if not dom:
                continue
            if dom not in global_agg:
                global_agg[dom] = {
                    "name": row["competitor_name"], "domain": dom,
                    "url": row.get("website_url", ""), "appearances": 0, "ranks": [],
                    "vis_scores": [],
                    "da": row.get("da", ""), "referring_domains": row.get("referring_domains", ""),
                    "rating": row.get("rating", ""), "review_count": row.get("review_count", ""),
                    "category": row.get("category", ""),
                }
            global_agg[dom]["appearances"] += row.get("total_appearances", 0)
            if row.get("avg_rank"):
                try:
                    global_agg[dom]["ranks"].append(float(row["avg_rank"]))
                except:
                    pass
            if row.get("vis_score") is not None:
                try:
                    global_agg[dom]["vis_scores"].append(float(row["vis_score"]))
                except:
                    pass

        leaders = []
        for dom, d in global_agg.items():
            d["avg_rank_global"] = round(sum(d["ranks"]) / len(d["ranks"]), 1) if d["ranks"] else 99
            d["avg_vis_global"]  = round(sum(d["vis_scores"]) / len(d["vis_scores"]), 1) if d["vis_scores"] else 0.0
            leaders.append(d)
        leaders.sort(key=lambda x: (-x["avg_vis_global"], -x["appearances"], x["avg_rank_global"]))
        leaders = leaders[:5]

        # Client cross-keyword stats
        client_total_apps = sum(
            1 for src in [maps_results, lf_results]
            for kw, kd in src.items()
            for zcta, od in kd.get("origins", {}).items()
            if od.get("client_pos") is not None
        )
        client_all_positions = [
            od.get("client_pos")
            for src in [maps_results, lf_results]
            for kw, kd in src.items()
            for zcta, od in kd.get("origins", {}).items()
            if od.get("client_pos") is not None
        ]
        client_avg_rank_global = round(sum(client_all_positions) / len(client_all_positions), 1) if client_all_positions else 99

        # Client avg vis_score across all keywords (using same slot formula)
        client_vis_scores = []
        for kw_dict in keywords:
            kw     = kw_dict["keyword"]
            kw_type = kw_dict["type"]
            origins_for_kw = nm_origins if kw_type == "near_me" else city_origins
            n_origins_kw   = len(origins_for_kw)
            src_map = maps_results.get(kw, {}).get("origins", {})
            src_lf  = lf_results.get(kw, {}).get("origins", {})
            slots = (
                [src_map.get(o["zcta"], {}).get("client_pos") for o in origins_for_kw] +
                [src_lf.get(o["zcta"],  {}).get("client_pos") for o in origins_for_kw]
            )
            client_vis_scores.append(visibility_score(slots, n_origins_kw))
        client_avg_vis = round(sum(client_vis_scores) / len(client_vis_scores), 1) if client_vis_scores else 0.0

        client_entry = {
            "name": BIZ_NAME, "domain": BIZ_DOMAIN, "url": BIZ_URL,
            "appearances": client_total_apps,
            "avg_rank_global": client_avg_rank_global,
            "avg_vis_global":  client_avg_vis,
            "da":                client_meta.get("da", ""),
            "referring_domains": client_meta.get("referring_domains", ""),
            "rating":            client_meta.get("rating", ""),
            "review_count":      client_meta.get("review_count", ""),
            "category": GBP_PRIMARY_CATEGORY, "is_client": True,
        }

        # Rank client against ALL competitors by avg_vis_global
        all_comps_sorted = sorted(global_agg.values(), key=lambda x: (-x["avg_vis_global"], -x["appearances"], x["avg_rank_global"]))
        client_rank = 1
        for c in all_comps_sorted:
            if c["avg_vis_global"] > client_avg_vis:
                client_rank += 1
            elif c["avg_vis_global"] == client_avg_vis and c["appearances"] > client_total_apps:
                client_rank += 1

        # Inject client into leaders if in top 5
        if client_rank <= 5:
            leaders.insert(client_rank - 1, client_entry)
            leaders = leaders[:6]

        def _lb_row(rank_num, comp, is_client=False):
            da_val = comp.get("da", "")
            try:
                da_int   = int(da_val)
                da_color = "#4ade80" if da_int >= 40 else ("#f59e0b" if da_int >= 20 else "#f87171")
                da_disp  = str(da_int)
            except:
                da_color, da_disp = "#6b6b88", "—"

            try:
                reviews_str = f'{int(comp.get("review_count","0")):,}'
            except:
                reviews_str = "—"

            rating_val = comp.get("rating", "")
            rating_str = f"{rating_val}★" if rating_val else "—"
            avg_r = comp.get("avg_rank_global", 99)
            avg_rank_str = f"{avg_r:.1f}" if avg_r != 99 else "—"
            url = comp.get("url", "")
            url_link = f'<a href="{url}" target="_blank" style="color:#c8a96e;font-size:11px;">{url[:38]}…</a>' if url else "—"

            avg_vis = comp.get("avg_vis_global", 0.0)
            vis_color = "#4ade80" if is_client else "#c8a96e"
            vis_bar = (f'<div style="display:flex;align-items:center;gap:6px;">'
                       f'<div style="width:{min(100,int(avg_vis))}%;max-width:60px;height:4px;'
                       f'background:{vis_color};border-radius:2px;"></div>'
                       f'<span style="font-size:11px;color:{vis_color};">{avg_vis:.1f}</span></div>')

            apps = comp.get("appearances", 0)
            freq_color = "#4ade80" if is_client else "#6b6b88"
            freq_str = f'<span style="font-size:12px;color:{freq_color};font-family:\'DM Mono\',monospace;">{apps}</span>'

            if is_client:
                # 4-tier: leaderboard shows cross-keyword rank, use green as default (high performer)
                row_style = 'background:rgba(74,222,128,0.06);border-bottom:1px solid #1a2a1a;border-left:3px solid #4ade80;'
                name_html = (f'<div style="font-size:13px;font-weight:700;color:#4ade80;">'
                             f'{comp["name"]} <span style="font-size:11px;font-weight:400;">(you)</span></div>'
                             f'<div style="font-size:11px;color:#4ade8088;margin-top:2px;">{comp["domain"]}</div>'
                             f'<div style="font-size:11px;color:#4ade8066;margin-top:1px;">{comp.get("category","—")}</div>')
                rank_html  = f'<span style="font-family:\'Bebas Neue\',sans-serif;font-size:22px;color:#4ade80;">#{rank_num}</span>'
            else:
                row_style = 'background:transparent;border-bottom:1px solid #1a1a26;'
                rank_color = "#c8a96e" if rank_num == 1 else "#6b6b88"
                name_html  = (f'<div style="font-size:13px;font-weight:600;color:#e8e8f0;">{comp["name"]}</div>'
                              f'<div style="font-size:11px;color:#6b6b88;margin-top:2px;">{comp["domain"]}</div>'
                              f'<div style="font-size:11px;color:#8888a8;margin-top:1px;">{comp.get("category","—")}</div>')
                rank_html  = f'<span style="font-family:\'Bebas Neue\',sans-serif;font-size:22px;color:{rank_color};">#{rank_num}</span>'

            return (f'<tr style="{row_style}">'
                    f'<td style="padding:12px 14px;text-align:center;">{rank_html}</td>'
                    f'<td style="padding:12px 14px;">{name_html}</td>'
                    f'<td style="padding:12px 10px;text-align:center;">{vis_bar}</td>'
                    f'<td style="padding:12px 10px;text-align:center;">{freq_str}</td>'
                    f'<td style="padding:12px 10px;text-align:center;font-family:\'DM Mono\',monospace;font-size:12px;color:#8888a8;">{avg_rank_str}</td>'
                    f'<td style="padding:12px 10px;text-align:center;font-weight:700;color:{da_color};font-size:14px;">{da_disp}</td>'
                    f'<td style="padding:12px 10px;text-align:center;font-size:12px;color:#8888a8;">{rating_str}</td>'
                    f'<td style="padding:12px 10px;text-align:center;font-size:12px;color:#8888a8;">{reviews_str}</td>'
                    f'<td style="padding:12px 10px;">{url_link}</td>'
                    f'</tr>')

        lb_rows = ""
        for i, comp in enumerate(leaders):
            lb_rows += _lb_row(i + 1, comp, is_client=comp.get("is_client", False))

        # If client outside top 5, append with separator
        if client_rank > 5:
            sep = ('<tr><td colspan="9" style="padding:6px 14px;border-top:1px solid #2a2a3a;border-bottom:1px solid #2a2a3a;'
                   'font-family:\'DM Mono\',monospace;font-size:9px;letter-spacing:0.1em;text-transform:uppercase;color:#3a3a5a;">'
                   'Your Business</td></tr>')
            lb_rows += sep
            lb_rows += _lb_row(client_rank, client_entry, is_client=True)

        return lb_rows

    # ── Build keyword detail sections (Tab 2) ─────────────────
    # Sorted by visibility score DESC. Client ranked same way.
    def build_detail_sections():
        grouped = defaultdict(lambda: defaultdict(list))
        for row in rows:
            grouped[row["service"]][row["keyword"]].append(row)

        def _vis_color(score):
            """Tier color for visibility score badge."""
            if score >= 60:  return "#4ade80", "#0f2818", "#4ade8040"   # Leading
            if score >= 40:  return "#60a5fa", "#0d1f3a", "#60a5fa40"   # Competitive
            if score >= 20:  return "#f59e0b", "#2a1a00", "#f59e0b40"   # Needs Work
            return               "#f87171", "#2a0a0a", "#f8717140"       # Critical

        def _vis_badge(score, is_client=False):
            if score is None or score == 0:
                return '<span style="display:inline-block;min-width:44px;padding:3px 8px;border-radius:3px;background:#1a1a26;border:1px solid #2a2a3a;font-size:11px;color:#3a3a5a;text-align:center;font-family:\'DM Mono\',monospace;">—</span>'
            clr, bg, border = _vis_color(score)
            if is_client: border = border  # same
            return (f'<span style="display:inline-block;min-width:44px;padding:3px 8px;border-radius:3px;'
                    f'background:{bg};border:1px solid {border};font-size:12px;font-weight:700;'
                    f'color:{clr};text-align:center;font-family:\'DM Mono\',monospace;">{score}</span>')

        def _det_row(rank_label, name, domain, vis, apps, maps_apps, lf_apps,
                     avg_r, da_val, rds, rating, reviews, category, url,
                     is_client=False, not_ranked=False):
            # DA
            try:
                da_int = int(da_val)
                da_c   = "#4ade80" if da_int >= 40 else ("#f59e0b" if da_int >= 20 else "#f87171")
                da_d   = f'<span style="font-weight:700;color:{da_c};">{da_int}</span>'
            except:
                da_d = '<span style="color:#3a3a5a;">—</span>'

            # Appearances bar
            try:    apps_int = int(apps)
            except: apps_int = 0
            pct = min(100, int((apps_int / max(max_apps, 1)) * 100))

            try:    rv_str = f'{int(reviews):,}'
            except: rv_str = "—"
            rating_str = f'{rating}★' if rating else "—"
            url_cell = (f'<a href="{url}" target="_blank" style="color:#c8a96e;font-size:11px;">{url[:34]}…</a>'
                        if url else '<span style="color:#3a3a5a;">—</span>')

            if is_client:
                if not_ranked or rank_label == "N/A":
                    nc = "#f87171"; bg = "rgba(248,113,113,0.06)"
                else:
                    # Color by visibility score tier
                    if vis is not None and vis >= 60:   nc = "#4ade80"; bg = "rgba(74,222,128,0.06)"
                    elif vis is not None and vis >= 40: nc = "#60a5fa"; bg = "rgba(96,165,250,0.06)"
                    elif vis is not None and vis >= 20: nc = "#f59e0b"; bg = "rgba(245,158,11,0.06)"
                    else:                               nc = "#f87171"; bg = "rgba(248,113,113,0.06)"
                lborder   = f"border-left:3px solid {nc};"
                app_bar   = (f'<div style="display:flex;align-items:center;gap:5px;">'
                             f'<div style="width:{pct}%;max-width:60px;height:4px;background:{nc};border-radius:2px;"></div>'
                             f'<span style="font-size:11px;color:{nc};">{apps_int if apps_int else "—"}</span></div>')
                name_cell = (f'<div style="font-size:13px;font-weight:700;color:{nc};">'
                             f'{name} <span style="font-size:11px;font-weight:400;">(you)</span></div>'
                             f'<div style="font-size:11px;color:{nc}88;">{domain}</div>')
                rank_cell = f'<span style="font-family:\'Bebas Neue\',sans-serif;font-size:18px;color:{nc};">{rank_label}</span>'
                vis_cell  = _vis_badge(vis, is_client=True)
            else:
                bg, lborder = "transparent", ""
                app_bar = (f'<div style="display:flex;align-items:center;gap:5px;">'
                           f'<div style="width:{pct}%;max-width:60px;height:4px;background:#c8a96e;border-radius:2px;"></div>'
                           f'<span style="font-size:11px;color:#c8a96e;">{apps_int if apps_int else "—"}</span></div>')
                name_cell = (f'<div style="font-size:13px;font-weight:500;color:#e8e8f0;">{name}</div>'
                             f'<div style="font-size:11px;color:#6b6b88;">{domain}</div>')
                rank_cell = f'<span style="font-family:\'Bebas Neue\',sans-serif;font-size:18px;color:#6b6b88;">{rank_label}</span>'
                vis_cell  = _vis_badge(vis)

            return (f'<tr style="background:{bg};{lborder}border-bottom:1px solid #1a1a26;">'
                    f'<td style="padding:9px 12px;text-align:center;">{rank_cell}</td>'
                    f'<td style="padding:9px 12px;">{name_cell}</td>'
                    f'<td style="padding:9px 10px;text-align:center;">{vis_cell}</td>'
                    f'<td style="padding:9px 10px;text-align:center;">{app_bar}</td>'
                    f'<td style="padding:9px 10px;text-align:center;font-family:\'DM Mono\',monospace;font-size:11px;color:#8888a8;">{maps_apps if maps_apps != "" else "—"}</td>'
                    f'<td style="padding:9px 10px;text-align:center;font-family:\'DM Mono\',monospace;font-size:11px;color:#8888a8;">{lf_apps if lf_apps != "" else "—"}</td>'
                    f'<td style="padding:9px 10px;text-align:center;font-family:\'DM Mono\',monospace;font-size:12px;color:#8888a8;">{avg_r if avg_r else "—"}</td>'
                    f'<td style="padding:9px 10px;text-align:center;">{da_d}</td>'
                    f'<td style="padding:9px 10px;text-align:center;font-size:12px;color:#8888a8;">{rds if rds else "—"}</td>'
                    f'<td style="padding:9px 10px;text-align:center;font-size:12px;color:#8888a8;">{rating_str}</td>'
                    f'<td style="padding:9px 10px;text-align:center;font-size:12px;color:#8888a8;">{rv_str}</td>'
                    f'<td style="padding:9px 10px;font-size:11px;color:#8888a8;max-width:130px;">{category if category else "—"}</td>'
                    f'<td style="padding:9px 10px;">{url_cell}</td>'
                    f'</tr>')

        secs = ""
        for svc in sorted(grouped.keys()):
            secs += (f'<div style="margin-bottom:48px;">'
                     f'<div style="font-family:\'DM Mono\',monospace;font-size:9px;letter-spacing:0.16em;'
                     f'text-transform:uppercase;color:#c8a96e;margin-bottom:6px;">Service</div>'
                     f'<div style="font-family:\'Bebas Neue\',sans-serif;font-size:28px;letter-spacing:0.04em;'
                     f'color:#e8e8f0;margin-bottom:20px;text-transform:capitalize;'
                     f'border-bottom:1px solid #2a2a3a;padding-bottom:12px;">{svc}</div>')

            for kw, kw_rows in sorted(grouped[svc].items()):
                kw_type     = kw_rows[0]["keyword_type"] if kw_rows else ""
                badge_bg    = "#1e1b4b" if kw_type == "near_me" else "#14532d"
                badge_color = "#818cf8" if kw_type == "near_me" else "#4ade80"
                badge_label = "Near Me" if kw_type == "near_me" else "City"

                src_map = maps_results.get(kw, {}).get("origins", {})
                src_lf  = lf_results.get(kw, {}).get("origins",  {})
                origins_for_kw = nm_origins if kw_type == "near_me" else city_origins
                n_origins_kw   = len(origins_for_kw)

                # ── Client stats for this keyword ──────────────────
                client_positions = [
                    od.get("client_pos")
                    for od in list(src_map.values()) + list(src_lf.values())
                    if od.get("client_pos") is not None
                ]
                client_best      = min(client_positions) if client_positions else None
                client_apps      = len(client_positions)
                client_maps_apps = sum(1 for od in src_map.values() if od.get("client_pos") is not None)
                client_lf_apps   = sum(1 for od in src_lf.values()  if od.get("client_pos") is not None)
                client_avg_rank  = round(sum(client_positions) / len(client_positions), 1) if client_positions else None

                # Client visibility score — same formula as competitors
                client_slot_ranks = (
                    [src_map.get(o["zcta"], {}).get("client_pos") for o in origins_for_kw] +
                    [src_lf.get(o["zcta"],  {}).get("client_pos") for o in origins_for_kw]
                )
                client_vis = visibility_score(client_slot_ranks, n_origins_kw)

                # ── Sort competitor rows by vis_score DESC ─────────
                comp_sorted = sorted(kw_rows,
                                     key=lambda r: (-r.get("vis_score", 0),
                                                    -r.get("total_appearances", 0),
                                                    r.get("avg_rank", 99) or 99))

                # Determine client's true rank against ALL competitors for this keyword
                full_comp_list = competitor_agg_full.get(kw, comp_sorted)
                client_table_rank = 1
                for c in full_comp_list:
                    if c.get("vis_score", 0) > client_vis:
                        client_table_rank += 1
                    elif c.get("vis_score", 0) == client_vis and c.get("appearances", 0) > client_apps:
                        client_table_rank += 1

                client_in_top5  = client_table_rank <= TOP_N_COMPETITORS
                client_in_top20 = client_best is not None

                table_html      = ""
                client_inserted = False
                displayed_comp_count = 0
                max_comp_rows = TOP_N_COMPETITORS  # show 5 competitors max (6 rows total if client inserts)

                for rank_i, row in enumerate(comp_sorted, start=1):
                    if displayed_comp_count >= max_comp_rows:
                        break
                    # Insert client exactly when we reach their slot in the ranking
                    if not client_inserted and client_in_top5 and rank_i == client_table_rank:
                        table_html += _det_row(
                            f"#{client_table_rank}", BIZ_NAME, BIZ_DOMAIN,
                            client_vis, client_apps, client_maps_apps, client_lf_apps,
                            client_avg_rank,
                            client_meta.get("da",""), client_meta.get("referring_domains",""),
                            client_meta.get("rating",""), client_meta.get("review_count",""),
                            GBP_PRIMARY_CATEGORY, BIZ_URL, is_client=True
                        )
                        client_inserted = True
                    # Competitors after client shift +1
                    display_rank_i = rank_i + (1 if client_inserted else 0)
                    table_html += _det_row(
                        f"#{display_rank_i}", row.get("competitor_name",""), row.get("domain",""),
                        row.get("vis_score", 0),
                        row.get("total_appearances",0), row.get("maps_appearances",""),
                        row.get("lf_appearances",""), row.get("avg_rank",""),
                        row.get("da",""), row.get("referring_domains",""),
                        row.get("rating",""), row.get("review_count",""),
                        row.get("category",""), row.get("website_url","")
                    )
                    displayed_comp_count += 1

                # If client ranks after all 5 competitors, insert at end of loop
                if not client_inserted and client_in_top5:
                    table_html += _det_row(
                        f"#{client_table_rank}", BIZ_NAME, BIZ_DOMAIN,
                        client_vis, client_apps, client_maps_apps, client_lf_apps,
                        client_avg_rank,
                        client_meta.get("da",""), client_meta.get("referring_domains",""),
                        client_meta.get("rating",""), client_meta.get("review_count",""),
                        GBP_PRIMARY_CATEGORY, BIZ_URL, is_client=True
                    )
                    client_inserted = True

                if not client_inserted:
                    sep = ('<tr><td colspan="13" style="padding:5px 12px;border-top:1px solid #2a2a3a;'
                           'font-family:\'DM Mono\',monospace;font-size:9px;letter-spacing:0.1em;'
                           'text-transform:uppercase;color:#3a3a5a;">Your Position</td></tr>')
                    table_html += sep
                    if client_in_top20:
                        table_html += _det_row(
                            f"#{client_table_rank}", BIZ_NAME, BIZ_DOMAIN,
                            client_vis, client_apps, client_maps_apps, client_lf_apps,
                            client_avg_rank,
                            client_meta.get("da",""), client_meta.get("referring_domains",""),
                            client_meta.get("rating",""), client_meta.get("review_count",""),
                            GBP_PRIMARY_CATEGORY, BIZ_URL, is_client=True
                        )
                    else:
                        table_html += _det_row(
                            "N/A", BIZ_NAME, BIZ_DOMAIN,
                            0.0, 0, 0, 0, None,
                            client_meta.get("da",""), client_meta.get("referring_domains",""),
                            client_meta.get("rating",""), client_meta.get("review_count",""),
                            GBP_PRIMARY_CATEGORY, BIZ_URL, is_client=True, not_ranked=True
                        )

                th_cells = ''.join(
                    f'<th style="padding:8px 10px;font-family:\'DM Mono\',monospace;font-size:9px;'
                    f'letter-spacing:0.1em;text-transform:uppercase;color:{c};">{h}</th>'
                    for h, c in [
                        ("Rank",           "#6b6b88"),
                        ("Business",       "#6b6b88"),
                        ("Visibility ↓",   "#c8a96e"),
                        ("Appearances",    "#6b6b88"),
                        ("Maps",           "#6b6b88"),
                        ("LF",             "#6b6b88"),
                        ("Avg Rank",       "#6b6b88"),
                        ("DA",             "#6b6b88"),
                        ("RDs",            "#6b6b88"),
                        ("Stars",          "#6b6b88"),
                        ("Reviews",        "#6b6b88"),
                        ("GBP Category",   "#6b6b88"),
                        ("Website",        "#6b6b88"),
                    ]
                )

                secs += (
                    f'<div style="margin-bottom:28px;">'
                    f'<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">'
                    f'<span style="font-size:13px;color:#e8e8f0;">"{kw}"</span>'
                    f'<span style="background:{badge_bg};color:{badge_color};font-family:\'DM Mono\',monospace;'
                    f'font-size:9px;letter-spacing:0.1em;padding:3px 8px;border-radius:2px;'
                    f'text-transform:uppercase;">{badge_label}</span>'
                    f'<span style="font-family:\'DM Mono\',monospace;font-size:9px;color:#6b6b88;letter-spacing:0.06em;">'
                    f'TOP {TOP_N_COMPETITORS} + YOUR POSITION · SORTED BY VISIBILITY SCORE</span>'
                    f'</div>'
                    f'<div style="overflow-x:auto;border-radius:4px;border:1px solid #2a2a3a;">'
                    f'<table style="width:100%;border-collapse:collapse;min-width:1000px;">'
                    f'<thead><tr style="background:#12121a;border-bottom:2px solid #2a2a3a;">'
                    f'{th_cells}</tr></thead>'
                    f'<tbody>{table_html}</tbody></table></div></div>'
                )
            secs += "</div>"
        return secs

    nm_list_html = "".join(
        f'<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #1a1a26;">'
        f'<span style="color:#e8e8f0;font-size:12px;">{o.get("name",o["zcta"])}</span>'
        f'<span style="font-family:\'DM Mono\',monospace;font-size:11px;color:#4ade80;">'
        f'{o["zcta"]} · {o["dist_mi"]:.2f}mi</span>'
        f'</div>'
        for o in nm_origins
    )
    city_list_html = "".join(
        f'<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #1a1a26;">'
        f'<span style="color:#e8e8f0;font-size:12px;">{o.get("name",o["zcta"])}</span>'
        f'<span style="font-family:\'DM Mono\',monospace;font-size:11px;color:#c8a96e;">{o["zcta"]}</span>'
        f'</div>'
        for o in city_origins
    )

    position_grid_rows = build_position_grid()
    leaderboard_rows   = build_leaderboard()
    detail_sections    = build_detail_sections()

    total_ranked = 0
    total_pos_slots = 0
    for source in [maps_results, lf_results]:
        for kw, kw_data in source.items():
            for zcta, od in kw_data.get("origins", {}).items():
                total_pos_slots += 1
                if od.get("client_pos"):
                    total_ranked += 1

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{BIZ_NAME} — Competitive Intelligence</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {{
      --bg:      #09090e;
      --surface: #111118;
      --surface2:#18181f;
      --border:  #2a2a3a;
      --text:    #e8e8f0;
      --muted:   #6b6b88;
      --accent:  #c8a96e;
      --green:   #4ade80;
      --amber:   #f59e0b;
      --red:     #f87171;
      --blue:    #818cf8;
    }}
    * {{ box-sizing:border-box; margin:0; padding:0; }}
    body {{ background:var(--bg); color:var(--text); font-family:'DM Sans',sans-serif;
            font-size:16px; line-height:1.6; }}
    a {{ color:var(--accent); text-decoration:none; }}
    a:hover {{ text-decoration:underline; }}
    .tab-btn {{
      padding:14px 24px; background:transparent; border:none;
      font-family:'DM Mono',monospace; font-size:11px; letter-spacing:0.12em;
      text-transform:uppercase; color:var(--muted); cursor:pointer;
      border-bottom:2px solid transparent; transition:all 0.2s;
    }}
    .tab-btn:hover {{ color:var(--text); }}
    .tab-btn.active {{ color:var(--accent); border-bottom-color:var(--accent); }}
    .tab-panel {{ display:none; }}
    .tab-panel.active {{ display:block; }}
  </style>
</head>
<body>

<!-- ════ HEADER ════ -->
<div style="background:var(--surface);border-bottom:1px solid var(--border);padding:28px 40px;">
  <div style="max-width:1400px;margin:0 auto;display:flex;align-items:flex-start;
              justify-content:space-between;flex-wrap:wrap;gap:20px;">
    <div>
      <div style="font-family:'DM Mono',monospace;font-size:10px;letter-spacing:0.18em;
                  text-transform:uppercase;color:var(--muted);margin-bottom:8px;">
        GrowthPath Analytics · Competitive Intelligence v1.3</div>
      <div style="font-family:'Bebas Neue',sans-serif;font-size:42px;letter-spacing:0.04em;
                  line-height:1;color:var(--text);">{BIZ_NAME}</div>
      <div style="font-family:'DM Mono',monospace;font-size:11px;color:var(--muted);margin-top:8px;">
        {now_str} · {BIZ_ADDRESS}</div>
    </div>
    <div style="display:flex;gap:28px;flex-wrap:wrap;align-items:flex-start;">
      <div style="text-align:center;">
        <div style="font-family:'DM Mono',monospace;font-size:9px;letter-spacing:0.12em;
                    text-transform:uppercase;color:var(--muted);margin-bottom:4px;">Keywords</div>
        <div style="font-family:'Bebas Neue',sans-serif;font-size:36px;color:var(--accent);">{len(keywords)}</div>
      </div>
      <div style="text-align:center;">
        <div style="font-family:'DM Mono',monospace;font-size:9px;letter-spacing:0.12em;
                    text-transform:uppercase;color:var(--muted);margin-bottom:4px;">Origins</div>
        <div style="font-family:'Bebas Neue',sans-serif;font-size:36px;color:var(--accent);">{n_orig}</div>
      </div>
      <div style="text-align:center;">
        <div style="font-family:'DM Mono',monospace;font-size:9px;letter-spacing:0.12em;
                    text-transform:uppercase;color:var(--muted);margin-bottom:4px;">Ranked Slots</div>
        <div style="font-family:'Bebas Neue',sans-serif;font-size:36px;color:var(--green);">
          {total_ranked}<span style="font-size:20px;color:var(--muted);">/{total_pos_slots}</span></div>
      </div>
    </div>
  </div>
</div>

<!-- ════ TAB BAR ════ -->
<div style="background:var(--surface);border-bottom:1px solid var(--border);padding:0 40px;">
  <div style="max-width:1400px;margin:0 auto;display:flex;">
    <button class="tab-btn active" onclick="switchTab('summary',this)">Summary &amp; Rankings</button>
    <button class="tab-btn" onclick="switchTab('detail',this)">Full Competitor Detail</button>
  </div>
</div>

<div style="max-width:1400px;margin:0 auto;padding:32px 40px;">

<!-- ════ TAB 1: SUMMARY ════ -->
<div id="tab-summary" class="tab-panel active">

  <!-- Origin grid -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:32px;">
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:4px;padding:20px;">
      <div style="font-family:'DM Mono',monospace;font-size:9px;letter-spacing:0.14em;
                  text-transform:uppercase;color:#4ade80;margin-bottom:12px;">
        Near-Me Origins · {len(nm_origins)} ZCTAs (spread 0–5mi)</div>
      {nm_list_html}
    </div>
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:4px;padding:20px;">
      <div style="font-family:'DM Mono',monospace;font-size:9px;letter-spacing:0.14em;
                  text-transform:uppercase;color:var(--accent);margin-bottom:12px;">
        City Origins · {len(city_origins)} ZCTAs (2 per band, 5–20mi)</div>
      {city_list_html}
    </div>
  </div>

  <div style="background:var(--surface);border:1px solid var(--border);border-radius:4px;
              padding:14px 20px;margin-bottom:28px;display:flex;gap:20px;flex-wrap:wrap;align-items:center;">
    <div style="font-family:'DM Mono',monospace;font-size:9px;letter-spacing:0.12em;
                text-transform:uppercase;color:var(--muted);">Position</div>
    <div style="display:flex;align-items:center;gap:6px;font-size:12px;color:#4ade80;">
      {pos_badge(1)} <span>Leading · #1–3</span>
    </div>
    <div style="display:flex;align-items:center;gap:6px;font-size:12px;color:#60a5fa;">
      {pos_badge(4)} <span>Competitive · #4–5</span>
    </div>
    <div style="display:flex;align-items:center;gap:6px;font-size:12px;color:#f59e0b;">
      {pos_badge(8)} <span>Needs Work · #6–10</span>
    </div>
    <div style="display:flex;align-items:center;gap:6px;font-size:12px;color:#f87171;">
      {pos_badge(15)} <span>Critical · #11+</span>
    </div>
    <div style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--muted);">
      {pos_badge(None)} <span>Not ranked</span>
    </div>
    <div style="margin-left:auto;font-family:'DM Mono',monospace;font-size:9px;color:var(--muted);">
      <span style="color:#818cf8;font-weight:500;">M</span> = Google Maps &nbsp;·&nbsp;
      <span style="color:var(--accent);font-weight:500;">LF</span> = Local Finder
    </div>
  </div>

  <!-- Position cards (per service) -->
  <div style="font-family:'DM Mono',monospace;font-size:9px;letter-spacing:0.14em;
              text-transform:uppercase;color:var(--muted);margin-bottom:12px;">
    Client Rankings by Service × Origin — Each cell: M = Maps · LF = Local Finder</div>
  {position_grid_rows}

  <!-- Leaderboard -->
  <div style="font-family:'DM Mono',monospace;font-size:9px;letter-spacing:0.14em;
              text-transform:uppercase;color:var(--muted);margin-bottom:6px;">
    Top Competitors — Cross-Keyword Leaderboard</div>
  <div style="font-size:12px;color:var(--muted);margin-bottom:14px;line-height:1.6;">
    Sorted by <span style="color:var(--accent);font-family:'DM Mono',monospace;">avg visibility score</span>
    (average vis score across all keywords) — the most reliable competitive signal.
    Rewards consistent top-ranked presence across your full trade area, not one lucky keyword result.
  </div>
  <div style="overflow-x:auto;border-radius:4px;border:1px solid var(--border);margin-bottom:12px;">
    <table style="width:100%;border-collapse:collapse;min-width:800px;">
      <thead>
        <tr style="background:var(--surface2);border-bottom:2px solid var(--border);">
          <th style="padding:10px 14px;font-family:'DM Mono',monospace;font-size:9px;
                     letter-spacing:0.1em;text-transform:uppercase;color:var(--muted);">Rank</th>
          <th style="padding:10px 14px;text-align:left;font-family:'DM Mono',monospace;font-size:9px;
                     letter-spacing:0.1em;text-transform:uppercase;color:var(--muted);">Competitor</th>
          <th style="padding:10px 10px;font-family:'DM Mono',monospace;font-size:9px;
                     letter-spacing:0.1em;text-transform:uppercase;color:var(--accent);">Avg Vis ↓</th>
          <th style="padding:10px 10px;font-family:'DM Mono',monospace;font-size:9px;
                     letter-spacing:0.1em;text-transform:uppercase;color:var(--muted);">Frequency</th>
          <th style="padding:10px 10px;font-family:'DM Mono',monospace;font-size:9px;
                     letter-spacing:0.1em;text-transform:uppercase;color:var(--muted);">Avg Rank</th>
          <th style="padding:10px 10px;font-family:'DM Mono',monospace;font-size:9px;
                     letter-spacing:0.1em;text-transform:uppercase;color:var(--muted);">DA</th>
          <th style="padding:10px 10px;font-family:'DM Mono',monospace;font-size:9px;
                     letter-spacing:0.1em;text-transform:uppercase;color:var(--muted);">Stars</th>
          <th style="padding:10px 10px;font-family:'DM Mono',monospace;font-size:9px;
                     letter-spacing:0.1em;text-transform:uppercase;color:var(--muted);">Reviews</th>
          <th style="padding:10px 10px;text-align:left;font-family:'DM Mono',monospace;font-size:9px;
                     letter-spacing:0.1em;text-transform:uppercase;color:var(--muted);">Website</th>
        </tr>
      </thead>
      <tbody>{leaderboard_rows}</tbody>
    </table>
  </div>
  <div style="font-size:11px;color:var(--muted);font-family:'DM Mono',monospace;margin-bottom:8px;">
    DA: <span style="color:#4ade80;">■ 40+</span> &nbsp;
    <span style="color:#f59e0b;">■ 20–39</span> &nbsp;
    <span style="color:#f87171;">■ &lt;20</span> &nbsp;
    &nbsp;|&nbsp; Avg Vis = avg visibility score across all keywords &nbsp;·&nbsp; Frequency = total ranked slots across {n_orig} origins × 2 surfaces
  </div>

</div><!-- /tab-summary -->

<!-- ════ TAB 2: DETAIL ════ -->
<div id="tab-detail" class="tab-panel">
  <div style="background:var(--surface);border:1px solid var(--border);border-radius:4px;
              padding:20px 24px;margin-bottom:28px;border-left:3px solid #c8a96e;">
    <div style="font-family:'DM Mono',monospace;font-size:9px;letter-spacing:0.14em;
                text-transform:uppercase;color:#c8a96e;margin-bottom:10px;">Ranking Methodology</div>
    <div style="font-size:13px;color:#cccce0;line-height:1.8;">
      Each business earns a <strong style="color:#e8e8f0;">Visibility Score</strong> (0–100) based on points earned per origin × surface slot:
      <span style="font-family:'DM Mono',monospace;color:#4ade80;">#1=10 &nbsp;#2=8 &nbsp;#3=7</span> &nbsp;
      <span style="font-family:'DM Mono',monospace;color:#60a5fa;">#4=6 &nbsp;#5=5</span> &nbsp;
      <span style="font-family:'DM Mono',monospace;color:#f59e0b;">#6=4 &nbsp;#7=3 &nbsp;#8–10=2</span> &nbsp;
      <span style="font-family:'DM Mono',monospace;color:#f87171;">#11–20=1</span> &nbsp;
      <span style="font-family:'DM Mono',monospace;color:#3a3a5a;">absent=0</span>.
      Score = earned ÷ max possible × 100, normalized to actual origins scanned.
      Rewards consistent <strong style="color:#e8e8f0;">top-3 presence</strong> over broad low-ranked appearances.
      <strong style="color:#e8e8f0;">Frequency</strong> and <strong style="color:#e8e8f0;">Avg Rank</strong> shown as supporting context.
      GBP Category: compare to yours — <em style="color:#e8e8f0;">{GBP_PRIMARY_CATEGORY}</em>.
    </div>
    <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:14px;">
      <span style="font-size:11px;font-family:'DM Mono',monospace;padding:3px 10px;border-radius:2px;background:rgba(74,222,128,0.1);color:#4ade80;border:1px solid #4ade8030;">60–100 Leading</span>
      <span style="font-size:11px;font-family:'DM Mono',monospace;padding:3px 10px;border-radius:2px;background:rgba(96,165,250,0.1);color:#60a5fa;border:1px solid #60a5fa30;">40–59 Competitive</span>
      <span style="font-size:11px;font-family:'DM Mono',monospace;padding:3px 10px;border-radius:2px;background:rgba(245,158,11,0.1);color:#f59e0b;border:1px solid #f59e0b30;">20–39 Needs Work</span>
      <span style="font-size:11px;font-family:'DM Mono',monospace;padding:3px 10px;border-radius:2px;background:rgba(248,113,113,0.1);color:#f87171;border:1px solid #f8717130;">0–19 Critical</span>
    </div>
  </div>
  {detail_sections}
</div><!-- /tab-detail -->

</div><!-- /content -->

<script>
function switchTab(name, btn) {{
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  btn.classList.add('active');
}}
</script>
</body>
</html>"""

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"  HTML report exported: {filepath}")



# ════════════════════════════════════════════════════════════════
# PDF GENERATION — screenshot-slice method
# Identical to generate_report_v6.58. Assumes clean Colab session.
# ════════════════════════════════════════════════════════════════

def generate_pdf(html_path, pdf_path):
    import warnings, os, asyncio, subprocess, sys
    warnings.filterwarnings("ignore")

    # ── System deps for Chromium headless shell ──────────────────
    print("  Installing Chromium system dependencies...")
    subprocess.run(["apt-get", "update", "-qq"], capture_output=True)
    subprocess.run(
        ["apt-get", "install", "-y", "-q",
         "libatk1.0-0", "libatk-bridge2.0-0", "libcups2", "libdrm2",
         "libxkbcommon0", "libxcomposite1", "libxdamage1", "libxfixes3",
         "libxrandr2", "libgbm1", "libasound2", "libpango-1.0-0",
         "libpangocairo-1.0-0", "libgtk-3-0", "libgdk-pixbuf2.0-0"],
        capture_output=True
    )

    # ── nest_asyncio: must apply before any asyncio.run() in Colab ──
    try:
        import nest_asyncio
        nest_asyncio.apply()
    except ImportError:
        subprocess.run([sys.executable, "-m", "pip", "install",
                        "nest_asyncio", "--break-system-packages", "-q"])
        import nest_asyncio
        nest_asyncio.apply()

    # ── Auto-install Playwright + Pillow if missing ──────────────
    try:
        from playwright.async_api import async_playwright
        from PIL import Image
    except ImportError:
        print("  Installing Playwright and Pillow (one-time per session)...")
        subprocess.run([sys.executable, "-m", "pip", "install",
                        "playwright", "pillow", "--break-system-packages", "-q"],
                       check=True)
        subprocess.run(["playwright", "install", "chromium"], check=True)
        try:
            from playwright.async_api import async_playwright
            from PIL import Image
        except ImportError:
            print("  Install failed — download HTML from the Colab files panel.")
            return False

    import numpy as np

    BG             = (13, 13, 26)
    MARGIN_PX      = 0
    PAGE_CONTENT_H = int(2880 * 1.294)   # Letter ratio at 2880px wide (2x scale)
    SNAP_SEARCH_PX = 600
    BG_TOLERANCE   = 18
    BG_ROW_THRESH  = 0.70

    print("  Generating PDF (smart-break screenshot method)...")

    screenshot_path = html_path.replace(".html", "_tmp_screenshot.png")

    async def _capture():
        async with async_playwright() as p:
            browser = await p.chromium.launch()
            page = await browser.new_page(
                viewport={"width": 1440, "height": 900}, device_scale_factor=2
            )
            await page.goto(f"file://{os.path.abspath(html_path)}")
            await page.wait_for_timeout(3000)   # allow Google Fonts to load

            # ── Make both tabs visible for PDF ───────────────────
            await page.evaluate("""
                () => {
                    document.querySelectorAll('.tab-panel').forEach(el => {
                        el.style.display = 'block';
                    });
                    const tabBar = document.querySelector(
                        'div[style*="border-bottom:1px solid var(--border)"][style*="padding:0 40px"]'
                    );
                    if (tabBar) tabBar.style.display = 'none';
                    document.querySelectorAll('button[onclick]').forEach(el => {
                        el.style.display = 'none';
                    });
                    // 100px spacer between Tab 1 and Tab 2 — prevents
                    // Tab 2 bleeding onto bottom of page 1.
                    // Adjust if client has significantly more/fewer keywords.
                    const detail = document.getElementById('tab-detail');
                    if (detail) {
                        const spacer = document.createElement('div');
                        spacer.id = 'pdf-page-spacer';
                        spacer.style.cssText = [
                            'width:100%',
                            'height:100px',
                            'background:#09090e',
                            'display:block',
                        ].join(';');
                        detail.parentNode.insertBefore(spacer, detail);
                    }
                }
            """)
            await page.wait_for_timeout(300)

            full_h = await page.evaluate("document.documentElement.scrollHeight")
            await page.set_viewport_size({"width": 1440, "height": full_h})
            await page.wait_for_timeout(500)
            await page.screenshot(path=screenshot_path, full_page=True)
            await browser.close()

    asyncio.run(_capture())

    img     = Image.open(screenshot_path).convert("RGB")
    pixels  = np.array(img)
    total_w = pixels.shape[1]
    h       = pixels.shape[0]

    def find_snap_point(ideal_cut):
        search_start = max(0, ideal_cut - SNAP_SEARCH_PX)
        for row in range(ideal_cut, search_start, -1):
            diff = np.abs(pixels[row].astype(int) - np.array(BG))
            if np.all(diff <= BG_TOLERANCE, axis=1).mean() >= BG_ROW_THRESH:
                return row
        return ideal_cut

    pages = []
    top   = 0
    while top < h:
        ideal_bottom = top + PAGE_CONTENT_H
        bottom = h if ideal_bottom >= h else find_snap_point(ideal_bottom)

        slice_img = Image.fromarray(pixels[top:bottom])
        slice_h   = slice_img.height

        if slice_h < PAGE_CONTENT_H * 0.12 and pages:
            prev     = pages[-1]
            combined = Image.new("RGB", (total_w, prev.height + slice_h), BG)
            combined.paste(prev, (0, 0))
            combined.paste(slice_img, (0, prev.height))
            pages[-1] = combined
            break

        padded = Image.new("RGB", (total_w, slice_h + MARGIN_PX * 2), BG)
        padded.paste(slice_img, (0, MARGIN_PX))
        pages.append(padded)
        top = bottom

    pages[0].save(pdf_path, save_all=True, append_images=pages[1:], resolution=200)
    os.remove(screenshot_path)
    size_mb = os.path.getsize(pdf_path) / 1024 / 1024
    print(f"  PDF written: {pdf_path}  ({len(pages)} pages, {size_mb:.1f} MB)")
    return True

# ════════════════════════════════════════════════════════════════
# RUN
# ════════════════════════════════════════════════════════════════

def run():
    print("=" * 62)
    print("  GROWTHPATH COMPETITIVE INTEL ENGINE v2.0")
    print(f"  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"  {BIZ_NAME} · {BIZ_DOMAIN}")
    print("=" * 62)

    run_start  = time.time()
    total_cost = 0.0

    print("\n── Step 1: Keywords ─────────────────────────────────────────")
    keywords = build_keywords(OWNER_SERVICES, CITY)

    gazetteer = load_gazetteer()
    origins   = build_origins(BIZ_ADDRESS, GOOGLE_API_KEY, gazetteer)

    maps_results, maps_cost, maps_meta = fetch_maps(keywords, origins, biz_domain=BIZ_DOMAIN)
    total_cost += maps_cost

    biz_street = BIZ_ADDRESS.split(",")[0].strip()
    lf_results, lf_cost = fetch_local_finder(
        keywords, origins,
        biz_name=BIZ_NAME, biz_domain=BIZ_DOMAIN, biz_address_street=biz_street,
    )
    total_cost += lf_cost

    competitor_agg, competitor_agg_full = aggregate_competitors(maps_results, lf_results, origins)

    all_domains = set()
    all_domains.add(BIZ_DOMAIN.replace("www.", "").lower())  # always fetch client DA
    for comps in competitor_agg.values():
        for comp in comps:
            dom = comp.get("domain", "").replace("www.", "").lower()
            if dom:
                all_domains.add(dom)
    moz_data = fetch_moz_bulk(sorted(all_domains), MOZ_API_KEY)

    # Merge client Moz data with rating/reviews from scan
    client_moz = moz_data.get(BIZ_DOMAIN.replace("www.", "").lower(), {})
    client_meta = {
        "da":               client_moz.get("da", ""),
        "referring_domains":client_moz.get("referring_domains", ""),
        "rating":           maps_meta.get("rating", ""),
        "review_count":     maps_meta.get("review_count", ""),
    }
    print(f"  Client metrics — DA={client_meta['da']} RDs={client_meta['referring_domains']} "
          f"Rating={client_meta['rating']} Reviews={client_meta['review_count']}")

    print("\n── Step 7: Building Output Rows ─────────────────────────────")
    rows = build_output_rows(keywords, competitor_agg, moz_data)
    print(f"  {len(rows)} rows built")

    print("\n── Step 8: HTML Report + PDF ────────────────────────────────")
    run_meta = {
        "timestamp":  datetime.now().strftime("%B %d, %Y %I:%M %p"),
        "total_cost": total_cost,
    }
    export_html(rows, keywords, origins, maps_results, lf_results, run_meta, client_meta, competitor_agg_full)

    print("\n── Step 9: PDF ──────────────────────────────────────────────")
    html_path = f"/content/{_OUTPUT_STEM}_comp_intel.html"
    pdf_path  = f"/content/{_OUTPUT_STEM}_comp_intel.pdf"
    generate_pdf(html_path, pdf_path)

    elapsed = round(time.time() - run_start, 1)
    print(f"\n{'=' * 62}")
    print(f"  COMPLETE — {elapsed}s  |  Est. cost: ${total_cost:.4f}")
    print(f"  {_OUTPUT_STEM}_comp_intel.html")
    print(f"  {_OUTPUT_STEM}_comp_intel.pdf")
    print(f"{'=' * 62}")

    try:
        from google.colab import files
        files.download(f"/content/{_OUTPUT_STEM}_comp_intel.html")
        files.download(pdf_path)
    except ImportError:
        print("  (Not in Colab — files saved to working directory)")


run()
