# Build 34 — Module 42 Build Self-Report Runtime v1

Implements the Module 42 — Build Self-Report Specification as a
sibling runtime to the existing `build-preservation` module (which
remains the evidence archive gate). This build adds the actual
report generator that produces an evidence artifact for the
archive.

## Command

```
npm run build:self-report
```

Writes:

```
docs/build-records/<YYYY-MM-DD>/build-self-report.json
docs/build-records/<YYYY-MM-DD>/build-self-report.md
```

Exits non-zero on any of:
- any module verdict is `FAIL`
- `live_fetch_enabled != 0`
- `audit_chain_intact = FAIL`
- any dangling contract / handoff / orphan module exists
- the requirements ledger does not enumerate all rows
  (`implemented + pending != total`)

## Per-module checks

Every cell is one of `PASS` / `FAIL` / `WARN` / `N/A` /
`BLOCKED_BY_DESIGN`. Never blank. `N/A` always carries a reason.
Fail closed.

| Check | Data source (deterministic) | Behavior |
| --- | --- | --- |
| `route_loads` | File-system probe for `src/app/<route>/page.*` or `src/app/api/<route>/route.*` | PASS if exists; FAIL otherwise. N/A only when module has no route. |
| `replay_reproduces` | manifest `replayRequired` + `productionBlocked` | PASS if both true; FAIL if replayRequired true but productionBlocked false; N/A otherwise. |
| `disclosures_present` | description token check for advisory posture tokens | PASS if ≥ 2 advisory tokens; WARN otherwise. N/A for internal-only surfaces (no public disclosure required). Strongest result depends on Module 44 disclosure-audit corpus. |
| `blocks_enforced` | manifest `productionBlocked` + `claimsProfile` | PASS if productionBlocked + non-live-action-blocked; BLOCKED_BY_DESIGN if productionBlocked + live-action-blocked (intentional block confirmed off = healthy); FAIL if productionBlocked false. |
| `human_authority` | Until Module 45 ships: FAIL for gate modules with reason "human-authority-registry-not-yet-built"; N/A for non-gate. |
| `claims_controls` | manifest `claimsProfile` + surface class | PASS if customer-facing surface has a claimsProfile; FAIL if customer-facing without one; N/A for internal / gate. Strongest result depends on Module 44 prohibited-claims corpus. |
| `pii_redaction` | PII-class data-dependency detection | PASS if PII-touching module is internal + production-blocked + replay-required; FAIL if PII-touching but public-allowed or block-disabled; N/A if no PII. |
| `lineage_traceable` | every published event must have a registered contract | PASS if all published events have contracts; FAIL otherwise; N/A if no events published. |

## Graph + orphan flag

Each module reports `events_produced` / `events_consumed` /
`handoffs_in` / `handoffs_out` derived from the registries. The
`orphan_flag` is one of:
- `none` (healthy)
- `dangling` (an eventsPublished or eventsConsumed entry has no
  contract)
- `no_consumer` (publishes events but no contract / handoff
  consumer exists)
- `no_producer` (consumes events but no producer / handoff origin
  exists)

## Module verdict roll-up

Per the spec:
- `FAIL` if any of `route_loads`, `blocks_enforced`,
  `claims_controls`, `pii_redaction`, or gate-`human_authority`
  fails, or if `orphan_flag != none`.
- `BLOCKED_BY_DESIGN` if the module's primary function is an
  intentionally-held block and the block is asserted on the
  manifest (and no FAIL elsewhere, and no WARN).
- `PASS_WITH_WARNINGS` if no FAIL but a WARN exists (e.g.
  smoke-only test coverage).
- `PASS` otherwise.

## Platform roll-up (report header)

The header carries:
- `checkpoint`, `commit`, `branch`, `tree_status`, `generated`
- `verify_backend`, `build`, `static_pages`
- `volumes_conformed` (must include `VII`)
- `live_fetch_enabled` (must be `0` at this checkpoint)
- `audit_chain_intact` (`PASS` / `FAIL`)
- `totals` per verdict
- `orphans` and `dangling_event_contracts` rosters
- `public_surfaces_checked`
- `requirements` (total / implemented / enumerated pending)
- `exit_code` (`0` if gate clean, `1` if any gate condition fails)

## First-run baseline

The first run against the shipped backbone (commit `d7450e0`) shows:

- 99 modules audited
- 9 PASS · 39 PASS_WITH_WARNINGS · 51 FAIL · 0 BLOCKED_BY_DESIGN
- 0 orphans (no_consumer / no_producer / dangling)
- 0 dangling event contracts
- 78 findings, 2 cross-source conflicts
- `live_fetch_enabled: 0`, `audit_chain_intact: PASS`
- `exit_code: 1`

The 51 FAIL verdicts are almost entirely gate modules that have no
assigned human authority — a real, expected gap until Module 45
(Human Authority Registry) ships. This is the audit working
correctly; the spec explicitly says "Build 42 first with whatever
inputs exist today (it will honestly show FAILs/WARNs for 44/45-
dependent columns), then let those columns turn green as 44 and 45
land."

The remaining FAILs cover modules whose routes lack a Next.js page
file (purely backend modules without a UI surface) — these can be
reviewed and either get a placeholder page or be marked `N/A` for
route_loads.

## Constitutional posture

Internal advisory audit posture only. The runtime does NOT create:

- information sale, silent submission, secret distribution,
  marketing lead generation,
- denial, rejection, approval, preapproval, lender commitment,
  agency decision, official certification,
- public verification, regulatory reliance, legal reliance, source
  certainty claim,
- autonomous lending / eligibility / pathway / opportunity /
  intelligence / evidence / certification / onboarding / readiness
  determination,
- live external action, payment authorization, notice send.

Every finding resolves to `REQUIRES_HUMAN_REVIEW`.

## Master Volume Governance

- **Vol I** — preserves user sovereignty and constitutional
  authority.
- **Vol II** — blocks audit posture from becoming approval, denial,
  certification, public verification, regulatory reliance, or
  legal reliance.
- **Vol III** — deterministic, replay-safe composition with
  explicit version lineage sealing
  `build-self-report-runtime-v0.1.0` against
  `module-42-build-self-report-spec-v1.0`.
- **Vol III-B** — runtime evidence with classification,
  observability, explainability, replay verification.
- **Vol IV** — routes findings to QUALIFIED_GOVERNANCE_REVIEWER
  and surfaces handoffs to build-preservation (the archive gate),
  doctrine-gap-ledger, module-readiness, data-transparency-posture,
  applications, documents, data-rights, evidence packets, audit
  replay, governance, reviews.
- **Vol V** — preserves claims governance, controlled disclosure,
  replay, audit, advisory-only boundaries.
- **Vol VI** — every finding remains behind a public-safe DTO; no
  live external fetch; no source-certainty claim.

## Module manifest and event contract

- Module manifest: `governance-build-self-report`, route
  `/governance/build-self-report`, internal audience,
  production-blocked, replay-required, public surface disallowed.
- Event contract:
  `governance.build.self.report.generated`, RESTRICTED,
  production-blocked, replay-required, public surface disallowed.
- 11 governed handoffs.

## Honest gaps (as the spec calls out)

- `human_authority` needs Module 45. Until then it reports `FAIL`
  for gate modules — that surfaces a real missing piece.
- `disclosures_present` / `claims_controls` are strongest with
  Module 44 supplying the canonical disclosure + prohibited-claims
  corpus.
- `test_coverage` reads `WARN` for smoke-only at the current
  checkpoint — accurate reflection of today's state.
- `route_loads` is currently a file-system probe rather than a
  live HTTP GET against a booted Next.js instance. A future
  enhancement boots the app once and replaces the static probe.

## Verification

- `npx tsc --noEmit` — clean.
- `npm run smoke:build-self-report` — passed.
- `npm run build:self-report` — runs, generates JSON + MD, exits
  non-zero (correct gate behavior at first checkpoint).
- `npm run verify:module-manifests` — 99 modules, 89 event
  contracts, 536 handoffs, conformance passed.
- `npm run smoke:replay-cross-module` — passed.
- `npm run smoke:public-surfaces` — passed.
- `npm run smoke:claims-public` — 0 findings.
- `npm run smoke:redaction` — passed.
- `npm run build` — passed.
