import {
  AccessRole,
  normalizeAccessRole,
} from "@/lib/auth/accessControl";

/**
 * Production Auth Activation Policy
 *
 * Master Volume Governance:
 * - Vol I: Prevents ungoverned identity or role authority from becoming
 *   constitutional platform authority.
 * - Vol II: Protects regulated borrower/operator workflows from open,
 *   passwordless, or caller-claimed identity paths.
 * - Vol III: Provides deterministic auth activation checks before backend
 *   routes are exposed with production enforcement.
 * - Vol IV: Supports deployment readiness, access review, incident response,
 *   and operator recovery.
 * - Vol V: Preserves source authority, controlled disclosure, observability,
 *   replayability, and governed promotion.
 */

export type AuthActivationEnvironment = Record<string, string | undefined>;

export type CredentialAuthMode =
  | "development-open"
  | "email-allowlist"
  | "disabled";

export type RoleProvisioningMode =
  | "locked"
  | "development-headers"
  | "governed-admin-only";

export type CredentialAuthDecision = {
  allowed: boolean;
  mode: CredentialAuthMode;
  email: string | null;
  productionLike: boolean;
  reason: string;
  failureCode?: string;
};

export type SessionAuthority = {
  authenticated: boolean;
  actorId: string | null;
  role: AccessRole | null;
  tenantId: string | null;
};

export type RoleProvisioningDecision = {
  allowed: boolean;
  mode: RoleProvisioningMode;
  requesterRole: AccessRole;
  targetRole: AccessRole;
  productionLike: boolean;
  reason: string;
  failureCode?: string;
};

const SELF_SERVICE_ROLES = new Set<AccessRole>(["user", "borrower"]);
const PROVISIONABLE_ROLES = new Set<AccessRole>([
  "user",
  "borrower",
  "lender",
  "sponsor",
  "operator",
  "underwriter",
  "auditor",
  "government_official",
  "attorney",
  "admin",
  "governance",
]);
const ELEVATED_PROVISIONING_ROLES = new Set<AccessRole>([
  "operator",
  "underwriter",
  "auditor",
  "government_official",
  "attorney",
  "admin",
  "governance",
]);

function envValue(
  env: AuthActivationEnvironment,
  key: string
): string | undefined {
  return env[key]?.trim();
}

function normalizeEmail(email: unknown): string | null {
  if (typeof email !== "string") {
    return null;
  }

  const normalized = email.trim().toLowerCase();

  return normalized.length > 0 ? normalized : null;
}

function normalizeText(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  const normalized = String(value).trim();

  return normalized.length > 0 ? normalized : null;
}

function parseEmailAllowlist(value: string | undefined): Set<string> {
  return new Set(
    (value ?? "")
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean)
  );
}

export function productionAuthLike(
  env: AuthActivationEnvironment = process.env
): boolean {
  return (
    env.NODE_ENV === "production" ||
    env.SECURITY_GATE_PROFILE === "production" ||
    env.API_AUTH_ENFORCEMENT === "required"
  );
}

export function credentialAuthMode(
  env: AuthActivationEnvironment = process.env
): CredentialAuthMode {
  const mode = envValue(env, "AUTH_CREDENTIALS_MODE")?.toLowerCase();

  if (mode === "email-allowlist" || mode === "disabled") {
    return mode;
  }

  return "development-open";
}

export function roleProvisioningMode(
  env: AuthActivationEnvironment = process.env
): RoleProvisioningMode {
  const mode = envValue(env, "ROLE_PROVISIONING_MODE")?.toLowerCase();

  if (mode === "development-headers" || mode === "governed-admin-only") {
    return mode;
  }

  return "locked";
}

export function credentialSharedSecretMinimumLength(
  env: AuthActivationEnvironment = process.env
): number {
  const configured = Number(env.AUTH_CREDENTIAL_MIN_LENGTH ?? 32);
  if (!Number.isInteger(configured)) return 32;
  return Math.min(32, Math.max(20, configured));
}

export function strongCredentialSharedSecret(
  env: AuthActivationEnvironment = process.env
): boolean {
  return Boolean(
    (env.AUTH_CREDENTIAL_SHARED_SECRET?.length ?? 0) >=
      credentialSharedSecretMinimumLength(env)
  );
}

export function credentialAllowlistConfigured(
  env: AuthActivationEnvironment = process.env
): boolean {
  return parseEmailAllowlist(env.AUTH_CREDENTIAL_EMAIL_ALLOWLIST).size > 0;
}

export function sanitizeSelfServiceAuthRole(role: unknown): AccessRole {
  const normalized = normalizeAccessRole(role);

  return SELF_SERVICE_ROLES.has(normalized) ? normalized : "user";
}

export function elevatedRole(role: unknown): boolean {
  return ELEVATED_PROVISIONING_ROLES.has(normalizeAccessRole(role));
}

export function evaluateCredentialAuthPolicy(input: {
  email?: unknown;
  password?: unknown;
  env?: AuthActivationEnvironment;
}): CredentialAuthDecision {
  const env = input.env ?? process.env;
  const email = normalizeEmail(input.email);
  const password = normalizeText(input.password);
  const mode = credentialAuthMode(env);
  const productionLike = productionAuthLike(env);

  if (!email) {
    return {
      allowed: false,
      mode,
      email,
      productionLike,
      reason: "A valid email is required for credential authentication.",
      failureCode: "email_missing",
    };
  }

  if (mode === "disabled") {
    return {
      allowed: false,
      mode,
      email,
      productionLike,
      reason: "Credential authentication is disabled by policy.",
      failureCode: "credentials_disabled",
    };
  }

  if (mode === "development-open") {
    return {
      allowed: !productionLike,
      mode,
      email,
      productionLike,
      reason: productionLike
        ? "Open development credentials are blocked when production auth is active."
        : "Open development credentials are allowed only for local development.",
      failureCode: productionLike ? "development_credentials_in_production" : undefined,
    };
  }

  const allowlist = parseEmailAllowlist(env.AUTH_CREDENTIAL_EMAIL_ALLOWLIST);
  const sharedSecret = env.AUTH_CREDENTIAL_SHARED_SECRET;

  if (!allowlist.has(email)) {
    return {
      allowed: false,
      mode,
      email,
      productionLike,
      reason: "Email is not authorized by the credential allowlist.",
      failureCode: "email_not_allowlisted",
    };
  }

  if (!strongCredentialSharedSecret(env)) {
    return {
      allowed: false,
      mode,
      email,
      productionLike,
      reason: "Credential shared secret is missing or too short.",
      failureCode: "shared_secret_weak",
    };
  }

  if (!password || password !== sharedSecret) {
    return {
      allowed: false,
      mode,
      email,
      productionLike,
      reason: "Credential shared secret did not match.",
      failureCode: "shared_secret_mismatch",
    };
  }

  return {
    allowed: true,
    mode,
    email,
    productionLike,
    reason:
      "Credential authentication passed allowlist and shared-secret controls.",
  };
}

export function extractSessionAuthorityFromHeaders(
  headers: Headers
): SessionAuthority {
  const actorId = normalizeText(headers.get("x-ares-authenticated-user-id"));
  const role = headers.get("x-ares-authenticated-role");
  const tenantId = normalizeText(headers.get("x-ares-authenticated-tenant-id"));

  return {
    authenticated: Boolean(actorId && role),
    actorId,
    role: role ? normalizeAccessRole(role) : null,
    tenantId,
  };
}

export function evaluateRoleProvisioningPolicy(input: {
  requesterRole?: unknown;
  targetRole?: unknown;
  hasAuthenticatedSession?: boolean;
  reason?: unknown;
  operatorAttestation?: unknown;
  env?: AuthActivationEnvironment;
}): RoleProvisioningDecision {
  const env = input.env ?? process.env;
  const mode = roleProvisioningMode(env);
  const productionLike = productionAuthLike(env);
  const requesterRole = normalizeAccessRole(input.requesterRole);
  const targetRole = normalizeAccessRole(input.targetRole);
  const hasAuthenticatedSession = input.hasAuthenticatedSession === true;
  const reason = normalizeText(input.reason);
  const operatorAttestation = normalizeText(input.operatorAttestation);

  if (mode === "locked") {
    return {
      allowed: false,
      mode,
      requesterRole,
      targetRole,
      productionLike,
      reason: "Role provisioning is locked by policy.",
      failureCode: "role_provisioning_locked",
    };
  }

  if (productionLike && mode !== "governed-admin-only") {
    return {
      allowed: false,
      mode,
      requesterRole,
      targetRole,
      productionLike,
      reason:
        "Production role provisioning requires governed-admin-only mode.",
      failureCode: "production_role_mode_invalid",
    };
  }

  if (!hasAuthenticatedSession) {
    return {
      allowed: false,
      mode,
      requesterRole,
      targetRole,
      productionLike,
      reason:
        "Role provisioning requires authenticated session authority from the API perimeter.",
      failureCode: "session_authority_missing",
    };
  }

  if (requesterRole !== "admin" && requesterRole !== "governance") {
    return {
      allowed: false,
      mode,
      requesterRole,
      targetRole,
      productionLike,
      reason: "Only admin or governance roles may provision roles.",
      failureCode: "requester_role_denied",
    };
  }

  if (!PROVISIONABLE_ROLES.has(targetRole)) {
    return {
      allowed: false,
      mode,
      requesterRole,
      targetRole,
      productionLike,
      reason: "Target role is not provisionable.",
      failureCode: "target_role_invalid",
    };
  }

  if (
    (targetRole === "admin" || targetRole === "governance") &&
    requesterRole !== "governance"
  ) {
    return {
      allowed: false,
      mode,
      requesterRole,
      targetRole,
      productionLike,
      reason: "Only governance may provision admin or governance roles.",
      failureCode: "privileged_target_requires_governance",
    };
  }

  if (!reason || !operatorAttestation || operatorAttestation.length < 8) {
    return {
      allowed: false,
      mode,
      requesterRole,
      targetRole,
      productionLike,
      reason:
        "Role provisioning requires a reason and operator attestation.",
      failureCode: "attestation_missing",
    };
  }

  return {
    allowed: true,
    mode,
    requesterRole,
    targetRole,
    productionLike,
    reason: "Role provisioning request passed governed policy controls.",
  };
}
