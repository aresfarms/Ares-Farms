/**
 * SECRET-GOV-001 — Secrets governance (governance only).
 *
 * Inventories institutional secrets + service accounts, tracks rotation and
 * expiration, and requires: no hardcoded secrets (CI secret-scan), vault-backed
 * storage, rotation tracking, expiration tracking, and a service-account
 * inventory. Production is BLOCKED until every tracked secret is vault-backed
 * with current rotation. Provides the Secret Risk Dashboard.
 *
 * No secret VALUES live here — only metadata. Master Volume traceability: Vol III
 * (Secret Manager), Vol II governance.
 */

export const SECRET_GOV_DOCTRINE_ID = "SECRET-GOV-001";
export const SECRET_GOV_VERSION = "secrets-governance-v0.1.0";

export type RotationStatus = "current" | "due-soon" | "overdue" | "unknown";
export type SecretEnvironment = "production" | "staging" | "preview" | "ci" | "local";
export type RiskLevel = "low" | "medium" | "high" | "critical";

export interface SecretRecord {
  secret_id: string;
  rotation_period_days: number;
  last_rotation: string | null;
  rotation_status: RotationStatus;
  environment: SecretEnvironment;
  owner: string; // role, not a person
  risk_level: RiskLevel;
  /** Stored in a managed vault (Secret Manager), never in the repo. */
  vault_backed: boolean;
  expires_at: string | null;
}

export interface ServiceAccount {
  sa_id: string;
  purpose: string;
  least_privilege: boolean;
  key_rotation_status: RotationStatus;
}

/** Seeded inventory — the one known secret + planned SAs. Honest defaults. */
export const SECRET_REGISTRY: SecretRecord[] = [
  { secret_id: "furlong-db-password", rotation_period_days: 90, last_rotation: null, rotation_status: "unknown", environment: "production", owner: "platform-security", risk_level: "critical", vault_backed: true, expires_at: null },
  { secret_id: "anthropic-api-key", rotation_period_days: 90, last_rotation: null, rotation_status: "unknown", environment: "production", owner: "platform-security", risk_level: "high", vault_backed: true, expires_at: null },
  { secret_id: "nextauth-secret", rotation_period_days: 180, last_rotation: null, rotation_status: "unknown", environment: "production", owner: "platform-security", risk_level: "high", vault_backed: true, expires_at: null },
];

export const SERVICE_ACCOUNT_INVENTORY: ServiceAccount[] = [
  { sa_id: "cloud-run-core", purpose: "Core app runtime (cloudsql.client only)", least_privilege: false, key_rotation_status: "unknown" },
  { sa_id: "cloud-run-jobs", purpose: "Scheduled jobs (ingest/freshness) — separate from core", least_privilege: false, key_rotation_status: "unknown" },
  { sa_id: "ci-deployer", purpose: "CI/CD deploy identity", least_privilege: false, key_rotation_status: "unknown" },
];

/**
 * Attestation that no secret is hardcoded in the repo. Backed by the CI
 * secret-scan (gitleaks) + verify:secret-scan — but stays false here until a
 * human confirms the scan is green and wired as a required gate.
 */
export const NO_HARDCODED_SECRETS_ATTESTED = false;

const rotationOk = (r: RotationStatus) => r === "current" || r === "due-soon";

/** PRODUCTION BLOCKER (SEC-SECRET-001): every secret vault-backed + rotation tracked + scan attested. */
export function secretsGovernanceVerified(): boolean {
  if (!NO_HARDCODED_SECRETS_ATTESTED) return false;
  const secretsOk = SECRET_REGISTRY.every((s) => s.vault_backed && rotationOk(s.rotation_status) && !!s.last_rotation);
  const saOk = SERVICE_ACCOUNT_INVENTORY.every((sa) => sa.least_privilege && rotationOk(sa.key_rotation_status));
  return secretsOk && saOk;
}

/** Secret Risk Dashboard — one row per secret + the SA inventory summary. */
export function secretRiskDashboard() {
  const rows = SECRET_REGISTRY.map((s) => ({
    secret_id: s.secret_id,
    environment: s.environment,
    risk_level: s.risk_level,
    vault_backed: s.vault_backed,
    rotation_status: s.rotation_status,
    overdue: s.rotation_status === "overdue" || s.rotation_status === "unknown",
  }));
  return {
    doctrine: SECRET_GOV_DOCTRINE_ID,
    noHardcodedSecretsAttested: NO_HARDCODED_SECRETS_ATTESTED,
    secrets: rows,
    overdueOrUnknown: rows.filter((r) => r.overdue).length,
    notVaultBacked: rows.filter((r) => !r.vault_backed).length,
    serviceAccounts: SERVICE_ACCOUNT_INVENTORY.map((sa) => ({ sa_id: sa.sa_id, least_privilege: sa.least_privilege, key_rotation_status: sa.key_rotation_status })),
    serviceAccountsNotLeastPriv: SERVICE_ACCOUNT_INVENTORY.filter((sa) => !sa.least_privilege).length,
    verified: secretsGovernanceVerified(),
  };
}
