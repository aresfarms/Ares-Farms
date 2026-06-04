# Build 24 — Borrower Onboarding Core v2

Borrower Onboarding Core v2 is the borrower entry point of the
canonical v2 backbone. It is the tenth downstream consumer of the
Universal Capital Graph (Build 13) and the Customer Type Registry
(Build 14), composed on top of Revenue Intelligence v2 (Build 15),
Financing Pathway Engine v2 (Build 16), and Opportunity Discovery
v2 (Build 17). It joins:

- The legacy v1 `createBorrowerOnboardingWorkflow` runtime
  (readinessPercent, missing items, default handoffs, disclosures)
  preserved as an additive compatibility bridge.
- Opportunity Discovery v2 (which composes FPE v2 + RI v2 +
  Customer Type + Capital Graph + all upstream legacy bridges)
  using the declared customer types, intended uses, farm types,
  goals, and jurisdiction derived from the onboarding state.
- Per-customer-type onboarding summaries (matched customer type,
  archetype, federation scope, Capital Graph-backed grant card
  count, legacy v1 discovery section count, cross-source conflict
  count).
- Cross-source conflict signals: legacy v1 100% readiness with v2
  empty matches, financing interest with no grants, sovereign
  customer types declared without sovereign federation
  authorization, upstream OD v2 conflict propagation.

Advisory borrower intake-and-discovery posture only. No autonomous
onboarding / eligibility / pathway / opportunity / intelligence /
evidence / certification determination, credit decision, lender
commitment, public verification, regulatory reliance, source
certainty claim, notice send, or legal reliance.

Version lineage:
`borrower-onboarding-core-v2-runtime-v0.1.0` → OD v2 → FPE v2 → RI
v2 → Customer Type → Capital Graph → v1 borrower onboarding.

Module manifest, RESTRICTED event contract
`governance.borrower.onboarding.core.v2.composed`, 18 governed
handoffs.
