# Build 32 — Document Evidence Reconciliation Workflow v1

Identifies missing, conflicting, incomplete, or unreconciled
borrower-provided documents and converts each variance into a
respectful clarification request, third-party verification
recommendation, or human-review escalation — never rejection,
accusation, or false conclusion.

This is Build 32, a sibling to Build 31 (Evidence Resolution
Workflow v1, general variance detection across the v2 backbone).
Build 31 focuses on declared / signal-level variance from the
canonical v2 modules. Build 32 focuses on financial DOCUMENT
pair-wise reconciliation.

## Purpose (verbatim)

Prevent Furlong from saying "no" merely because documents do not
reconcile yet. The system should say: "These items do not currently
line up. Here is what appears inconsistent, why it matters, and
what additional information may resolve it."

## Composed sources

- **Evidence Resolution Workflow v1** (Build 31) — upstream
  variance detection across the v2 backbone.
- **Readiness Assessment v2** (Build 25) — readiness signals and
  cross-source conflicts.
- **Borrower Onboarding Core v2** (Build 24) — declared customer
  types, intended uses, cross-source conflicts.
- Borrower-provided document references: tax returns, P&L
  statements, rent rolls, property ownership records,
  environmental report appendices.

## Eight resolution outputs

- `CONSISTENT` — pair reconciles within tolerance.
- `INCOMPLETE` — one side missing; request the missing document.
- `UNRESOLVED_VARIANCE` — values differ but are explainable (e.g.
  depreciation, deductions); request clarification.
- `MATERIAL_CONFLICT` — values differ beyond explainable
  tolerance; request clarification + flag for human review.
- `CLARIFICATION_REQUESTED` — additional context is required
  (e.g. referenced appendix not provided).
- `THIRD_PARTY_VERIFICATION_RECOMMENDED` — borrower-declared fact
  is inconsistent with an external-records-class reference (e.g.
  property ownership); recommend third-party verification.
- `HUMAN_REVIEW_REQUIRED` — variance cannot be reconciled through
  borrower clarification alone.
- `BLOCKED_BY_CONFLICT` — upstream cross-source conflict
  propagated; reconciliation cannot proceed.

## Pair-wise reconciliation rules

| Rule | Comparison | Tolerance | Variance handling |
| --- | --- | --- | --- |
| 1 | Tax return net income vs P&L operating cash flow | 25% | UNRESOLVED_VARIANCE when depreciation/deductions declared; MATERIAL_CONFLICT otherwise |
| 2 | Tax return gross revenue vs P&L reported revenue | 10% / 25% | CONSISTENT / UNRESOLVED_VARIANCE / MATERIAL_CONFLICT |
| 3 | Rent roll presence (income property) | — | INCOMPLETE when missing for declared rental income |
| 4 | Borrower-declared owner vs external records owner | exact match | CONSISTENT / THIRD_PARTY_VERIFICATION_RECOMMENDED |
| 5 | Environmental report appendix references | full provision | CLARIFICATION_REQUESTED when any referenced appendix is missing |
| 6 | Borrower-provided document conflict with no explanation | — | HUMAN_REVIEW_REQUIRED when ≥ 1 UNRESOLVED_VARIANCE or MATERIAL_CONFLICT and no borrower explanation note |
| 7 (wrap-up) | All other findings CONSISTENT | — | Adds FULLY_CONSISTENT_PACKET finding |

## Four governed reconciliation signals

- `reconciliation_explanation_alignment` — every finding has a
  plain-English explanation and a why-it-matters statement.
- `reconciliation_evidence_alignment` — every finding carries a
  replay-safe evidence or source reference.
- `reconciliation_clarification_alignment` — every non-consistent
  finding carries a clarification path and a next recommended
  action; nothing collapses to denial.
- `reconciliation_material_conflict_routing_alignment` — every
  MATERIAL_CONFLICT and HUMAN_REVIEW_REQUIRED finding carries
  `humanReviewFlag = true`.

## Five cross-source conflict classes

- `der-v1-upstream-evidence-resolution-conflicts` — upstream ERW
  v1 conflicts propagated.
- `der-v1-upstream-readiness-conflicts` — upstream RA v2 conflicts
  propagated.
- `der-v1-upstream-borrower-onboarding-conflicts` — upstream BO v2
  conflicts propagated.
- `der-v1-material-conflict-without-human-review` — MATERIAL_
  CONFLICT finding failed to set `humanReviewFlag = true`
  (constitutional routing failure).
- `der-v1-banned-accusatory-language` — banned accusatory token
  detected in a reconciliation output.

## Banned-accusatory token registry

The workflow refuses to emit any of these tokens in finding text.
Detection is negation-aware, so disclaimers like "this is not a
fraud accusation" don't fail the gate:

```
fraud, fraudulent,
fake document, fake documents, fake invoice, fake statement,
forged, forgery, falsified, falsification,
misrepresented, misrepresentation,
lying, lied, liar,
deceit, deception, deceptive,
denied, denial, rejected, rejection,
approved, preapproved, guaranteed,
lender commitment,
underwriting decision, credit decision,
legal conclusion, regulatory determination,
public verification, regulatory reliance, legal reliance
```

## Constitutional posture (hard rules)

- Never accuse fraud.
- Never say a document is fake.
- Never say the borrower is lying.
- Never make a legal conclusion.
- Never make an underwriting decision.
- Never convert unreconciled evidence into automatic denial.
- Never hide conflicting evidence.
- Always ask for clarification when additional context could
  resolve the variance.
- Always preserve conflict lineage for replay.
- Always distinguish "missing," "inconsistent," "unverified," and
  "material conflict."

Every finding carries:
- `uncertaintyPreservedFlag: true`
- `conflictLineagePreservedFlag: true`
- `classificationLevel: "RESTRICTED"`
- `redactionRequired: true`
- A plain-English explanation, why-it-matters, what-may-resolve-
  it, next-recommended-action, evidence refs, source refs,
  advisory disclaimer, and a reviewer-role assignment.

Material conflicts and human-review-required findings carry
`humanReviewFlag: true` and route to QUALIFIED_GOVERNANCE_REVIEWER
or THIRD_PARTY_RECORDS_AUTHORITY.

Internal advisory document-reconciliation posture only. The
runtime does NOT create:

- denial, rejection, fraud accusation, document-fakeness
  accusation, borrower-lying accusation, misrepresentation
  accusation, legal conclusion, underwriting decision,
- approval, preapproval, guarantee, lender commitment, agency
  decision, official certification,
- public verification, regulatory reliance, legal reliance,
- source certainty claim, live external action, payment
  authorization, notice send,
- autonomous lending / eligibility / pathway / opportunity /
  intelligence / evidence / certification / onboarding / readiness
  / environmental-intake / environmental-compliance /
  environmental-risk / environmental-escalation determination,
- automatic denial, conflict hiding, external escalation
  notification, third-party queue submission, paging.

Environmental Engineering Spoke isolation preserved. Sovereign-
tier findings hidden unless named federation participation is
authorized (CANON-SOVEREIGNTY-001). Borrower fee autonomy
preserved (CANON-ECON-001).

## Master Volume Governance

- **Vol I** — keeps reconciliation subordinate to constitutional
  authority and accountable human review.
- **Vol II** — blocks the workflow from becoming denial, fraud
  accusation, lender commitment, agency decision, official
  certification, public verification, regulatory reliance, or
  legal reliance.
- **Vol III** — deterministic, replay-safe composition with
  explicit version lineage chaining
  `document-evidence-reconciliation-runtime-v0.1.0` →
  `evidence-resolution-workflow-runtime-v0.1.0` →
  `readiness-assessment-v2-runtime-v0.1.0` →
  `borrower-onboarding-core-v2-runtime-v0.1.0` → ... → Customer
  Type → Capital Graph.
- **Vol III-B** — runtime evidence with classification,
  observability, explainability, replay verification.
- **Vol IV** — routes findings to BORROWER_INTAKE_REVIEWER /
  QUALIFIED_GOVERNANCE_REVIEWER / DOCUMENT_VERIFICATION_REVIEWER /
  THIRD_PARTY_RECORDS_AUTHORITY, and routes governed handoffs to
  upstream v2 modules, applications, documents, data-rights,
  evidence packets, audit replay, governance, reviews, module
  readiness.
- **Vol V** — preserves CANON-ECON-001 fee disclosure, CANON-
  SOVEREIGNTY-001 sovereign review, claims governance, controlled
  disclosure, replay, audit, advisory-only boundaries.
- **Vol VI** — public-safe DTO; no live external fetch; no
  source-certainty claim.

## Smoke scenarios (all passing)

1. Tax return income lower than operating cash flow because of
   depreciation/deductions → **UNRESOLVED_VARIANCE** with
   clarification requested (BORROWER_INTAKE_REVIEWER).
2. P&L revenue conflicts with tax return revenue by > 25% →
   **MATERIAL_CONFLICT** routed to QUALIFIED_GOVERNANCE_REVIEWER
   with `humanReviewFlag: true`.
3. Missing rent roll for declared income property → **INCOMPLETE**.
4. Property ownership mismatch between intake and external records
   → **THIRD_PARTY_VERIFICATION_RECOMMENDED** routed to
   THIRD_PARTY_RECORDS_AUTHORITY.
5. Environmental report references missing appendix items →
   **CLARIFICATION_REQUESTED**.
6. Conflicting borrower-provided documents with no explanation
   note → **HUMAN_REVIEW_REQUIRED** with `humanReviewFlag: true`.
7. Fully consistent document packet → every finding **CONSISTENT**
   plus a `FULLY_CONSISTENT_PACKET` wrap-up finding.

## Module manifest and event contract

- Module manifest:
  `governance-document-evidence-reconciliation`, route
  `/governance/document-evidence-reconciliation`, internal
  audience, production-blocked, replay-required, public surface
  disallowed.
- Event contract:
  `governance.document.evidence.reconciliation.evaluated`,
  RESTRICTED, production-blocked, replay-required, public surface
  disallowed.
- 15 governed handoffs.

## Verification

- `npx tsc --noEmit` — clean.
- `npm run smoke:document-evidence-reconciliation` — 7 scenarios
  passed.
- `npm run verify:module-manifests` — 97 modules, 87 event
  contracts, 512 handoffs, conformance passed.
- `npm run smoke:replay-cross-module` — passed.
- `npm run smoke:public-surfaces` — passed.
- `npm run smoke:claims-public` — 0 findings.
- `npm run smoke:redaction` — passed.
- `npm run build` — passed.
