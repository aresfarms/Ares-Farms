# Build 19 — Advanced Intelligence v2

Advanced Intelligence v2 is the fifth downstream consumer of the
Universal Capital Graph (Build 13) and the Customer Type Registry
(Build 14), composed on top of Revenue Intelligence v2 (Build 15),
Financing Pathway Engine v2 (Build 16), Opportunity Discovery v2
(Build 17), and Lender Workflow v2 (Build 18). It composes a
unified, deterministic, replay-safe, audit-safe, conflict-preserving
advisory intelligence pack that joins:

- The legacy v1 `evaluateAdvancedIntelligence` runtime (source,
  revenue, market, geospatial, pathway intelligence — 5 domains)
  preserved as an additive compatibility bridge.
- Four new v2 governed intelligence domains derived from the
  canonical stack:
  - `customer_type_intelligence` — per-customer-type posture
    (archetype, federation scope, eligible capital categories),
  - `capital_program_intelligence` — per-program sponsor authority,
    federation, capital category, fit score signals,
  - `pathway_v2_intelligence` — Revenue Intelligence v2 composition
    posture, conflict signals, cross-source conflicts, capital
    pathway summary,
  - `lender_coordination_intelligence` — Lender Workflow v2 handoff
    summary (application-scoped composition deferred to LWF v2).
- Cross-source conflict signals when (a) v1 returns zero insights
  while v2 returned customer profiles, (b) v2 returned zero
  profiles while v1 returned insights, or (c) upstream Revenue
  Intelligence v2 surfaced cross-source conflicts that propagate
  into v2 evidence.

The runtime is advisory-only, human-review-bound, replay-safe,
audit-safe, federation-scoped, and conflict-preserving. It does not
issue an autonomous intelligence determination, customer eligibility
determination, pathway determination, opportunity determination,
credit decision, lender commitment, program approval, tax-credit
allocation, environmental clearance, or carbon-credit issuance, and
it does not perform a live external fetch or claim source certainty.

---

## §1 Canonical doctrine

Master Volume governance carried by Advanced Intelligence v2:

- **Vol I — Constitutional Backbone.** Keeps advanced intelligence
  subordinate to constitutional authority; the runtime never grants
  intelligence authority and never composes an autonomous
  determination.
- **Vol II — Regulatory Governance.** Composed intelligence inherits
  upstream Capital Graph + Customer Type + Revenue / Pathway /
  Opportunity / Lender doctrine refs; review-bound, not regulatory
  determination.
- **Vol III — Technical Infrastructure.** Deterministic, replay-safe
  composition with explicit version lineage chaining
  `advanced-intelligence-v2-runtime-v0.1.0` →
  `lender-workflow-v2-runtime-v0.1.0` →
  `opportunity-discovery-v2-runtime-v0.1.0` →
  `financing-pathway-engine-v2-runtime-v0.1.0` →
  `revenue-intelligence-v2-runtime-v0.1.0` →
  `customer-type-runtime-v0.1.0` →
  `capital-graph-runtime-v0.1.0` →
  `advanced-intelligence-runtime-v0.1.0`.
- **Vol III-B — Governance Runtime.** Runtime evidence with
  classification, observability, explainability, and replay
  verification posture; runtime guard required on the governed API.
- **Vol IV — Operational Runbooks.** Routes governed handoffs to
  Lender Workflow v2, Opportunity Discovery v2, Financing Pathway
  Engine v2, Revenue Intelligence v2, Customer Type Registry,
  Capital Graph, legacy v1 advanced intelligence, customer revenue,
  revenue opportunities, borrower opportunities, financing pathways,
  lender workflow, evidence engine, certification engine, registry
  framework, evidence packets, audit replay, governance, reviews,
  and module readiness.
- **Vol V — Canonical Doctrines.** Preserves claims governance,
  controlled disclosure, replay, audit, portability, and
  advisory-only boundaries.
- **Vol VI — Source Intelligence Integration.** Every composed
  insight remains behind a public-safe DTO; no raw borrower /
  sponsor / property records; no live external fetch; no
  source-certainty claim.

---

## §2 Architecture

- `src/lib/intelligence/advancedIntelligenceV2Runtime.ts` —
  canonical v2 runtime. Exports
  `ADVANCED_INTELLIGENCE_V2_RUNTIME_VERSION`,
  `composeAdvancedIntelligenceV2`,
  `advancedIntelligenceV2Lineage`,
  `ADVANCED_INTELLIGENCE_V2_DOMAIN_IDS`,
  `ADVANCED_INTELLIGENCE_V2_DISCLOSURES`, and
  `ADVANCED_INTELLIGENCE_V2_PRODUCTION_RESTRICTIONS`.
  - Calls `composeRevenueIntelligenceV2` to derive customer
    profiles + Capital Graph-backed composed programs + legacy
    revenue bridge + cross-source conflicts at the borrower-context
    scope.
  - Calls v1 `evaluateAdvancedIntelligence` for the legacy 5-domain
    compatibility bridge.
  - Builds 4 v2 governed domains (customer_type_intelligence,
    capital_program_intelligence, pathway_v2_intelligence,
    lender_coordination_intelligence) with replay-safe signals and
    upstream doctrine refs.
  - Emits cross-source conflicts for v1/v2 coverage divergence and
    upstream RI v2 conflict propagation.
- `src/app/api/governance/advanced-intelligence-v2/route.ts` —
  governed POST. Applies `runRuntimeGuard`,
  `evaluateVersionRuntime`, `classifyRecord`,
  `createExplanationLineage`, `createObservabilityEvent`, and
  `persistGovernanceEvidence`. Classification: `RESTRICTED`. Replay
  required. Production blocked.
- `src/app/governance/advanced-intelligence-v2/page.tsx` —
  internal-facing reviewer surface (advisory only).

The v1 runtime is preserved unchanged; the bridge is additive per
AGENTS.md rule 4.

---

## §3 Registry seed

The Advanced Intelligence v2 runtime does not introduce a new
program registry. It composes from the existing Capital Graph
(23 programs), Customer Type Registry (20 customer types), Revenue
Intelligence v2 composition, the v1 advanced-intelligence runtime
(5 domains, 20+ insight signals), and the v1 source-authority
registry.

Version lineage seal:

| Layer | Version |
| --- | --- |
| Advanced Intelligence v2 | `advanced-intelligence-v2-runtime-v0.1.0` |
| Lender Workflow v2 | `lender-workflow-v2-runtime-v0.1.0` |
| Opportunity Discovery v2 | `opportunity-discovery-v2-runtime-v0.1.0` |
| Financing Pathway Engine v2 | `financing-pathway-engine-v2-runtime-v0.1.0` |
| Revenue Intelligence v2 | `revenue-intelligence-v2-runtime-v0.1.0` |
| Customer Type Registry | `customer-type-runtime-v0.1.0` |
| Capital Graph | `capital-graph-runtime-v0.1.0` |
| Legacy v1 advanced intelligence | `advanced-intelligence-runtime-v0.1.0` |

---

## §4 Event contract

`governance.advanced.intelligence.v2.composed` —
`src/lib/modules/eventContractRegistry.ts`.

- `classificationLevel`: `RESTRICTED`
- `replayRequired`: `true`
- `productionBlocked`: `true`
- `publicSurfaceAllowed`: `false`
- Payload digest: `v2_domain_count`, `v1_domain_count`,
  `total_insight_count`, `v2_insight_count`, `v1_insight_count`,
  `conflict_count`, `cross_source_conflict_count`,
  `customer_type_coverage_count`,
  `capital_program_coverage_count`.

Consumers include Lender Workflow v2, Opportunity Discovery v2,
Financing Pathway Engine v2, Revenue Intelligence v2, Capital Graph,
Customer Type Registry, legacy v1 advanced intelligence,
customer-revenue, portal revenue opportunities, portal borrower
opportunities, portal borrower financing pathways, lender workflow,
evidence engine, certification engine, registry framework, evidence
packets, audit replay, governance, reviews, and module readiness.

---

## §5 Module integration plan

`governance-advanced-intelligence-v2` (registered in
`src/lib/modules/moduleRegistry.ts`):

- `publicSurfaceAllowed: false`
- `productionBlocked: true`
- `replayRequired: true`
- `audience: ["internal"]`
- `claimsProfile: "advisory-reporting"`
- `eventsPublished`:
  `["governance.advanced.intelligence.v2.composed"]`
- `eventsConsumed`: Lender Workflow v2, Opportunity Discovery v2,
  Financing Pathway Engine v2, Revenue Intelligence v2, Capital
  Graph, Customer Type, intelligence composed, registry framework,
  evidence pack, certification posture
- `adjacentModules`: paired with every upstream canonical module
  plus the legacy v1 advanced intelligence and downstream consumers

Twenty governed handoffs are registered in
`src/lib/modules/handoffMap.ts`, each
`fromModuleId: "governance-advanced-intelligence-v2"`,
`replayRequired: true`, `humanReviewBoundary: true`,
`productionBlocked: true`.

---

## §6 Verification gates

The following must pass before Build 19 is considered shipped:

- `npx tsc --noEmit`
- `npm run smoke:advanced-intelligence-v2`
- `npm run smoke:lender-workflow-v2`
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

CI step `Advanced Intelligence v2` is wired into
`.github/workflows/ci.yml` and gates every push and pull request.

---

## §7 Conformance requirements

- Runtime version must equal
  `advanced-intelligence-v2-runtime-v0.1.0`.
- Composition over Lender Workflow v2 + Opportunity Discovery v2 +
  Financing Pathway Engine v2 + Revenue Intelligence v2 + Capital
  Graph + Customer Type Registry + legacy v1 advanced intelligence
  must be deterministic and replay-safe; conflict signals from every
  upstream are preserved as first-class evidence and never collapsed.
- The runtime always exposes all four canonical v2 domains and the
  five canonical v1 domains.
- Sovereign customer types and sovereign programs are visible only
  when sovereign federation participation is named.
- Module manifest must remain production-blocked, replay-required,
  audience: internal, public surface disallowed.
- Event contract must remain `RESTRICTED`, replay-required,
  production-blocked, public-surface disallowed.
- ≥ 18 governed handoffs from
  `governance-advanced-intelligence-v2`.
- Every consumer module must register
  `governance.advanced.intelligence.v2.composed` in its
  `eventsConsumed` list.

---

## §8 Build sequence

1. Implement `advancedIntelligenceV2Runtime.ts` and verify against
   the existing v2 stack and v1 advanced intelligence runtime
   (additive bridge to v1).
2. Wire
   `src/app/api/governance/advanced-intelligence-v2/route.ts` and
   `src/app/governance/advanced-intelligence-v2/page.tsx`.
3. Register module manifest, event contract, and governed handoffs.
4. Add `governance.advanced.intelligence.v2.composed` to every
   consumer module's `eventsConsumed`.
5. Add adjacency for `governance-advanced-intelligence-v2` to every
   paired module's `adjacentModules`.
6. Write `src/scripts/advancedIntelligenceV2SmokeTest.ts` and
   register `npm run smoke:advanced-intelligence-v2`.
7. Add Advanced Intelligence v2 step to CI.
8. Run verification gates; commit, push, open PR, merge.

---

## §9 Operator instructions (Caitlin)

When Advanced Intelligence v2 is used by a Qualified Governance
Reviewer:

- The runtime composes the full v2 canonical stack + legacy v1
  advanced intelligence into one advisory intelligence pack
  organized by domain.
- No autonomous decisions are produced; all output is advisory
  evidence.
- Sovereign customer types and sovereign sponsor programs appear
  only when sovereign federation is explicitly authorized.
- v2 governed domains (customer_type_intelligence,
  capital_program_intelligence, pathway_v2_intelligence,
  lender_coordination_intelligence) carry upstream doctrine refs;
  legacy v1 domains (source_intelligence, revenue_intelligence,
  market_intelligence, geospatial_intelligence,
  pathway_intelligence) carry their own canonical source-authority
  tiers.
- Cross-source conflicts (v1-vs-v2 coverage divergence, upstream
  RI v2 conflict propagation) are surfaced as first-class evidence
  and never silently collapsed.
- Use the internal page
  `/governance/advanced-intelligence-v2` to inspect a pack; use the
  API `POST /api/governance/advanced-intelligence-v2` for
  programmatic governed composition.
