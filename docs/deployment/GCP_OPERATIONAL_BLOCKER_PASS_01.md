# GCP Operational Blocker Pass 01 — Furlong

- **Owner:** Caitlin · **Repo:** `ares-farms` · **Base:** `main @ 5931545`
- **Branch:** `build-gcp-operational-blockers-01`
- **Companion:** `docs/deployment/GCP_MIGRATION_RUNBOOK.md` (the how-to). This file
  is the **evidence-organization pass** — what remains to close each blocker.

> **Purpose:** turn the GCP runbook into an evidence checklist for the 10 open
> production blockers **without activating production.** This pass closes ZERO
> blockers. Hard rules: no production activation, no DNS cutover, no blocker
> closure, no financing activation. Secrets stay owner-controlled (names only
> below).

## Starting posture (verified this pass)

| Check | Value |
|---|---|
| Base hash | `main @ 5931545` |
| Production blockers | **10, all OPEN** |
| `combined_production_ready` | **false** |
| `financing_live` | **false** (gated) |
| Production / DNS | not active / not cut |

Blocker IDs: SEC-DR-001, SEC-BACKUP-001, SEC-DNS-001, SEC-SECRET-001,
SEC-FORENSICS-001, REALITY-INPUT-001, REALITY-CONTEXT-001, REALITY-URL-001,
REALITY-PRIVACY-001, REALITY-OUTPUT-001.

---

## Part A — Per-blocker evidence matrix

Columns: **Status · Owner · Evidence needed to close · Commands/checks · Human
action · Why still open.** Nothing here is closeable in this pass.

### SEC-DR-001 — disaster recovery / recovery certification
- **Status:** OPEN. **Owner:** Caitlin + infra.
- **Evidence to close:** a valid, unexpired, **simulation-backed** recovery
  certification meeting RPO/RTO, **human-reviewed**. RECOVERY-CERT-001 is folded
  inside SEC-DR-001 (never a sixth blocker).
- **Commands/checks:** `npm run verify:cyber-resilience`;
  `recoveryFrameworkInvariants().ok && recoveryCertificationValid()`.
- **Human action:** run a DR drill against a restored stack; record RPO/RTO; sign off.
- **Why open:** no DR drill / valid certification exists yet (`recoveryCertificationValid()=false`).

### SEC-BACKUP-001 — backups + restore test
- **Status:** OPEN. **Owner:** Caitlin + infra.
- **Evidence to close:** Cloud SQL automated daily backups + PITR ON; an
  **immutable** off-instance copy (Tier-C, object-lock) provisioned; a **restore
  test** that restores the latest backup to a scratch instance and passes
  `verify:ledger`/`verify:replay`, with time-to-restore recorded.
- **Commands/checks:** `immutableBackupVerified()` via `verify:cyber-resilience`;
  restore-drill evidence record.
- **Human action:** provision the Tier-C vault; take a backup; perform + document the restore.
- **Why open:** vault not provisioned; no restore evidence.

### SEC-DNS-001 — domain / DNS / HTTPS / rollback
- **Status:** OPEN. **Owner:** Caitlin (multi-party founder controls).
- **Evidence to close:** registrar access verified; auto-renew + transfer-lock +
  DNSSEC; canonical-domain sign-off (founder-approved candidate
  **furlongpathways.com**); cert issued + VALID on staging; nonce-CSP hydration
  verified on the real edge; **redirect strategy** (typo/.org → compasstocapital.com)
  documented; **rollback** (exported records, low TTL) rehearsed BEFORE cutover.
- **Commands/checks:** `npm run verify:domain-governance` + `verify:domain-purpose`;
  `dnsGovernanceVerified()`; `verify:csp-hydration` against the live edge.
- **Human action:** registrar/DNS controls + multi-party authority sign-off; choose canonical; rehearse rollback.
- **Why open:** controls unverified; **no DNS cutover in this pass**.

### SEC-SECRET-001 — Secret Manager / no repo secrets
- **Status:** OPEN. **Owner:** Caitlin + infra.
- **Evidence to close:** every secret in GCP Secret Manager (names below);
  rotation policy current; runtime reads via Workload Identity (no downloaded SA
  keys); repo provably clean.
- **Commands/checks:** `npm run verify:repo-secrets` (repo scan — currently
  GREEN); Secret Manager inventory + rotation record (not yet);
  `secretsGovernanceVerified()` via `verify:cyber-resilience`.
- **Human action:** create the named secrets in Secret Manager; set rotation; bind least-privilege access.
- **Why open:** vault not provisioned; rotation unverified (`secretsGovernanceVerified()=false`). Repo scan clean is necessary, not sufficient.

### SEC-FORENSICS-001 — logging / forensics
- **Status:** OPEN. **Owner:** Caitlin + infra.
- **Evidence to close:** forensic evidence classes fully wired (tamper-evident
  retention, security logs, escalation-ledger export) + verified.
- **Commands/checks:** `forensicReadinessVerified()` via `verify:cyber-resilience`.
- **Human action:** wire Cloud Logging sinks + the threat/harassment escalation ledger export; verify tamper-evidence.
- **Why open:** evidence classes only partially wired.

### REALITY-INPUT-001 — public input guard
- **Status:** OPEN. **Owner:** Caitlin (human review). **Evidence:** sign-off of
  the public input guard. **Check:** `npm run verify:reality-security` (+
  `verify:break-me` proves the guard holds across obfuscation). **Why open:**
  controls + gates pass; awaiting recorded human review.

### REALITY-CONTEXT-001 — AI context firewall
- **Status:** OPEN. **Owner:** Caitlin. **Evidence:** sign-off that owner/
  demographic fields never enter model context. **Check:** `verify:reality-security`.
  **Why open:** awaiting human review.

### REALITY-URL-001 — URL sandbox
- **Status:** OPEN. **Owner:** Caitlin. **Evidence:** sign-off; SSRF/credential
  fetch blocked; `CANDIDATE_SOURCES_LIVE=false`; no real fetch. **Check:**
  `verify:reality-security`. **Why open:** review + candidate-source activation deferred.

### REALITY-PRIVACY-001 — owner/demographic firewall
- **Status:** OPEN. **Owner:** Caitlin. **Evidence:** sign-off; data-layer
  stripping + FHA/identity refusals (now obfuscation-hardened). **Check:**
  `verify:reality-security` + `verify:navigator` + `verify:break-me`. **Why open:** awaiting human review.

### REALITY-OUTPUT-001 — Navigator output gate
- **Status:** OPEN. **Owner:** Caitlin. **Evidence:** sign-off; ranges-with-basis,
  no promises/determinations/decisions. **Check:** `verify:reality-security` +
  `verify:navigator`. **Why open:** awaiting human review.

> All five REALITY blockers: controls exist and gates pass; they remain OPEN by
> design until Caitlin records human-review sign-off. This pass does not record it.

---

## Part B — Operational checklist (GCP)

1. **GCP project setup** — `furlong-dev` exists; create `furlong-prod` only at
   go-live. Billing + budget alert. Enable: Cloud Run, Cloud SQL Admin, Secret
   Manager, Artifact Registry, Cloud Build, Logging/Monitoring, Scheduler.
2. **IAM / service accounts** — `furlong-run@` (runtime: `cloudsql.client`,
   `secretmanager.secretAccessor`, `logging.logWriter`); `furlong-deploy@` (CI:
   `run.admin`, `artifactregistry.writer`, `iam.serviceAccountUser` on the
   runtime SA only). Workload Identity; **no downloaded SA keys**. Caitlin=Owner;
   external broker workspace = no production-governance authority; required independent review is role-bound.
3. **Secret Manager inventory** (names only — values owner-set, never in repo):
   `NEXTAUTH_SECRET`, `DATABASE_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
   `AUTH_CREDENTIAL_SHARED_SECRET`, `ANTHROPIC_API_KEY`, `GSA_API_KEY`,
   `RESEND_API_KEY`, plus `furlong-db-password`. Non-secret runtime config
   (`NEXTAUTH_URL`, `NEXT_PUBLIC_BASE_URL`, `NODE_ENV=production`,
   `API_AUTH_ENFORCEMENT`, `RATE_LIMITING_ENABLED`, …) in deploy config.
   Preview-only (`PREVIEW_BASIC_AUTH_*`, `CSP_HYDRATION_ALLOW_DEV`) UNSET in prod.
4. **Cloud SQL / database migration** — Postgres, PRIVATE IP, Cloud SQL
   connector from Cloud Run. Core DB (no PII, hash-chained INSERT-only ledgers)
   + listing DB (separate creds). Forward-only numbered migrations run as a
   discrete pre-deploy step (never on container boot); verify row counts +
   hash-chain heads vs the file-store export.
5. **Cloud Run deployment target** — standalone Next container; min instances ≥1
   (dynamic-rendered app, avoids cold-start); HTTPS LB. `NODE_ENV=production`
   activates the nonce-CSP path in `src/proxy.ts`; the LB must not strip/override
   response headers. Secrets mounted via Secret Manager refs only.
6. **Backup + restore test procedure** — daily automated backups + PITR; weekly
   GCS export to the immutable bucket; **restore drill**: restore latest → scratch
   instance → `verify:ledger`/`verify:replay` → record time-to-restore. Local
   3-2-1 copy is **owner-only** (secrets/GPG steps never run by an agent).
   → closes SEC-BACKUP-001 + feeds SEC-DR-001.
7. **DNS cutover + rollback plan** — pre-cutover: registrar verified, records
   exported (rollback copy), Cloud Run domain mapping/LB + cert VALID, staging
   smoke incl. `verify:csp-hydration` on the real edge, redirect strategy
   documented in the SEC-DNS-001 sign-off. Cutover: lower TTL 24h ahead → switch
   A/AAAA/CNAME → verify HTTPS + headers + nonce-CSP. Rollback: restore exported
   records (TTL still low), confirm old target healthy. **No cutover this pass.**
8. **Monitoring / logging / alerting** — Cloud Logging (app + security logs:
   operator-wall denials, rate-limit, failed logins); escalation ledger →
   human-review dashboard only; uptime check on `/`; CSP report endpoint
   post-launch; backup-success + cron-failure + budget alerts.
9. **Go / No-Go checklist** — all NO-GO this pass:

| Gate | Required to GO | Now |
|---|---|---|
| 10 blockers closed with evidence | yes | **NO** (10 open) |
| `combined_production_ready=true` | yes | **NO** (false) |
| Human review recorded | yes | **NO** |
| Cloud SQL provisioned + restore-tested | yes | **NO** |
| Immutable backup verified | yes | **NO** |
| Secret Manager live + rotation | yes | **NO** |
| DNS controls verified + canonical chosen | yes | **NO** |
| Forensic preservation wired | yes | **NO** |
| Financing decision (stays gated) | n/a | gated |

**Verdict: NO-GO.** This pass organizes evidence only; it does not launch.

## Next required human / GCP action
1. Create GCP projects, runtime/deploy SAs, Secret Manager secrets (by name).
2. Provision Cloud SQL, enable backups, run a **restore drill** → SEC-BACKUP-001 + SEC-DR-001 evidence.
3. Registrar/DNS controls + canonical-domain sign-off (multi-party) → SEC-DNS-001.
4. Wire forensic logging/retention → SEC-FORENSICS-001.
5. Caitlin records human-review sign-off on the five REALITY controls.
6. Re-run this pass to attach captured evidence; only then revisit go/no-go.
