# Build 28 — Environmental Compliance v2

Environmental Compliance v2 is the thirteenth downstream consumer of
the Universal Capital Graph (Build 13) and Customer Type Registry
(Build 14), composed on top of Revenue Intelligence v2 (Build 15),
Financing Pathway Engine v2 (Build 16), Opportunity Discovery v2
(Build 17), Borrower Onboarding Core v2 (Build 24), Readiness
Assessment v2 (Build 25), and Environmental Intake v2 (Build 26). It
composes the canonical v2 stack with a pure-functional advisory
replay of the v1 environmental-compliance gate semantics.

## What is composed

- **Environmental Intake v2** (Build 26) — composes Borrower
  Onboarding Core v2 + the full canonical v2 stack + the legacy v1
  environmental intake runtime (NEPA / Phase I ESA / state
  environmental review / exemption pathway routing).
- **A pure-functional advisory replay** of the v1
  `environmentalComplianceStore.gateSnapshot` semantics. The v1
  store is a DB writer for `environmental_compliance_records` and
  `borrower_protection_fee_controls`. The v2 runtime does NOT write
  to those tables — it composes an advisory posture only. The v1
  store remains the canonical write path; this v2 runtime composes
  the canonical advisory view of that gate posture without DB side
  effects.
- **Four new v2 governed compliance signals**:
  - `compliance_provider_license_alignment` — provider type
    allowed, provider license ref present, provider license
    verified.
  - `compliance_fee_disclosure_alignment` — fee disclosure ref
    present, fee disclosed before initiation, borrower external-firm
    right preserved, no fee surcharge or preference.
  - `compliance_spoke_isolation_alignment` — Environmental
    Engineering Spoke isolation confirmed, Banker Spoke isolation
    confirmed. **Failure escalates to BLOCKED_BY_CONFLICT**, not
    NEEDS_INPUT — Vol I ROLE-ARCH-001 treats spoke isolation as a
    constitutional gate.
  - `compliance_audit_anchor_alignment` — audit anchor ref present,
    escalation ref present when assessment outcome is CONDITIONAL /
    ESCALATED / FAILED.
- **Cross-source conflict signals** preserved as first-class
  evidence:
  - `ec-v2-gate-blocked-capital-coverage-present` — v1 gate posture
    blocked while v2 environmental Capital Graph coverage is
    present (review wedge).
  - `ec-v2-upstream-ei-v2-conflicts` — upstream Environmental Intake
    v2 cross-source conflicts propagated.
  - `ec-v2-sovereign-declared-without-authorization` — sovereign
    customer type declared without sovereign federation
    authorization.
  - `ec-v2-spoke-isolation-not-confirmed` — Environmental
    Engineering Spoke isolation not confirmed while v2 environmental
    pathway is TRIGGERED.
  - `ec-v2-escalation-ref-missing` — CONDITIONAL / ESCALATED /
    FAILED outcome without escalation reference.

## Constitutional posture

Internal advisory environmental compliance posture only. The runtime
does NOT create:

- DB writes to `environmental_compliance_records` (v1 store remains
  the canonical write path),
- external environmental provider engagement,
- fee authorization,
- official environmental report,
- environmental clearance, NEPA determination, Phase I ESA report,
  or permit issued,
- autonomous environmental compliance / intake / onboarding /
  readiness / customer eligibility / pathway / opportunity /
  intelligence / evidence / certification determination,
- credit decision, lender commitment, program approval,
- tax-credit allocation, carbon-credit issuance,
- public verification, regulatory reliance, legal reliance,
- source certainty claim, live external action, payment
  authorization, notice send.

Environmental Engineering Spoke isolation is preserved. Borrower fee
autonomy and the borrower's right to engage an external
environmental firm are preserved (CANON-ECON-001 /
CANON-SOVEREIGNTY-001). Sovereign customer types remain hidden
unless named federation participation is authorized.

## Master Volume Governance

- **Vol I (Constitutional Backbone)** — preserves Environmental
  Engineering Spoke / Banker Spoke isolation (ROLE-ARCH-001);
  composition never grants authority and never replaces external
  environmental review.
- **Vol II (Regulatory Governance)** — blocks the v2 runtime from
  becoming approval, eligibility, autonomous environmental
  compliance, NEPA determination, Phase I ESA report, permit,
  official environmental report, public verification, regulatory
  reliance, or legal reliance.
- **Vol III (Technical Infrastructure)** — deterministic,
  replay-safe composition with explicit version lineage chaining
  `environmental-compliance-v2-runtime-v0.1.0` →
  `environmental-intake-v2-runtime-v0.1.0` →
  `borrower-onboarding-core-v2-runtime-v0.1.0` →
  `opportunity-discovery-v2-runtime-v0.1.0` →
  `financing-pathway-engine-v2-runtime-v0.1.0` →
  `revenue-intelligence-v2-runtime-v0.1.0` →
  `customer-type-runtime-v0.1.0` →
  `capital-graph-runtime-v0.1.0` →
  `environmental-intake-runtime-v0.1.0` →
  `environmental-compliance-runtime-v0.1.0` (the v1 store seal as
  conceptual reference).
- **Vol III-B (Governance Runtime)** — runtime evidence with
  classification, observability, explainability, replay
  verification posture.
- **Vol IV (Operational Runbooks)** — routes governed handoffs to
  Environmental Intake v2, Borrower Onboarding Core v2, Readiness
  Assessment v2, Opportunity Discovery v2, Financing Pathway Engine
  v2, Revenue Intelligence v2, Customer Type Registry, Capital
  Graph, environmental-compliance v1 review,
  portal-borrower-environmental-intake, applications, documents,
  data-rights, evidence packets, audit replay, governance, reviews,
  and module readiness.
- **Vol V (Canonical Doctrines)** — preserves CANON-ECON-001 fee
  disclosure and CANON-SOVEREIGNTY-001 jurisdictional license
  verification, claims governance, controlled disclosure, replay,
  audit, portability, advisory-only boundaries.
- **Vol VI (Source Intelligence Integration)** — keeps every
  composed entry behind a public-safe DTO; no raw provider,
  sponsor, or borrower records; no live external fetch; no
  source-certainty claim.

## Module manifest and event contract

- Module manifest:
  `governance-environmental-compliance-v2`, route
  `/governance/environmental-compliance-v2`, internal audience,
  production-blocked, replay-required, public surface disallowed,
  claimsProfile `advisory-reporting`.
- Event contract:
  `governance.environmental.compliance.v2.composed`, RESTRICTED,
  production-blocked, replay-required, public surface disallowed.
- 17 governed handoffs to upstream canonical v2 modules +
  environmental-compliance v1 + portal-borrower-environmental-intake
  + applications + documents + data-rights + evidence packets +
  audit replay + governance + reviews + module readiness.

## Verification

- `npx tsc --noEmit` — clean.
- `npm run smoke:environmental-compliance-v2` — passed
  (5 scenarios: exempt pathway, fully populated triggered + CLEARED,
  triggered + spoke isolation not confirmed, ESCALATED outcome
  without escalation ref, sovereign declared without authorization).
- `npm run verify:module-manifests` — 93 modules, 83 event
  contracts, 444 handoffs, conformance passed.
- `npm run smoke:replay-cross-module` — passed.
- `npm run smoke:public-surfaces` — 27 surfaces, conformance
  passed.
- `npm run smoke:claims-public` — 0 findings.
- `npm run smoke:redaction` — passed.

## CI gate

The CI workflow `.github/workflows/ci.yml` runs the new step
"Environmental Compliance v2" via
`npm run smoke:environmental-compliance-v2`. The step fails the
build when any canonical scenario assertion (v2 signal posture, v1
gate snapshot, cross-source conflict propagation, module manifest /
event contract / handoff conformance) does not match the doctrinal
expectation.
