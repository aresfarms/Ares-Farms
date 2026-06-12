/**
 * Security Hardening Manifest — machine-readable controls A–N (FortKnox).
 *
 * Each control carries a VERIFIED status (per the spec's primary rule):
 *   implemented | partial | doctrine-only | missing | required-external
 * plus blocking flags. `securityHardeningStatus()` computes the gate and refuses
 * readiness while any Alpha-blocking control is not implemented OR human review
 * is absent. The build can never self-declare security readiness.
 *
 * Constitutional constraints (all must remain true; tests assert them):
 * no live PII flows · no production activation · no legal/regulatory reliance ·
 * no payment/card data stored · no public certification claims · third-party
 * pentest + GLBA/security audit REQUIRED before real PII or go-live.
 */

export type ControlStatus = "implemented" | "partial" | "doctrine-only" | "missing" | "required-external";
export type ControlGroup = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J" | "K" | "L" | "M" | "N" | "O" | "P";

export interface SecurityControl {
  id: string;
  group: ControlGroup;
  name: string;
  status: ControlStatus;
  blockingForAlpha: boolean;
  blockingForProduction: boolean;
  evidence: string;
}

export const SECURITY_HARDENING_VERSION = "security-hardening-governance-v0.1.0";

export const SECURITY_CONTROLS: SecurityControl[] = [
  // A — account/identity
  { id: "A-mfa-privileged", group: "A", name: "Passkeys/MFA required for founders/operators/admins/stewards", status: "doctrine-only", blockingForAlpha: false, blockingForProduction: true, evidence: "humanVerificationPolicy + securityRuntimeGuards.requireMfa (deny-flag); IdP wiring pending (GCP IAP)" },
  { id: "A-no-sms-mfa", group: "A", name: "No SMS-only MFA for privileged users", status: "doctrine-only", blockingForAlpha: false, blockingForProduction: true, evidence: "human-security-governance.md policy; enforced at IdP (IAP) — config item" },
  { id: "A-role-separation", group: "A", name: "Separate admin/security/audit/operator roles", status: "partial", blockingForAlpha: false, blockingForProduction: true, evidence: "operatorRegistry roles + securityRuntimeGuards.ROLE_MATRIX; full separation at IAM (GCP) pending" },
  { id: "A-no-shared-creds", group: "A", name: "No shared credentials", status: "doctrine-only", blockingForAlpha: false, blockingForProduction: true, evidence: "policy; per-identity SAs in infra/gcp (build-gcp-deploy)" },
  { id: "A-short-sessions", group: "A", name: "Short-lived sessions + secure cookies", status: "partial", blockingForAlpha: false, blockingForProduction: true, evidence: "NextAuth JWT; absolute/inactivity lifetimes to set in authOptions" },
  { id: "A-session-revoke", group: "A", name: "Global session revocation", status: "missing", blockingForAlpha: false, blockingForProduction: true, evidence: "incidentRunbook.globalSessionRevocation (state flag); session-store invalidation pending" },
  { id: "A-stepup", group: "A", name: "Step-up re-auth for sensitive actions", status: "partial", blockingForAlpha: false, blockingForProduction: true, evidence: "securityRuntimeGuards.requireStepUpAuth (fail-closed) · T-stepup test" },
  // B — operator wall
  { id: "B-deny-anon", group: "B", name: "/internal,/admin,/operator deny unauthenticated", status: "implemented", blockingForAlpha: true, blockingForProduction: true, evidence: "src/proxy.ts page perimeter · verify:internal-auth · T-wall test" },
  { id: "B-runtime-role", group: "B", name: "Runtime role checks (not registry-only)", status: "partial", blockingForAlpha: false, blockingForProduction: true, evidence: "server actions check canApproveSourceLegal at call time; ROLE_MATRIX guard adds action-level" },
  { id: "B-least-priv", group: "B", name: "Least-privilege enforcement", status: "partial", blockingForAlpha: false, blockingForProduction: true, evidence: "securityRuntimeGuards.enforceLeastPrivilege · T-rbac test" },
  { id: "B-perm-multiparty", group: "B", name: "Founder/operator permission changes require multi-party approval", status: "implemented", blockingForAlpha: true, blockingForProduction: true, evidence: "securityGovernanceVerification.requireMultiParty · T-multiparty test" },
  { id: "B-security-events", group: "B", name: "Failed-login/priv-esc/suspicious access → security events", status: "partial", blockingForAlpha: false, blockingForProduction: true, evidence: "securityRuntimeGuards.recordSecurityEvent (hash-chained); detection wiring at IdP/LB pending" },
  // C — founder human governance
  { id: "C-no-single-compromise", group: "C", name: "No single founder can compromise the institution", status: "implemented", blockingForAlpha: true, blockingForProduction: true, evidence: "securityGovernanceVerification quorum invariants · T-governance" },
  { id: "C-prod-perms-multiparty", group: "C", name: "Production permission change needs multi-party", status: "implemented", blockingForAlpha: true, blockingForProduction: true, evidence: "requireMultiParty('prod-permissions') · T-multiparty" },
  { id: "C-master-rotate-multiparty", group: "C", name: "Master-credential rotation needs multi-party", status: "implemented", blockingForAlpha: true, blockingForProduction: true, evidence: "requireMultiParty('master-credential-rotation') · T-multiparty" },
  { id: "C-no-disable-controls", group: "C", name: "No single founder disables audit/replay/security/governance", status: "implemented", blockingForAlpha: true, blockingForProduction: true, evidence: "CRITICAL_ACTIONS all-founder quorum · T-governance" },
  { id: "C-pii-export-multiparty", group: "C", name: "Sensitive financial/PII export needs multi-party", status: "implemented", blockingForAlpha: true, blockingForProduction: true, evidence: "requireMultiParty('pii-financial-export') · T-multiparty" },
  { id: "C-stuart-steward", group: "C", name: "Stuart = steward, not unilateral override", status: "implemented", blockingForAlpha: true, blockingForProduction: true, evidence: "FINANCIAL_HIGH_RISK requires Stuart + ≥1 founder · T-steward" },
  { id: "C-founder-procedures", group: "C", name: "Compromise/lockout/recovery/succession/escalation procedures", status: "implemented", blockingForAlpha: false, blockingForProduction: true, evidence: "human-security-governance.md + incidentRunbook executable steps" },
  // D — social engineering
  { id: "D-two-channel", group: "D", name: "Two-channel verification for high-risk requests", status: "implemented", blockingForAlpha: true, blockingForProduction: true, evidence: "humanVerificationPolicy.verifyHighRiskRequest · T-traps" },
  { id: "D-urgent-suspicious", group: "D", name: "Urgent access/money/key/export requests treated suspicious", status: "implemented", blockingForAlpha: true, blockingForProduction: true, evidence: "isHighRisk + email-cannot-self-authorize · T-traps" },
  { id: "D-record-verifier", group: "D", name: "High-risk approvals record verifier/channel/ts/rationale/audit-ref", status: "implemented", blockingForAlpha: true, blockingForProduction: true, evidence: "verifyHighRiskRequest writes a chained security event · T-traps" },
  // E — treasury/financial
  { id: "E-treasury-multiparty", group: "E", name: "Multi-party approval for treasury movements + exports", status: "implemented", blockingForAlpha: true, blockingForProduction: true, evidence: "requireMultiParty('treasury-movement'/'financial-export') · T-treasury" },
  { id: "E-treasury-freeze", group: "E", name: "Treasury emergency freeze control", status: "implemented", blockingForAlpha: false, blockingForProduction: true, evidence: "incidentRunbook.treasuryFreeze (state flag, blocks movements) · T-freeze" },
  { id: "E-no-card-data", group: "E", name: "No payment/card data stored; PCI processor only", status: "implemented", blockingForAlpha: true, blockingForProduction: true, evidence: "no payment capture anywhere (constitutional constraint asserted); spec G/H" },
  { id: "E-financial-replayable", group: "E", name: "Financial-module access logged + replayable", status: "doctrine-only", blockingForAlpha: false, blockingForProduction: true, evidence: "hash-chained ledger pattern ready; module not built (counsel-gated)" },
  // F — data/PII
  { id: "F-core-anon", group: "F", name: "Core anonymous/tokenized; cannot resolve token→identity", status: "implemented", blockingForAlpha: true, blockingForProduction: true, evidence: "consentLedger PII guard + token hashing · verify:consent-model" },
  { id: "F-pii-isolated", group: "F", name: "PII isolated in licensed modules (no PII module exists yet)", status: "doctrine-only", blockingForAlpha: false, blockingForProduction: true, evidence: "separability (verify:module-separability) + GCP per-module DB (Phase 3)" },
  { id: "F-encrypt-at-rest", group: "F", name: "PII encryption at rest + field-level prep", status: "missing", blockingForAlpha: false, blockingForProduction: true, evidence: "KMS CMEK in infra/gcp; field-level tokenization spec'd, no PII to encrypt yet" },
  { id: "F-consent-bound", group: "F", name: "Consent-bound access before PII access", status: "implemented", blockingForAlpha: true, blockingForProduction: true, evidence: "consentLedger.hasActiveConsent + guards.consentBoundAccess" },
  { id: "F-retention-purge", group: "F", name: "Retention/purge + DLP/export controls", status: "partial", blockingForAlpha: false, blockingForProduction: true, evidence: "deleteToken + retention disclosure; core PII-write DLP; module DLP pending" },
  { id: "F-private-db", group: "F", name: "Private DBs only; no public DB endpoints", status: "partial", blockingForAlpha: false, blockingForProduction: true, evidence: "infra/gcp Cloud SQL ipv4_enabled=false; no DB today" },
  // G — network/cloud
  { id: "G-gcp-canonical", group: "G", name: "GCP canonical; Railway preview-only", status: "partial", blockingForAlpha: false, blockingForProduction: true, evidence: "docs/deploy/gcp-deployment-plan.md + infra/gcp Terraform" },
  { id: "G-sa-least-priv", group: "G", name: "Service accounts least-privilege (no owner/editor)", status: "partial", blockingForAlpha: false, blockingForProduction: true, evidence: "infra/gcp/iam.tf per-service SAs, cloudsql.client only" },
  { id: "G-no-manual-prod", group: "G", name: "No manual prod change without audit event", status: "doctrine-only", blockingForAlpha: false, blockingForProduction: true, evidence: "IaC + manual deploy workflow; cloud audit logging = GCP config" },
  // H — appsec
  { id: "H-csrf", group: "H", name: "CSRF on state-changing routes", status: "implemented", blockingForAlpha: true, blockingForProduction: true, evidence: "Next server-action origin enforcement · T-csrf" },
  { id: "H-headers", group: "H", name: "Security headers (CSP/HSTS/frame-ancestors/nosniff/referrer)", status: "implemented", blockingForAlpha: true, blockingForProduction: true, evidence: "next.config headers() · T-headers" },
  { id: "H-rate-limit", group: "H", name: "Rate limiting + size limits on public forms", status: "implemented", blockingForAlpha: true, blockingForProduction: true, evidence: "src/proxy.ts evaluateRateLimit · T-ratelimit" },
  { id: "H-sanitize-ingest", group: "H", name: "Source-ingested content sanitized before store + render", status: "implemented", blockingForAlpha: true, blockingForProduction: true, evidence: "ingestSanitizer + listing projection · T-sanitize" },
  { id: "H-bot-protection", group: "H", name: "Bot/automation protection for public forms", status: "missing", blockingForAlpha: false, blockingForProduction: true, evidence: "Cloud Armor / reCAPTCHA Enterprise (Phase 4); no public write form ships today" },
  { id: "H-param-queries", group: "H", name: "Parameterized queries only", status: "doctrine-only", blockingForAlpha: false, blockingForProduction: true, evidence: "no SQL today (JSON stores); enforced when Cloud SQL lands" },
  // I — secrets/supply chain
  { id: "I-no-secrets-repo", group: "I", name: "No secrets in repo + CI secret scanning", status: "implemented", blockingForAlpha: true, blockingForProduction: true, evidence: ".github/workflows/security.yml gitleaks · verify:secret-scan" },
  { id: "I-sca", group: "I", name: "Dependency/SCA scanning", status: "implemented", blockingForAlpha: true, blockingForProduction: true, evidence: ".github/workflows/security.yml npm audit (high)" },
  { id: "I-sbom", group: "I", name: "SBOM generation", status: "implemented", blockingForAlpha: false, blockingForProduction: true, evidence: ".github/workflows/security.yml CycloneDX artifact" },
  { id: "I-image-scan", group: "I", name: "Container/image scanning + signed provenance", status: "missing", blockingForAlpha: false, blockingForProduction: true, evidence: "Dockerfile exists; Artifact Registry scan + cosign = Phase 4 CI" },
  { id: "I-rotation", group: "I", name: "Secret rotation procedure", status: "doctrine-only", blockingForAlpha: false, blockingForProduction: true, evidence: "human-security-governance.md; Secret Manager versions (GCP)" },
  { id: "I-pr-gate", group: "I", name: "Security-review gate on every PR", status: "implemented", blockingForAlpha: false, blockingForProduction: true, evidence: "security.yml security-review-gate job" },
  // J — ledger/audit/replay
  { id: "J-append-only", group: "J", name: "Append-only audit/consent ledger", status: "implemented", blockingForAlpha: true, blockingForProduction: true, evidence: "auditLedger + consentLedger (append-only NDJSON)" },
  { id: "J-hash-chain", group: "J", name: "Hash-chain ledger verification", status: "implemented", blockingForAlpha: true, blockingForProduction: true, evidence: "ledgerHashChain.verifyLedgerChain wired into auditLedger · T-chain" },
  { id: "J-nightly-integrity", group: "J", name: "Nightly ledger integrity check", status: "implemented", blockingForAlpha: false, blockingForProduction: true, evidence: "scripts/verifyLedgerIntegrity (run:ledger-integrity) — schedule via Cloud Scheduler" },
  { id: "J-monitor-separate-creds", group: "J", name: "Ledger monitor uses separate credentials from write path", status: "partial", blockingForAlpha: false, blockingForProduction: true, evidence: "monitor is read-only verify path; separate GCP SA at deploy (jobs SA ≠ core SA)" },
  { id: "J-replay-protected", group: "J", name: "Replay endpoint protected + unauthorized attempts denied/logged", status: "partial", blockingForAlpha: false, blockingForProduction: true, evidence: "/api/properties/replay behind API perimeter; explicit deny-log guard pending" },
  { id: "J-forensic-preserve", group: "J", name: "Forensic evidence preservation mode", status: "implemented", blockingForAlpha: false, blockingForProduction: true, evidence: "incidentRunbook.forensicLockdown (read-only + snapshot)" },
  // K — AI/source intelligence
  { id: "K-prompt-injection", group: "K", name: "Prompt-injection defenses for ingested content", status: "implemented", blockingForAlpha: true, blockingForProduction: true, evidence: "securityGuards.aiIngestGuard + ingestSanitizer · T-injection" },
  { id: "K-feeds-untrusted", group: "K", name: "External feeds treated untrusted; sanitized", status: "implemented", blockingForAlpha: true, blockingForProduction: true, evidence: "ingestSanitizer at projection; source authority tiers (pre-existing)" },
  { id: "K-ai-no-decisions", group: "K", name: "AI cannot make final credit/eligibility decisions", status: "implemented", blockingForAlpha: true, blockingForProduction: true, evidence: "Module 45 ai_permitted=false; verified-only program engine (no person-eligibility)" },
  { id: "K-circuit-breaker", group: "K", name: "Source-ingestion circuit breaker", status: "implemented", blockingForAlpha: false, blockingForProduction: true, evidence: "incidentRunbook.publicIntakeDisable + source not auto-activating" },
  // L — incident/recovery
  { id: "L-runbook", group: "L", name: "Security incident runbook + 'someone got in' procedure", status: "implemented", blockingForAlpha: true, blockingForProduction: true, evidence: "securityIncidentRunbook.ts + docs" },
  { id: "L-emergency-switches", group: "L", name: "Public-intake disable / operator-action lock / treasury freeze / session revoke", status: "implemented", blockingForAlpha: true, blockingForProduction: true, evidence: "incidentRunbook switches (state flags) · T-incident" },
  { id: "L-backup-restore", group: "L", name: "Backup restore + ransomware recovery testing", status: "partial", blockingForAlpha: false, blockingForProduction: true, evidence: "Cloud SQL PITR (infra/gcp); restore-test drill = runbook item" },
  { id: "L-breach-notification", group: "L", name: "Breach-notification procedure (counsel review)", status: "doctrine-only", blockingForAlpha: false, blockingForProduction: true, evidence: "human-security-governance.md placeholder — REQUIRES COUNSEL" },
  // M — monitoring
  { id: "M-alerts", group: "M", name: "Failed-login/priv-esc/secret-access/export/after-hours alerts", status: "partial", blockingForAlpha: false, blockingForProduction: true, evidence: "security-event recorder emits typed events; alert policies = Cloud Monitoring config" },
  { id: "M-honeytokens", group: "M", name: "Honeytoken records/keys/users that alert if touched", status: "implemented", blockingForAlpha: false, blockingForProduction: true, evidence: "securityRuntimeGuards.honeytokenTouch + HONEYTOKENS · T-honeytoken" },
  { id: "M-dashboard", group: "M", name: "Security dashboard (MFA/scans/backups/ledger/replay/rotation/restore/pentest)", status: "implemented", blockingForAlpha: true, blockingForProduction: true, evidence: "securityDashboardStatus.ts · T-dashboard" },
  // N — pentest readiness
  { id: "N-checklist", group: "N", name: "Pen-test readiness checklist + scope/report requirements", status: "implemented", blockingForAlpha: false, blockingForProduction: true, evidence: "docs/security/penetration-test-readiness.md · verify:security-conformance" },
  { id: "N-pentest", group: "N", name: "Third-party penetration test", status: "required-external", blockingForAlpha: false, blockingForProduction: true, evidence: "NOT scheduled — production blocked until critical/high remediated + retested" },
  { id: "N-glba-audit", group: "N", name: "GLBA / security audit", status: "required-external", blockingForAlpha: false, blockingForProduction: true, evidence: "REQUIRED before any real borrower PII" },
  { id: "N-red-team", group: "N", name: "Red-team (incl. prompt injection + social engineering)", status: "required-external", blockingForAlpha: false, blockingForProduction: true, evidence: "REQUIRED before go-live" },
  // O — institutional domain asset governance (DOMAIN-ASSET-001)
  { id: "O-domain-registry", group: "O", name: "Institutional domain asset registry (2 Furlong domains, canonical roles)", status: "implemented", blockingForAlpha: true, blockingForProduction: true, evidence: "src/security/domainAssetManifest.ts (DOMAIN_ASSETS) · verify:domain-governance" },
  { id: "O-domain-multiparty", group: "O", name: "Domain transfer / registrar / DNS-authority / ownership change requires multi-party founders", status: "implemented", blockingForAlpha: true, blockingForProduction: true, evidence: "requireMultiParty domain-* (ALL founders) in src/security/securityGovernanceVerification.ts · verify:domain-governance" },
  { id: "O-domain-dashboard", group: "O", name: "Domain status panel in the security dashboard", status: "implemented", blockingForAlpha: false, blockingForProduction: true, evidence: "domainDashboardPanel in src/security/securityDashboardStatus.ts · verify:domain-governance" },
  { id: "O-prod-dns-human", group: "O", name: "Production DNS cutover requires human review (gate returns false)", status: "implemented", blockingForAlpha: false, blockingForProduction: true, evidence: "productionDnsCutoverAllowed()=false · PRODUCTION_DNS_CUTOVER_REQUIRES_HUMAN_REVIEW · verify:domain-governance" },
  { id: "O-railway-not-authoritative", group: "O", name: "Railway can never be an authoritative production host", status: "implemented", blockingForAlpha: false, blockingForProduction: true, evidence: "railwayCanBeAuthoritativeProductionHost()=false in src/security/domainSecurityVerification.ts · verify:domain-governance" },
  { id: "O-domain-transfer-lock", group: "O", name: "Transfer/registrar lock enabled on every domain", status: "partial", blockingForAlpha: false, blockingForProduction: true, evidence: "manual founder attestation pending (registrar settings not assumed) · DOMAIN_TRANSFER_LOCK_REQUIRED" },
  { id: "O-domain-autorenew", group: "O", name: "Auto-renew enabled on every domain", status: "partial", blockingForAlpha: false, blockingForProduction: true, evidence: "manual founder attestation pending · DOMAIN_AUTORENEW_REQUIRED" },
  { id: "O-domain-dns-review", group: "O", name: "Founder DNS security review recorded", status: "missing", blockingForAlpha: false, blockingForProduction: true, evidence: "no founder DNS review recorded yet · DOMAIN_DNS_REVIEW_REQUIRED" },
  { id: "O-domain-registrar-mfa", group: "O", name: "Registrar accounts use MFA/passkeys", status: "partial", blockingForAlpha: false, blockingForProduction: true, evidence: "manual founder attestation pending (treat registrar account as critical infrastructure)" },
  { id: "O-domain-continuity", group: "O", name: "Domains in founder continuity + disaster recovery records", status: "doctrine-only", blockingForAlpha: false, blockingForProduction: true, evidence: "docs/security/domain-security-governance.md continuity section; founder emergency package item" },
  { id: "O-domain-security-review-launch", group: "O", name: "Domain security review required before public launch", status: "doctrine-only", blockingForAlpha: false, blockingForProduction: true, evidence: "DOMAIN_SECURITY_REVIEW_REQUIRED_BEFORE_PUBLIC_LAUNCH — categorical human gate" },
  // P — cyber resilience foundation (Security & Cyber Resilience build). The
  // five SEC-* blockers + the supporting frameworks. Frameworks are implemented
  // governance; the verified-state controls stay open until a human attests.
  { id: "P-recovery-framework", group: "P", name: "SECURITY-DR-001 cyber recovery state machine", status: "implemented", blockingForAlpha: false, blockingForProduction: true, evidence: "src/security/securityRecoveryFramework.ts (8 states/5 scenarios) · verify:cyber-resilience" },
  { id: "P-lockdown-runtime", group: "P", name: "SECURITY-LOCKDOWN-001 runtime deny policy", status: "implemented", blockingForAlpha: false, blockingForProduction: true, evidence: "src/security/securityLockdownRuntime.ts (deny deploy/promote/connector/sync/admin) · verify:cyber-resilience" },
  { id: "P-cloud-recovery", group: "P", name: "CLOUD-RECOVERY-001 rebuild manifest", status: "implemented", blockingForAlpha: false, blockingForProduction: true, evidence: "src/security/cloudRecoveryManifest.ts (ordered, dependency-checked) · verify:cyber-resilience" },
  { id: "P-drill-framework", group: "P", name: "SECURITY-DRILLS-001 drill framework", status: "implemented", blockingForAlpha: false, blockingForProduction: true, evidence: "src/security/securityDrillFramework.ts (6 scenarios, posture sims) · verify:cyber-resilience" },
  { id: "P-resilience-dashboard", group: "P", name: "CYBER-RESILIENCE-DASHBOARD + production gate", status: "implemented", blockingForAlpha: false, blockingForProduction: true, evidence: "src/security/securityResilienceDashboard.ts (productionReady gate) · verify:cyber-resilience" },
  { id: "P-sec-backup", group: "P", name: "SEC-BACKUP-001 — immutable backup verified + restore-tested", status: "missing", blockingForAlpha: false, blockingForProduction: true, evidence: "IMMUTABLE-BACKUP-001 Tier C vault not yet provisioned/verified — immutableBackupVerified()=false" },
  { id: "P-sec-dr", group: "P", name: "SEC-DR-001 — recovery certification valid (RPO/RTO sim-backed)", status: "missing", blockingForAlpha: false, blockingForProduction: true, evidence: "RECOVERY-CERT-001 certification missing — recoveryCertificationValid()=false" },
  { id: "P-sec-dns", group: "P", name: "SEC-DNS-001 — registrar + DNS controls verified", status: "partial", blockingForAlpha: false, blockingForProduction: true, evidence: "DNS-GOV-001 extends domain governance; controls unverified — dnsGovernanceVerified()=false" },
  { id: "P-sec-secret", group: "P", name: "SEC-SECRET-001 — secrets vault-backed + rotation current", status: "partial", blockingForAlpha: false, blockingForProduction: true, evidence: "SECRET-GOV-001 inventory + Secret Risk Dashboard; rotation unverified — secretsGovernanceVerified()=false" },
  { id: "P-sec-forensics", group: "P", name: "SEC-FORENSICS-001 — forensic preservation wired", status: "partial", blockingForAlpha: false, blockingForProduction: true, evidence: "FORENSICS-001 evidence classes partially wired — forensicReadinessVerified()=false" },
];

export const SECURITY_CONSTITUTIONAL_CONSTRAINTS = {
  noLivePiiFlows: true,
  noProductionActivation: true,
  noLegalRegulatoryReliance: true,
  noPaymentOrCardDataStored: true,
  noPublicCertificationClaims: true,
  thirdPartyPentestAndAuditStillRequired: true,
} as const;

/** Human review attestation — set ONLY by a human after reviewing doc + results. */
export const SECURITY_GOVERNANCE_HUMAN_REVIEW_COMPLETE = false;

export type GovernanceGate = "ALPHA_PENDING" | "BETA_PENDING" | "PRODUCTION_BLOCKED";

export function securityHardeningStatus() {
  const byStatus = (s: ControlStatus) => SECURITY_CONTROLS.filter((c) => c.status === s).map((c) => c.id);
  const alphaBlockingOpen = SECURITY_CONTROLS.filter((c) => c.blockingForAlpha && c.status !== "implemented").map((c) => c.id);
  const productionBlockersOpen = SECURITY_CONTROLS.filter((c) => c.blockingForProduction && c.status !== "implemented").map((c) => c.id);
  const externalBlockers = SECURITY_CONTROLS.filter((c) => c.status === "required-external").map((c) => c.id);
  // Alpha gate is satisfied when alpha-blocking controls are implemented AND a
  // human recorded review; production stays blocked by definition (externals).
  const gate: GovernanceGate =
    alphaBlockingOpen.length === 0 && SECURITY_GOVERNANCE_HUMAN_REVIEW_COMPLETE ? "BETA_PENDING" : "ALPHA_PENDING";
  return {
    gate,
    counts: {
      implemented: byStatus("implemented").length,
      partial: byStatus("partial").length,
      doctrineOnly: byStatus("doctrine-only").length,
      missing: byStatus("missing").length,
      requiredExternal: byStatus("required-external").length,
      total: SECURITY_CONTROLS.length,
    },
    alphaBlockingOpen,
    productionBlockersOpen,
    externalBlockers,
    humanReviewComplete: SECURITY_GOVERNANCE_HUMAN_REVIEW_COMPLETE,
  };
}

/** The package gate — never production-ready from the build. */
export const SECURITY_HARDENING_GOVERNANCE: GovernanceGate = securityHardeningStatus().gate;
