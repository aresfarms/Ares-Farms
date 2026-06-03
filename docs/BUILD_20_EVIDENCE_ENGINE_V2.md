# Build 20 — Evidence Engine v2

Evidence Engine v2 is the sixth downstream consumer of the
Universal Capital Graph (Build 13) and the Customer Type Registry
(Build 14), composed on top of Revenue Intelligence v2 (Build 15),
Financing Pathway Engine v2 (Build 16), Opportunity Discovery v2
(Build 17), Lender Workflow v2 (Build 18), and Advanced Intelligence
v2 (Build 19). It produces a unified, deterministic, replay-safe,
audit-safe, conflict-preserving advisory evidence pack that joins:

- The legacy v1 `composeGovernanceEvidencePack` runtime (module
  manifests, event contracts, handoff trails, human authority
  mapping, audit anchors) preserved as an additive compatibility
  bridge.
- Three new v2 governed evidence dimensions derived from the
  canonical v2 stack (via Advanced Intelligence v2):
  - `customer_type_evidence` — per-customer-type archetype,
    federation scope, eligible capital categories,
  - `capital_program_evidence` — per-program sponsor authority,
    category, federation, fit signals,
  - `pathway_v2_evidence` — Revenue Intelligence v2 composition
    summary, conflict signals, cross-source conflicts, capital
    pathway summary.
- Cross-source conflict signals when (a) v2 dimensions returned
  entries but the legacy v1 pack returned no modules, (b) v1 pack
  returned modules but v2 returned no entries, or (c) upstream
  Advanced Intelligence v2 surfaced cross-source conflicts that
  propagate into v2 evidence.

The runtime is advisory evidence only. It does not approve, certify,
verify, commit credit, send notices, authorize payment, or grant
regulatory or legal reliance.

---

## §1 Canonical doctrine

Master Volume governance carried by Evidence Engine v2:

- **Vol I — Constitutional Backbone.** Keeps the engine subordinate
  to constitutional authority; packs describe accountable governance
  posture and never replace it.
- **Vol II — Regulatory Governance.** Pack composition cannot become
  official certification, public verification, regulatory reliance,
  lender commitment, credit decision, environmental clearance, or
  payment authorization.
- **Vol III — Technical Infrastructure.** Deterministic, replay-safe
  composition with explicit version lineage chaining
  `governance-evidence-engine-v2-runtime-v0.1.0` →
  `advanced-intelligence-v2-runtime-v0.1.0` →
  `lender-workflow-v2-runtime-v0.1.0` →
  `opportunity-discovery-v2-runtime-v0.1.0` →
  `financing-pathway-engine-v2-runtime-v0.1.0` →
  `revenue-intelligence-v2-runtime-v0.1.0` →
  `customer-type-runtime-v0.1.0` →
  `capital-graph-runtime-v0.1.0` →
  `governance-evidence-engine-v0.1.0`.
- **Vol III-B — Governance Runtime.** Runtime evidence with
  classification, observability, explainability, and replay
  verification; runtime guard required on the governed API.
- **Vol IV — Operational Runbooks.** Routes governed handoffs to
  Advanced Intelligence v2, Lender Workflow v2, Opportunity
  Discovery v2, Financing Pathway Engine v2, Revenue Intelligence
  v2, Customer Type Registry, Capital Graph, legacy v1 evidence
  engine, certification engine, registry framework, evidence
  packets, audit replay, governance, reviews, and module readiness.
- **Vol V — Canonical Doctrines.** Preserves claims governance,
  controlled disclosure, replay, audit, portability, and
  evidence-only boundaries.
- **Vol VI — Source Intelligence Integration.** Every composed
  evidence entry remains behind a public-safe DTO; no raw borrower
  / sponsor / property records; no live external fetch; no
  source-certainty claim.

---

## §2 Architecture

- `src/lib/governance/evidenceEngineV2Runtime.ts` — canonical v2
  runtime. Exports
  `GOVERNANCE_EVIDENCE_ENGINE_V2_RUNTIME_VERSION`,
  `composeGovernanceEvidenceEngineV2`,
  `governanceEvidenceEngineV2Lineage`,
  `GOVERNANCE_EVIDENCE_ENGINE_V2_DIMENSION_IDS`,
  `GOVERNANCE_EVIDENCE_ENGINE_V2_DISCLOSURES`, and
  `GOVERNANCE_EVIDENCE_ENGINE_V2_PRODUCTION_RESTRICTIONS`.
  - Calls `composeAdvancedIntelligenceV2` to derive the full v2
    intelligence stack at the borrower-context scope.
  - Calls v1 `composeGovernanceEvidencePack` for the legacy
    compatibility bridge.
  - Builds 3 v2 governed evidence dimensions whose entries inherit
    AI v2 insight signals and upstream doctrine refs.
  - Emits cross-source conflicts for v1/v2 coverage divergence and
    upstream AI v2 conflict propagation.
- `src/app/api/governance/evidence-engine-v2/route.ts` — governed
  POST. Applies `runRuntimeGuard`, `evaluateVersionRuntime`,
  `classifyRecord`, `createExplanationLineage`,
  `createObservabilityEvent`, and `persistGovernanceEvidence`.
  Classification: `RESTRICTED`. Replay required. Production blocked.
- `src/app/governance/evidence-engine-v2/page.tsx` — internal-
  facing reviewer surface.

The v1 runtime is preserved unchanged; the bridge is additive per
AGENTS.md rule 4.

---

## §3 Registry seed

The Evidence Engine v2 runtime does not introduce a new program
registry. It composes from the existing Capital Graph (23 programs),
Customer Type Registry (20 customer types), the full canonical v2
stack via Advanced Intelligence v2, and the v1 governance evidence
engine.

Version lineage seal:

| Layer | Version |
| --- | --- |
| Evidence Engine v2 | `governance-evidence-engine-v2-runtime-v0.1.0` |
| Advanced Intelligence v2 | `advanced-intelligence-v2-runtime-v0.1.0` |
| Lender Workflow v2 | `lender-workflow-v2-runtime-v0.1.0` |
| Opportunity Discovery v2 | `opportunity-discovery-v2-runtime-v0.1.0` |
| Financing Pathway Engine v2 | `financing-pathway-engine-v2-runtime-v0.1.0` |
| Revenue Intelligence v2 | `revenue-intelligence-v2-runtime-v0.1.0` |
| Customer Type Registry | `customer-type-runtime-v0.1.0` |
| Capital Graph | `capital-graph-runtime-v0.1.0` |
| Legacy v1 evidence engine | `governance-evidence-engine-v0.1.0` |

---

## §4 Event contract

`governance.evidence.engine.v2.composed` —
`src/lib/modules/eventContractRegistry.ts`.

- `classificationLevel`: `RESTRICTED`
- `replayRequired`: `true`
- `productionBlocked`: `true`
- `publicSurfaceAllowed`: `false`
- Payload digest: `pack_intent`, `v2_dimension_count`,
  `v2_entry_count`, `legacy_module_count`,
  `legacy_event_contract_count`, `legacy_handoff_count`,
  `legacy_human_authority_count`, `cross_source_conflict_count`,
  `customer_type_coverage_count`,
  `capital_program_coverage_count`.

Consumers (15+) include the full canonical v2 stack, legacy v1
evidence engine, certification engine, registry framework, evidence
packets, audit replay, governance, reviews, and module readiness.

---

## §5 Module integration plan

`governance-evidence-engine-v2` (registered in
`src/lib/modules/moduleRegistry.ts`):

- `publicSurfaceAllowed: false`
- `productionBlocked: true`
- `replayRequired: true`
- `audience: ["internal"]`
- `claimsProfile: "advisory-reporting"`
- `eventsPublished`:
  `["governance.evidence.engine.v2.composed"]`
- `eventsConsumed`: Advanced Intelligence v2, Lender Workflow v2,
  Opportunity Discovery v2, Financing Pathway Engine v2, Revenue
  Intelligence v2, Capital Graph, Customer Type, evidence pack
  (v1), intelligence composed, registry framework, certification
  posture
- `adjacentModules`: paired with every upstream canonical module
  plus the legacy v1 evidence engine and downstream consumers

Fifteen governed handoffs are registered in
`src/lib/modules/handoffMap.ts`, each
`fromModuleId: "governance-evidence-engine-v2"`,
`replayRequired: true`, `humanReviewBoundary: true`,
`productionBlocked: true`.

---

## §6 Verification gates

The following must pass before Build 20 is considered shipped:

- `npx tsc --noEmit`
- `npm run smoke:evidence-engine-v2`
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

CI step `Evidence Engine v2` is wired into
`.github/workflows/ci.yml` and gates every push and pull request.

---

## §7 Conformance requirements

- Runtime version must equal
  `governance-evidence-engine-v2-runtime-v0.1.0`.
- Composition over Advanced Intelligence v2 + full canonical v2
  stack + legacy v1 evidence engine must be deterministic and
  replay-safe; conflict signals from every upstream are preserved
  as first-class evidence and never collapsed.
- The runtime always exposes all three canonical v2 dimensions and
  the embedded v1 evidence pack.
- Sovereign customer types and sovereign programs are visible only
  when sovereign federation participation is named.
- Module manifest must remain production-blocked, replay-required,
  audience: internal, public surface disallowed.
- Event contract must remain `RESTRICTED`, replay-required,
  production-blocked, public-surface disallowed.
- ≥ 14 governed handoffs from `governance-evidence-engine-v2`.
- Every consumer module must register
  `governance.evidence.engine.v2.composed` in its
  `eventsConsumed` list.

---

## §8 Build sequence

1. Implement `evidenceEngineV2Runtime.ts` and verify against the
   existing v2 stack and v1 evidence engine runtime (additive bridge
   to v1).
2. Wire `src/app/api/governance/evidence-engine-v2/route.ts` and
   `src/app/governance/evidence-engine-v2/page.tsx`.
3. Register module manifest, event contract, and governed handoffs.
4. Add `governance.evidence.engine.v2.composed` to every consumer
   module's `eventsConsumed`.
5. Add adjacency for `governance-evidence-engine-v2` to every
   paired module's `adjacentModules`.
6. Write `src/scripts/evidenceEngineV2SmokeTest.ts` and register
   `npm run smoke:evidence-engine-v2`.
7. Add Evidence Engine v2 step to CI.
8. Run verification gates; commit, push, open PR, merge.

---

## §9 Operator instructions (Caitlin)

When Evidence Engine v2 is used by a Qualified Governance Reviewer:

- The runtime composes the full v2 canonical stack via Advanced
  Intelligence v2 + the legacy v1 governance evidence engine into
  one advisory evidence pack organized by dimension.
- No autonomous decisions are produced; all output is advisory
  evidence.
- Sovereign customer types and sovereign sponsor programs appear
  only when sovereign federation is explicitly authorized.
- The three v2 dimensions (`customer_type_evidence`,
  `capital_program_evidence`, `pathway_v2_evidence`) inherit
  upstream doctrine refs; the embedded v1 pack carries its module /
  contract / handoff / authority / audit anchor summaries.
- Cross-source conflicts (v1-vs-v2 coverage divergence, upstream
  AI v2 conflict propagation) are surfaced as first-class evidence.
- Use the internal page
  `/governance/evidence-engine-v2` to inspect a pack; use the API
  `POST /api/governance/evidence-engine-v2` for programmatic
  governed composition.
