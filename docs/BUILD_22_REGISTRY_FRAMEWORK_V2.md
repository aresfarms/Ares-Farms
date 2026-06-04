# Build 22 — Registry Framework v2

Registry Framework v2 is the eighth downstream consumer of the
Universal Capital Graph (Build 13) and the Customer Type Registry
(Build 14), composed on top of Builds 15–21. It produces a unified,
deterministic, replay-safe, audit-safe, conflict-preserving advisory
internal-registry posture that joins:

- The legacy v1 `evaluateRegistryFramework` runtime (7 catalogs:
  modules, public_surfaces, event_contracts, handoffs,
  source_authorities, controlled_promotion, participant_roles)
  preserved as an additive compatibility bridge.
- Four new v2 governed registry catalogs derived from the canonical
  v2 stack:
  - `capital_program_catalog` — Capital Graph CapitalProgram entries
    with sponsor authority, federation scope, category, blocked
    claims, doctrine refs;
  - `customer_type_catalog` — Customer Type Registry entries with
    archetype, federation, eligible capital categories, review
    boundary;
  - `capital_category_catalog` — Capital Graph canonical 23-category
    taxonomy with governance posture;
  - `certification_posture_catalog` — Certification Engine v2
    per-dimension status, readiness, blocking gates, review signals.
- Cross-source conflict signals when v2 catalogs are empty while v1
  is populated, upstream CE v2 surfaces cross-source conflicts, or
  v1 certification reports blocked-gate domains while registry
  catalogs remain populated.

Registry Framework v2 output is internal registry evidence only.
Registry output remains internal evidence unless separately promoted
through governed controlled-promotion gates.

---

## §1 Canonical doctrine

- **Vol I.** Framework subordinate to constitutional authority.
- **Vol II.** Blocks external promotion, public verification,
  regulatory reliance, lender commitment, legal reliance.
- **Vol III.** Deterministic, replay-safe; version lineage chains
  `registry-framework-v2-runtime-v0.1.0` →
  `certification-engine-v2-runtime-v0.1.0` →
  `governance-evidence-engine-v2-runtime-v0.1.0` →
  `advanced-intelligence-v2-runtime-v0.1.0` →
  `lender-workflow-v2-runtime-v0.1.0` →
  `opportunity-discovery-v2-runtime-v0.1.0` →
  `financing-pathway-engine-v2-runtime-v0.1.0` →
  `revenue-intelligence-v2-runtime-v0.1.0` →
  `customer-type-runtime-v0.1.0` →
  `capital-graph-runtime-v0.1.0` →
  `registry-framework-runtime-v0.1.0`.
- **Vol III-B.** Runtime guard, classification, observability,
  explainability, replay verification.
- **Vol IV.** 17 governed handoffs across the canonical stack and
  downstream consumers.
- **Vol V.** Claims governance, controlled disclosure, replay,
  audit, internal-registry-only boundaries.
- **Vol VI.** Public-safe DTO posture; no live external fetch; no
  source-certainty claim.

---

## §2 Architecture

- `src/lib/registry/frameworkV2Runtime.ts` — runtime.
- `src/app/api/governance/registry-framework-v2/route.ts` — governed
  POST.
- `src/app/governance/registry-framework-v2/page.tsx` — reviewer
  surface with expandable per-catalog entry lists.

---

## §3 Registry seed

23 Capital Programs + 20 Customer Types + 23 Capital Categories + 3
v2 certification dimensions = ≥ 69 v2 entries, plus the legacy v1
7-catalog 500+ entry pack.

---

## §4 Event contract

`governance.registry.framework.v2.composed` — RESTRICTED,
replay-required, production-blocked, public-surface disallowed. 17
consumer module IDs.

---

## §5 Module integration plan

Publishes `governance.registry.framework.v2.composed`; consumes the
upstream canonical v2 stack events plus v1 evidence pack /
certification posture / intelligence composed / registry framework
composed events. 17 governed handoffs from
`governance-registry-framework-v2`.

---

## §6 Verification gates

`npx tsc --noEmit`, `npm run smoke:registry-framework-v2`, all
upstream v2 smokes, `npm run verify:module-manifests`,
`npm run smoke:public-surfaces`, `npm run smoke:claims-public`,
`npm run smoke:redaction`, `npm run smoke:replay-cross-module`,
`npm run build`. CI step `Registry Framework v2` is wired in.

---

## §7 Conformance requirements

- Runtime version must equal
  `registry-framework-v2-runtime-v0.1.0`.
- Deterministic, replay-safe; conflict signals preserved.
- All four canonical v2 catalogs always exposed; embedded v1 7-catalog
  pack always exposed.
- Module manifest, event contract, ≥ 14 handoffs, consumer-event
  registration: enforced.

---

## §8 Build sequence

1. Implement `frameworkV2Runtime.ts`.
2. Wire route + page.
3. Register module manifest, event contract, handoffs.
4. Add event to consumer eventsConsumed lists.
5. Adjacency.
6. Smoke + register `npm run smoke:registry-framework-v2`.
7. CI step.
8. Verification gates; commit, push, open PR, merge.

---

## §9 Operator instructions

- Composes CE v2 + the full canonical v2 stack + v1 registry
  framework into one advisory internal-registry pack with 4 v2
  catalogs (capital programs, customer types, capital categories,
  certification posture) and the embedded v1 pack.
- No autonomous decisions, no external promotion, no public
  verification, no regulatory reliance. Internal evidence unless
  separately promoted through governed controlled-promotion gates.
- Use `/governance/registry-framework-v2` or the API
  `POST /api/governance/registry-framework-v2`.
