# Security & Cyber Resilience Foundation

Governance/security infrastructure only. **No live production. Do not merge. Stop for human review.**
Built on the FortKnox + domain-governance spine — composes with it, never weakens it.

## Modules (all under `src/security/`)

| Doctrine | File | What it governs |
|---|---|---|
| SECURITY-DR-001 | `securityRecoveryFramework.ts` | 8 cyber recovery states (NORMAL → … → RETURN_TO_SERVICE) + 5 scenarios (ransomware, extortion, cloud/insider compromise, infrastructure destruction). Transition guard; RETURN_TO_SERVICE only via REVALIDATION. |
| IMMUTABLE-BACKUP-001 | `backupGovernance.ts` | Tiers A–D; per-backup record (id, type, created_at, retention_class, immutable_until, encrypted, verification_status, restore_test_date). Blocker: a usable Tier C immutable backup must be verified + restore-tested. |
| RECOVERY-CERT-001 | `recoveryCertification.ts` | RPO/RTO, recovery simulations, score, certification window. Blocks production if missing or expired. |
| DNS-GOV-001 | `dnsGovernance.ts` | **Extends** DOMAIN-ASSET-001: registrar, dns_provider, registrar/transfer lock, MFA, owner_verified, recovery_contacts, founder_approval_required. `productionDnsCutoverAllowed()` = existing gate AND DNS controls (never looser). |
| SECRET-GOV-001 | `secretsGovernance.ts` | Secret inventory (id, rotation_period, last_rotation, rotation_status, environment, owner, risk_level), service-account inventory, no-hardcoded attestation, vault-backed requirement, **Secret Risk Dashboard**. |
| FORENSICS-001 | `forensicPreservation.ts` | Preserve audit/runtime/api/security/deployment/config evidence; forensic_case_id + evidence_hash + chain_of_custody; integrates TECH-LEDGER-001 / TECH-REPLAY-001; seal detects tamper. |
| SECURITY-LOCKDOWN-001 | `securityLockdownRuntime.ts` | SECURITY_LOCKDOWN mode: denies deployments/promotions/external connectors/external sync/admin mutations; allows only audit/forensics/read-only recovery (fail-closed). |
| CLOUD-RECOVERY-001 | `cloudRecoveryManifest.ts` | Ordered, dependency-checked rebuild for total loss (cloud account, DB, secrets, DNS, CI/CD); recovery authority + verification per step. |
| SECURITY-DRILLS-001 | `securityDrillFramework.ts` | 6 drill scenarios; drill records (id, scenario, date, result, lessons_learned, remediation_items); read-only posture simulations against the real gates. |
| CYBER-RESILIENCE-DASHBOARD | `securityResilienceDashboard.ts` | 8-panel dashboard + overall Cyber Resilience Score + the production gate (owns the 5 blockers). |

## Production blockers (any failed blocker → `production_ready=false`)
`SEC-DR-001` (recovery framework + valid recovery certification) · `SEC-BACKUP-001` (immutable backup verified) ·
`SEC-DNS-001` (registrar+DNS verified) · `SEC-SECRET-001` (secrets vault-backed + rotation) ·
`SEC-FORENSICS-001` (forensic preservation wired). All five also registered as controls in
`securityHardeningManifest` group **P**, and surfaced on the security dashboard (`securityDashboardStatus`).

## Honesty / human-review gates
Every underlying control defaults to **unverified/pending** — so `productionReady()` is **false** until a human
verifies backups, DNS, secrets, forensics, and recovery, AND records `CYBER_RESILIENCE_HUMAN_REVIEW_COMPLETE`.
The build asserts nothing it hasn't earned; the Cyber Resilience Score reads low (currently 44/100) by design.

## Verification
`verify:cyber-resilience` proves: 8 states/5 scenarios + transition guard; immutable backup NOT verified by
default; recovery cert missing → blocks; DNS cutover blocked + never looser than the existing domain gate;
secrets not verified + risk dashboard flags overdue; forensic seal verifies AND detects a tampered manifest;
lockdown denies deploy/promote/connector/sync/admin and allows only audit/forensic/recovery; rebuild order
valid + covers all 5 losses; drill lockdown posture holds, full posture not ready; **production_ready=false with
ALL FIVE blockers OPEN**; existing FortKnox + domain controls still present; gate ALPHA_PENDING.

`verify:security-conformance`, `verify:security-governance`, and `verify:domain-governance` all still PASS
(existing governance not weakened). `tsc --noEmit` clean; `npm run build` exit 0.
