# Security Hardening + Human Governance — Verification Report (FortKnox)

**Gate: SECURITY_HARDENING_GOVERNANCE = ALPHA_PENDING.** Not merged. Not production-ready.
Branch: build-security-hardening-governance-fort-knox. Builder = verifier (disclosed).
Controls: 68 total — 38 implemented · 14 partial · 9 doctrine-only · 4 missing · 3 required-external.
Alpha-blocking open: 0 · Production blockers open: 30.

## Controls IMPLEMENTED (with evidence)
| id | grp | control | evidence |
|----|-----|---------|----------|
| B-deny-anon | B | /internal,/admin,/operator deny unauthenticated | src/proxy.ts page perimeter · verify:internal-auth · T-wall test |
| B-perm-multiparty | B | Founder/operator permission changes require multi-party approval | securityGovernanceVerification.requireMultiParty · T-multiparty test |
| C-no-single-compromise | C | No single founder can compromise the institution | securityGovernanceVerification quorum invariants · T-governance |
| C-prod-perms-multiparty | C | Production permission change needs multi-party | requireMultiParty('prod-permissions') · T-multiparty |
| C-master-rotate-multiparty | C | Master-credential rotation needs multi-party | requireMultiParty('master-credential-rotation') · T-multiparty |
| C-no-disable-controls | C | No single founder disables audit/replay/security/governance | CRITICAL_ACTIONS all-founder quorum · T-governance |
| C-pii-export-multiparty | C | Sensitive financial/PII export needs multi-party | requireMultiParty('pii-financial-export') · T-multiparty |
| C-stuart-steward | C | Stuart = steward, not unilateral override | FINANCIAL_HIGH_RISK requires Stuart + ≥1 founder · T-steward |
| C-founder-procedures | C | Compromise/lockout/recovery/succession/escalation procedures | human-security-governance.md + incidentRunbook executable steps |
| D-two-channel | D | Two-channel verification for high-risk requests | humanVerificationPolicy.verifyHighRiskRequest · T-traps |
| D-urgent-suspicious | D | Urgent access/money/key/export requests treated suspicious | isHighRisk + email-cannot-self-authorize · T-traps |
| D-record-verifier | D | High-risk approvals record verifier/channel/ts/rationale/audit-ref | verifyHighRiskRequest writes a chained security event · T-traps |
| E-treasury-multiparty | E | Multi-party approval for treasury movements + exports | requireMultiParty('treasury-movement'/'financial-export') · T-treasury |
| E-treasury-freeze | E | Treasury emergency freeze control | incidentRunbook.treasuryFreeze (state flag, blocks movements) · T-freeze |
| E-no-card-data | E | No payment/card data stored; PCI processor only | no payment capture anywhere (constitutional constraint asserted); spec G/H |
| F-core-anon | F | Core anonymous/tokenized; cannot resolve token→identity | consentLedger PII guard + token hashing · verify:consent-model |
| F-consent-bound | F | Consent-bound access before PII access | consentLedger.hasActiveConsent + guards.consentBoundAccess |
| H-csrf | H | CSRF on state-changing routes | Next server-action origin enforcement · T-csrf |
| H-headers | H | Security headers (CSP/HSTS/frame-ancestors/nosniff/referrer) | next.config headers() · T-headers |
| H-rate-limit | H | Rate limiting + size limits on public forms | src/proxy.ts evaluateRateLimit · T-ratelimit |
| H-sanitize-ingest | H | Source-ingested content sanitized before store + render | ingestSanitizer + listing projection · T-sanitize |
| I-no-secrets-repo | I | No secrets in repo + CI secret scanning | .github/workflows/security.yml gitleaks · verify:secret-scan |
| I-sca | I | Dependency/SCA scanning | .github/workflows/security.yml npm audit (high) |
| I-sbom | I | SBOM generation | .github/workflows/security.yml CycloneDX artifact |
| I-pr-gate | I | Security-review gate on every PR | security.yml security-review-gate job |
| J-append-only | J | Append-only audit/consent ledger | auditLedger + consentLedger (append-only NDJSON) |
| J-hash-chain | J | Hash-chain ledger verification | ledgerHashChain.verifyLedgerChain wired into auditLedger · T-chain |
| J-nightly-integrity | J | Nightly ledger integrity check | scripts/verifyLedgerIntegrity (run:ledger-integrity) — schedule via Cloud Scheduler |
| J-forensic-preserve | J | Forensic evidence preservation mode | incidentRunbook.forensicLockdown (read-only + snapshot) |
| K-prompt-injection | K | Prompt-injection defenses for ingested content | securityGuards.aiIngestGuard + ingestSanitizer · T-injection |
| K-feeds-untrusted | K | External feeds treated untrusted; sanitized | ingestSanitizer at projection; source authority tiers (pre-existing) |
| K-ai-no-decisions | K | AI cannot make final credit/eligibility decisions | Module 45 ai_permitted=false; verified-only program engine (no person-eligibility) |
| K-circuit-breaker | K | Source-ingestion circuit breaker | incidentRunbook.publicIntakeDisable + source not auto-activating |
| L-runbook | L | Security incident runbook + 'someone got in' procedure | securityIncidentRunbook.ts + docs |
| L-emergency-switches | L | Public-intake disable / operator-action lock / treasury freeze / session revoke | incidentRunbook switches (state flags) · T-incident |
| M-honeytokens | M | Honeytoken records/keys/users that alert if touched | securityRuntimeGuards.honeytokenTouch + HONEYTOKENS · T-honeytoken |
| M-dashboard | M | Security dashboard (MFA/scans/backups/ledger/replay/rotation/restore/pentest) | securityDashboardStatus.ts · T-dashboard |
| N-checklist | N | Pen-test readiness checklist + scope/report requirements | docs/security/penetration-test-readiness.md · verify:security-conformance |

## Controls PARTIAL (work item: complete before production)
| id | grp | control | evidence |
|----|-----|---------|----------|
| A-role-separation | A | Separate admin/security/audit/operator roles | operatorRegistry roles + securityRuntimeGuards.ROLE_MATRIX; full separation at IAM (GCP) pending |
| A-short-sessions | A | Short-lived sessions + secure cookies | NextAuth JWT; absolute/inactivity lifetimes to set in authOptions |
| A-stepup | A | Step-up re-auth for sensitive actions | securityRuntimeGuards.requireStepUpAuth (fail-closed) · T-stepup test |
| B-runtime-role | B | Runtime role checks (not registry-only) | server actions check canApproveSourceLegal at call time; ROLE_MATRIX guard adds action-level |
| B-least-priv | B | Least-privilege enforcement | securityRuntimeGuards.enforceLeastPrivilege · T-rbac test |
| B-security-events | B | Failed-login/priv-esc/suspicious access → security events | securityRuntimeGuards.recordSecurityEvent (hash-chained); detection wiring at IdP/LB pending |
| F-retention-purge | F | Retention/purge + DLP/export controls | deleteToken + retention disclosure; core PII-write DLP; module DLP pending |
| F-private-db | F | Private DBs only; no public DB endpoints | infra/gcp Cloud SQL ipv4_enabled=false; no DB today |
| G-gcp-canonical | G | GCP canonical; Railway preview-only | docs/deploy/gcp-deployment-plan.md + infra/gcp Terraform |
| G-sa-least-priv | G | Service accounts least-privilege (no owner/editor) | infra/gcp/iam.tf per-service SAs, cloudsql.client only |
| J-monitor-separate-creds | J | Ledger monitor uses separate credentials from write path | monitor is read-only verify path; separate GCP SA at deploy (jobs SA ≠ core SA) |
| J-replay-protected | J | Replay endpoint protected + unauthorized attempts denied/logged | /api/properties/replay behind API perimeter; explicit deny-log guard pending |
| L-backup-restore | L | Backup restore + ransomware recovery testing | Cloud SQL PITR (infra/gcp); restore-test drill = runbook item |
| M-alerts | M | Failed-login/priv-esc/secret-access/export/after-hours alerts | security-event recorder emits typed events; alert policies = Cloud Monitoring config |

## Controls DOCTRINE-ONLY (enforcement scaffolded; full enforcement pending)
| id | grp | control | evidence |
|----|-----|---------|----------|
| A-mfa-privileged | A | Passkeys/MFA required for founders/operators/admins/stewards | humanVerificationPolicy + securityRuntimeGuards.requireMfa (deny-flag); IdP wiring pending (GCP IAP) |
| A-no-sms-mfa | A | No SMS-only MFA for privileged users | human-security-governance.md policy; enforced at IdP (IAP) — config item |
| A-no-shared-creds | A | No shared credentials | policy; per-identity SAs in infra/gcp (build-gcp-deploy) |
| E-financial-replayable | E | Financial-module access logged + replayable | hash-chained ledger pattern ready; module not built (counsel-gated) |
| F-pii-isolated | F | PII isolated in licensed modules (no PII module exists yet) | separability (verify:module-separability) + GCP per-module DB (Phase 3) |
| G-no-manual-prod | G | No manual prod change without audit event | IaC + manual deploy workflow; cloud audit logging = GCP config |
| H-param-queries | H | Parameterized queries only | no SQL today (JSON stores); enforced when Cloud SQL lands |
| I-rotation | I | Secret rotation procedure | human-security-governance.md; Secret Manager versions (GCP) |
| L-breach-notification | L | Breach-notification procedure (counsel review) | human-security-governance.md placeholder — REQUIRES COUNSEL |

## Controls MISSING (scaffolded with blocking production gate)
| id | grp | control | evidence |
|----|-----|---------|----------|
| A-session-revoke | A | Global session revocation | incidentRunbook.globalSessionRevocation (state flag); session-store invalidation pending |
| F-encrypt-at-rest | F | PII encryption at rest + field-level prep | KMS CMEK in infra/gcp; field-level tokenization spec'd, no PII to encrypt yet |
| H-bot-protection | H | Bot/automation protection for public forms | Cloud Armor / reCAPTCHA Enterprise (Phase 4); no public write form ships today |
| I-image-scan | I | Container/image scanning + signed provenance | Dockerfile exists; Artifact Registry scan + cosign = Phase 4 CI |

## REQUIRED-EXTERNAL (cannot be satisfied in-house — block production)
| id | grp | control | evidence |
|----|-----|---------|----------|
| N-pentest | N | Third-party penetration test | NOT scheduled — production blocked until critical/high remediated + retested |
| N-glba-audit | N | GLBA / security audit | REQUIRED before any real borrower PII |
| N-red-team | N | Red-team (incl. prompt injection + social engineering) | REQUIRED before go-live |

## Tests added (verify:security-governance — all PASS)
Operator-wall anon redirect (live) · CSRF cross-origin POST (live) · security headers CSP/HSTS/XFO/nosniff/referrer (live) · multi-party founder governance (single founder refused; all-founder control-disable; duplicate-approver refused) · Stuart-as-steward (Stuart alone refused; Stuart+1 passes) · 4 human-security traps (urgent access, fake wire, fake password/MFA, fake vendor) all refused without out-of-band; email-cannot-self-authorize · MFA/step-up fail-closed; SMS rejected · least-privilege deny · hash-chain tamper detection · sanitizer + injection quarantine + honeytoken alert + consent fail-closed · incident switches (treasury freeze, forensic lockdown, stand-down) · dashboard + gate ALPHA_PENDING + constitutional constraints.

## CI / security scan status
verify:secret-scan PASS · verify:ledger-integrity PASS · verify:security-conformance PASS · verify:security-governance PASS · CI security.yml (gitleaks, npm audit high, SBOM CycloneDX, security-review-gate → verify:security-governance, verify:security-conformance) · tsc clean.

## Remaining blockers BEFORE real borrower PII
PII encryption at rest + field-level tokenization (F-encrypt-at-rest) · consent-bound module enforcement + DLP (module side) · GLBA Safeguards mapping · **GLBA/security audit (external)** · per-module encrypted vault + private DB (GCP Phase 3). No PII flows today.

## Remaining blockers BEFORE public production
MFA/IAP + step-up wiring · global session invalidation · IAM role separation + least-priv SAs · bot protection · image scan + signed provenance · security-header + Cloud Armor at the LB · backup/restore + ransomware drills · breach-notification (COUNSEL) · **third-party penetration test + red-team (external)**; production stays blocked until critical/high findings are remediated and retested.

## Clear statement
A professional third-party penetration test AND a GLBA/security audit remain REQUIRED before real borrower PII or go-live. Nothing in this build replaces them; the manifest hard-codes them as required-external production blockers, and the content-claims gate continues to block any public certification claim.
