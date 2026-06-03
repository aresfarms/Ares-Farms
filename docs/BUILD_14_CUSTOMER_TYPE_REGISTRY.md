# Build 14 — Customer Type Registry

Implemented: 2026-06-02

Status: Complete as the borrower-side canonical taxonomy paired with the Universal Capital Graph (Build 13). Review-bound and not production-live. Internal advisory evidence only — no autonomous customer eligibility determination, credit decision, lender commitment, public verification, regulatory reliance, tax-credit allocation, environmental clearance, carbon-credit issuance, payment authorization, live external action, or legal reliance is created. Sovereign customer types require named federation participation.

This Build adds the Customer Type Registry as a *new* canonical module. It does NOT rewrite the existing `evaluateFinancingPathways`, `revenueSourceIntelligenceRuntime`, or any other consumer's internal logic — those rewires are governed by AGENTS.md rule 4 (no drift from current module) and remain scheduled for separate maintenance builds.

---

## 1. Canonical Doctrine

The Customer Type Registry is the borrower-side counterpart to the Capital Graph. Together they form the canonical eligibility matrix: **Customer Type × Capital Category → Review-bound eligibility posture.**

### Governing principles

| Principle | Source | Enforcement in runtime |
|---|---|---|
| Advisory-only | Vol V (Canonical Doctrines) | `advisoryOnly`, `noAutonomousEligibility`, `noAutonomousLending` flags |
| Human-review-bound | Vol III-B (Governance Runtime) | `humanReviewRequired` flag; every customer type carries an explicit `reviewBoundary` string and `reviewRoute` |
| No autonomous eligibility | Vol I (Constitutional Backbone) | Hard runtime flag; smoke-asserted |
| Replay-safe | Vol III (Technical Infrastructure) | `replaySafe` flag; deterministic composition |
| Audit-safe | Vol III-B | `auditSafe` flag; replay refs and traceable evidence |
| Federated architecture | Vol I + Vol VI | `federationScope: "SOVEREIGN" \| "PARTICIPANT" \| "PUBLIC"` per type; sovereign types gated behind `sovereignFederationAllowed` |
| Conflict preservation | Vol III + Vol V | Conflict signals preserved per profile when eligibility spans many categories or mixed federation scopes |
| Source authority | Vol VI (Source Intelligence Integration) | Review boundary names the qualifying authority (FSA, IRS, SBA, NPS, USACE, etc.); no live external fetch |

### Canonical customer-type taxonomy (18 archetypes)

`AGRICULTURAL_PRODUCER` · `RURAL_SMALL_BUSINESS` · `AGRITOURISM_OPERATOR` · `UTILITY_CUSTOMER` · `COMMUNITY_FACILITY_SPONSOR` · `HISTORIC_PRESERVATION_OWNER` · `OPPORTUNITY_ZONE_BUSINESS` · `WORKFORCE_DEVELOPMENT_EMPLOYER` · `FOUNDATION_RECIPIENT` · `COOPERATIVE` · `NONPROFIT` · `TRIBAL_NATION` · `VETERAN_OWNED_BUSINESS` · `WOMEN_OWNED_BUSINESS` · `MINORITY_OWNED_BUSINESS` · `ENVIRONMENTAL_MARKET_PARTICIPANT` · `CARBON_MARKET_PARTICIPANT` · `MISSION_ALIGNED_BORROWER`

Seeded with 20 canonical customer types covering all 18 archetypes (the `AGRICULTURAL_PRODUCER` archetype has three subtypes: general agricultural producer, beginning farmer, rancher).

### Doctrine mappings

| Volume | Customer Type Registry enforcement |
|---|---|
| **Vol I (Constitutional Backbone)** | Each customer type carries an explicit `reviewBoundary` that names the qualified human authority (FSA, IRS, SBA, NPS, USACE, tribal nation, foundation sponsor, etc.). The runtime never claims constitutional authority or autonomous eligibility determination. |
| **Vol II (Regulatory Governance)** | Every customer type carries `requiredDocumentation`, `consentRequirements`, and a blocked-claim catalog including regulatory determinations specific to its archetype (small-business size, beginning-farmer status, MBE/WOSB/SDVOSB certification, QOZ business determination, etc.). |
| **Vol III (Technical Infrastructure)** | Deterministic, replay-safe composition. `replaySafe` flag and `customerTypeVersion` field on every type. |
| **Vol III-B (Governance Runtime)** | Runtime guard, classification (RESTRICTED), version lineage, observability, explainability, replay verification, and audit-safe error envelope on the API. `humanReviewRequired` flag. |
| **Vol IV (Operational Runbooks)** | Routes governed handoffs to the Capital Graph, financing pathway guidance, opportunity discovery, advanced intelligence, evidence engine, certification engine, registry framework, governance, reviews, and module readiness. Each type has a `reviewRoute`. |
| **Vol V (Canonical Doctrines)** | Preserves claims governance, source authority, controlled disclosure, replay, audit, portability, and advisory-only boundaries on every customer type and matched profile. Each type carries `CANON-CLAIMS-001` reference. |
| **Vol VI (Source Intelligence Integration)** | Every customer-type registry entry is behind a public-safe DTO with classification filtering and redaction. Sovereign-scope types are gated to named federation participants only. |

---

## 2. Architecture Specification

### Runtime module

`src/lib/customer-types/customerTypeRuntime.ts` — exports:

- `CUSTOMER_TYPE_RUNTIME_VERSION` (string) — version lineage anchor.
- `CustomerArchetype` (string union) — 18 canonical archetype enum.
- `CustomerTypeFederationScope` (string union) — federation enum.
- `CustomerType` (type) — canonical customer-type object model.
- `CUSTOMER_TYPE_REGISTRY` (array) — canonical seed registry.
- `CustomerTypeInput` / `CustomerTypeMatchSignal` / `CustomerTypeEligibilityCapitalRef` / `CustomerTypeProfile` / `CustomerTypeSummary` / `CustomerTypeResult` — runtime types.
- `composeCustomerTypeRegistry(input)` — runtime composition entry point.
- `CUSTOMER_TYPE_DISCLOSURES` / `CUSTOMER_TYPE_PRODUCTION_RESTRICTIONS` — canonical disclosure constants.
- `customerTypeRegistryLineage()` — version-lineage helper paired with Capital Graph lineage.

### API route

`src/app/api/governance/customer-types/route.ts` — governed POST. Runtime guard (`RESTRICTED`), version lineage (chains Customer Type runtime to Capital Graph runtime), classification (input + output), explainability (`audience: "governance"`, `claimType: "recommendation"`, `humanReviewRequired: true`), observability, replay verification, evidence persistence. Audit-safe error envelope.

### Internal surface

`src/app/governance/customer-types/page.tsx` — internal-facing surface with reviewer-role input, declared types, jurisdiction (federal + state), sovereign-federation toggle, pack summary, matched-profile cards (showing eligible capital refs and preserved conflict signals), unmatched canonical types catalog, recommended review routes, disclosures, and governance evidence display.

---

## 3. Registry Specification

### `CUSTOMER_TYPE_REGISTRY`

Each `CustomerType` carries:

```
{
  typeId: string,                                    // e.g. "ct-beginning-farmer"
  archetype: CustomerArchetype,
  label: string,
  description: string,
  matchingTokens: string[],                          // tokens used by the matcher
  eligibleCapitalCategories: CapitalCategoryId[],    // Capital Graph cross-ref
  requiredDocumentation: string[],
  consentRequirements: string[],
  reviewBoundary: string,                            // names qualified human authority
  classificationLevel: "PUBLIC" | "INTERNAL" | "CONFIDENTIAL",
  federationScope: "SOVEREIGN" | "PARTICIPANT" | "PUBLIC",
  doctrineRefs: string[],                            // Vol I/II/IV/V minimum
  blockedClaims: string[],
  reviewRoute: string,                               // canonical: /governance/customer-types
  customerTypeVersion: string,                       // versioned identifier
}
```

The seed registry covers all 18 archetypes with 20 canonical entries. Each customer type is a governed translation-layer entry — it names the review boundary, eligibility, and doctrine refs without performing a live external fetch and without certifying customer status.

### Cross-reference to Capital Graph

Each customer type's `eligibleCapitalCategories` references the canonical `CapitalCategoryId` taxonomy from Build 13. The runtime composes each matched profile's `eligibleCapitalRefs` by filtering `CAPITAL_GRAPH_REGISTRY` to those categories, preserving program `federationScope` for each ref.

---

## 4. Event Contract Specification

### `governance.customer.type.composed`

| Field | Value |
|---|---|
| Producer module | `governance-customer-type-registry` |
| Consumer modules | `governance-capital-graph`, `portal-borrower-financing-pathways`, `portal-borrower-opportunities`, `portal-revenue-opportunities`, `customer-revenue`, `lender-workflow`, `governance-advanced-intelligence`, `governance-evidence-engine`, `governance-certification-engine`, `governance-registry-framework`, `evidence-packets`, `audit-replay`, `governance`, `reviews`, `module-readiness` |
| Classification | `RESTRICTED` |
| Replay required | `true` |
| Public-surface allowed | `false` |
| Production blocked | `true` |
| Payload fields | `application_id`, `archetype_count`, `customer_type_count`, `matched_type_count`, `total_eligible_capital_ref_count`, `conflict_signal_count`, `sovereign_type_count`, `human_review_required`, `replay_ref` |
| Purpose | Record canonical Customer Type Registry composition posture and route review-bound handoffs without autonomous customer eligibility determination, credit decision, lender commitment, public verification, regulatory reliance, tax-credit allocation, environmental clearance, carbon-credit issuance, payment authorization, live external action, or legal reliance. |

---

## 5. Module Integration Plan

### Handoffs (15)

`governance-customer-type-registry` → each of: `governance-capital-graph`, `portal-borrower-financing-pathways`, `portal-borrower-opportunities`, `portal-revenue-opportunities`, `customer-revenue`, `lender-workflow`, `governance-advanced-intelligence`, `governance-evidence-engine`, `governance-certification-engine`, `governance-registry-framework`, `evidence-packets`, `audit-replay`, `governance`, `reviews`, `module-readiness`.

Each handoff: `eventType: "governance.customer.type.composed"`, `replayRequired: true`, `humanReviewBoundary: true`, `productionBlocked: true`.

### Customer Type ↔ Capital Graph pairing

The Customer Type Registry and Capital Graph form a pair. They both:

- Live in the same `governance` route group (`/governance/customer-types` and `/governance/capital-graph`).
- Carry the same federation-scope semantics (`SOVEREIGN` / `PARTICIPANT` / `PUBLIC`).
- Share doctrine refs (Vol I–VI mapped per entry).
- Cross-reference each other (customer type → Capital Graph categories; Capital Graph → customer-type eligibility tokens via downstream events).
- Are gated behind named federation participation for sovereign-scope entries.

### Downstream module ownership

| Module | Role with Customer Type Registry |
|---|---|
| `governance-capital-graph` | Paired consumer; future Build 15 will fuse the two into combined eligibility evidence. |
| `portal-borrower-financing-pathways` | Consumer; future maintenance build will use customer-type signals to scope program graph matching. |
| `portal-borrower-opportunities` / `portal-revenue-opportunities` | Consumer; future maintenance build will surface customer-type-matched opportunities. |
| `customer-revenue` | Consumer; Revenue Intelligence build composes customer-type posture against revenue opportunities. |
| `lender-workflow` | Consumer; future lender coordination build will surface customer-type profiles on per-application coordination cards. |
| `governance-advanced-intelligence` | Consumer; future maintenance build will compose customer-type intelligence as an additional domain. |
| `governance-evidence-engine` / `governance-certification-engine` / `governance-registry-framework` | Consumer; customer-type composition feeds evidence pack composition, certification, and registry framework. |
| `evidence-packets`, `audit-replay`, `governance`, `reviews`, `module-readiness` | Consumers for evidence persistence, audit replay, governance posture, human review routing, and readiness composition. |

---

## 6. Verification Gates

Required verification for this Build:

- `npm run smoke:customer-type-registry` (asserts 18 canonical archetypes, registry coverage, doctrine refs, replay/audit/review-boundary posture, eligibility cross-reference to canonical Capital Graph categories, sovereign-federation gating, default-no-declared-types posture, archetype scoping, registry/contract/handoff conformance)
- `npm run smoke:capital-graph`
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

The Customer Type Registry remains review-bound until each of the following is independently approved by named human authority:

- **No autonomous eligibility** — Constitutional Authority and Reliance Authority must independently approve before any customer-type signal can be treated as a determination.
- **Sovereign-federation visibility** — sovereign customer types (e.g. federally recognized tribes) require named sovereign participant review before they can appear as `matched` in any borrower-context output.
- **Regulatory determination boundaries** — beginning-farmer status, small-business size, VOSB/SDVOSB, WOSB/EDWOSB, MBE/DBE, QOZ business, certified historic structure, NMTC-eligible business, essential-community-facility, utility-territory eligibility, and workforce-program eligibility all remain regulatory determinations retained by the named human authorities listed in each customer type's `reviewBoundary`.
- **Tribal sovereign consent** — `ct-tribal-nation` carries `tribal-sovereign-consent` as a required consent. The runtime never binds sovereign authority.

---

## 8. Build Sequence for Implementation

Build 14 lands as a single coherent module. Downstream rewires (Build 15 onward) are NOT part of this Build per AGENTS.md rule 4. The suggested sequence:

1. **Build 15 — Revenue Intelligence v2**: rewrites `src/lib/revenue-intelligence/revenueSourceIntelligenceRuntime.ts` to consume both the canonical Capital Graph and Customer Type Registry. Preserves backward compatibility through a compatibility bridge.
2. **Build 16 — Financing Pathway Engine v2**: rewrites `src/lib/financing/pathwayEngine.ts` to consume both events and compose pathways from the canonical Capital Graph × Customer Type matrix instead of the placeholder `PROGRAM_GRAPH`.
3. **Build 17 — Public DTO Promotion**: introduces public-safe Customer Type and Capital Graph DTOs behind controlled-promotion review for selected public archetypes and categories.
4. **Build 18 — Lender Coordination v2**: rewires `src/lib/lender/workflowRuntime.ts` to surface customer-type profiles and Capital Graph pathway candidates per application.
5. **Build 19 — Customer Type Advanced Intelligence Domain**: surfaces Customer Type Registry as an additional intelligence domain in the Advanced Intelligence module with conflict-preserving customer-type-disagreement evidence.

Each subsequent build remains gated behind named human authority approval.

---

## 9. Next Sequence

The Customer Type Registry is the borrower-side counterpart to the Capital Graph. Together they form the canonical eligibility matrix that future Revenue Intelligence and Financing Pathway builds will consume. No downstream build can autonomously bypass the federation-scope gates or the named review boundaries.
