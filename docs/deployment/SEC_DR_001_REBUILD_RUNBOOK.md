# SEC-DR-001 — Platform Rebuild Runbook & DR Drill Procedure

- **Date:** 2026-06-15 · **Owner-run** (Caitlin + infra) · **Mode:** procedure only
- **Companion:** `SEC_DR_001_READINESS_AUDIT.md`. Closure gate:
  `recoveryFrameworkInvariants().ok && recoveryCertificationValid()` (folds RECOVERY-CERT-001).
- **Hard rule:** run the drill in an **isolated** environment — never production.
  No cloud provisioning, no production activation, no blocker closure by this doc.
  **SEC-DR-001 stays OPEN** until a passing drill is executed and human-reviewed.
- **Targets (from code):** RPO ≤ **60 min**, RTO ≤ **240 min**.

> A recovery plan you have never executed is a hypothesis. This runbook is the
> exact rebuild sequence + the drill that turns it into the measured evidence
> SEC-DR-001 requires.

## A. Canonical rebuild sequence

### A1 — Infrastructure
1. Create a fresh GCP project (DR/scratch — NOT prod). Enable Cloud Run, Cloud SQL Admin, Secret Manager, Artifact Registry, Cloud Build, Logging/Monitoring, Scheduler.
2. `terraform apply` the IaC skeleton (network, Cloud Run, Cloud SQL/Neon, buckets, IAM/Workload Identity). No downloaded SA keys.
3. **Evidence:** project id (scratch), `terraform apply` log, IAM binding summary (no secrets).

### A2 — Database
1. Provision Postgres/Neon in the rebuilt project (PRIVATE IP / connector).
2. Run forward-only numbered migrations as a discrete pre-deploy step (never on boot).
3. **Restore** core DB + ledger/audit from the **Tier-C immutable vault** (SEC-BACKUP-001 restore-test plan, Steps 1–4).
4. **Evidence:** migration head, restore log, row-count + ledger-head match vs the pre-backup export.

### A3 — Secrets
1. Re-provision Secret Manager (names per `SEC_SECRET_001_INVENTORY.md` / readiness classification) with **scratch** values for the drill (never prod values).
2. Bind least-privilege via Workload Identity. Preview/dev-only flags UNSET.
3. Rotate one secret to confirm rotation works.
4. **Evidence:** secret **names** present (no values), rotation observed, IAM binding.

### A4 — Deployment
1. Build the standalone Next container; deploy to Cloud Run (min-instances ≥1; HTTPS LB; `NODE_ENV=production` → nonce-CSP path).
2. LB must not strip/override response headers.
3. **Evidence:** deploy log, revision id, `/` returns 200.

### A5 — Verification suite
Run against the rebuilt stack: `verify:ledger`, `verify:replay`, `verify:csp-hydration`, `verify:navigator-refresh`, `verify:cyber-resilience`.
**Evidence:** each gate's output.

### A6 — Governance validation
`verify:security-governance`, `verify:security-conformance`, `verify:module-sovereignty`, `verify:public-disclaimer`.
**Evidence:** each gate's output.

### A7 — Forensic validation
Re-create the Cloud Logging sinks (SEC-FORENSICS Pass 03 contract); emit a test event; confirm read-back + `verifyForensicSeal()`.
**Evidence:** sink config, test-event read-back.

### A8 — User acceptance
Exercise a core public flow end-to-end on the rebuilt stack (discovery/navigator conversation; a governed place-fact render). No fabricated data; advisory framing intact.
**Evidence:** rendered capture.

## B. DR drill procedure (the measured test)
1. **Isolated recovery environment** — fresh scratch project, separate creds, no prod secrets/DNS.
2. **Restore from backup** — A2.3 (Tier-C immutable vault).
3. **Restore configuration** — A3 (scratch config) + recompute config snapshots (`verifyConfigurationSnapshot()`).
4. **Restore secrets** — A3 (scratch values), rotation proven.
5. **Restore deployment** — A4.
6. **Execute verification suite** — A5–A8.
7. **Capture evidence + measure** — record **measured RPO** (data-loss window from backup cadence) and **measured RTO** (drill start → user-acceptance pass).

## C. Closure evidence for SEC-DR-001
- [ ] Successful **rebuild** (A1–A4) in isolation.
- [ ] Successful **restore** (SEC-BACKUP-001 restore test passes within the drill).
- [ ] **Verification reports** green (A5–A6) on the rebuilt stack.
- [ ] **Measured RTO ≤ 240 min** and **measured RPO ≤ 60 min** captured from the drill.
- [ ] `RECOVERY_CERTIFICATION` updated: a passing sim (`ransomware-restore` and/or `infra-rebuild`) with `passed:true`, measured RPO/RTO within targets, `recovery_score`, `certification_date`, `expiration`, `certified_by`.
- [ ] **Owner sign-off (Caitlin) + infra sign-off**; multi-party where founder controls apply.
- **Then** `recoveryFrameworkInvariants().ok && recoveryCertificationValid()` → SEC-DR-001 satisfiable; a recorded human review closes it (never automatic). RECOVERY-CERT-001 stays folded inside SEC-DR-001.

## D. Blockers preventing a successful drill today
- **SEC-BACKUP-001** — no verified Tier-C restore floor (no backup to restore).
- **SEC-SECRET-001** — no provisioned secrets (even scratch provisioning not done).
- **GCP infra** — IaC is plan-only; never applied.
- **SEC-FORENSICS-001** — Cloud Logging sinks owner-pending (A7 can't complete).
- Order to unblock a drill: base GCP infra → SEC-BACKUP restore floor → SEC-SECRET (scratch) → then a full drill can run and be measured.

## Posture
Procedure only — nothing executed. **SEC-DR-001 OPEN** (RECOVERY-CERT-001 folded);
10 blockers open; `combinedProductionReady=false`. No cloud provisioning, no
DNS/secrets/production/financing change.
