# Build 26 — Environmental Intake v2

Environmental Intake v2 is the twelfth downstream consumer of the
Universal Capital Graph (Build 13) and Customer Type Registry
(Build 14), composed on top of Revenue Intelligence v2 (Build 15),
Financing Pathway Engine v2 (Build 16), Opportunity Discovery v2
(Build 17), and Borrower Onboarding Core v2 (Build 24). It joins:

- The legacy v1 `evaluateEnvironmentalIntake` runtime (NEPA
  screening / Phase I ESA / state environmental review / exemption
  pathway routing) preserved as an additive compatibility bridge.
- Borrower Onboarding Core v2 (which composes the full canonical v2
  stack).
- Three new v2 governed environmental signals:
  - `environmental_customer_type_alignment` — matched customer
    types declaring environmental-eligible Capital Graph categories
    (ENVIRONMENTAL_MARKETS, CARBON_MARKETS, ENERGY_CREDITS,
    UTILITY_INCENTIVES, REAP);
  - `environmental_capital_program_alignment` — Capital Graph-backed
    grant cards available;
  - `environmental_pathway_v2_alignment` — upstream BO v2
    cross-source conflict propagation gating.
- Cross-source conflicts: legacy v1 TRIGGERED pathway vs v2 no
  environmental Capital Graph coverage; legacy v1
  POTENTIAL_EXEMPTION vs v2 environmental programs available;
  upstream BO v2 conflict propagation.

Operational guidance and review routing only. No external
environmental provider engagement, fee authorization, official
environmental report, environmental clearance, NEPA determination,
Phase I ESA report, or permit issued. Environmental Engineering
Spoke isolation preserved.

Version lineage:
`environmental-intake-v2-runtime-v0.1.0` → BO v2 → OD v2 → FPE v2 →
RI v2 → Customer Type → Capital Graph → v1 environmental intake.

Module manifest, RESTRICTED event contract
`governance.environmental.intake.v2.composed`, 17 governed handoffs.
