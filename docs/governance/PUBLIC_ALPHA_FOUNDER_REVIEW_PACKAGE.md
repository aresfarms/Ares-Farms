# Public Alpha — Founder Review Package

**Status: PUBLIC ALPHA PENDING — NOT APPROVED. No PR merged. No founder votes recorded.**

This package assembles everything the founders need to review **before** any
merge and before the Ceremony Part D vote. It is prepared by the build tooling
and is labeled **"Internally Verified — Independent Verification Pending"**
(VIA-AUDIT-001 / VIA-AUDIT-EXCEPTION-001 — the builder is not the independent
verifier; this review **is** the independent founder step).

**Prepared:** 2026-06-05 · **Base:** main `3f23179` (PR #34 merged; PR #35 held).
**Founders of record:** Caitlin Hudson (Chief Governance Authority),
Stuart Fraass (Qualified Governance Reviewer), Frances Fraass (Founder).

> The build agent **cannot conduct the founder review or record approvals**.
> The decision fields in Section 7 are left `[pending]` for each founder to
> complete. Merges and the Part D vote happen only after founders act.

---

## 1. Pull requests

| PR | Title | State | Files | Δ | CI | Notes |
|---|---|---|---|---|---|---|
| **#35** | Build 43 — Alpha Continuity Closure | **OPEN — held for founder review** | 4 governance docs | +583 / -0 | ✅ Verify pass | The Part D / continuity package; do not merge before review |
| **#34** | Build 43 — CI live-state enforcement of Public Alpha governance gates | **MERGED** (`3f23179`) | 6 (ci.yml, package.json, 3 CLIs, proof) | +242 / -12 | ✅ Verify pass | Infrastructure, not a founder-judgment gate; merged to protect main; founders may still review and request follow-ups |

**PR #35 (docs only — held for review):**
`ALPHA_DEPLOYMENT_AND_ROLLBACK_RUNBOOK.md`,
`ALPHA_KEY_CUSTODY_AND_DISASTER_RECOVERY_RUNBOOK.md`,
`ENVIRONMENTAL_QUALIFICATION_SUCCESSOR_PLAN.md`,
`PUBLIC_ALPHA_CEREMONY_PART_D.md` (committed, unsigned).

**PR #34 (CI hardening — merged):** `--check` modes on the three literal gate
CLIs; `verify:human-authority:ci`, `verify:customer-journey:ci`,
`build:self-report:ci` (read live state, write no timestamped artifacts);
`smoke:ci-live-state-proof` (fail-closed proof); CI steps added alongside the
existing smokes. Merged as infrastructure (closes the CI live-state enforcement
gap); the three live-state gates are now enforced in CI, not just locally.

## 2. Step 8 verification matrix — from main `3f23179` (post-#34 merge)

| Gate | Local (main) | CI on `3f23179` |
|---|---|---|
| `verify:human-authority` | ✅ exit 0 | ✅ |
| `verify:human-authority:ci` | ✅ exit 0 | ✅ live-state, no artifacts |
| `verify:no-personal-docs` | ✅ exit 0 (1052 files) | ✅ literal |
| `verify:disclosures` | ✅ exit 0 | ✅ equivalent via `smoke:disclosure-audit-gate` |
| `verify:customer-journey` | ✅ exit 0 | ✅ |
| `verify:customer-journey:ci` | ✅ exit 0 | ✅ live-state, no artifacts |
| `build:self-report` | ✅ exit 0 | ✅ |
| `build:self-report:ci` | ✅ exit 0 | ✅ live-state, no artifacts |
| `verify:module-manifests` | ✅ exit 0 | ✅ literal |
| `build` | ✅ exit 0 | ✅ literal |
| `smoke:ci-live-state-proof` | ✅ exit 0 | ✅ fail-closed proof |

All green on main, **locally and in CI**. With #34 merged, the three live-state
gates (human-authority, customer-journey, build-self-report) are enforced in CI,
materially resolving the Part D CI caveat (PR #35's Part D record will be updated
to reflect this once #35 is reviewed).

## 3. Continuity checklist (post Build 43)

| # | Item | Status |
|---|---|---|
| 1 | Module Registry documentation | COMPLETE |
| 2 | Governance Registry documentation | COMPLETE |
| 3 | Technical architecture documentation | COMPLETE (distributed) |
| 4 | Build documentation | COMPLETE |
| 5 | Deployment documentation | **COMPLETE** (PR #35) |
| 6 | Recovery / key-custody documentation | **COMPLETE** entry slice (PR #35); full DR consolidation **ACCEPTED_WITH_CONDITION** for exit |
| 7 | Replay documentation | COMPLETE (distributed) |
| 8 | Environmental qualification successor plan | **ACCEPTED_WITH_CONDITION** (PR #35) |
| — | MV-IV / MV-V / MV-VII doctrine gaps | ACCEPTED_WITH_CONDITION |

No item is MISSING or PARTIAL-without-a-plan.

## 4. Active Classification Change Registry list

From `build:self-report` on main (`classificationChangeRegistry`): parsed = true,
3 active, 1 resolved.

| CCR | Title | Status |
|---|---|---|
| CCR-2026-002 | Environmental Engineering Reviewer Reclassification | **ACTIVE** (HELD_FOR_ALPHA) |
| CCR-2026-003 | Regulatory Liaison Authority reclassification | **ACTIVE** (HELD_FOR_ALPHA) |
| CCR-2026-004 | Source Legal Authority reclassification | **ACTIVE** (HELD_FOR_ALPHA) |
| CCR-2026-001 | Build 38 Human Authority Severity Reclassification | RESOLVED (historical) |

## 5. Part D readiness record

`docs/governance/PUBLIC_ALPHA_CEREMONY_PART_D.md` (on PR #35): the unsigned
2-of-3 vote record, votes `[pending]`, marked "Internally Verified — Independent
Verification Pending," with the verification matrix, continuity table, CI caveat,
and the open conditions the founders vote with knowledge of.

## 6. Constitutional posture (unchanged)

Advisory-only · production-blocked · `DRY_RUN=true` · live fetch = 0 · closed
invitation-only cohort · human in the loop at every decision · no autonomous
determination · no information sale / silent submission. Public Alpha is opened
**only** by a recorded 2-of-3 Part D vote.

---

## 7. Founder review record (to be completed by founders)

For each review area, each founder records a **Decision**
(APPROVE / REQUEST_CHANGES / HOLD), any comments, and requested changes. Leave
`[pending]` until the founder personally completes their line. **No entry here
is a vote to open Alpha** — that is Part D (Section 8).

### 7.1 Continuity documentation (PR #35)
| Founder | Decision | Comments / requested changes |
|---|---|---|
| Caitlin Hudson | _[pending]_ | |
| Stuart Fraass | _[pending]_ | |
| Frances Fraass | _[pending]_ | |

### 7.2 Recovery / key-custody procedures (PR #35)
| Founder | Decision | Comments / requested changes |
|---|---|---|
| Caitlin Hudson | _[pending]_ | |
| Stuart Fraass | _[pending]_ | |
| Frances Fraass | _[pending]_ | |

### 7.3 Environmental successor plan (PR #35)
| Founder | Decision | Comments / requested changes |
|---|---|---|
| Caitlin Hudson | _[pending]_ | |
| Stuart Fraass | _[pending]_ | |
| Frances Fraass | _[pending]_ | |

### 7.4 CI live-state enforcement changes (PR #34 — already merged as infrastructure)
Merged to protect main; founders may review post-merge and request follow-ups.
| Founder | Decision | Comments / requested changes |
|---|---|---|
| Caitlin Hudson | _[pending]_ | |
| Stuart Fraass | _[pending]_ | |
| Frances Fraass | _[pending]_ | |

### 7.5 Part D readiness package
| Founder | Decision | Comments / requested changes |
|---|---|---|
| Caitlin Hudson | _[pending]_ | |
| Stuart Fraass | _[pending]_ | |
| Frances Fraass | _[pending]_ | |

**Review outcome:** _[pending]_ — APPROVE_TO_MERGE / CHANGES_REQUESTED / HOLD.

---

## 8. Post-review plan

Already done (infrastructure, per the operator/founder decision that CI hardening
is not a founder-judgment gate):
- ✅ **PR #34 merged** to main (`3f23179`).
- ✅ **Step 8 re-run green on main** including the CI-safe live-state gates
  (Section 2).

Remaining, after founders complete Section 7:
1. **Merge PR #35** if approved (or update it per requested changes), keeping the
   Part D vote fields `[pending]`.
2. If any approved change modifies governance, CI, or verification behavior,
   **re-run the Step 8 suite on main** and record the refreshed matrix.
3. **Update the Part D package** if review requires (e.g., to reflect a requested
   change, or the now-resolved CI live-state coverage).
4. **Proceed to the Ceremony Part D vote** (2-of-3). Public Alpha is opened only
   when ≥2 founders record APPROVE in Part D.

**Public Alpha remains PENDING until the Part D vote is recorded.**
