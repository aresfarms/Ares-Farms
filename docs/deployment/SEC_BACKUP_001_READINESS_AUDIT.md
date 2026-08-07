# SEC-BACKUP-001 — Backup & Restore Readiness Audit

- **Date:** 2026-06-15 · **Owner:** Caitlin + infra · **Mode:** audit + planning only
- **Authority in code:** `src/security/backupGovernance.ts` — `BACKUP_REGISTRY`,
  `isUsableImmutable()`, `immutableBackupVerified()`. Companion: `SEC_BACKUP_001_RESTORE_TEST_PLAN.md`.
- **Hard rule:** no cloud resources provisioned, no production activation, no
  blocker closure. **SEC-BACKUP-001 stays OPEN.** Today every `BACKUP_REGISTRY`
  record is `verification_status: "pending"` → `immutableBackupVerified()=false`.

> Closure gate (from code): at least one **Tier-C** backup that is **encrypted +
> verification_status=verified + immutable_until in the future + restore_test_date
> present**. Nothing else flips SEC-BACKUP-001.

## Backup tier model (from code)
- **Tier A — Live Production** (primary; first to fail)
- **Tier B — Nearline Recovery** (PITR / warm snapshot; fast restore)
- **Tier C — Immutable Recovery Vault** (write-once / object-locked; **the recovery floor — required to close**)
- **Tier D — Offline Archive** (air-gapped cold)

## 1–3. Stateful asset inventory + classification

Legend: **protected** = immutable + verified + restore-tested · **partially** =
some backup but not immutable/verified/restore-tested · **unprotected** = no
backup mechanism in place · **unknown** = needs owner confirmation.

| Asset | Source of truth | Current backup method | Frequency | Retention | Restore method | Recovery verification | Evidence status | Class |
|---|---|---|---|---|---|---|---|---|
| **PostgreSQL / Neon (core DB)** | Neon Postgres (once provisioned) | Neon PITR (built-in) + planned Cloud SQL/GCS export | continuous PITR (planned) | 30-day nearline (`core-db-nearline`, Tier B) | Neon branch/restore or import to scratch | restore → `verify:ledger`/`verify:replay` | **pending** (not provisioned) | **unprotected** |
| **Core DB immutable copy** | object-locked vault (`core-db-immutable-vault`, Tier C) | planned object-lock GCS/bucket | weekly (planned) | 90-day immutable | restore vault snapshot → scratch | restore-test + integrity | **pending** | **unprotected** |
| **Ledger data** (hash-chained INSERT-only) | file-store ledgers now → DB ledger tables at go-live | within DB backups; planned `ledger-immutable-vault` (Tier C) | with DB; 7-year vault (planned) | 7-year | restore + replay-verify hash heads | `verify:ledger` + `verify:replay` (hash-chain heads) | **pending** | **partially** (in-DB only; no immutable copy) |
| **Audit events** | audit-ledger (hash-chained) | within DB/ledger backups | with DB | 7-year (with ledger vault) | restore with ledger | hash-chain continuity check | **pending** | **partially** |
| **User records** | core DB (no PII by design; anonymous tokens) | within DB backups | with DB | 30/90-day | restore with DB | row-count + token integrity | **pending** | **unprotected** (until DB backup exists) |
| **Configuration snapshots** | `captureConfigurationSnapshot()` sealed records (SEC-FORENSICS Pass 01) | in-code deterministic; persisted with DB/forensic store | on change/deploy | with DB | recompute + `verifyConfigurationSnapshot()` | seal re-derivation | **partial (in-code seal exists; storage TBD)** | **partially** |
| **Forensic records** | forensic cases + sealed manifests (`openForensicCase`) + Cloud Logging sinks (owner-pending) | sink export → locked bucket (owner-pending per SEC-FORENSICS Pass 02/03) | per event / continuous | ≥400-day (forensic contract) | read-back from locked bucket | `verifyForensicSeal()` + sink export-verify | **pending** (sinks owner-pending) | **partially** |
| **Uploaded assets** (if any) | object storage (none active yet; listing/media gated) | none | — | — | — | — | **unknown** | **unknown** |
| **Generated reports** (PDF/exports) | regenerable from governed source data | none (regenerated on demand) | n/a (derived) | n/a | re-generate from restored DB | report renders post-restore | **n/a (derived, not source of truth)** | **protected-by-regeneration** |
| **Image-rights records (Module 23)** | PENDING image-rights records (file/DB) | within DB/file backups | with DB | with DB | restore with DB | record integrity | **pending** | **partially** |

**Summary:** 0 assets currently **protected** (no verified immutable backup exists). Most are **unprotected** or **partially protected** pending DB provisioning + the Tier-C immutable vault. Uploaded assets = **unknown** (none active); generated reports are derived (regenerable).

## 4. Restore-test procedure
Full procedure in `SEC_BACKUP_001_RESTORE_TEST_PLAN.md`. Summary: create backup →
restore into an **isolated** scratch environment → integrity verify → ledger
verify (`verify:ledger`/`verify:replay`) → application startup verify → user-flow
verify → capture evidence + time-to-restore.

## 5. Closure evidence for SEC-BACKUP-001
To flip `immutableBackupVerified()` true and (with human review) close the blocker:
- [ ] A **Tier-C** immutable vault provisioned (object-lock / write-once), **encrypted**, with `immutable_until` in the future.
- [ ] A real backup written to it (`created_at` set).
- [ ] A **restore test executed** (`restore_test_date` set) per the test plan — passing integrity + `verify:ledger` + `verify:replay` + app-startup + user-flow.
- [ ] Evidence captured (owner-held): backup-config screenshot/export, retention/object-lock policy, restore-run log, ledger/replay verify output, time-to-restore.
- [ ] Owner/infra records `verification_status: "verified"` in `BACKUP_REGISTRY` **with** the evidence references — and a human review sign-off.
- **Passing restore** = restored DB starts the app, ledger hash-chain heads match the pre-backup export, replay reconstructs, and a core user flow works — within the RTO target.

**Sign-off:** Caitlin (owner) + infra; multi-party where founder controls apply. The build agent records nothing here.

## 6. RPO / RTO / confidence (estimates — planning targets, not commitments)
- **Estimated RPO:** with Neon PITR (continuous) → minutes for the core DB; the **immutable vault** cadence (weekly planned) sets the worst-case immutable RPO at up to 7 days until a tighter cadence is set. Target RPO to ratify: **≤ 24h immutable**, ≤ minutes nearline.
- **Estimated RTO:** restore-to-scratch + verify → **a few hours** estimated (unmeasured); the restore test will produce the real number.
- **Current confidence:** **LOW** — no backup is provisioned, none verified, no restore has ever been run. `immutableBackupVerified()=false`.

## Posture
Audit only. **SEC-BACKUP-001 OPEN**; 10 blockers open; `combinedProductionReady=false`. No cloud resources provisioned, no DNS/secrets/production/financing change.
