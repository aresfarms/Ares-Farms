# GCP Migration Runbook — Furlong (furlongpathways.com)

**Owner:** Caitlin · **Date:** 2026-06-12 · **Branch:** `build-gcp-nonce-csp-readiness` (off `main @ f007e38`)
**Posture:** production BLOCKED — 10 open blockers (5 SEC + 5 REALITY), `production_ready=false`. This runbook
prepares the path; **nothing here activates production.** Operator: Caitlin (environmental engineer) — every
step states the exact command or console click.

---

## 1. GCP project / account setup
- Project: `furlong-dev` (existing target from the Postgres migration spec); create `furlong-prod` only at go-live.
- Billing account attached; budget alert at a Caitlin-chosen monthly cap.
- Enable APIs: Cloud Run, Cloud SQL Admin, Secret Manager, Artifact Registry, Cloud Build, Cloud Logging/Monitoring, Cloud Scheduler.
- Command sketch: `gcloud services enable run.googleapis.com sqladmin.googleapis.com secretmanager.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com`.

## 2. IAM / service accounts
- `furlong-run@<project>` — Cloud Run runtime SA: roles `cloudsql.client`, `secretmanager.secretAccessor`, `logging.logWriter`. NOTHING broader.
- `furlong-deploy@<project>` — CI deploy SA: `run.admin`, `artifactregistry.writer`, `iam.serviceAccountUser` (on the runtime SA only).
- Humans: Caitlin = Owner; Stuart = steward per multi-party governance (no unilateral prod change — matches FortKnox doctrine).
- No SA keys downloaded; use Workload Identity / `gcloud auth` only. (Owner-only secrets rule stands.)

## 3. Secret Manager
Secrets exist ONLY in Secret Manager — never in repo, env files in git, or build logs. Names (values owner-set):
- `furlong-db-password` (already specified by the Postgres migration spec)
- `DATABASE_URL` / `CORE_DATABASE_URL` / `LISTING_DATABASE_URL`
- `NEXTAUTH_SECRET`
- `PREVIEW_BASIC_AUTH_USER` / `PREVIEW_BASIC_AUTH_PASSWORD` (locked-preview wall)
- third-party API keys (e.g. Smithsonian journey-image key), webhook secrets
**Gate:** `npm run verify:repo-secrets` must PASS (scans tracked files for live-credential patterns; CI-runnable).

## 4. Database target + migration plan
- Target: Cloud SQL Postgres (`furlong-dev:us-central1:furlong-db`), PRIVATE IP, no public endpoint; app connects via Cloud SQL connector from Cloud Run.
- Two databases per the file-store→Postgres spec: core (no PII, hash-chained INSERT-only ledgers, tokens hash-only) and listing-module (separate credentials; Caitlin creates via gcloud when instructed).
- Migration = the numbered migrations already proven via PGlite; run with `npm run` migration scripts against the proxy; verify row counts + hash-chain heads match the file-store export.

## 5. Backups + restore test (feeds SEC-BACKUP-001)
- Cloud SQL automated daily backups + PITR (7-day WAL) ON before any real data.
- GCS export weekly to the immutable bucket (object-lock/retention — IMMUTABLE-BACKUP-001 Tier C).
- **Restore test (required to close SEC-BACKUP-001):** restore latest backup into a scratch instance, run `verify:ledger`/`verify:replay` against it, document time-to-restore. Evidence recorded by Caitlin; blocker stays open until done.
- Local 3-2-1 copy: `furlong-local-backup.sh` (secrets step owner-only, `ALLOW_SECRETS_BACKUP=yes` never set by agents).

## 6. Cloud Run target
- Container from the existing standalone Dockerfile (GCP branch work); deploy `furlong-web` with: min instances 0–1, max small; concurrency default; CPU 1; mem 512Mi–1Gi; request timeout 60s.
- Mount secrets as env via Secret Manager references — never literal env values in YAML committed to git.
- Health check `/api/health` (or `/` 200). Locked preview deploys keep the Basic-auth wall env-set.

## 7. Environment variables
- `NODE_ENV=production` (activates the NONCE CSP path in `src/proxy.ts`)
- `NEXTAUTH_URL=https://furlongpathways.com`
- DB URLs via Secret Manager refs; `NEXT_PUBLIC_*` flags: financing preview flag MUST be absent/false in prod.
- Document every var in deploy config; no secret values in repo.

## 8. Domain / DNS cutover plan (feeds SEC-DNS-001 — stays OPEN until done + reviewed)
- Canonical domain: `furlongpathways.com` (furlonghub.com redirects). Only the TWO governed domains (DOMAIN-ASSET-001).
- Pre-cutover: registrar access verified by Caitlin; current records exported (rollback copy); Cloud Run domain mapping or HTTPS LB created; cert issued and VALID; staging hostname smoke-tested incl. `verify:csp-hydration` against the real edge.
- Cutover: lower TTL 24h ahead → switch A/AAAA/CNAME → verify HTTPS + headers + nonce-CSP hydration on the live host.
- **Rollback:** restore exported records (TTL still low), confirm old target healthy. Documented BEFORE cutover.

## 9. Monitoring / logging / alerting
- Cloud Logging: app logs + security logs (operator wall denials, rate-limit events, failed logins).
- Threat/harassment escalation ledger (`data/threat-escalation-ledger.ndjson` → DB table post-migration): surfaced to the human-review dashboard ONLY (never public); alert on new NEW-status events.
- Uptime check on `/`; alert to Caitlin's email.
- CSP violation monitoring: add `report-to`/`report-uri` endpoint post-launch; until then watch browser console during reviews + LB logs for blocked-resource spikes.
- Backup success/failure alerts from Cloud SQL ops; Cloud Scheduler job failures (the two cron ingests) alert.

## 10. Disaster recovery
- `cloudRecoveryManifest` (security module #8) is the ordered rebuild: account → DB → secrets → DNS → CI/CD.
- Inputs: repo mirror + DB dump + owner-held encrypted secrets bundle + this runbook (the 3-2-1 plan).
- RECOVERY-CERT-001 stays folded inside SEC-DR-001: cert must be valid, unexpired, simulation-backed, human-reviewed before SEC-DR-001 can close.

## 11. Security blocker closure criteria (NONE close in this branch)
| Blocker | Closes only when |
|---|---|
| SEC-DR-001 | recovery framework invariants + RECOVERY-CERT sub-gate (valid/unexpired/sim-backed/human-reviewed) |
| SEC-BACKUP-001 | immutable backup provisioned + restore test evidence (§5) |
| SEC-DNS-001 | §8 complete incl. nonce-CSP hydration verified on the live edge + rollback plan |
| SEC-SECRET-001 | Secret Manager migration complete + rotation current + `verify:repo-secrets` green |
| SEC-FORENSICS-001 | forensic preservation verified per its doctrine |
| REALITY-* (5) | per REALITY_BLOCKERS_MERGE_NOTE — incl. REALITY-URL-001 only with a real licensed fetch path + review |

## 12. Human review checklist (Caitlin, before any go-live step)
- [ ] Rendered review of the production build (Navigator conversation, refusals, overview, console clean, zero CSP violations)
- [ ] `verify:csp-hydration` PASS against the production edge
- [ ] All 10 blockers individually reviewed (close only with evidence)
- [ ] Counsel items resolved: LEGAL-REVIEW-001 (threat metadata), financing disclaimer, FHA/ownership/advisory language, saved-journeys privacy
- [ ] DNS rollback plan read and approved
- [ ] Stuart steward sign-off where multi-party governance requires it

## 13. No-go criteria (any true ⇒ STOP)
Blocker count ≠ 10-as-expected · any SEC blocker open without approved override · production CSP contains `'unsafe-inline'` in script-src · production-CSP hydration fails · secrets committed · DB restore untested · DNS rollback missing · threat/privacy legal review unresolved · financing node live without approval · internal routes public · Navigator rendered smoke fails.

## 14. Evidence
Every closure records: command output, screenshot where rendered, reviewer name + date — appended to the merge plan / build records.

## 15. Standing hard rules
No production activation. No DNS cutover. No blocker closed without verified evidence. No financing-node activation. Secrets backup is owner-run only. Anonymous-by-default and the 10-blocker model are unchanged by deployment work.
