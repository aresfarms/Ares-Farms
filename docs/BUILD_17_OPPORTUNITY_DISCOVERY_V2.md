# Build 17 — Opportunity Discovery v2

Opportunity Discovery v2 is the third downstream consumer of the
Universal Capital Graph (Build 13) and the Customer Type Registry
(Build 14), composed on top of Revenue Intelligence v2 (Build 15) and
Financing Pathway Engine v2 (Build 16). It produces a unified,
deterministic, replay-safe, audit-safe, conflict-preserving advisory
opportunity pack that joins:

- Financing Pathway Engine v2 as the authoritative governed source
  for per-customer-type pathway candidates (and therefore Revenue
  Intelligence v2 + Customer Type Registry + Capital Graph + legacy
  v1 revenue + legacy v1 financing-pathway-engine),
- Customer Type review boundary and federation scope,
- Capital Graph sponsor authority and category posture,
- an additive backward-compatibility bridge to the legacy v1
  `evaluateOpportunityDiscovery` runtime, so the existing
  marketplace, market-signal, operating-cost, geo-suitability,
  sellable-catalog, and property-discovery sections continue to
  appear as first-class evidence,
- per-customer-type opportunity cards organized into governed
  sections — `grants_and_programs` (composed pathways promoted from
  v2), `revenue_opportunities`, `equipment_and_marketplace`,
  `market_context`, `geo_suitability`, `sellable_catalog`,
  `property_discovery`, `operating_costs` — each tagged with blocked
  claims, source refs, review route, and conflict signals,
- cross-source conflict signals when (a) legacy v1 surfaces an
  opportunity for a customer type that v2 composition does not
  cover, (b) federation scope mismatches, or (c) v1 returns zero
  cards for a matched customer type.

The runtime is advisory-only, human-review-bound, replay-safe,
audit-safe, federation-scoped, and conflict-preserving. It does not
issue an autonomous customer eligibility determination, autonomous
pathway determination, autonomous opportunity determination, credit
decision, lender commitment, program approval, tax-credit allocation,
environmental clearance, or carbon-credit issuance, and it does not
perform a live external customer / sponsor / source / property fetch
or claim source certainty.

---

## §1 Canonical doctrine

Master Volume governance carried by Opportunity Discovery v2:

- **Vol I — Constitutional Backbone.** Preserves Customer Type
  review boundary, Capital Graph sponsor authority, and legacy v1
  discovery review boundary; the runtime never grants opportunity
  authority and never composes an autonomous opportunity
  determination.
- **Vol II — Regulatory Governance.** Every opportunity card
  inherits the upstream Capital Graph + Customer Type doctrine refs;
  the composed pack is review-bound and not a regulatory
  determination.
- **Vol III — Technical Infrastructure.** Deterministic, replay-safe
  composition with explicit version lineage chaining
  `opportunity-discovery-v2-runtime-v0.1.0` →
  `financing-pathway-engine-v2-runtime-v0.1.0` →
  `revenue-intelligence-v2-runtime-v0.1.0` →
  `customer-type-runtime-v0.1.0` →
  `capital-graph-runtime-v0.1.0` →
  `opportunity-discovery-runtime-v0.1.0` →
  `revenue-source-intelligence-runtime-v0.1.0`.
- **Vol III-B — Governance Runtime.** Runtime evidence with
  classification, observability, explainability, and replay
  verification posture; runtime guard required on the governed API.
- **Vol IV — Operational Runbooks.** Routes governed handoffs to
  Capital Graph, Customer Type Registry, Revenue Intelligence v2,
  Financing Pathway Engine v2, borrower opportunities, revenue
  opportunities, customer revenue, lender workflow, advanced
  intelligence, evidence engine, certification engine, registry
  framework, evidence packets, audit replay, governance, reviews,
  and module readiness.
- **Vol V — Canonical Doctrines.** Preserves claims governance,
  controlled disclosure, replay, audit, portability, and
  advisory-only boundaries.
- **Vol VI — Source Intelligence Integration.** Every composed
  opportunity card remains behind a public-safe DTO; no raw
  borrower, sponsor, or property records; no live external fetch;
  no source-certainty claim.

---

## §2 Architecture

- `src/lib/opportunity/discoveryV2Runtime.ts` — canonical v2
  runtime. Exports
  `OPPORTUNITY_DISCOVERY_V2_RUNTIME_VERSION`,
  `composeOpportunityDiscoveryV2`,
  `opportunityDiscoveryV2Lineage`,
  `OPPORTUNITY_DISCOVERY_V2_DISCLOSURES`, and
  `OPPORTUNITY_DISCOVERY_V2_PRODUCTION_RESTRICTIONS`.
  - Calls `composeFinancingPathwayEngineV2` to derive customer
    profiles + Capital Graph-backed grant cards + legacy v1 pathway
    bridge + cross-source conflicts.
  - Calls v1 `evaluateOpportunityDiscovery` for the same borrower
    context to produce the legacy opportunity sections.
  - For each matched customer type, promotes FPE v2 pathway
    candidates into Capital Graph-backed `grants_and_programs`
    opportunity cards, filters the legacy v1 sections by customer-
    type label / matching-token overlap, and emits cross-source
    conflicts.
- `src/app/api/governance/opportunity-discovery-v2/route.ts` —
  governed POST. Applies `runRuntimeGuard`,
  `evaluateVersionRuntime`, `classifyRecord`,
  `createExplanationLineage`, `createObservabilityEvent`, and
  `persistGovernanceEvidence`. Classification: `RESTRICTED`. Replay
  required. Production blocked.
- `src/app/governance/opportunity-discovery-v2/page.tsx` —
  internal-facing reviewer surface (advisory only).

The v1 runtime is preserved unchanged; the bridge is additive per
AGENTS.md rule 4 (no drift from the current module).

---

## §3 Registry seed

The Opportunity Discovery v2 runtime does not introduce a new
program registry; it composes from the existing Capital Graph
(`CAPITAL_GRAPH_REGISTRY`, 23 programs), Customer Type Registry
(`CUSTOMER_TYPE_REGISTRY`, 20 customer types across 18 archetypes),
Revenue Intelligence v2 composition, Financing Pathway Engine v2
composition, and the v1 opportunity discovery runtime's 8 governed
sections.

Version lineage seal:

| Layer | Version |
| --- | --- |
| Opportunity Discovery v2 | `opportunity-discovery-v2-runtime-v0.1.0` |
| Financing Pathway Engine v2 | `financing-pathway-engine-v2-runtime-v0.1.0` |
| Revenue Intelligence v2 | `revenue-intelligence-v2-runtime-v0.1.0` |
| Customer Type Registry | `customer-type-runtime-v0.1.0` |
| Capital Graph | `capital-graph-runtime-v0.1.0` |
| Legacy v1 opportunity discovery | `opportunity-discovery-runtime-v0.1.0` |
| Legacy v1 revenue-source-intelligence | `revenue-source-intelligence-runtime-v0.1.0` |

---

## §4 Event contract

`governance.opportunity.discovery.v2.composed` —
`src/lib/modules/eventContractRegistry.ts`.

- `classificationLevel`: `RESTRICTED`
- `replayRequired`: `true`
- `productionBlocked`: `true`
- `publicSurfaceAllowed`: `false`
- Payload digest: `customer_profile_count`,
  `total_grant_card_count`, `total_legacy_card_count`,
  `conflict_signal_count`, `cross_source_conflict_count`,
  `sovereign_card_count`, `review_required_count`,
  `missing_information_count`, `federation_gated_count`.

Consumers (seventeen modules) include Financing Pathway Engine v2,
Revenue Intelligence v2, Capital Graph, Customer Type Registry,
customer-revenue, portal revenue opportunities, portal borrower
opportunities, portal borrower financing pathways, lender workflow,
advanced intelligence, evidence engine, certification engine,
registry framework, evidence packets, audit replay, governance,
reviews, and module readiness.

---

## §5 Module integration plan

`governance-opportunity-discovery-v2` (registered in
`src/lib/modules/moduleRegistry.ts`):

- `publicSurfaceAllowed: false`
- `productionBlocked: true`
- `replayRequired: true`
- `audience: ["internal"]`
- `claimsProfile: "advisory-reporting"`
- `eventsPublished`:
  `["governance.opportunity.discovery.v2.composed"]`
- `eventsConsumed`: Financing Pathway Engine v2, Revenue
  Intelligence v2, Capital Graph, Customer Type, registry framework,
  evidence pack, certification posture, governance intelligence
- `adjacentModules`: paired with Financing Pathway Engine v2,
  Revenue Intelligence v2, Capital Graph, Customer Type Registry,
  and every downstream consumer

Eighteen governed handoffs are registered in
`src/lib/modules/handoffMap.ts`, each
`fromModuleId: "governance-opportunity-discovery-v2"`,
`replayRequired: true`, `humanReviewBoundary: true`,
`productionBlocked: true`.

---

## §6 Verification gates

The following must pass before Build 17 is considered shipped:

- `npx tsc --noEmit`
- `npm run smoke:opportunity-discovery-v2`
- `npm run smoke:financing-pathway-engine-v2`
- `npm run smoke:revenue-intelligence-v2`
- `npm run smoke:capital-graph`
- `npm run smoke:customer-type-registry`
- `npm run verify:module-manifests`
- `npm run smoke:public-surfaces`
- `npm run smoke:claims-public`
- `npm run smoke:redaction`
- `npm run smoke:replay-cross-module`
- `npm run build`

CI step `Opportunity Discovery v2` is wired into
`.github/workflows/ci.yml` and gates every push and pull request.

---

## §7 Conformance requirements

- Runtime version must equal
  `opportunity-discovery-v2-runtime-v0.1.0`.
- Composition over Financing Pathway Engine v2 + Revenue
  Intelligence v2 + Capital Graph + Customer Type Registry + legacy
  v1 opportunity discovery must be deterministic and replay-safe;
  conflict signals from every upstream are preserved as first-class
  evidence and never collapsed.
- Sovereign customer types and sovereign programs are visible only
  when sovereign federation participation is named; sovereign grant
  cards under a closed federation are marked `FEDERATION_GATED`.
- Grant card `pathwayStatus` must always be one of
  `REVIEW_REQUIRED`, `MISSING_INFORMATION`, or `FEDERATION_GATED`;
  the status buckets must sum to total grant card count.
- Legacy v1 sections must remain advisory and review-bound; legacy
  entries do not become authoritative through v2 composition.
- Module manifest must remain production-blocked, replay-required,
  audience: internal, public surface disallowed.
- Event contract must remain `RESTRICTED`, replay-required,
  production-blocked, public-surface disallowed.
- ≥ 17 governed handoffs from
  `governance-opportunity-discovery-v2`.
- Every consumer module must register
  `governance.opportunity.discovery.v2.composed` in its
  `eventsConsumed` list.

---

## §8 Build sequence

1. Implement `discoveryV2Runtime.ts` and verify against the
   existing Financing Pathway Engine v2, Revenue Intelligence v2,
   Customer Type Registry, Capital Graph, and v1 opportunity
   discovery runtimes (additive bridge to v1).
2. Wire `src/app/api/governance/opportunity-discovery-v2/route.ts`
   and `src/app/governance/opportunity-discovery-v2/page.tsx`.
3. Register module manifest, event contract, and eighteen handoffs.
4. Add `governance.opportunity.discovery.v2.composed` to every
   consumer module's `eventsConsumed`.
5. Add adjacency for `governance-opportunity-discovery-v2` to every
   paired module's `adjacentModules`.
6. Write `src/scripts/opportunityDiscoveryV2SmokeTest.ts` and
   register `npm run smoke:opportunity-discovery-v2`.
7. Add Opportunity Discovery v2 step to CI.
8. Run verification gates; commit, push, open PR, merge.

---

## §9 Operator instructions (Caitlin)

When Opportunity Discovery v2 is used by a Qualified Governance
Reviewer:

- The runtime composes Financing Pathway Engine v2 + Revenue
  Intelligence v2 + Capital Graph + Customer Type Registry + legacy
  v1 opportunity discovery into one advisory opportunity pack.
- No autonomous decisions are produced; all output is advisory.
- Sovereign customer types and sovereign sponsor programs appear
  only when sovereign federation is explicitly authorized via the
  reviewer toggle; sovereign grant cards under closed federation
  remain visible but are marked `FEDERATION_GATED`.
- Every opportunity card is paired with its upstream FPE v2
  candidate, Capital Graph finding, Customer Type profile, and
  readiness context.
- Cross-source conflicts (federation-scope mismatch, pathway gap,
  legacy v1 coverage gap) are surfaced as first-class evidence and
  never silently collapsed.
- Use the internal page
  `/governance/opportunity-discovery-v2` to inspect a pack; use the
  API `POST /api/governance/opportunity-discovery-v2` for
  programmatic governed composition.
