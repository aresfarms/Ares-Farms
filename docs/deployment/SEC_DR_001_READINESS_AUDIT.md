# SEC-DR-001 — Disaster Recovery Readiness Audit

- **Date:** 2026-06-15 · **Owner:** Caitlin + infra · **Mode:** planning + audit only
- **Authority in code:** `securityRecoveryFramework.ts` (`recoveryFrameworkInvariants`, 8 recovery states),
  `recoveryCertification.ts` (`recoveryCertificationValid`, RPO/RTO targets + sims). Companion:
  `SEC_DR_001_REBUILD_RUNBOOK.md`.
- **Hard rule:** no cloud provisioning, no production activation, no blocker closure.
  **SEC-DR-001 stays OPEN.**

> **Closure gate (from code):** SEC-DR-001 is an **aggregate** —
> `recoveryFrameworkInvariants().ok && recoveryCertificationValid()`. It **folds
> RECOVERY-CERT-001** as a mandatory sub-gate: a valid, unexpired certification
> backed by **at least one passing simulation** meeting the targets
> (**RPO ≤ 60 min, RTO ≤ 240 min**). Today both seeded sims (`ransomware-restore`,
> `infra-rebuild`) are unrun (`passed:false`), `recovery_score:0`, no
> `certification_date` → `recoveryCertificationValid()=false`. SEC-DR-001 also
> depends on SEC-BACKUP-001 (the restore floor).

## 1. Disaster scenarios
| Scenario | What is lost | Primary recovery path |
|---|---|---|
| Database loss | core DB / Neon | restore from immutable vault + PITR (SEC-BACKUP-001) |
| Repository loss | GitHub repo | re-clone from mirror / local; repo is source of truth for code + governance docs |
| Cloud account loss | GCP project | rebuild infra from IaC into a fresh project; restore DB + secrets |
| DNS loss | registrar/zone | restore exported zone (SEC-DNS-001 rollback copy); re-point to rebuilt edge |
| Secret loss | Secret Manager | re-provision from owner-held source; rotate; re-bind Workload Identity |
| Regional outage | one GCP region | redeploy to alternate region; restore from cross-region backup |
| Complete platform rebuild | everything | full canonical rebuild sequence (runbook) |

## 2–3. Recovery dependency inventory + classification

Legend: **recoverable** = path exists + proven · **partially** = path exists, unproven/incomplete ·
**not yet recoverable** = no mechanism in place · **unknown** = needs owner confirmation.

| Dependency | Source of truth | Recovery path | Class |
|---|---|---|---|
| GitHub repository | GitHub (+ local clones) | re-clone; standard git | **recoverable** |
| Source code | the repo | with repo | **recoverable** |
| Governance documents | the repo (`docs/`) | with repo | **recoverable** |
| Neon / Postgres | Neon project (once provisioned) | PITR + immutable vault restore | **not yet recoverable** (not provisioned; SEC-BACKUP-001) |
| GCP services | IaC (Terraform skeleton exists, plan-only) | `terraform apply` into fresh project | **partially** (skeleton only; never applied) |
| Secret Manager | owner-held sources | re-provision + rotate (SEC-SECRET-001) | **not yet recoverable** (no values provisioned) |
| DNS registrar | Squarespace (owner-attested controls) | registrar access + exported zone | **partially** (controls evidenced; no exported rollback zone yet — SEC-DNS-001) |
| Domains | registrar | re-point after rebuild | **partially** |
| Cloud Logging / forensic sinks | locked bucket (owner-pending) | re-create sinks (SEC-FORENSICS Pass 03) | **not yet recoverable** (sinks owner-pending) |
| Backups | Tier-C immutable vault (planned) | restore (SEC-BACKUP-001) | **not yet recoverable** (none verified) |
| Forensic evidence | sealed cases + locked-bucket export | read-back from locked bucket | **partially** (seal exists; export owner-pending) |
| Deployment pipeline | CI config + Dockerfile/standalone (`build-gcp-deploy`) | re-run pipeline into rebuilt infra | **partially** (defined; unmerged/unproven end-to-end) |

**Summary:** code/docs/repo = **recoverable**. Everything stateful or
infra-bound = **not yet** or **partially** recoverable. **0 dependencies proven
by a real drill.**

## 4. Canonical rebuild sequence (detail in the runbook)
1. **Infrastructure** — fresh GCP project; `terraform apply` (network, Cloud Run, Cloud SQL/Neon, buckets, IAM/Workload Identity).
2. **Database** — provision Postgres/Neon; run forward-only migrations; restore from Tier-C immutable vault (+ PITR).
3. **Secrets** — re-provision Secret Manager (names per SEC-SECRET-001), bind least-privilege, rotate.
4. **Deployment** — build + deploy the standalone container; min-instances ≥1; HTTPS LB.
5. **Verification** — run the gate suite (`verify:cyber-resilience`, `verify:ledger`, `verify:replay`, `verify:navigator-refresh`, `verify:csp-hydration`).
6. **Governance validation** — `verify:security-governance`, `verify:security-conformance`, `verify:module-sovereignty`, `verify:public-disclaimer`.
7. **Forensic validation** — re-create Cloud Logging sinks; confirm seal + export read-back.
8. **User acceptance** — core public flow works end-to-end on the rebuilt stack.

## 5. DR drill procedure (summary; full in runbook)
Isolated recovery environment → restore from backup → restore configuration →
restore secrets (scratch values) → restore deployment → execute verification
suite → capture evidence + **measure RPO/RTO**.

## 6. Closure evidence for SEC-DR-001
- [ ] Successful **rebuild** (infra + deployment from runbook) in an isolated environment.
- [ ] Successful **restore** (SEC-BACKUP-001 restore test passes as part of the drill).
- [ ] **Verification reports** green on the rebuilt stack (gate suite above).
- [ ] **Measured RTO** ≤ 240 min and **measured RPO** ≤ 60 min, captured from the drill.
- [ ] `RECOVERY_CERTIFICATION` updated: a passing sim (`passed:true`, measured RPO/RTO within targets), `recovery_score`, `certification_date`, `expiration`, `certified_by`.
- [ ] **Owner sign-off (Caitlin) + infra sign-off**; multi-party where founder controls apply.
- **Then** `recoveryCertificationValid()` + `recoveryFrameworkInvariants().ok` → SEC-DR-001 satisfiable; a recorded human review closes it (never automatic).

## 7. Current state
- **DR confidence:** **LOW** — no drill ever run; `recoveryCertificationValid()=false`; `recovery_score:0`.
- **Recovery gaps:** no provisioned DB, no verified backup, no provisioned secrets, IaC never applied, forensic sinks owner-pending, no exported DNS rollback zone, deploy pipeline unproven end-to-end.
- **Estimated recovery time:** unmeasured; target RTO ≤ 240 min / RPO ≤ 60 min — to be proven by the drill.
- **Blockers preventing a successful drill today:** SEC-BACKUP-001 (no restore floor), SEC-SECRET-001 (no secrets to restore), GCP infra not provisioned (IaC plan-only), SEC-FORENSICS sinks owner-pending. A drill cannot pass until at least SEC-BACKUP + SEC-SECRET + base GCP infra exist.

## Posture
Audit only. **SEC-DR-001 OPEN** (RECOVERY-CERT-001 folded inside); 10 blockers open;
`combinedProductionReady=false`. No cloud provisioning, no DNS/secrets/production/financing change.
