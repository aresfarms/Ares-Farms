# Build 31 — Evidence Resolution Workflow v1

Detects unresolved variances across the canonical v2 backbone,
converts each variance into a clarification request with non-
accusatory language, preserves cross-source conflicts as
first-class evidence, and routes to human review when
reconciliation is not possible through borrower clarification
alone.

This is the first build to address the "uncertainty is not denial"
boundary explicitly. The workflow exists to make sure the system
never treats a gap as a rejection, never accuses a borrower of
fraud, and never collapses a conflict into a determination.

## Purpose (verbatim per Caitlin)

- detect unresolved variances
- avoid false rejection
- request clarification
- preserve conflicts
- route to human review when needed
- never accuse fraud
- never treat uncertainty as denial

## What is composed

- **Readiness Assessment v2** (Build 25) — general v1 6-section
  readiness + 3 v2 governed readiness signals + cross-source
  conflicts.
- **Borrower Onboarding Core v2** (Build 24) — declared customer
  types, intended uses, cross-source conflicts.
- **Environmental Escalation Engine v2** (Build 30) — environmental
  escalation queue + upstream EC v2 / ERA v2 / EI v2 conflict
  propagation.

## Five variance categories

- `SECTION_INCOMPLETE` — readiness section reports NEEDS_INPUT.
- `SIGNAL_BLOCKED` — upstream governed signal reports
  BLOCKED_BY_CONFLICT.
- `CROSS_SOURCE_CONFLICT` — upstream cross-source conflict
  propagated from RA v2 / BO v2 / EEE v2.
- `DATA_GAP` — declarative descriptor in UNKNOWN.
- `EVIDENCE_REFERENCE_MISSING` — required evidence ref not present.

## Three resolution paths

- `BORROWER_CLARIFICATION` — 14-day window, routed to
  `BORROWER_INTAKE_REVIEWER`.
- `REVIEWER_CLARIFICATION` — 7-day window, routed to
  `QUALIFIED_GOVERNANCE_REVIEWER`.
- `REQUIRES_HUMAN_REVIEW` — 5-day window, routed to the canonical
  reviewer role for the source module.

## Four governed workflow signals

- `variance_detection_alignment` — every detected variance is
  converted into a clarification request (none silently dropped).
- `clarification_routing_alignment` — every clarification request
  carries a reviewer route, an evidence reference, and a timeline.
- `false_rejection_prevention_alignment` — no clarification
  request frames uncertainty as rejection.
- `fraud_accusation_prevention_alignment` — no clarification
  request contains banned accusatory language.

## Five cross-source conflict classes

- `erw-v1-upstream-eee-v2-conflicts` — upstream Environmental
  Escalation Engine v2 propagated conflicts.
- `erw-v1-upstream-ra-v2-conflicts` — upstream Readiness Assessment
  v2 propagated conflicts.
- `erw-v1-upstream-bo-v2-conflicts` — upstream Borrower Onboarding
  Core v2 propagated conflicts.
- `erw-v1-clarification-routing-missing` — router missed at least
  one variance.
- `erw-v1-banned-accusatory-language` — banned accusatory token
  detected in a clarification request (constitutional failure).

## Banned-accusatory token registry

The workflow refuses to emit any of the following tokens in
clarification request text. Detection is negation-aware, so
disclaimers like "we will never accuse fraud" don't fail the gate:

```
fraud, fraudulent, falsification, falsified,
misrepresentation, misrepresented, lying, lied,
deceit, deception, deceptive,
denied, denial, rejected, rejection,
approved, preapproved, guaranteed,
lender commitment, public verification,
regulatory reliance, legal reliance
```

## Constitutional posture

Internal advisory evidence resolution workflow only. The runtime
does NOT create:

- denial, rejection, fraud accusation, misrepresentation
  accusation,
- approval, preapproval, guarantee,
- autonomous lending / eligibility / pathway / opportunity /
  intelligence / evidence / certification / onboarding / readiness
  / environmental-intake / environmental-compliance /
  environmental-risk / environmental-escalation determination,
- credit decision, lender commitment, agency decision, official
  certification,
- public verification, regulatory reliance, legal reliance,
- source certainty claim, live external action, payment
  authorization, notice send.

**Uncertainty is not denial.** NEEDS_INPUT signals stay
NEEDS_INPUT. Every clarification request carries the
`uncertaintyPreservedFlag` and resolves to
`REQUIRES_HUMAN_REVIEW`. Cross-source conflicts are preserved as
first-class evidence and never collapsed.

Environmental Engineering Spoke isolation preserved. Sovereign-
tier clarification requests are hidden unless named federation
participation is authorized (CANON-SOVEREIGNTY-001). Borrower fee
autonomy preserved (CANON-ECON-001).

## Master Volume Governance

- **Vol I** — keeps the workflow subordinate to constitutional
  authority and accountable human review.
- **Vol II** — blocks the workflow from becoming denial, rejection,
  eligibility, approval, autonomous determination, fraud
  accusation, lender commitment, public verification, regulatory
  reliance, or legal reliance.
- **Vol III** — deterministic, replay-safe composition with
  explicit version lineage chaining
  `evidence-resolution-workflow-runtime-v0.1.0` →
  `readiness-assessment-v2-runtime-v0.1.0` →
  `borrower-onboarding-core-v2-runtime-v0.1.0` →
  `environmental-escalation-engine-v2-runtime-v0.1.0` → ... →
  `capital-graph-runtime-v0.1.0`.
- **Vol III-B** — runtime evidence with classification,
  observability, explainability, replay verification.
- **Vol IV** — routes clarification requests to
  BORROWER_INTAKE_REVIEWER / QUALIFIED_GOVERNANCE_REVIEWER /
  ENVIRONMENTAL_ENGINEERING_SPOKE_REVIEWER /
  SOVEREIGN_FEDERATION_AUTHORITY, and routes governed handoffs to
  upstream v2 modules, applications, documents, data-rights,
  evidence packets, audit replay, governance, reviews, module
  readiness.
- **Vol V** — preserves CANON-ECON-001 fee disclosure,
  CANON-SOVEREIGNTY-001 sovereign review, claims governance,
  controlled disclosure, replay, audit, advisory-only boundaries.
- **Vol VI** — public-safe DTO; no live external fetch; no
  source-certainty claim.

## Module manifest and event contract

- Module manifest: `governance-evidence-resolution-workflow`,
  route `/governance/evidence-resolution-workflow`, internal
  audience, production-blocked, replay-required, public surface
  disallowed.
- Event contract:
  `governance.evidence.resolution.workflow.composed`, RESTRICTED,
  production-blocked, replay-required, public surface disallowed.
- 14 governed handoffs.

## Verification

- `npx tsc --noEmit` — clean.
- `npm run smoke:evidence-resolution-workflow` — passed
  (4 scenarios: default empty input → zero variances + 100%
  readiness; spoke-blocked → 5 clarification requests routed to
  spoke reviewer with zero fraud-accusation-risk; tribal sovereign-
  closed → upstream conflict propagation with sovereign-tier
  entries hidden; tribal sovereign-authorized → SOVEREIGN_FEDERATION
  _AUTHORITY clarification visible).
- `npm run verify:module-manifests` — 96 modules, 86 event
  contracts, 497 handoffs, conformance passed.
- `npm run smoke:replay-cross-module` — passed.
- `npm run smoke:public-surfaces` — passed.
- `npm run smoke:claims-public` — 0 findings.
- `npm run smoke:redaction` — passed.
- `npm run build` — passed.
