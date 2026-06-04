# Build 30 — Environmental Escalation Engine v2

The fifteenth downstream consumer of the canonical v2 backbone.
Composes Environmental Risk Assessment v2 (Build 29) into a
deterministic escalation routing engine that maps gate failures,
BLOCKED_BY_CONFLICT risk signals, and upstream cross-source
conflicts into a canonical escalation queue.

No v1 environmental-escalation runtime exists; this is a v2-native
composition.

## Five escalation tiers

| Tier | Reviewer | Timeline |
| --- | --- | --- |
| `ROUTINE` | `BORROWER_INTAKE_REVIEWER` | 30 days |
| `ACCELERATED` | `QUALIFIED_GOVERNANCE_REVIEWER` | 10 days |
| `URGENT` | `ENVIRONMENTAL_ENGINEERING_SPOKE_REVIEWER` | 3 days |
| `SOVEREIGN_REVIEW` | `SOVEREIGN_FEDERATION_AUTHORITY` | 14 days |
| `NO_ESCALATION` | — | — |

Sovereign-tier entries are HIDDEN from the queue unless
`sovereignFederationAllowed === true` (CANON-SOVEREIGNTY-001).

## Four governed escalation signals

- `escalation_routing_alignment` — every queue entry carries an
  explicit review route.
- `escalation_evidence_alignment` — every entry carries a
  replay-safe evidence reference.
- `escalation_reviewer_assignment_alignment` — every entry is
  routed to the canonical tier reviewer role.
- `escalation_timeline_alignment` — every entry declares the
  canonical timeline for its tier.

## Three cross-source conflict classes

- `eee-v2-upstream-era-v2-conflicts` — upstream Environmental Risk
  Assessment v2 cross-source conflicts propagated.
- `eee-v2-router-missed-upstream-blockers` — upstream EC v2 + ERA
  v2 surfaced blockers but the router produced no queue entries.
- `eee-v2-sovereign-tier-without-authorization` — sovereign-tier
  entries present (in the unfiltered queue) without sovereign
  federation authorization.

## Constitutional posture

Internal advisory escalation routing only. Every escalation entry
resolves to `REQUIRES_HUMAN_REVIEW`. The runtime does NOT create:

- external escalation notification,
- external ticket creation,
- third-party queue submission,
- paging,
- autonomous resolution,
- external environmental provider engagement, fee authorization,
- official environmental report, environmental clearance, NEPA
  determination, Phase I/II/III ESA report, permit issued,
- autonomous environmental escalation / risk / compliance / intake
  / onboarding / readiness / customer eligibility / pathway /
  opportunity / intelligence / evidence / certification
  determination,
- credit decision, lender commitment, program approval, tax-credit
  allocation, carbon-credit issuance,
- public verification, regulatory reliance, legal reliance,
- source certainty claim, live external action, notice send,
  payment authorization.

Environmental Engineering Spoke isolation preserved.

## Master Volume Governance

- **Vol I** — ROLE-ARCH-001 spoke isolation; constitutional
  authority preserved.
- **Vol II** — escalation routing is review-bound, not a
  determination.
- **Vol III** — deterministic, replay-safe composition with
  explicit version lineage chaining
  `environmental-escalation-engine-v2-runtime-v0.1.0` →
  `environmental-risk-assessment-v2-runtime-v0.1.0` →
  `environmental-compliance-v2-runtime-v0.1.0` →
  `environmental-intake-v2-runtime-v0.1.0` → BO v2 → OD v2 →
  FPE v2 → RI v2 → Customer Type → Capital Graph.
- **Vol III-B** — runtime evidence with classification,
  observability, explainability, replay verification.
- **Vol IV** — routes escalation entries to upstream v2 modules,
  environmental-compliance v1, portal-borrower-environmental-
  intake, applications, documents, data-rights, evidence packets,
  audit replay, governance, reviews, module readiness.
- **Vol V** — CANON-SOVEREIGNTY-001 sovereign-tier hiding;
  CANON-ECON-001 borrower autonomy preserved.
- **Vol VI** — public-safe DTO; no external escalation
  notification.

## Module manifest and event contract

- Module manifest:
  `governance-environmental-escalation-engine-v2`, route
  `/governance/environmental-escalation-engine-v2`, internal
  audience, production-blocked, replay-required, public surface
  disallowed.
- Event contract:
  `governance.environmental.escalation.engine.v2.composed`,
  RESTRICTED, production-blocked, replay-required, public surface
  disallowed.
- 20 governed handoffs.

## Verification

- `npx tsc --noEmit` — clean.
- `npm run smoke:environmental-escalation-engine-v2` — passed
  (4 scenarios: exempt empty queue, spoke-isolation-blocked
  produces URGENT entries, sovereign-closed hides sovereign-tier
  entries, sovereign-authorized exposes SOVEREIGN_REVIEW).
- `npm run verify:module-manifests` — 95 modules, 85 event
  contracts, 483 handoffs, conformance passed.
- `npm run smoke:replay-cross-module` — passed.
- `npm run smoke:public-surfaces` — passed.
- `npm run smoke:claims-public` — 0 findings.
- `npm run smoke:redaction` — passed.
- `npm run build` — passed.
