# SEC-BACKUP-001 — Restore-Test Procedure

- **Date:** 2026-06-15 · **Owner-run** (Caitlin + infra) · **Mode:** procedure only
- **Companion:** `SEC_BACKUP_001_READINESS_AUDIT.md`. Gate: `immutableBackupVerified()`.
- **Hard rule:** run against an **isolated scratch environment** — never production.
  No production activation, no blocker closure by this document. **SEC-BACKUP-001
  stays OPEN** until a passing restore is executed and human-reviewed.

> A backup you have never restored is not a backup. This plan turns the planned
> Tier-C vault into evidence by proving a real restore works end-to-end.

## Preconditions
- Tier-C immutable vault provisioned (object-lock, encrypted) + a real backup written.
- A pre-backup **export of ledger hash-chain heads** captured (the integrity baseline).
- An isolated scratch project/instance (NOT prod; separate creds; no prod secrets).

## Step 1 — Create backup
1. Trigger/confirm the Tier-C immutable backup (`core-db-immutable-vault`; and `ledger-immutable-vault` for audit/ledger).
2. Record `created_at`, `immutable_until` (object-lock expiry), encryption status.
3. **Evidence:** screenshot/export of the backup object + its object-lock/retention policy.

## Step 2 — Restore into isolated environment
1. Restore the backup to a **scratch** Postgres/Neon instance (separate from prod).
2. Restore the ledger/audit immutable copy alongside.
3. Record start + end time → **time-to-restore** (feeds RTO).
4. **Evidence:** restore-run log (start/end, source object, target scratch instance id — no secrets).

## Step 3 — Integrity verification
1. Row counts per critical table match the source-of-truth export (within expected delta).
2. No corruption on load; schema migrations resolve to the same head.
3. **Evidence:** row-count diff + schema-head comparison.

## Step 4 — Ledger verification
1. `npm run verify:ledger` — hash-chained INSERT-only ledgers intact.
2. `npm run verify:replay` — state reconstructs from the restored ledgers.
3. Compare **ledger hash-chain heads** to the Step-0 pre-backup export — must match.
4. **Evidence:** `verify:ledger` + `verify:replay` output; head-match confirmation.

## Step 5 — Application startup verification
1. Boot the app against the restored scratch DB (`NODE_ENV=production`, scratch secrets).
2. `/` and core routes return 200; nonce-CSP intact (`verify:csp-hydration`); navigator refresh-survives (`verify:navigator-refresh`).
3. **Evidence:** startup log + route status capture.

## Step 6 — User-flow verification
1. Exercise a core public flow end-to-end on the restored stack (discovery/navigator conversation; a governed place-fact render).
2. Confirm no fabricated data, advisory framing intact, no errors.
3. **Evidence:** rendered capture of the working flow.

## Step 7 — Evidence capture + record
1. Bundle all evidence **owner-side** (not committed — may contain infra UI).
2. Set in `BACKUP_REGISTRY`: `created_at`, `immutable_until`, `verification_status: "verified"`, `restore_test_date`, with evidence references.
3. Record **time-to-restore** (RTO actual) and the backup cadence (RPO actual).
4. Re-run `npm run verify:cyber-resilience` — confirm `immutableBackupVerified()` now true; then a **human review** closes SEC-BACKUP-001 (never automatic).

## Pass criteria (all required)
- Backup is Tier-C, encrypted, object-locked, `immutable_until` in the future.
- Restore completed into an isolated environment within the RTO target.
- Integrity ✓, `verify:ledger` ✓, `verify:replay` ✓, ledger heads match.
- App boots + core route 200 + nonce-CSP intact; core user flow works.
- Evidence captured; `verification_status=verified` + `restore_test_date` recorded; human sign-off.

## Posture
Procedure only — nothing executed here. **SEC-BACKUP-001 OPEN**; 10 blockers open;
`combinedProductionReady=false`. No cloud resources provisioned, no DNS/secrets/
production/financing change.
