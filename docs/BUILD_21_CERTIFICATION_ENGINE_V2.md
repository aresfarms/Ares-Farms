# Build 21 — Certification Engine v2

Certification Engine v2 is the seventh downstream consumer of the
Universal Capital Graph (Build 13) and the Customer Type Registry
(Build 14), composed on top of Revenue Intelligence v2 (Build 15),
Financing Pathway Engine v2 (Build 16), Opportunity Discovery v2
(Build 17), Lender Workflow v2 (Build 18), Advanced Intelligence v2
(Build 19), and Evidence Engine v2 (Build 20). It produces a
unified, deterministic, replay-safe, audit-safe, conflict-preserving
advisory internal-certification posture that joins:

- The legacy v1 `evaluateInternalCertification` runtime (4 domains:
  `module_readiness`, `source_posture`, `connector_posture`,
  `module_conformance`) preserved as an additive compatibility
  bridge.
- Three new v2 governed certification dimensions derived from the
  canonical v2 stack via Evidence Engine v2:
  - `customer_type_certification` — Customer Type Registry posture
    readiness across declared customer types,
  - `capital_program_certification` — Capital Graph posture
    readiness across composed programs and federation gates,
  - `pathway_v2_certification` — Revenue / Pathway / Opportunity /
    Lender Workflow v2 composition readiness with cross-source
    conflict propagation.
- Cross-source conflict signals when (a) v2 dimensions report
  certified while v1 reports blocked gates, (b) v2 dimensions
  report not-started while v1 reports certified, or (c) upstream
  Evidence Engine v2 surfaced cross-source conflicts.

Certification Engine v2 produces internal certification posture
only. External certification claims remain blocked until the public
verification and reliance gates are approved.

---

## §1 Canonical doctrine

- **Vol I — Constitutional Backbone.** Engine subordinate to
  constitutional authority; internal certification describes
  accountable internal posture and never replaces external review.
- **Vol II — Regulatory Governance.** Blocks the engine from claiming
  external certification, public verification, regulatory reliance,
  lender commitment, or legal reliance.
- **Vol III — Technical Infrastructure.** Deterministic, replay-safe
  composition with explicit version lineage chaining
  `certification-engine-v2-runtime-v0.1.0` →
  `governance-evidence-engine-v2-runtime-v0.1.0` →
  `advanced-intelligence-v2-runtime-v0.1.0` →
  `lender-workflow-v2-runtime-v0.1.0` →
  `opportunity-discovery-v2-runtime-v0.1.0` →
  `financing-pathway-engine-v2-runtime-v0.1.0` →
  `revenue-intelligence-v2-runtime-v0.1.0` →
  `customer-type-runtime-v0.1.0` →
  `capital-graph-runtime-v0.1.0` →
  `certification-engine-runtime-v0.1.0`.
- **Vol III-B — Governance Runtime.** Runtime evidence with
  classification, observability, explainability, and replay
  verification posture.
- **Vol IV — Operational Runbooks.** Routes governed handoffs to
  Evidence Engine v2, Advanced Intelligence v2, Lender Workflow v2,
  Opportunity Discovery v2, Financing Pathway Engine v2, Revenue
  Intelligence v2, Customer Type Registry, Capital Graph, legacy v1
  certification engine, legacy v1 evidence engine, registry
  framework, evidence packets, audit replay, governance, reviews,
  and module readiness.
- **Vol V — Canonical Doctrines.** Preserves claims governance,
  controlled disclosure, replay, audit, portability, and
  internal-certification-only boundaries.
- **Vol VI — Source Intelligence Integration.** Every composed
  certification dimension remains behind a public-safe DTO; no raw
  borrower / sponsor records, no live external fetch, no
  source-certainty claim, and no portable external conformance
  claim.

---

## §2 Architecture

- `src/lib/certification/engineV2Runtime.ts` — canonical v2 runtime.
- `src/app/api/governance/certification-engine-v2/route.ts` —
  governed POST (runtime guard, classification, version lineage,
  observability, explainability, evidence persistence).
- `src/app/governance/certification-engine-v2/page.tsx` — internal
  reviewer surface.

---

## §3 Registry seed

Composes from existing Capital Graph (23 programs), Customer Type
Registry (20 types), Evidence Engine v2 + the full canonical v2
stack, and the v1 internal certification engine (4 domains).

---

## §4 Event contract

`governance.certification.engine.v2.composed` —
`src/lib/modules/eventContractRegistry.ts`.

- `classificationLevel`: `RESTRICTED`
- `replayRequired`: `true`
- `productionBlocked`: `true`
- `publicSurfaceAllowed`: `false`
- Payload digest: `v2_dimension_count`, `v2_certified_count`,
  `v2_blocked_count`, `v2_overall_readiness_percent`,
  `v1_domain_count`, `v1_certified_count`, `v1_blocked_count`,
  `cross_source_conflict_count`, `customer_type_coverage_count`,
  `capital_program_coverage_count`.

---

## §5 Module integration plan

`governance-certification-engine-v2` publishes
`governance.certification.engine.v2.composed`; consumes the
upstream canonical v2 stack events plus v1 evidence pack /
certification posture / intelligence composed events. Sixteen
governed handoffs (≥ 14 minimum).

---

## §6 Verification gates

`npx tsc --noEmit`, `npm run smoke:certification-engine-v2`,
upstream v2 smokes, `npm run verify:module-manifests`,
`npm run smoke:public-surfaces`, `npm run smoke:claims-public`,
`npm run smoke:redaction`, `npm run smoke:replay-cross-module`,
`npm run build`.

CI step `Certification Engine v2` is wired into
`.github/workflows/ci.yml`.

---

## §7 Conformance requirements

- Runtime version must equal
  `certification-engine-v2-runtime-v0.1.0`.
- Composition deterministic and replay-safe; conflict signals
  preserved as first-class evidence.
- All three v2 dimensions always exposed; embedded v1 4-domain
  posture always exposed.
- Module manifest, event contract, ≥ 14 handoffs, consumer-event
  registration: all enforced.

---

## §8 Build sequence

1. Implement `engineV2Runtime.ts`.
2. Wire route + page.
3. Register module manifest, event contract, handoffs.
4. Add `governance.certification.engine.v2.composed` to consumer
   eventsConsumed lists.
5. Add adjacency.
6. Write smoke + register `npm run smoke:certification-engine-v2`.
7. Add CI step.
8. Run verification gates; commit, push, open PR, merge.

---

## §9 Operator instructions (Caitlin)

- Composes EE v2 + the full canonical v2 stack + v1 internal
  certification engine into one advisory internal-certification
  posture.
- No autonomous decisions, no external certification, no public
  verification, no regulatory reliance.
- Each v2 dimension carries a status (`CERTIFIED_INTERNAL_REVIEW_
  BOUND`, `REVIEW_PENDING`, `BLOCKED_BY_GATE`, `NOT_STARTED`) and a
  readiness percentage; v1 domain statuses appear alongside.
- Cross-source conflicts surfaced as first-class evidence.
- Use `/governance/certification-engine-v2` or the API
  `POST /api/governance/certification-engine-v2`.
