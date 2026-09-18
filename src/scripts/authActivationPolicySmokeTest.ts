import {
  credentialAuthMode,
  evaluateCredentialAuthPolicy,
  evaluateRoleProvisioningPolicy,
  roleProvisioningMode,
  sanitizeSelfServiceAuthRole,
} from "@/lib/auth/authActivationPolicy";

/**
 * Auth Activation Policy Smoke Test
 *
 * Master Volume Governance:
 * - Vol I: checks identity and role authority cannot be created by open
 *   request-body claims.
 * - Vol II: verifies regulated role access is controlled before module work.
 * - Vol III: keeps auth activation policy deterministic and testable.
 * - Vol IV: supports deployment readiness and access-review operations.
 * - Vol V: preserves source authority, controlled disclosure, and governed
 *   production promotion.
 */

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function main() {
  const productionEnv = {
    SECURITY_GATE_PROFILE: "production",
    API_AUTH_ENFORCEMENT: "required",
  };

  assert(
    credentialAuthMode({}) === "development-open",
    "Credential auth should default to development-open."
  );
  assert(
    roleProvisioningMode({}) === "locked",
    "Role provisioning should default to locked."
  );
  assert(
    sanitizeSelfServiceAuthRole("operator") === "user",
    "Self-service auth init must not mint operator roles."
  );
  assert(
    sanitizeSelfServiceAuthRole("borrower") === "borrower",
    "Self-service auth init may mint borrower roles."
  );

  const devOpen = evaluateCredentialAuthPolicy({
    email: "local-user@aresfarms.test",
    env: {},
  });

  assert(devOpen.allowed, "Development-open credentials should work locally.");

  const prodOpen = evaluateCredentialAuthPolicy({
    email: "prod-user@aresfarms.test",
    env: productionEnv,
  });

  assert(
    !prodOpen.allowed &&
      prodOpen.failureCode === "development_credentials_in_production",
    "Development-open credentials must be blocked in production-like auth."
  );

  const allowlisted = evaluateCredentialAuthPolicy({
    email: "allowed@aresfarms.test",
    password: "0123456789abcdef0123456789abcdef",
    env: {
      ...productionEnv,
      AUTH_CREDENTIALS_MODE: "email-allowlist",
      AUTH_CREDENTIAL_EMAIL_ALLOWLIST: "allowed@aresfarms.test",
      AUTH_CREDENTIAL_SHARED_SECRET: "0123456789abcdef0123456789abcdef",
    },
  });

  assert(
    allowlisted.allowed,
    "Allowlisted credential auth should pass with the correct shared secret."
  );

  const stagingTwentyCharacterSecret = evaluateCredentialAuthPolicy({
    email: "allowed@aresfarms.test",
    password: "12345678901234567890",
    env: {
      ...productionEnv,
      AUTH_CREDENTIALS_MODE: "email-allowlist",
      AUTH_CREDENTIAL_EMAIL_ALLOWLIST: "allowed@aresfarms.test",
      AUTH_CREDENTIAL_MIN_LENGTH: "20",
      AUTH_CREDENTIAL_SHARED_SECRET: "12345678901234567890",
    },
  });

  assert(
    stagingTwentyCharacterSecret.allowed,
    "Staging may explicitly lower the credential minimum to 20 characters."
  );

  const wrongPassword = evaluateCredentialAuthPolicy({
    email: "allowed@aresfarms.test",
    password: "wrong",
    env: {
      ...productionEnv,
      AUTH_CREDENTIALS_MODE: "email-allowlist",
      AUTH_CREDENTIAL_EMAIL_ALLOWLIST: "allowed@aresfarms.test",
      AUTH_CREDENTIAL_SHARED_SECRET: "0123456789abcdef0123456789abcdef",
    },
  });

  assert(
    !wrongPassword.allowed &&
      wrongPassword.failureCode === "shared_secret_mismatch",
    "Allowlisted credential auth must reject the wrong shared secret."
  );

  const lockedProvisioning = evaluateRoleProvisioningPolicy({
    requesterRole: "governance",
    targetRole: "operator",
    hasAuthenticatedSession: true,
    reason: "Smoke test",
    operatorAttestation: "attested",
    env: {},
  });

  assert(
    !lockedProvisioning.allowed &&
      lockedProvisioning.failureCode === "role_provisioning_locked",
    "Role provisioning should be locked by default."
  );

  const governedProvisioning = evaluateRoleProvisioningPolicy({
    requesterRole: "governance",
    targetRole: "operator",
    hasAuthenticatedSession: true,
    reason: "Governed production activation smoke test.",
    operatorAttestation: "attested by governance",
    env: {
      ...productionEnv,
      ROLE_PROVISIONING_MODE: "governed-admin-only",
    },
  });

  assert(
    governedProvisioning.allowed,
    "Governed role provisioning should allow governance to provision operator."
  );

  const adminProvisionedByAdmin = evaluateRoleProvisioningPolicy({
    requesterRole: "admin",
    targetRole: "admin",
    hasAuthenticatedSession: true,
    reason: "Governed production activation smoke test.",
    operatorAttestation: "attested by admin",
    env: {
      ...productionEnv,
      ROLE_PROVISIONING_MODE: "governed-admin-only",
    },
  });

  assert(
    !adminProvisionedByAdmin.allowed &&
      adminProvisionedByAdmin.failureCode ===
        "privileged_target_requires_governance",
    "Admin may not provision admin or governance roles."
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        message: "Auth activation policy smoke test passed.",
      },
      null,
      2
    )
  );
}

main();
