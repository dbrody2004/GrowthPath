# Report Fidelity Parity Checklist

Maps the original GrowthPath client deliverable (`initialdiscovery/currentapp/kitchen747-Growth-Gap-Analysis.html`, `growthpath-portal-kitchen747-v1_0.html`, `scoring-engine-v4_69 (1).py`) to the current TypeScript stack.

## Report sections

| Reference section | Current source | Status |
|---|---|---|
| P1 / P2 header + profile quadrant | `Scores.p1`, `Scores.p2`, `Scores.profile`, `ScoreHeader` | Ported |
| Category score cards | `Scores.categories.*`, `CategoryCard` | Ported (enhanced with evidence) |
| Category assessment (plain-language score meaning) | `Scores.report.explanation`, `Scores.report.categories[].assessment` | Ported |
| Signal benchmark table (earned / max, client value, target) | `Scores.categories.*.signal_pts` + `Scores.report.categories[].signals` | Ported |
| Findings list with severity | `Scores.categories.*.findings` | Ported |
| Priority action plan | `Scores.actions`, `PriorityActions` | Ported |
| Rank map / origin grid | `AuditData.serp`, `RankMap` tab | Ported |
| Competitor intel + leaderboard | `Scores.competitor_intel`, `CompetitorLeaderboard` | Ported |
| Keyword cards | `AuditData.keywords`, `KeywordCards` tab | Ported |
| Map pack diagnostics (reach, scenario, diagnosis) | `Scores.categories.mappack.*` | Ported |
| Collection / appendix diagnostics | `Scores.report.appendix` | Ported |
| KB-driven appendix remediation cards | `Finding.kb_key` collected in appendix; full KB cards deferred | Partial |

## Field mapping by category

### GBP Strength (`gbp_strength`)

| Signal key | Points source | Client value source | Benchmark |
|---|---|---|---|
| `primary_category` | `score-gbp-strength.ts` | `AuditData.gbp.primary_type` | Confirm most specific category |
| `secondary_categories` | same | `gbp.secondary_categories.length` | 3+ categories |
| `google_rating` | same | `gbp.rating` | 4.8★+ |
| `review_count` | same | `gbp.review_count` | 800+ (vertical-adjusted in scorer) |
| `review_velocity` | same | `gbp.reviews_w1/w2/w3` | 5+/30-day window |
| `response_rate` | same | `gbp.owner_response_rate` | 75%+ |
| `photos` | same | `gbp.photo_count` | 15+ photos |
| `gbp_posts` | same | `gbp_posts.last_post_days_ago` | Post within 7 days |

### Search Visibility (`mappack`)

No `signal_pts` in scorer; report evidence uses reach metrics:

| Evidence row | Source |
|---|---|
| Near-me reach | `mappack.near_me_score`, `local_reach` |
| Regional reach | `mappack.city_score`, `regional_reach` |
| 3-pack keywords | `mappack.kw_3pack` |
| Invisible keywords | `mappack.kw_invisible` |

### On-Page, Trust, Performance, Conversion, UX

Each category's `signal_pts` keys match `scoring-engine-v4_69 (1).py`. Report rows are built from `signal_pts` plus audit snippets in `build-report-evidence.ts`.

## Structured report contract

All report-facing narrative and benchmark context lives on `Scores.report`:

- `explanation` — profile and pillar summaries
- `categories[]` — per-category assessment, benchmark summary, signal evidence rows, rule outcomes
- `appendix` — collection status, signal availability, triggered `kb_key` list

The UI renders this data; it does not compute scoring rationale.

## Deferred (out of scope for this plan)

- Full KB registry appendix cards (`SEO-Knowledge-Base-v1_6.md`)
- GA4 / GSC benchmark cards from portal P2 confirmation flow
- PDF export (`build_report` HTML generator)
