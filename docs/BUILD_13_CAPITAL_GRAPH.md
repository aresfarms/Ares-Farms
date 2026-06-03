# Build 13 — Universal Capital Graph

Implemented: 2026-06-02

Status: Complete as the constitutional funding backbone for Ares/Furlong. Review-bound and not production-live. Internal advisory evidence only — no autonomous lending decision, program approval, public verification, regulatory reliance, lender commitment, tax-credit allocation, environmental clearance, carbon-credit issuance, payment authorization, live external action, or legal reliance is created. Sovereign sponsor programs are gated behind named federation participant review.

This is the foundation for future Customer Type Registry and Revenue Intelligence builds. Downstream surfaces (financing pathway engine, opportunity discovery, advanced intelligence, lender workflow, revenue intelligence, customer-revenue) will be re-wired to consume the Capital Graph through governed `governance.capital.graph.composed` events in separate maintenance builds; this Build does not modify those surfaces.

---

## 1. Canonical Doctrine

The Universal Capital Graph is canonical infrastructure. It composes the canonical capital taxonomy, the canonical CapitalProgram registry, the eligibility evaluator, and the pathway matcher into deterministic, replay-safe, audit-safe, conflict-preserving advisory evidence.

### Governing principles

| Principle | Source | Enforcement in runtime |
|---|---|---|
| Advisory-only | Vol V (Canonical Doctrines) | `advisoryOnly`, `noAutonomousLending`, `noProgramApproval` flags; blocked-claim catalog on every program |
| Human-review-bound | Vol III-B (Governance Runtime) | `humanReviewRequired` flag; every output routes to a `reviewRoute` |
| No autonomous lending | Vol I (Constitutional Backbone) | Hard runtime flag; smoke-asserted |
| Replay-safe | Vol III (Technical Infrastructure) | `replaySafe` flag; `replayPosture: "REPLAY_SAFE"` per program; deterministic composition |
| Audit-safe | Vol III-B | `auditSafe` flag; `auditPosture: "AUDIT_ANCHORED"` per program; replay refs on every entry |
| Federated architecture | Vol I + Vol VI | `federationScope: "SOVEREIGN" \| "PARTICIPANT" \| "PUBLIC"` per program; sovereign programs gated behind `sovereignFederationAllowed` |
| Conflict preservation | Vol III + Vol V | Stacking and conflict rules preserved as first-class evidence; never collapsed into a single authoritative claim |
| Source authority | Vol VI (Source Intelligence Integration) | Sponsor authority named per program; no live external fetch; no source-certainty claim |

### Canonical capital taxonomy (23 categories)

USDA · SBA · FSA · REAP · Community Facilities · CDFI · New Markets Tax Credits · Opportunity Zones · Historic Tax Credits · Energy Credits · Utility Incentives · State Incentive Programs · Municipal Incentives · Workforce Programs · Foundation Grants · Philanthropic Funding · Environmental Markets · Carbon Markets · Private Lending · Conventional Banking · Equipment Financing · Vendor Financing · Revenue-Based Financing

Each category in `CAPITAL_CATEGORY_GOVERNANCE` carries: `id`, `label`, `description`, `sponsorTypes`, `defaultRegulatoryDomain`, `doctrineRefs` (Vol I/II/IV/V minimum), and `blockedClaims`.

### Doctrine mappings

| Volume | Capital Graph enforcement |
|---|---|
| **Vol I (Constitutional Backbone)** | Each program names its qualified sponsor authority. The runtime never claims constitutional authority or autonomous capital allocation. `noAutonomousLending` flag is hard-coded. |
| **Vol II (Regulatory Governance)** | Every program carries jurisdiction, `defaultRegulatoryDomain`, prohibited-use posture, and blocked-claim catalog. Matching is review-bound; no regulatory determination is made. |
| **Vol III (Technical Infrastructure)** | Deterministic, replay-safe composition over the canonical taxonomy and registry. `replaySafe` flag and `replayPosture` field on every program. |
| **Vol III-B (Governance Runtime)** | Runtime guard, classification (RESTRICTED), version lineage, observability, explainability, replay verification, and audit-safe error envelope on the API. `humanReviewRequired` flag. |
| **Vol IV (Operational Runbooks)** | Routes governed handoffs to sponsor review, controlled promotion, and the downstream consumer modules. Each program has a `reviewRoute`. |
| **Vol V (Canonical Doctrines)** | Preserves claims governance, source authority, controlled disclosure, replay, audit, portability, and advisory-only boundaries on every program and pathway. Each program carries `CANON-CLAIMS-001` reference. |
| **Vol VI (Source Intelligence Integration)** | Every program registry entry is behind a public-safe DTO with classification filtering and redaction; no raw sponsor records, no live external fetch, no source-certainty claim. `federationScope` governs sovereign-vs-participant-vs-public visibility. |

---

## 2. Architecture Specification

### Runtime module

`src/lib/capital-graph/capitalGraphRuntime.ts` — exports:

- `CAPITAL_GRAPH_RUNTIME_VERSION` (string) — version lineage anchor.
- `CapitalCategoryId` (string union) — 23 canonical category enum.
- `CapitalSponsorType` (string union) — sponsor archetype enum.
- `CapitalCategoryGovernance` (type) — per-category governance metadata.
- `CAPITAL_CATEGORY_GOVERNANCE` (array) — canonical taxonomy registry.
- `CapitalProgram` (type) — canonical program object model.
- `CAPITAL_GRAPH_REGISTRY` (array) — canonical CapitalProgram registry seed.
- `CapitalEligibilityInput` / `CapitalEligibilityFinding` / `CapitalEligibilityResult` — eligibility evaluator types.
- `evaluateCapitalEligibility(input, registry?)` — deterministic eligibility evaluator.
- `CapitalPathwayCandidate` — pathway matcher type.
- `CapitalGraphInput` / `CapitalGraphSummary` / `CapitalGraphResult` — runtime composition types.
- `composeCapitalGraph(input)` — runtime composition entry point.
- `CAPITAL_GRAPH_DISCLOSURES` / `CAPITAL_GRAPH_PRODUCTION_RESTRICTIONS` — canonical disclosure constants.
- `capitalGraphLineage()` — version-lineage helper for downstream runtimes.

### API route

`src/app/api/governance/capital-graph/route.ts` — governed POST. Runtime guard (`RESTRICTED`), version lineage, classification (input + output), explainability (`audience: "governance"`, `claimType: "recommendation"`, `humanReviewRequired: true`), observability, replay verification, and evidence persistence. Audit-safe error envelope.

### Internal surface

`src/app/governance/capital-graph/page.tsx` — internal-facing surface with reviewer-role input, federation toggle, eligibility scope (customer types, intended uses, jurisdiction, utility territory, sovereign-federation authorization), pack summary, taxonomy view, pathway candidates with inline conflict preservation, unreviewed eligibility findings, recommended review routes, disclosures, and governance evidence display.

---

## 3. Registry Specification

### `CAPITAL_CATEGORY_GOVERNANCE`

All 23 categories enumerated. Each entry carries:

```
{
  id: CapitalCategoryId,
  label: string,
  description: string,
  sponsorTypes: CapitalSponsorType[],
  defaultRegulatoryDomain: string,
  doctrineRefs: string[],  // Vol I, Vol II, Vol IV, Vol V minimum
  blockedClaims: string[],
}
```

### `CAPITAL_GRAPH_REGISTRY`

Seeded with one canonical, review-bound program per category. Each `CapitalProgram` carries:

```
{
  programId: string,                          // e.g. "cap-usda-specialty-crop"
  programName: string,                        // canonical sponsor name
  categoryId: CapitalCategoryId,
  sponsorType: CapitalSponsorType,
  sponsorAuthority: string,                   // named human authority
  jurisdiction: string[],                     // federal / state / county / utility / sponsor-defined
  eligibleCustomerTypes: string[],
  eligibleUses: string[],
  prohibitedUses: string[],
  stackingRules: string[],                    // preserved for conflict-preserving review
  conflictRules: string[],                    // preserved for conflict-preserving review
  deadlineProfile: string,                    // review-required cycle language
  sourceRefs: string[],                       // source authority refs (DTO-safe)
  replayRefs: string[],                       // replay verification anchors
  doctrineRefs: string[],                     // Vol I/II/IV/V minimum
  classificationLevel: "PUBLIC" | "INTERNAL" | "CONFIDENTIAL",
  replayPosture: "REPLAY_SAFE" | "REVIEW_REQUIRED",
  auditPosture: "AUDIT_ANCHORED" | "REVIEW_REQUIRED",
  federationScope: "SOVEREIGN" | "PARTICIPANT" | "PUBLIC",
  blockedClaims: string[],
  reviewRoute: string,                        // canonical: /governance/capital-graph
  programVersion: string,                     // versioned program identifier
}
```

The seed registry adds programs across all 23 categories. Each program is governed translation-layer evidence — it names the sponsor authority, jurisdiction, eligibility, and doctrine refs without performing a live external sponsor fetch and without authorizing an award or commitment.

---

## 4. Event Contract Specification

### `governance.capital.graph.composed`

| Field | Value |
|---|---|
| Producer module | `governance-capital-graph` |
| Consumer modules | `portal-borrower-financing-pathways`, `portal-borrower-opportunities`, `portal-revenue-opportunities`, `customer-revenue`, `lender-workflow`, `governance-advanced-intelligence`, `governance-evidence-engine`, `governance-certification-engine`, `governance-registry-framework`, `governance-connector-certification`, `evidence-packets`, `audit-replay`, `governance`, `reviews`, `module-readiness` |
| Classification | `RESTRICTED` |
| Replay required | `true` |
| Public-surface allowed | `false` |
| Production blocked | `true` |
| Payload fields | `application_id`, `category_count`, `program_count`, `matched_program_count`, `pathway_candidate_count`, `conflict_signal_count`, `sovereign_program_count`, `human_review_required`, `replay_ref` |
| Purpose | Record canonical Capital Graph composition posture and route review-bound handoffs without autonomous lending decision, program approval, public verification, regulatory reliance, lender commitment, tax-credit allocation, environmental clearance, carbon-credit issuance, payment authorization, live external action, or legal reliance. |

---

## 5. Module Integration Plan

### Handoffs (15)

`governance-capital-graph` → each of: `portal-borrower-financing-pathways`, `portal-borrower-opportunities`, `portal-revenue-opportunities`, `customer-revenue`, `lender-workflow`, `governance-advanced-intelligence`, `governance-evidence-engine`, `governance-certification-engine`, `governance-registry-framework`, `governance-connector-certification`, `evidence-packets`, `audit-replay`, `governance`, `reviews`, `module-readiness`.

Each handoff carries `eventType: "governance.capital.graph.composed"`, `replayRequired: true`, `humanReviewBoundary: true`, `productionBlocked: true`.

### Downstream module ownership

| Module | Role with Capital Graph |
|---|---|
| `portal-borrower-financing-pathways` | Consumer; future maintenance build will rewire its pathway candidates from `PROGRAM_GRAPH` to the canonical `CAPITAL_GRAPH_REGISTRY`. |
| `portal-borrower-opportunities` / `portal-revenue-opportunities` | Consumer; future maintenance build will incorporate Capital Graph pathway candidates into the opportunities surface. |
| `customer-revenue` | Consumer; future Revenue Intelligence build will compose Capital Graph posture against customer-type eligibility. |
| `lender-workflow` | Consumer; future lender coordination build will surface Capital Graph pathway candidates on per-application coordination cards. |
| `governance-advanced-intelligence` | Consumer; future maintenance build will surface Capital Graph pathway intelligence as a sixth intelligence domain. |
| `governance-evidence-engine` | Consumer; Capital Graph composed events feed evidence pack composition. |
| `governance-certification-engine` | Consumer; Capital Graph composition contributes a future certification domain. |
| `governance-registry-framework` | Consumer; the Capital Graph Registry becomes a future framework catalog entry. |
| `governance-connector-certification` | Consumer; future certification build will pair Capital Graph sponsor authority with connector certification posture. |
| `evidence-packets`, `audit-replay`, `governance`, `reviews`, `module-readiness` | Consumers for evidence persistence, audit replay, governance posture, human review routing, and readiness composition. |

---

## 6. Verification Gates

Required verification for this Build:

- `npm run smoke:capital-graph` (asserts 23 canonical categories, registry seed coverage per category, replay/audit posture, doctrine refs, eligibility determinism, sovereign-federation gating, scoped composition, registry/contract/handoff conformance)
- `npm run smoke:advanced-intelligence`
- `npm run smoke:connector-certification`
- `npm run smoke:registry-framework`
- `npm run smoke:certification-engine`
- `npm run smoke:governance-evidence-engine`
- `npm run smoke:lender-workflow`
- `npm run smoke:public-trust`
- `npm run smoke:opportunity-discovery`
- `npm run smoke:environmental-intake`
- `npm run smoke:readiness-assessment`
- `npm run smoke:financing-pathway-engine`
- `npm run smoke:borrower-onboarding-core`
- `npm run verify:module-manifests`
- `npm run smoke:public-surfaces`
- `npm run smoke:claims-public`
- `npm run smoke:redaction`
- `npx tsc --noEmit`
- `npm run build`
- CI run on the canonical branch (added to `.github/workflows/ci.yml`)

---

## 7. Conformance Requirements

The Capital Graph remains review-bound until each of the following is independently approved by named human authority:

- **No autonomous lending** — Constitutional Authority and Reliance Authority must independently approve before any lending decision can leave the runtime.
- **Sovereign-federation visibility** — sovereign sponsor programs require named sovereign participant review before they can appear as `matched` in any borrower-context output.
- **External promotion** — Capital Graph evidence remains internal evidence unless separately promoted through governed controlled-promotion gates.
- **Tax-credit allocation, environmental clearance, carbon-credit issuance** — every program in the registry blocks these claims; only the named sponsor authority (CDFI Fund / CDE / IRS / NPS / USACE / approved registry) can clear them through the runbooks named in `doctrineRefs`.

---

## 8. Build Sequence for Implementation

Build 13 lands as a single coherent module. The downstream rewires (Build 14 onward) are NOT part of this Build per AGENTS.md rule 4 (no drift from current module). Their suggested sequence is:

1. **Build 14 — Customer Type Registry**: builds a canonical customer-type taxonomy and matches it against Capital Graph eligibility. Will introduce `governance.customer.type.composed` event and rewire the financing pathway engine to consume both events.
2. **Build 15 — Revenue Intelligence v2**: rewrites `src/lib/revenue-intelligence/revenueSourceIntelligenceRuntime.ts` to consume the canonical Capital Graph instead of the placeholder `PROGRAM_GRAPH`. Preserves backward compatibility through a compatibility bridge.
3. **Build 16 — Capital Graph DTO Promotion**: introduces public-safe Capital Graph DTOs behind controlled-promotion review for selected public categories.
4. **Build 17 — Capital Graph Sponsor Connector Promotion**: pairs Capital Graph sponsor authority with connector certification posture for selected sponsors who have completed Source Promotion Authority, Controlled Promotion Board, and Live Scraper Activation Gate review.
5. **Build 18 — Capital Graph Advanced Intelligence Domain**: surfaces Capital Graph as a sixth intelligence domain in the Advanced Intelligence module with conflict-preserving sponsor-disagreement evidence.

Each subsequent build remains gated behind named human authority approval.

---

## 9. Next Sequence

The Capital Graph is the constitutional funding backbone. Downstream sequencing (Build 14 onward) is now governed by the Capital Graph's federation scope, sponsor authority registry, and human-review gates. No downstream build can autonomously bypass these gates.
