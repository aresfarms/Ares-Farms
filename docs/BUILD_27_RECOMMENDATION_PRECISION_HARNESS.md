# Build 27 — Recommendation Precision Test Harness

The Recommendation Precision Test Harness is the trust-preservation
gate for Furlong recommendations. It is the first explicit
test-as-governance build in the canonical v2 backbone: it does not
add new borrower-facing pathways, lender workflows, or governance
posture. Instead it runs every canonical persona fixture through
the full canonical v2 stack and asserts that the recommendations
returned are relevant to the borrower's customer profile, project
goal, geography, asset type, and stated use of funds — and that
nothing irrelevant slips through.

The harness exists to prevent the kind of failure that breaks
borrower trust irreversibly: returning agricultural / pig-farm /
USDA pathways for a hotel owner in New Jersey, or returning
sovereign-tribe-only programs to a non-sovereign borrower in a
closed federation scope. These are not "quality" failures; they
are constitutional failures that undermine the entire advisory
posture of the platform. The harness gates them as a hard CI
failure.

## What is composed

The harness loads
`RECOMMENDATION_PRECISION_SCENARIOS` (canonical fixtures, sealed
under `recommendation-precision-scenarios-v0.1.0`) and runs each
scenario through:

- Customer Type Registry (Build 14)
- Universal Capital Graph (Build 13)
- Revenue Intelligence v2 (Build 15)
- Financing Pathway Engine v2 (Build 16)
- Opportunity Discovery v2 (Build 17)
- Borrower Onboarding Core v2 (Build 24)
- Readiness Assessment v2 (Build 25)

Each scenario declares: `customer_type`, `geography`,
`project_goal`, `asset_type`, `desired_use_of_funds`,
`expected_relevant_pathways`, `expected_excluded_pathways`,
`expected_relevant_categories`, `expected_excluded_categories`,
`expected_readiness_gaps`, `expected_next_steps`,
`expected_conflict_topics`, `expects_zero_matched_profiles`, and
`human_review_notes`.

## Canonical persona fixtures (≥ 9)

1. **Hotel owner in urban NJ** — Newark, NJ; intentionally bad-fit.
   Expects zero matched customer profiles. Asserts: no USDA / FSA /
   REAP / specialty-crop pathways appear; conflict signals
   surface to a reviewer.
2. **Hotel owner in rural MO** — Howell County, MO; rural small
   business. Expects SBA / CDFI / state incentive programs. Asserts
   no agricultural production pathways (FSA, specialty crop block
   grant, livestock operating loans).
3. **Beginning farmer / rancher in MD** — Frederick County, MD;
   strong canonical match. Expects USDA / FSA / equipment financing.
   Asserts no historic tax credits / opportunity zones returned.
4. **Mobile home park owner** — Madison County, MS; community
   development matter, not farmer/producer. Expects CDFI / SBA /
   state incentives. Asserts no FSA / carbon markets.
5. **Contractor / equipment operator** — Story County, IA;
   equipment + working capital. Expects SBA / equipment / vendor
   financing. Asserts no FSA producer pathways.
6. **Small business acquisition** — Greene County, TN; SBA / CDFI /
   conventional banking. Asserts no FSA / specialty crop.
7. **Refinance-only borrower** — Kay County, OK; conventional /
   private / CDFI refinance. Asserts no FSA / beginning farmer.
8. **Expansion borrower** — Monongalia County, WV; SBA / state /
   conventional. Asserts no refinance-only / specialty crop / FSA.
9. **Intentionally bad-fit sovereign-closed** — Yellowstone County,
   MT; federally recognized tribe declared, sovereign federation
   NOT authorized. Expects zero matched sovereign profiles and
   cross-source conflict preservation. Asserts no sovereign-only
   program recommended.

## Scoring

For each scenario the harness computes:

- `precision_score` — of returned categories, the share that are
  NOT in the excluded list (1.0 means no off-topic category
  leaked through).
- `exclusion_score` — of expected-excluded categories, the share
  that are absent from the returned set (1.0 means perfect
  suppression of off-topic categories).
- `explanation_score` — of returned grant cards, the share that
  carry at least one `fitReason` (1.0 means every recommendation
  is reviewable).
- `trust_score` — weighted aggregate
  `0.25 × precision_score + 0.40 × exclusion_score + 0.25 × explanation_score + 0.10 × conflict_propagation_preserved`,
  minus penalties (banned language, excluded leakage,
  matched-profile boundary violation each subtract 0.5).

CI gate threshold: `trust_score >= 0.85` per scenario AND mean
across all scenarios.

## CI gate failure conditions

The harness fails CI when any of the following appears:

1. **Banned language** in advisory output (`approved`,
   `preapproved`, `guaranteed`, `qualified you for`, `we have
   committed`, `official certification`, `official decision`,
   `agency decision`, `regulatory reliance`, `legal reliance`,
   `lender commitment`, `funding committed`, `eligibility
   confirmed`, `public verification`). The detection respects
   negation context — a disclosure that says "no lender
   commitment" is the safety property, not a failure. The scan
   covers borrower-facing advisory output only (`fitReasons`,
   `missingItems`, `conflictSignals`), not Capital Graph factual
   labels.
2. **Excluded capital category returned** — the v2 stack returned
   a category that the scenario explicitly disallowed (e.g. FSA
   for a hotel owner).
3. **Missing explanation** — any returned grant card has zero
   `fitReasons`.
4. **Trust score below threshold** — `trust_score < 0.85`.
5. **Conflict propagation lost** — a scenario with declared
   conflict topics where neither OD v2 nor BO v2 nor RA v2
   surfaced any matching cross-source conflict.
6. **Matched-profile boundary violated** — a scenario declared
   `expectsZeroMatchedProfiles=true` but the v2 stack matched
   customer profiles without raising a cross-source conflict.

## Constitutional posture

Internal test harness only. The harness does NOT create:

- customer-facing approval or preapproval,
- eligibility determination,
- lender commitment,
- agency decision,
- public verification,
- regulatory reliance,
- legal reliance,
- source certainty claim,
- live external action,
- payment authorization, or
- notice send.

It validates advisory relevance and trust-preserving
recommendation behavior. Sovereign customer types remain hidden
unless named federation participation is authorized.

## Master Volume Governance

- **Vol I (Constitutional Backbone)** — keeps the harness
  subordinate to constitutional authority; precision testing
  never grants authority and never replaces external review.
- **Vol II (Regulatory Governance)** — blocks the harness from
  claiming approval, eligibility certainty, lender commitment,
  funding certainty, agency decision, public verification,
  regulatory reliance, or legal reliance.
- **Vol III (Technical Infrastructure)** — deterministic,
  replay-safe scenario execution with explicit version lineage
  chaining `recommendation-precision-runtime-v0.1.0` and
  `recommendation-precision-scenarios-v0.1.0` through the v2
  composition stack.
- **Vol III-B (Governance Runtime)** — runtime evidence with
  classification, observability, explainability, replay
  verification.
- **Vol IV (Operational Runbooks)** — routes governed handoffs to
  the upstream canonical v2 modules (Readiness Assessment v2,
  Borrower Onboarding Core v2, Opportunity Discovery v2,
  Financing Pathway Engine v2, Revenue Intelligence v2, Customer
  Type Registry, Capital Graph, Environmental Intake v2) and to
  governance, reviews, evidence packets, audit replay, and module
  readiness.
- **Vol V (Canonical Doctrines)** — preserves claims governance,
  controlled disclosure, replay, audit, advisory-only boundaries.
- **Vol VI (Source Intelligence Integration)** — keeps every
  composed recommendation behind a public-safe DTO; no live
  external fetch; no source-certainty claim.

## Version lineage

```
recommendation-precision-runtime-v0.1.0
  ├── recommendation-precision-scenarios-v0.1.0
  ├── readiness-assessment-v2-runtime-v0.1.0
  ├── borrower-onboarding-core-v2-runtime-v0.1.0
  ├── opportunity-discovery-v2-runtime-v0.1.0
  ├── financing-pathway-engine-v2-runtime-v0.1.0
  ├── revenue-intelligence-v2-runtime-v0.1.0
  ├── customer-type-runtime-v0.1.0
  └── capital-graph-runtime-v0.1.0
```

## Module manifest and event contract

- Module manifest:
  `governance-recommendation-precision-harness`, route
  `/governance/recommendation-precision-harness`, internal
  audience, production-blocked, replay-required, public surface
  disallowed.
- Event contract:
  `governance.recommendation.precision.tested`, RESTRICTED,
  production-blocked, replay-required, public surface disallowed.
- 13 governed handoffs to canonical v2 modules + governance +
  reviews + evidence packets + audit replay + module readiness.

## Verification

- `npx tsc --noEmit` — clean.
- `npm run smoke:recommendation-precision` — 9 / 9 scenarios pass,
  mean trust score 1.00, ci gate passed.
- `npm run verify:module-manifests` — 92 modules, 82 event
  contracts, 426 handoffs, conformance passed.
- `npm run smoke:replay-cross-module` — cross-module replay
  passed.
- `npm run smoke:public-surfaces` — 27 surfaces, conformance
  passed.
- `npm run smoke:claims-public` — 0 findings.
- `npm run smoke:redaction` — conformance passed.

## CI gate

The CI workflow `.github/workflows/ci.yml` runs the new step
"Recommendation Precision Harness" via
`npm run smoke:recommendation-precision`. The step fails the
build if any of the six CI gate conditions trigger.
