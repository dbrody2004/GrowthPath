# Competitor Intel Parity Checklist

Maps the original deliverable (`kitchen747-Growth-Gap-Analysis.html`, `scoring-engine-v4_69 identify_primary_competitor`) to the current stack.

## Reference deliverable sections

| Section | Source data | Current field |
|---|---|---|
| Near-me / city competitor tables | SERP + Local Finder + Moz | `Scores.competitor_leaderboard` |
| Primary competitor profile | SERP #1 frequency + Moz | `Scores.competitor_intel` |
| Client vs leader gap table | GBP + Moz + visibility | `Scores.competitor_intel.deltas` |
| Surface position matrix | SERP + LF per service | `Scores.competitor_intel.surface_matrix` |
| Why they're winning | Decision tree on reviews/DA | `Scores.competitor_intel.why_winning` + `why_factors` |
| Counter-moves | Largest computed gaps | `Scores.competitor_intel.counter_moves` + `action_callout` |
| Client row highlight | Client domain match | `CompetitorLeaderboardRow.is_client` |
| Primary row highlight | Primary competitor domain | `CompetitorLeaderboardRow.is_primary` |

## Aggregation (`compIntel.ts`)

| Field | Status |
|---|---|
| Per-keyword visibility score | Ported |
| Maps / LF appearance split | Ported |
| Cross-keyword leaderboard rollup | Enhanced via `buildCompetitorLeaderboard` |
| Moz DA / RD enrichment | Enhanced in scoring-engine |
| Near-me vs city frequency | Enhanced in scoring-engine |

## Primary competitor selection

| Rule | Status |
|---|---|
| Rank by near-me #1 frequency | Ported |
| Tie-break by city #1 frequency | Ported |
| Exclude client domain from tally | Ported |
| Moz metrics lookup by domain | Ported |
| LF + city surface positions | Ported (enhanced) |
| Structured deltas vs prose-only | Ported |

## Deferred

- External pages / backlink counts (shown in reference HTML when Moz provides them)
- LLM-generated competitor narratives
