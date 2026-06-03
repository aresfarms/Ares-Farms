# Build 15 — Revenue Intelligence v2

Revenue Intelligence v2 is the first downstream consumer of the
Universal Capital Graph (Build 13) and the Customer Type Registry
(Build 14). It composes a unified, deterministic, replay-safe,
audit-safe, conflict-preserving advisory pack that joins:

- Customer Type Registry profiles (declared archetypes → matched
  customer types → token-derived eligibility),
- Capital Graph composition (sponsor authority, eligibility findings,
  pathway candidates), scoped by the categories the matched customer
  types declare eligible,
- a per-customer-type "composed program" view: the intersection of
  Capital Graph matched programs and Customer Type
  `eligibleCapitalCategories`,
- a backward-compatibility bridge to the legacy v1
  `revenueSourceIntelligenceRuntime` (`PROGRAM_GRAPH`,
  `REVENUE_OPPORTUNITY_REGISTRY`),
- cross-source conflict signals when Customer Type Registry and
  Capital Graph disagree on federation scope or eligibility
  boundaries.

The runtime is advisory-only, human-review-bound, replay-safe,
audit-safe, federation-scoped, and conflict-preserving. It does not
issue an autonomous customer eligibility determination, credit
decision, lender commitment, program approval, tax-credit allocation,
environmental clearance, or carbon-credit issuance, and it does not
perform a live external customer or sponsor fetch.

---

## §1 Canonical doctrine

Master Volume governance carried by Revenue Intelligence v2:

- **Vol I — Constitutional Backbone.** Preserves Customer Type review
  boundaries and Capital Graph sponsor authority; never grants
  authority or composes an autonomous determination.
- **Vol II — Regulatory Governance.** Every composed program inherits
  the underlying Capital Graph + Customer Type doctrine refs; the
  composed pack is review-bound and not a regulatory determination.
- **Vol III — Technical Infrastructure.** Deterministic, replay-safe
  composition with explicit version lineage chaining
  `revenue-intelligence-v2-runtime-v0.1.0` →
  `customer-type-runtime-v0.1.0` → `capital-graph-runtime-v0.1.0` →
  `revenue-source-intelligence-runtime-v0.1.0`.
- **Vol III-B — Governance Runtime.** Runtime evidence with
  classification, observability, explainability, and replay
  verification posture; runtime guard required on the governed API.
- **Vol IV — Operational Runbooks.** Routes governed handoffs to the
  Capital Graph, Customer Type Registry, financing pathway guidance,
  opportunity discovery, customer revenue, revenue opportunities,
  advanced intelligence, lender workflow, evidence engine, internal
  certification engine, registry framework, evidence packets, audit
  replay, governance, reviews, and module readiness.
- **Vol V — Canonical Doctrines.** Preserves claims governance,
  controlled disclosure, replay, audit, portability, and
  advisory-only boundaries.
- **Vol VI — Source Intelligence Integration.** Every composed entry
  remains behind a public-safe DTO; no raw sponsor or borrower
  records, no live external fetch, no source-certainty claim.

---

## §2 Architecture

- `src/lib/revenue-intelligence/revenueIntelligenceV2Runtime.ts` —
  canonical v2 runtime. Exports
  `REVENUE_INTELLIGENCE_V2_RUNTIME_VERSION`,
  `composeRevenueIntelligenceV2`, `revenueIntelligenceV2Lineage`,
  `REVENUE_INTELLIGENCE_V2_DISCLOSURES`, and
  `REVENUE_INTELLIGENCE_V2_PRODUCTION_RESTRICTIONS`.
  - Calls `composeCustomerTypeRegistry` to derive matched profiles.
  - Forwards matched customer-type tokens + intended uses +
    jurisdiction to `composeCapitalGraph` (scoped by
    `scope.capitalCategoryIds` when provided).
  - For each matched customer type, intersects the Capital Graph
    matched programs with the customer type's
    `eligibleCapitalCategories` to produce per-customer composed
    programs ranked by `capitalFitScore`.
  - Builds a legacy revenue-opportunity bridge by token-matching
    customer type labels and matchingTokens against the v1
    `REVENUE_OPPORTUNITY_REGISTRY.customer_type` field, optionally
    filtered by `borrowerContext.intendedUses` against
    `product_or_service_category`.
  - Emits cross-source conflicts when (a) federation scope of the
    customer type differs from the federation scope of a composed
    program or (b) the customer type lists an eligible capital
    category that did not return a Capital Graph match under the
    current borrower context.
- `src/app/api/governance/revenue-intelligence-v2/route.ts` —
  governed POST. Applies `runRuntimeGuard`, `evaluateVersionRuntime`,
  `classifyRecord`, `createExplanationLineage`,
  `createObservabilityEvent`, and `persistGovernanceEvidence`.
  Classification: `RESTRICTED`. Replay required. Production blocked.
- `src/app/governance/revenue-intelligence-v2/page.tsx` — internal-
  facing reviewer surface (advisory only).

The v1 runtime is preserved unchanged; the bridge is additive per
AGENTS.md rule 4 (no drift from the current module).

---

## §3 Registry seed

The Revenue Intelligence v2 runtime does not introduce a new program
registry; it composes from the existing Capital Graph
(`CAPITAL_GRAPH_REGISTRY`, 23 programs) and Customer Type Registry
(`CUSTOMER_TYPE_REGISTRY`, 20 customer types across 18 archetypes),
plus the v1 `PROGRAM_GRAPH` (3 entries) and
`REVENUE_OPPORTUNITY_REGISTRY` (3 entries) as a legacy bridge.

Version lineage seal:

| Layer | Version |
| --- | --- |
| Revenue Intelligence v2 | `revenue-intelligence-v2-runtime-v0.1.0` |
| Customer Type Registry | `customer-type-runtime-v0.1.0` |
| Capital Graph | `capital-graph-runtime-v0.1.0` |
| Legacy v1 bridge | `revenue-source-intelligence-runtime-v0.1.0` |

---

## §4 Event contract

`governance.revenue.intelligence.v2.composed` —
`src/lib/modules/eventContractRegistry.ts`.

- `classificationLevel`: `RESTRICTED`
- `replayRequired`: `true`
- `productionBlocked`: `true`
- `publicSurfaceAllowed`: `false`
- Payload digest: `customer_profile_count`,
  `total_composed_program_count`, `total_legacy_opportunity_count`,
  `conflict_signal_count`, `cross_source_conflict_count`,
  `capital_pathway_count`, sovereign / participant / public program
  counts.

Consumers (sixteen modules) include Capital Graph, Customer Type
Registry, customer-revenue, portal revenue opportunities, portal
borrower opportunities, portal borrower financing pathways, lender
workflow, advanced intelligence, evidence engine, certification
engine, registry framework, evidence packets, audit replay,
governance, reviews, and module readiness.

---

## §5 Module integration plan

`governance-revenue-intelligence-v2` (registered in
`src/lib/modules/moduleRegistry.ts`):

- `publicSurfaceAllowed: false`
- `productionBlocked: true`
- `replayRequired: true`
- `audience: ["internal"]`
- `claimsProfile: "advisory-reporting"`
- `eventsPublished`:
  `["governance.revenue.intelligence.v2.composed"]`
- `eventsConsumed`: governance Capital Graph + Customer Type events,
  legacy revenue-source-intelligence composition event, plus
  upstream financing-pathway and advanced-intelligence governance
  events
- `adjacentModules`: paired with Capital Graph and Customer Type
  Registry, plus every downstream consumer of the new event

Sixteen governed handoffs are registered in
`src/lib/modules/handoffMap.ts`, each
`fromModuleId: "governance-revenue-intelligence-v2"`,
`replayRequired: true`, `humanReviewBoundary: true`,
`productionBlocked: true`. Targets: governance-capital-graph,
governance-customer-type-registry, customer-revenue,
portal-revenue-opportunities, portal-borrower-opportunities,
portal-borrower-financing-pathways, lender-workflow,
governance-advanced-intelligence, governance-evidence-engine,
governance-certification-engine, governance-registry-framework,
evidence-packets, audit-replay, governance, reviews,
module-readiness.

---

## §6 Verification gates

The following must pass before Build 15 is considered shipped:

- `npx tsc --noEmit`
- `npm run smoke:revenue-intelligence-v2`
- `npm run smoke:capital-graph`
- `npm run smoke:customer-type-registry`
- `npm run verify:module-manifests`
- `npm run smoke:public-surfaces`
- `npm run smoke:claims-public`
- `npm run smoke:redaction`
- `npm run smoke:replay-cross-module`
- `npm run build`

CI step `Revenue Intelligence v2` is wired into
`.github/workflows/ci.yml` and gates every push and pull request.

---

## §7 Conformance requirements

- Runtime version must equal
  `revenue-intelligence-v2-runtime-v0.1.0`.
- Composition over the canonical Capital Graph + Customer Type
  Registry must be deterministic and replay-safe; conflict signals
  from either upstream are preserved as first-class evidence and
  never collapsed.
- Sovereign customer types and sovereign programs are visible only
  when sovereign federation participation is named.
- Legacy revenue opportunity bridge must remain advisory and
  review-bound; legacy entries do not become authoritative through
  v2 composition.
- Module manifest must remain production-blocked, replay-required,
  audience: internal, public surface disallowed.
- Event contract must remain `RESTRICTED`, replay-required,
  production-blocked, public-surface disallowed.
- ≥ 15 governed handoffs from
  `governance-revenue-intelligence-v2`.
- Every consumer module must register
  `governance.revenue.intelligence.v2.composed` in its
  `eventsConsumed` list.

---

## §8 Build sequence

1. Implement `revenueIntelligenceV2Runtime.ts` and verify against
   the existing Capital Graph + Customer Type runtimes (additive
   bridge to v1).
2. Wire `src/app/api/governance/revenue-intelligence-v2/route.ts`
   and `src/app/governance/revenue-intelligence-v2/page.tsx`.
3. Register module manifest, event contract, and sixteen handoffs.
4. Add `governance.revenue.intelligence.v2.composed` to every
   consumer module's `eventsConsumed`.
5. Add adjacency for `governance-revenue-intelligence-v2` to every
   paired module's `adjacentModules`.
6. Write `src/scripts/revenueIntelligenceV2SmokeTest.ts` and
   register `npm run smoke:revenue-intelligence-v2`.
7. Add Revenue Intelligence v2 step to CI.
8. Run verification gates; commit, push, open PR, merge.

---

## §9 Operator instructions (Caitlin)

When Revenue Intelligence v2 is used by a Qualified Governance
Reviewer:

- The runtime composes Capital Graph + Customer Type Registry +
  legacy v1 evidence into one advisory pack.
- No autonomous decisions are produced; all output is advisory.
- Sovereign customer types and sovereign programs appear only when
  sovereign federation is explicitly authorized via the reviewer
  toggle.
- Every "composed program" row is paired with the Capital Graph
  finding it was derived from and the Customer Type profile that
  scoped it.
- Cross-source conflicts (federation-scope mismatch or
  eligibility-gap) are surfaced as first-class evidence and never
  silently collapsed.
- Use the internal page
  `/governance/revenue-intelligence-v2` to inspect a pack;
  use the API `POST /api/governance/revenue-intelligence-v2` for
  programmatic governed composition.
