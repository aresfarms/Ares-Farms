# Build 25 — Readiness Assessment v2

Readiness Assessment v2 is the eleventh downstream consumer of the
Universal Capital Graph (Build 13) and the Customer Type Registry
(Build 14), composed on top of Revenue Intelligence v2 (Build 15),
Financing Pathway Engine v2 (Build 16), Opportunity Discovery v2
(Build 17), and Borrower Onboarding Core v2 (Build 24). It joins:

- The legacy v1 `assessBorrowerReadiness` runtime (6 sections:
  borrower_intake, financing_pathway, documents, environmental,
  opportunity_discovery, data_rights) preserved as an additive
  compatibility bridge.
- Borrower Onboarding Core v2 (which composes the full canonical v2
  stack at the borrower-context scope). The BO v2 pack provides
  matched customer profiles, Capital Graph-backed grant card counts,
  legacy v1 discovery section counts, and propagated cross-source
  conflicts that inform readiness signals.
- Three new v2 governed readiness signals:
  - `customer_type_readiness` — matched customer profile count vs
    declared customer type count;
  - `capital_graph_readiness` — Capital Graph-backed grant card
    coverage;
  - `pathway_v2_readiness` — upstream cross-source conflict
    propagation gating.
- Cross-source conflict signals: legacy v1 READY_FOR_REVIEW sections
  while v2 stack returned no Capital Graph coverage, legacy v1 high
  overall readiness while v2 matched no customer profiles, upstream
  BO v2 cross-source conflict propagation, v2 readiness signals
  reporting BLOCKED_BY_CONFLICT.

Advisory borrower guidance only. No autonomous readiness /
onboarding / eligibility / pathway / opportunity / intelligence /
evidence / certification determination, credit decision, lender
commitment, public verification, regulatory reliance, source
certainty claim, notice send, or legal reliance.

Version lineage:
`readiness-assessment-v2-runtime-v0.1.0` → BO v2 → OD v2 → FPE v2 →
RI v2 → Customer Type → Capital Graph → v1 readiness assessment.

Module manifest, RESTRICTED event contract
`governance.readiness.assessment.v2.composed`, 18 governed handoffs.
