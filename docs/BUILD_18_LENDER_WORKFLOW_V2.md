# Build 18 — Lender Workflow v2

Lender Workflow v2 is the fourth downstream consumer of the Universal
Capital Graph (Build 13) and the Customer Type Registry (Build 14),
composed on top of Revenue Intelligence v2 (Build 15), Financing
Pathway Engine v2 (Build 16), and Opportunity Discovery v2
(Build 17). It produces a unified, deterministic, replay-safe,
audit-safe, conflict-preserving advisory lender-coordination pack
that joins:

- The legacy v1 `evaluateLenderWorkflow` runtime (application queue,
  sections, totals) preserved as an additive compatibility bridge so
  existing lender-facing surfaces continue to render first-class
  evidence,
- Opportunity Discovery v2 customer profiles + Capital Graph-backed
  grant cards (and therefore Financing Pathway Engine v2 + Revenue
  Intelligence v2 + Customer Type + Capital Graph + legacy revenue
  + legacy v1 pathway engine + legacy v1 discovery),
- Customer Type review boundary and federation scope,
- Capital Graph sponsor authority and category posture,
- per-application lender briefings: lender queue item + composed
  pathway candidates inherited from the application's declared
  customer types + federation-scope guardrails + cross-source
  conflict signals,
- cross-source conflicts when (a) federation scope mismatches
  between declared customer type and composed pathway, (b) the
  legacy v1 lender queue surfaces an application whose matched
  customer types return no Capital Graph-backed grant cards in v2,
  or (c) the v1 queue marks an application `READY_FOR_REVIEW` but
  intake readiness is below 80%.

Lender Workflow v2 is operational coordination only. It does not
approve, preapprove, deny, score, underwrite, determine eligibility,
commit credit, send borrower notices, capture payment, publish
official reports, or authorize any regulatory or legal reliance.

---

## §1 Canonical doctrine

Master Volume governance carried by Lender Workflow v2:

- **Vol I — Constitutional Backbone.** Keeps lender coordination
  subordinate to constitutional authority. The runtime never grants
  pathway, opportunity, or credit authority.
- **Vol II — Regulatory Governance.** Lender briefings inherit
  upstream doctrine refs; lender workflow is review-bound and not a
  regulatory determination.
- **Vol III — Technical Infrastructure.** Deterministic, replay-safe
  composition with explicit version lineage chaining
  `lender-workflow-v2-runtime-v0.1.0` →
  `opportunity-discovery-v2-runtime-v0.1.0` →
  `financing-pathway-engine-v2-runtime-v0.1.0` →
  `revenue-intelligence-v2-runtime-v0.1.0` →
  `customer-type-runtime-v0.1.0` →
  `capital-graph-runtime-v0.1.0` →
  `lender-workflow-runtime-v0.1.0`.
- **Vol III-B — Governance Runtime.** Runtime evidence with
  classification, observability, explainability, and replay
  verification posture; runtime guard required on the governed API.
- **Vol IV — Operational Runbooks.** Routes governed handoffs to
  Opportunity Discovery v2, Financing Pathway Engine v2, Revenue
  Intelligence v2, Customer Type Registry, Capital Graph, legacy
  lender workflow surfaces (workflow, applications, overlays,
  evidence), customer revenue, revenue opportunities, borrower
  opportunities, financing pathways, advanced intelligence, evidence
  engine, certification engine, registry framework, evidence
  packets, audit replay, governance, reviews, and module readiness.
- **Vol V — Canonical Doctrines.** Preserves claims governance,
  controlled disclosure, replay, audit, portability, and
  coordination-only boundaries.
- **Vol VI — Source Intelligence Integration.** Every composed
  briefing remains behind a public-safe DTO; no raw borrower,
  sponsor, or property records; no live external fetch; no
  source-certainty claim.

---

## §2 Architecture

- `src/lib/lender/workflowV2Runtime.ts` — canonical v2 runtime.
  Exports `LENDER_WORKFLOW_V2_RUNTIME_VERSION`,
  `composeLenderWorkflowV2`, `lenderWorkflowV2Lineage`,
  `LENDER_WORKFLOW_V2_DISCLOSURES`, and
  `LENDER_WORKFLOW_V2_PRODUCTION_RESTRICTIONS`.
  - Calls v1 `evaluateLenderWorkflow` for the same lender input set
    to produce the legacy queue + sections + handoffs bridge.
  - For each application, calls `composeOpportunityDiscoveryV2` with
    the application's per-borrower context to derive customer
    profiles + Capital Graph-backed grant cards.
  - Builds per-application briefings: legacy queue item + customer
    profile summaries (top 5 grant cards each) + per-application
    cross-source conflicts.
  - Emits conflicts for (a) federation-scope mismatch, (b) matched
    customer types with no Capital Graph-backed grant cards, and
    (c) `READY_FOR_REVIEW` queue items with low intake readiness.
- `src/app/api/governance/lender-workflow-v2/route.ts` — governed
  POST. Applies `runRuntimeGuard`, `evaluateVersionRuntime`,
  `classifyRecord`, `createExplanationLineage`,
  `createObservabilityEvent`, and `persistGovernanceEvidence`.
  Classification: `RESTRICTED`. Replay required. Production blocked.
- `src/app/governance/lender-workflow-v2/page.tsx` — internal-
  facing reviewer surface (coordination only).

The v1 runtime is preserved unchanged; the bridge is additive per
AGENTS.md rule 4 (no drift from the current module).

---

## §3 Registry seed

The Lender Workflow v2 runtime does not introduce a new program
registry. It composes from the existing Capital Graph
(`CAPITAL_GRAPH_REGISTRY`, 23 programs), Customer Type Registry
(`CUSTOMER_TYPE_REGISTRY`, 20 customer types), Revenue Intelligence
v2 composition, Financing Pathway Engine v2 composition, Opportunity
Discovery v2 composition, and the v1 `evaluateLenderWorkflow`
runtime.

Version lineage seal:

| Layer | Version |
| --- | --- |
| Lender Workflow v2 | `lender-workflow-v2-runtime-v0.1.0` |
| Opportunity Discovery v2 | `opportunity-discovery-v2-runtime-v0.1.0` |
| Financing Pathway Engine v2 | `financing-pathway-engine-v2-runtime-v0.1.0` |
| Revenue Intelligence v2 | `revenue-intelligence-v2-runtime-v0.1.0` |
| Customer Type Registry | `customer-type-runtime-v0.1.0` |
| Capital Graph | `capital-graph-runtime-v0.1.0` |
| Legacy v1 lender workflow | `lender-workflow-runtime-v0.1.0` |

---

## §4 Event contract

`governance.lender.workflow.v2.composed` —
`src/lib/modules/eventContractRegistry.ts`.

- `classificationLevel`: `RESTRICTED`
- `replayRequired`: `true`
- `productionBlocked`: `true`
- `publicSurfaceAllowed`: `false`
- Payload digest: `lender_id`, `partner_workflow_id`,
  `application_count`, `applications_with_profiles_count`,
  `total_grant_card_count`, `conflict_signal_count`,
  `cross_source_conflict_count`, `sovereign_card_count`,
  `ready_for_review_count`, `evidence_pending_count`,
  `overlay_review_pending_count`, `intake_in_progress_count`,
  `on_hold_count`.

Consumers include Opportunity Discovery v2, Financing Pathway
Engine v2, Revenue Intelligence v2, Capital Graph, Customer Type
Registry, legacy lender workflow surfaces (workflow, applications,
overlays, evidence, dashboard, revenue-opportunities,
property-opportunities), customer-revenue, portal revenue
opportunities, portal borrower opportunities, portal borrower
financing pathways, advanced intelligence, evidence engine,
certification engine, registry framework, evidence packets, audit
replay, governance, reviews, and module readiness.

---

## §5 Module integration plan

`governance-lender-workflow-v2` (registered in
`src/lib/modules/moduleRegistry.ts`):

- `publicSurfaceAllowed: false`
- `productionBlocked: true`
- `replayRequired: true`
- `audience: ["internal"]`
- `claimsProfile: "advisory-reporting"`
- `eventsPublished`:
  `["governance.lender.workflow.v2.composed"]`
- `eventsConsumed`: Opportunity Discovery v2, Financing Pathway
  Engine v2, Revenue Intelligence v2, Capital Graph, Customer Type,
  registry framework, evidence pack, certification posture,
  governance intelligence
- `adjacentModules`: paired with every upstream canonical module
  plus every downstream lender-facing surface and consumer

Twenty-one governed handoffs are registered in
`src/lib/modules/handoffMap.ts`, each
`fromModuleId: "governance-lender-workflow-v2"`,
`replayRequired: true`, `humanReviewBoundary: true`,
`productionBlocked: true`.

---

## §6 Verification gates

The following must pass before Build 18 is considered shipped:

- `npx tsc --noEmit`
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

CI step `Lender Workflow v2` is wired into
`.github/workflows/ci.yml` and gates every push and pull request.

---

## §7 Conformance requirements

- Runtime version must equal `lender-workflow-v2-runtime-v0.1.0`.
- Composition over Opportunity Discovery v2 + Financing Pathway
  Engine v2 + Revenue Intelligence v2 + Capital Graph + Customer
  Type Registry + legacy v1 lender workflow must be deterministic
  and replay-safe; conflict signals from every upstream are
  preserved as first-class evidence and never collapsed.
- Sovereign customer types and sovereign programs are visible only
  when sovereign federation participation is named; sovereign grant
  cards under a closed federation are marked `FEDERATION_GATED`.
- Per-application briefings must always carry the v1 queue item,
  customer profile summaries (with top 5 grant cards each), and
  per-application cross-source conflicts.
- Legacy v1 sections must remain advisory and review-bound; legacy
  entries do not become authoritative through v2 composition.
- Module manifest must remain production-blocked, replay-required,
  audience: internal, public surface disallowed.
- Event contract must remain `RESTRICTED`, replay-required,
  production-blocked, public-surface disallowed.
- ≥ 20 governed handoffs from `governance-lender-workflow-v2`.
- Every consumer module must register
  `governance.lender.workflow.v2.composed` in its `eventsConsumed`
  list.

---

## §8 Build sequence

1. Implement `workflowV2Runtime.ts` and verify against the existing
   Opportunity Discovery v2, Financing Pathway Engine v2, Revenue
   Intelligence v2, Customer Type Registry, Capital Graph, and v1
   lender workflow runtimes (additive bridge to v1).
2. Wire `src/app/api/governance/lender-workflow-v2/route.ts` and
   `src/app/governance/lender-workflow-v2/page.tsx`.
3. Register module manifest, event contract, and governed handoffs.
4. Add `governance.lender.workflow.v2.composed` to every consumer
   module's `eventsConsumed`.
5. Add adjacency for `governance-lender-workflow-v2` to every
   paired module's `adjacentModules`.
6. Write `src/scripts/lenderWorkflowV2SmokeTest.ts` and register
   `npm run smoke:lender-workflow-v2`.
7. Add Lender Workflow v2 step to CI.
8. Run verification gates; commit, push, open PR, merge.

---

## §9 Operator instructions (Caitlin)

When Lender Workflow v2 is used by a Qualified Governance Reviewer:

- The runtime composes Opportunity Discovery v2 + Financing Pathway
  Engine v2 + Revenue Intelligence v2 + Capital Graph + Customer
  Type Registry + legacy v1 lender workflow into one advisory
  lender-coordination pack.
- No autonomous decisions are produced; all output is advisory
  coordination evidence.
- Sovereign customer types and sovereign sponsor programs appear
  only when sovereign federation is explicitly authorized via the
  reviewer toggle.
- Each application briefing pairs the legacy v1 queue item with a
  per-customer-type summary (top 5 Capital Graph-backed grant cards
  by fit score) and per-application cross-source conflicts.
- Cross-source conflicts (federation-scope mismatch, empty grant
  cards under matched customer types, readiness mismatch on
  `READY_FOR_REVIEW`) are surfaced as first-class evidence and
  never silently collapsed.
- Use the internal page `/governance/lender-workflow-v2` to inspect
  a pack; use the API `POST /api/governance/lender-workflow-v2`
  for programmatic governed composition.
