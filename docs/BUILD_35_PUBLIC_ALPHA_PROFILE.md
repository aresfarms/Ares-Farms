# Build 35 — Public Alpha Profile Runtime v1

Codifies the **Furlong Public Alpha Definition v1.0** (preserved at
`docs/DOCTRINE_PUBLIC_ALPHA_DEFINITION_V1.md`) into a governed
runtime that composes the Build Self-Report v1 (Build 34) and
profiles its output against the doctrine's §3 ON capabilities, §4
OFF capability blocks, §6 entry criteria, §7 exit criteria, and §9
open decisions.

The runtime **does not** authorize Alpha entry. The named
governance authority records that decision externally. Until every
§9 open decision is signed off, `alpha_entry_allowed` remains
`PENDING_SIGNOFF` regardless of the underlying technical posture.

## What the runtime evaluates

### §3 ON capabilities (10)
- `application_intake`
- `document_intake`
- `field_overlay_completeness_checks`
- `human_review_and_transition`
- `in_app_notices_status`
- `advisory_program_opportunity_surfacing`
- `data_accounting_portability`
- `append_only_audit_replay`
- `advisory_export`
- `governance_runtime_promotion_gate`

A capability is **PASS** when at least one module matches its id
patterns AND every matched module's Build Self-Report verdict is
`PASS` / `PASS_WITH_WARNINGS` / `BLOCKED_BY_DESIGN`. **FAIL** if no
representing module or any matched module has verdict `FAIL`.

### §4 OFF capabilities (14)
- `payment_capture`
- `borrower_external_notice_sending`
- `official_determinations_or_adverse_action`
- `official_report_publication`
- `public_verification`
- `regulatory_or_official_reliance`
- `legal_advice`
- `live_scraper_or_live_fetch`
- `live_external_actions`
- `dns_cutover`
- `production_db_migrations`
- `public_production_api_exposure`
- `open_non_invited_signup`
- `regulatory_examination_submission_or_response`

A blocked capability reads **BLOCKED_BY_DESIGN** when every guarding
module's `blocks_enforced` cell is `PASS` or `BLOCKED_BY_DESIGN`.
**FAIL** if any guarding module reports `blocks_enforced = FAIL` or
if no guarding module is registered.

### §6 entry criteria (8)
Each criterion evaluates to `PASS` / `FAIL` / `PENDING_SIGNOFF`:
- self-report exit_code == 0 for the Alpha set
- Module 44 (Disclosure Audit) registered (until then → PENDING_SIGNOFF)
- Module 45 (Human Authority) registered (until then → PENDING_SIGNOFF)
- claims_controls PASS across Alpha set
- pii_redaction + audit_chain_intact + live_fetch_enabled clean
- requirements ledger enumerates all rows
- tree clean + DR-restore sign-off recorded
- signed Alpha participation terms recorded

### §7 exit criteria (5)
All start as `PENDING_SIGNOFF`; the runtime surfaces them for the
governance authority to record at Alpha exit.

### §9 open decisions (5)
- `sustained_window_duration`
- `cohort_size`
- `module_21_environmental_compliance_featured_or_deferred`
- `module_10_connectors_live_or_simulated`
- `named_governance_authority`

Each decision starts as `PENDING_SIGNOFF`. The runtime accepts a
`decisionSignoffs` array on input; each entry must include
`decisionId`, `recorded_value`, `recorded_by` (named governance
authority), and `recorded_at` (timestamp).

## alpha_entry_allowed aggregate gate

- `FAIL` — any §3 ON / §4 OFF / §6 entry criterion is FAIL.
- `PENDING_SIGNOFF` — no FAIL, but any §6 / §9 entry is
  `PENDING_SIGNOFF`.
- `PASS` — every §3, §4, §6, §9 entry is PASS / BLOCKED_BY_DESIGN /
  RECORDED.

## Four governed Alpha-profile signals

- `alpha_on_capability_coverage_alignment`
- `alpha_off_capability_block_alignment`
- `alpha_entry_criteria_alignment`
- `alpha_open_decisions_signoff_alignment`

## Findings + cross-source conflicts

Five finding categories:
- `ALPHA_ON_CAPABILITY_NOT_REPRESENTED`
- `ALPHA_ON_MODULE_VERDICT_FAIL`
- `ALPHA_OFF_CAPABILITY_BLOCK_NOT_ENFORCED`
- `ALPHA_ENTRY_CRITERION_NOT_MET`
- `ALPHA_OPEN_DECISION_PENDING_SIGNOFF`

Four cross-source conflict classes mirror the four signal domains.

## First-run baseline (commit `fa687c2`)

- 10 ON capabilities · **3 PASS · 7 FAIL** (the 7 FAILs are
  modules whose verdict is FAIL because their gate-tier modules
  await Module 45 Human Authority Registry)
- 14 OFF capabilities · **14 BLOCKED_BY_DESIGN** (every guarding
  module's block is enforced as the doctrine requires)
- 8 entry criteria · 1 PASS · 0 FAIL · 7 PENDING_SIGNOFF
  (Module 44/45 pending; signed terms + DR-restore pending; the
  `pii_audit_chain_and_live_fetch_clean` criterion picks up at PASS
  once the Alpha-set pii_redaction column flips green)
- 5 open decisions · **0 RECORDED · 5 PENDING_SIGNOFF**
- 19 findings, 3 cross-source conflicts
- **alpha_entry_allowed: FAIL** — exactly correct for a PROPOSED
  doctrine.

## Constitutional posture

Internal advisory audit posture only. The runtime **does NOT**:
- authorize Alpha entry,
- sell information, silently submit, secretly distribute, generate
  marketing leads,
- deny, reject, approve, preapprove,
- commit lenders, decide for agencies, certify officially, verify
  publicly,
- claim regulatory / legal reliance or source certainty,
- perform live external action, payment authorization, notice send,
- make any autonomous determination.

Every finding resolves to `REQUIRES_HUMAN_REVIEW`.

## Master Volume Governance

- **Vol I** — preserves user sovereignty and constitutional
  authority; runtime never grants Alpha entry.
- **Vol II** — blocks audit posture from becoming approval, denial,
  certification, public verification, regulatory reliance, or
  legal reliance.
- **Vol III** — deterministic, replay-safe composition sealing
  `public-alpha-profile-runtime-v0.1.0` against
  `public-alpha-definition-v1.0`.
- **Vol III-B** — runtime evidence with classification,
  observability, explainability, replay verification.
- **Vol IV** — routes findings to QUALIFIED_GOVERNANCE_REVIEWER
  and surfaces handoffs to build-self-report, data-transparency-
  posture, build-preservation, doctrine-gap-ledger, module-
  readiness, applications, documents, data-rights, evidence
  packets, audit replay, governance, reviews.
- **Vol V** — preserves claims governance, controlled disclosure,
  replay, audit, advisory-only boundaries.
- **Vol VI** — every finding remains behind a public-safe DTO; no
  live external fetch; no source-certainty claim.

## Module manifest and event contract

- Module manifest: `governance-public-alpha-profile`, route
  `/governance/public-alpha-profile`, internal audience,
  production-blocked, replay-required, public surface disallowed.
- Event contract:
  `governance.public.alpha.profile.evaluated`, RESTRICTED,
  production-blocked, replay-required, public surface disallowed.
- 12 governed handoffs.

## Verification

- `npx tsc --noEmit` — clean.
- `npm run smoke:public-alpha-profile` — passed.
- `npm run verify:module-manifests` — 100 modules, 90 event
  contracts, 548 handoffs, conformance passed.
- `npm run smoke:replay-cross-module` — passed.
- `npm run smoke:public-surfaces` — passed.
- `npm run smoke:claims-public` — 0 findings.
- `npm run smoke:redaction` — passed.
- `npm run build` — passed.
