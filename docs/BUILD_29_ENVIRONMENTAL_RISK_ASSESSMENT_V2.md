# Build 29 — Environmental Risk Assessment v2

The fourteenth downstream consumer of the canonical v2 backbone.
Composes Environmental Compliance v2 (Build 28) with a borrower-
declared site-risk overlay into seven governed risk signals.

There is no v1 environmental-risk-assessment runtime; this is a
v2-native composition. The risk overlay is a pure-functional
evaluation over borrower-declared descriptors — **no external risk
data fetch** (no FEMA flood, no FWS habitat, no EPA brownfield).

## Seven governed risk signals

- `risk_site_contamination_alignment` — NONE / RECORDED /
  PENDING_INVESTIGATION / UNKNOWN.
- `risk_water_wetland_alignment` — NONE / ADJACENT / ON_SITE /
  UNKNOWN.
- `risk_floodplain_alignment` — NONE / 500_YEAR / 100_YEAR /
  UNKNOWN.
- `risk_tribal_land_alignment` — NONE / ADJACENT /
  ON_SOVEREIGN_LAND / UNKNOWN. **ON_SOVEREIGN_LAND escalates to
  SOVEREIGN_REVIEW + BLOCKED_BY_CONFLICT** per Vol I and
  CANON-SOVEREIGNTY-001.
- `risk_historic_district_alignment` — NONE / ADJACENT /
  WITHIN_DISTRICT / UNKNOWN.
- `risk_endangered_species_habitat_alignment` — NONE / ADJACENT /
  ON_SITE / UNKNOWN.
- `risk_brownfield_alignment` — NONE / ADJACENT / ON_SITE /
  UNKNOWN.

Per-descriptor tier mapping:
- `NONE` → `NO_RISK` → `READY_FOR_REVIEW`, 100% readiness.
- `ADJACENT` / `500_YEAR` → `ADJACENT_REVIEW` → `NEEDS_INPUT`,
  60% readiness.
- `ON_SITE` / `WITHIN_DISTRICT` / `100_YEAR` / `RECORDED` /
  `PENDING_INVESTIGATION` → `ON_SITE_REVIEW` →
  `BLOCKED_BY_CONFLICT`, 25% readiness.
- `ON_SOVEREIGN_LAND` → `SOVEREIGN_REVIEW` → `BLOCKED_BY_CONFLICT`,
  25% readiness.
- `UNKNOWN` → `DATA_GAP` → `NEEDS_INPUT`, 40% readiness.

## Five cross-source conflict classes

- `era-v2-gate-cleared-risk-blocked` — v1 environmental-compliance
  gate ENVIRONMENTAL_LINEAGE_CONFIRMED while v2 risk overlay
  surfaces any BLOCKED_BY_CONFLICT signal.
- `era-v2-upstream-ec-v2-conflicts` — upstream Environmental
  Compliance v2 cross-source conflicts propagated.
- `era-v2-tribal-land-without-sovereign-authorization` — tribal-
  land declared ON_SOVEREIGN_LAND without sovereign federation
  authorization.
- `era-v2-floodplain-real-estate-without-block` — 100-year
  floodplain in REAL_ESTATE pathway without v1 gate block.
- `era-v2-contamination-without-phase-ii` — RECORDED or
  PENDING_INVESTIGATION contamination without a Phase II / III
  ESA assessment type.

## Constitutional posture

Internal advisory site-risk overlay posture only. The runtime does
NOT create:

- external risk data fetch (no FEMA flood, FWS habitat, EPA
  brownfield),
- external environmental provider engagement, fee authorization,
- official environmental report, environmental clearance, NEPA
  determination, Phase I / II / III ESA report, permit issued,
- autonomous environmental risk / compliance / intake / onboarding
  / readiness / customer eligibility / pathway / opportunity /
  intelligence / evidence / certification determination,
- credit decision, lender commitment, program approval,
- public verification, regulatory reliance, legal reliance,
- source certainty claim, live external action, notice send.

Environmental Engineering Spoke isolation preserved. Sovereign
customer types and on-sovereign-land sites require named
federation participation.

## Master Volume Governance

- **Vol I** — ROLE-ARCH-001 spoke isolation; risk signals never
  grant authority.
- **Vol II** — blocks risk assessment from becoming environmental
  clearance, NEPA, Phase I/II ESA report, permit, official report,
  public verification, regulatory reliance, legal reliance.
- **Vol III** — deterministic, replay-safe composition with
  explicit version lineage chaining
  `environmental-risk-assessment-v2-runtime-v0.1.0` →
  `environmental-compliance-v2-runtime-v0.1.0` →
  `environmental-intake-v2-runtime-v0.1.0` → BO v2 → OD v2 →
  FPE v2 → RI v2 → Customer Type → Capital Graph.
- **Vol III-B** — runtime evidence with classification,
  observability, explainability, replay verification.
- **Vol IV** — routes governed handoffs to Environmental
  Compliance v2, Environmental Intake v2, Readiness Assessment v2,
  Borrower Onboarding Core v2, Opportunity Discovery v2, Financing
  Pathway Engine v2, Revenue Intelligence v2, Customer Type
  Registry, Capital Graph, environmental-compliance v1,
  portal-borrower-environmental-intake, applications, documents,
  data-rights, evidence packets, audit replay, governance,
  reviews, module readiness.
- **Vol V** — CANON-SOVEREIGNTY-001 tribal-land sovereign review;
  claims governance; controlled disclosure; replay; audit.
- **Vol VI** — public-safe DTO; no live external fetch; no source
  certainty claim.

## Module manifest and event contract

- Module manifest:
  `governance-environmental-risk-assessment-v2`, route
  `/governance/environmental-risk-assessment-v2`, internal
  audience, production-blocked, replay-required, public surface
  disallowed, claimsProfile `advisory-reporting`.
- Event contract:
  `governance.environmental.risk.assessment.v2.composed`,
  RESTRICTED, production-blocked, replay-required, public surface
  disallowed.
- 19 governed handoffs.

## Verification

- `npx tsc --noEmit` — clean.
- `npm run smoke:environmental-risk-assessment-v2` — passed
  (6 scenarios: default DATA_GAP, all-NONE clean, high-risk +
  cleared gate, tribal-land sovereign-closed, 100-year flood +
  REAL_ESTATE, RECORDED contamination + Phase I only).
- `npm run verify:module-manifests` — 94 modules, 84 event
  contracts, 463 handoffs, conformance passed.
- `npm run smoke:replay-cross-module` — passed.
- `npm run smoke:public-surfaces` — passed.
- `npm run smoke:claims-public` — 0 findings.
- `npm run smoke:redaction` — passed.
