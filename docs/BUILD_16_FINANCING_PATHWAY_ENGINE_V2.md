# Build 16 — Financing Pathway Engine v2

Financing Pathway Engine v2 is the second downstream consumer of the
Universal Capital Graph (Build 13) and the Customer Type Registry
(Build 14), composed on top of Revenue Intelligence v2 (Build 15). It
produces a unified, deterministic, replay-safe, audit-safe, conflict-
preserving advisory pathway pack that joins:

- Revenue Intelligence v2 (Customer Type profiles + Capital Graph
  composed programs + legacy revenue-opportunity bridge + cross-
  source conflicts),
- Capital Graph pathway candidates and sponsor authority,
- Customer Type review boundaries and federation scope,
- a per-customer-type ranked pathway pack (capital fit + customer-
  type tier + sponsor authority + readiness gaps + status bucket),
- an additive backward-compatibility bridge to the legacy v1
  `evaluateFinancingPathways` runtime, so existing consumers
  continue to see legacy pathway intelligence as a first-class
  evidence layer,
- cross-source conflict signals when (a) customer-type federation
  scope differs from a composed pathway's federation scope, (b) the
  v1 legacy engine returns no candidate where v2 produces one, or
  (c) the v1 legacy engine returns candidates where v2 produces
  none.

The runtime is advisory-only, human-review-bound, replay-safe,
audit-safe, federation-scoped, and conflict-preserving. It does not
issue an autonomous customer eligibility determination, autonomous
pathway determination, credit decision, lender commitment, program
approval, tax-credit allocation, environmental clearance, or
carbon-credit issuance, and it does not perform a live external
customer or sponsor fetch.

---

## §1 Canonical doctrine

Master Volume governance carried by Financing Pathway Engine v2:

- **Vol I — Constitutional Backbone.** Preserves Customer Type
  review boundaries and Capital Graph sponsor authority; the
  runtime never grants pathway authority and never composes an
  autonomous pathway determination.
- **Vol II — Regulatory Governance.** Every pathway candidate
  inherits the upstream Capital Graph + Customer Type doctrine refs;
  the composed pack is review-bound and not a regulatory
  determination.
- **Vol III — Technical Infrastructure.** Deterministic, replay-safe
  composition with explicit version lineage chaining
  `financing-pathway-engine-v2-runtime-v0.1.0` →
  `revenue-intelligence-v2-runtime-v0.1.0` →
  `customer-type-runtime-v0.1.0` →
  `capital-graph-runtime-v0.1.0` →
  `financing-pathway-engine-v0.1.0`.
- **Vol III-B — Governance Runtime.** Runtime evidence with
  classification, observability, explainability, and replay
  verification posture; runtime guard required on the governed API.
- **Vol IV — Operational Runbooks.** Routes governed handoffs to
  Revenue Intelligence v2, Capital Graph, Customer Type Registry,
  financing pathway guidance, opportunity discovery, customer
  revenue, revenue opportunities, lender workflow, advanced
  intelligence, evidence engine, certification engine, registry
  framework, evidence packets, audit replay, governance, reviews,
  and module readiness.
- **Vol V — Canonical Doctrines.** Preserves claims governance,
  controlled disclosure, replay, audit, portability, and
  advisory-only boundaries.
- **Vol VI — Source Intelligence Integration.** Every composed
  pathway entry remains behind a public-safe DTO; no raw sponsor or
  borrower records, no live external fetch, no source-certainty
  claim.

---

## §2 Architecture

- `src/lib/financing/pathwayEngineV2Runtime.ts` — canonical v2
  runtime. Exports
  `FINANCING_PATHWAY_ENGINE_V2_RUNTIME_VERSION`,
  `composeFinancingPathwayEngineV2`,
  `financingPathwayEngineV2Lineage`,
  `FINANCING_PATHWAY_ENGINE_V2_DISCLOSURES`, and
  `FINANCING_PATHWAY_ENGINE_V2_PRODUCTION_RESTRICTIONS`.
  - Calls `composeRevenueIntelligenceV2` to derive customer profiles
    + Capital Graph composed programs + legacy revenue-opportunity
    bridge + cross-source conflicts.
  - Calls v1 `evaluateFinancingPathways` for the same borrower
    context to produce the legacy compatibility bridge.
  - For each matched customer type, intersects the v2 composed
    programs with Capital Graph eligibility and ranks them by
    `capitalFitScore`, then by `pathwayStatus` (`REVIEW_REQUIRED`,
    `MISSING_INFORMATION`, `FEDERATION_GATED`).
  - Computes borrower-level readiness gaps (borrower identity, farm
    location, farm type, borrower goal, acreage, requested amount /
    financing purpose).
  - Builds per-customer cross-source conflicts: federation-scope
    mismatch between customer type and composed pathway, legacy v1
    coverage divergence (legacy has 0 / v2 has many), customer-type
    coverage gap (legacy has many / v2 has 0).
- `src/app/api/governance/financing-pathway-engine-v2/route.ts` —
  governed POST. Applies `runRuntimeGuard`,
  `evaluateVersionRuntime`, `classifyRecord`,
  `createExplanationLineage`, `createObservabilityEvent`, and
  `persistGovernanceEvidence`. Classification: `RESTRICTED`. Replay
  required. Production blocked.
- `src/app/governance/financing-pathway-engine-v2/page.tsx` —
  internal-facing reviewer surface (advisory only).

The v1 runtime is preserved unchanged; the bridge is additive per
AGENTS.md rule 4 (no drift from the current module).

---

## §3 Registry seed

The Financing Pathway Engine v2 runtime does not introduce a new
program registry; it composes from the existing Capital Graph
(`CAPITAL_GRAPH_REGISTRY`, 23 programs), Customer Type Registry
(`CUSTOMER_TYPE_REGISTRY`, 20 customer types across 18 archetypes),
Revenue Intelligence v2 composition, and the v1 `PROGRAM_GRAPH` (3)
+ `REVENUE_OPPORTUNITY_REGISTRY` (3) + v1 financing pathway engine
candidates as compatibility bridges.

Version lineage seal:

| Layer | Version |
| --- | --- |
| Financing Pathway Engine v2 | `financing-pathway-engine-v2-runtime-v0.1.0` |
| Revenue Intelligence v2 | `revenue-intelligence-v2-runtime-v0.1.0` |
| Customer Type Registry | `customer-type-runtime-v0.1.0` |
| Capital Graph | `capital-graph-runtime-v0.1.0` |
| Legacy v1 financing pathway engine | `financing-pathway-engine-v0.1.0` |

---

## §4 Event contract

`governance.financing.pathway.engine.v2.composed` —
`src/lib/modules/eventContractRegistry.ts`.

- `classificationLevel`: `RESTRICTED`
- `replayRequired`: `true`
- `productionBlocked`: `true`
- `publicSurfaceAllowed`: `false`
- Payload digest: `customer_profile_count`,
  `total_candidate_count`, `total_legacy_candidate_count`,
  `conflict_signal_count`, `cross_source_conflict_count`,
  `sovereign_candidate_count`, `review_required_count`,
  `missing_information_count`, `federation_gated_count`.

Consumers (seventeen modules) include Revenue Intelligence v2,
Capital Graph, Customer Type Registry, customer-revenue, portal
revenue opportunities, portal borrower opportunities, portal
borrower financing pathways, lender workflow, advanced intelligence,
evidence engine, certification engine, registry framework, evidence
packets, audit replay, governance, reviews, and module readiness.

---

## §5 Module integration plan

`governance-financing-pathway-engine-v2` (registered in
`src/lib/modules/moduleRegistry.ts`):

- `publicSurfaceAllowed: false`
- `productionBlocked: true`
- `replayRequired: true`
- `audience: ["internal"]`
- `claimsProfile: "advisory-reporting"`
- `eventsPublished`:
  `["governance.financing.pathway.engine.v2.composed"]`
- `eventsConsumed`: Revenue Intelligence v2, Capital Graph, Customer
  Type, registry framework, evidence pack, certification posture,
  governance intelligence
- `adjacentModules`: paired with Revenue Intelligence v2, Capital
  Graph, Customer Type Registry, and every downstream consumer

Seventeen governed handoffs are registered in
`src/lib/modules/handoffMap.ts`, each
`fromModuleId: "governance-financing-pathway-engine-v2"`,
`replayRequired: true`, `humanReviewBoundary: true`,
`productionBlocked: true`. Targets: governance-revenue-intelligence-v2,
governance-capital-graph, governance-customer-type-registry,
customer-revenue, portal-revenue-opportunities,
portal-borrower-opportunities,
portal-borrower-financing-pathways, lender-workflow,
governance-advanced-intelligence, governance-evidence-engine,
governance-certification-engine, governance-registry-framework,
evidence-packets, audit-replay, governance, reviews,
module-readiness.

---

## §6 Verification gates

The following must pass before Build 16 is considered shipped:

- `npx tsc --noEmit`
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

CI step `Financing Pathway Engine v2` is wired into
`.github/workflows/ci.yml` and gates every push and pull request.

---

## §7 Conformance requirements

- Runtime version must equal
  `financing-pathway-engine-v2-runtime-v0.1.0`.
- Composition over Revenue Intelligence v2 + Capital Graph +
  Customer Type Registry + legacy v1 financing-pathway-engine must
  be deterministic and replay-safe; conflict signals from every
  upstream are preserved as first-class evidence and never
  collapsed.
- Sovereign customer types and sovereign programs are visible only
  when sovereign federation participation is named; sovereign
  candidates under a closed federation are marked
  `FEDERATION_GATED`.
- Candidate `pathwayStatus` must always be one of `REVIEW_REQUIRED`,
  `MISSING_INFORMATION`, `FEDERATION_GATED`; the status buckets
  must sum to the total candidate count.
- Legacy v1 candidate bridge must remain advisory and review-bound;
  legacy entries do not become authoritative through v2 composition.
- Module manifest must remain production-blocked, replay-required,
  audience: internal, public surface disallowed.
- Event contract must remain `RESTRICTED`, replay-required,
  production-blocked, public-surface disallowed.
- ≥ 16 governed handoffs from
  `governance-financing-pathway-engine-v2`.
- Every consumer module must register
  `governance.financing.pathway.engine.v2.composed` in its
  `eventsConsumed` list.

---

## §8 Build sequence

1. Implement `pathwayEngineV2Runtime.ts` and verify against the
   existing Revenue Intelligence v2, Customer Type Registry, Capital
   Graph, and v1 financing-pathway-engine runtimes (additive bridge
   to v1).
2. Wire `src/app/api/governance/financing-pathway-engine-v2/route.ts`
   and `src/app/governance/financing-pathway-engine-v2/page.tsx`.
3. Register module manifest, event contract, and seventeen handoffs.
4. Add `governance.financing.pathway.engine.v2.composed` to every
   consumer module's `eventsConsumed`.
5. Add adjacency for `governance-financing-pathway-engine-v2` to
   every paired module's `adjacentModules`.
6. Write `src/scripts/financingPathwayEngineV2SmokeTest.ts` and
   register `npm run smoke:financing-pathway-engine-v2`.
7. Add Financing Pathway Engine v2 step to CI.
8. Run verification gates; commit, push, open PR, merge.

---

## §9 Operator instructions (Caitlin)

When Financing Pathway Engine v2 is used by a Qualified Governance
Reviewer:

- The runtime composes Revenue Intelligence v2 + Capital Graph +
  Customer Type Registry + legacy v1 financing-pathway-engine into
  one advisory pathway pack.
- No autonomous decisions are produced; all output is advisory.
- Sovereign customer types and sovereign sponsor programs appear
  only when sovereign federation is explicitly authorized via the
  reviewer toggle; sovereign candidates under closed federation
  remain visible but are marked `FEDERATION_GATED`.
- Every pathway candidate is paired with its upstream Capital Graph
  finding, Customer Type profile, and readiness-gap context.
- Cross-source conflicts (federation-scope mismatch, legacy v1-vs-v2
  divergence, customer-type coverage gap) are surfaced as first-
  class evidence and never silently collapsed.
- Use the internal page
  `/governance/financing-pathway-engine-v2` to inspect a pack; use
  the API `POST /api/governance/financing-pathway-engine-v2` for
  programmatic governed composition.
