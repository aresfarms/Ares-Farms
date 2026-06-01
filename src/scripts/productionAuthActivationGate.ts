import "dotenv/config";

import fs from "fs";
import path from "path";

import {
  credentialAllowlistConfigured,
  credentialAuthMode,
  roleProvisioningMode,
  strongCredentialSharedSecret,
} from "@/lib/auth/authActivationPolicy";
import {
  isLocalDevelopmentNextAuthSecret,
  resolveNextAuthSecret,
} from "@/lib/auth/nextAuthSecurity";

/**
 * Production Auth Activation Gate
 *
 * Master Volume Governance:
 * - Vol I: verifies identity and role authority are controlled before modules.
 * - Vol II: protects regulated workflows from open credential and role paths.
 * - Vol III: provides deterministic auth activation checks.
 * - Vol IV: supports deployment readiness, incident response, and access review.
 * - Vol V: preserves source authority, controlled disclosure, replayability,
 *   observability, and governed promotion.
 */

type GateStatus = "PASS" | "WARN" | "BLOCK";

type GateCheck = {
  id: string;
  status: GateStatus;
  area: string;
  summary: string;
  detail: string;
};

const repoRoot = process.cwd();
const profile = (process.env.AUTH_ACTIVATION_PROFILE ?? "development").toLowerCase();
const productionProfile = profile === "production";

function file(pathname: string): string {
  return path.join(repoRoot, pathname);
}

function exists(pathname: string): boolean {
  return fs.existsSync(file(pathname));
}

function read(pathname: string): string {
  return fs.readFileSync(file(pathname), "utf8");
}

function check(
  checks: GateCheck[],
  input: {
    id: string;
    area: string;
    passed: boolean;
    summary: string;
    passDetail: string;
    failDetail: string;
    productionOnlyBlock?: boolean;
  }
): void {
  const block =
    input.productionOnlyBlock === true && !productionProfile
      ? false
      : !input.passed;

  checks.push({
    id: input.id,
    area: input.area,
    status: input.passed ? "PASS" : block ? "BLOCK" : "WARN",
    summary: input.summary,
    detail: input.passed ? input.passDetail : input.failDetail,
  });
}

function nextAuthUrlProductionSafe(value: string | undefined): boolean {
  if (!value) {
    return false;
  }

  try {
    const url = new URL(value);

    return url.protocol === "https:" && url.hostname !== "localhost";
  } catch {
    return false;
  }
}

function secretLooksStrong(secret: string | undefined): boolean {
  return Boolean(secret && secret.length >= 32);
}

function main() {
  const checks: GateCheck[] = [];
  const nextAuthSecret = resolveNextAuthSecret();
  const authRoute = exists("src/app/api/auth/[...nextauth]/route.ts")
    ? read("src/app/api/auth/[...nextauth]/route.ts")
    : "";
  const authInitRoute = exists("src/app/api/auth/init/route.ts")
    ? read("src/app/api/auth/init/route.ts")
    : "";
  const roleProvisioningRoute = exists("src/app/api/auth/role-provisioning/route.ts")
    ? read("src/app/api/auth/role-provisioning/route.ts")
    : "";
  const packageJson = JSON.parse(read("package.json")) as {
    scripts?: Record<string, string>;
  };

  check(checks, {
    id: "auth-activation.credentials-policy-wired",
    area: "credentials",
    passed:
      authRoute.includes("evaluateCredentialAuthPolicy") &&
      authRoute.includes("AUTH_CREDENTIAL_POLICY_BLOCKED"),
    summary: "NextAuth credentials must use the auth activation policy.",
    passDetail: "NextAuth credentials route is wired to auth activation policy.",
    failDetail:
      "NextAuth credentials route is missing auth activation policy enforcement.",
  });

  check(checks, {
    id: "auth-activation.self-service-role-limit",
    area: "roles",
    passed: authInitRoute.includes("sanitizeSelfServiceAuthRole"),
    summary: "Self-service auth init must not create elevated roles.",
    passDetail:
      "Auth init sanitizes self-service roles and routes elevated roles to provisioning.",
    failDetail:
      "Auth init can still create elevated roles without role provisioning.",
  });

  check(checks, {
    id: "auth-activation.role-provisioning-route",
    area: "roles",
    passed:
      roleProvisioningRoute.includes("extractSessionAuthorityFromHeaders") &&
      roleProvisioningRoute.includes("evaluateRoleProvisioningPolicy") &&
      roleProvisioningRoute.includes("provisionUserRole"),
    summary: "Governed role provisioning route must exist.",
    passDetail:
      "Role provisioning route requires session authority and governed policy.",
    failDetail:
      "Role provisioning route is missing session authority, policy, or durable store wiring.",
  });

  check(checks, {
    id: "auth-activation.role-provisioning-store",
    area: "roles",
    passed: exists("src/lib/auth/roleProvisioningStore.ts"),
    summary: "Role provisioning must persist durable user role changes.",
    passDetail: "Role provisioning store exists.",
    failDetail: "Role provisioning store is missing.",
  });

  check(checks, {
    id: "auth-activation.smoke-wired",
    area: "verification",
    passed:
      exists("src/scripts/authActivationPolicySmokeTest.ts") &&
      Boolean(packageJson.scripts?.["smoke:auth-activation-policy"]) &&
      Boolean(packageJson.scripts?.["verify:backend"]?.includes("auth:activation")),
    summary: "Auth activation smoke and gate must be wired into verification.",
    passDetail:
      "Auth activation smoke and gate are wired into backend verification.",
    failDetail:
      "Auth activation smoke or gate is missing from backend verification.",
  });

  check(checks, {
    id: "auth-activation.nextauth-secret",
    area: "credentials",
    passed:
      secretLooksStrong(nextAuthSecret) &&
      (!productionProfile ||
        !isLocalDevelopmentNextAuthSecret(nextAuthSecret)),
    summary: "Production auth requires a strong NextAuth secret.",
    passDetail: productionProfile
      ? "NEXTAUTH_SECRET is configured for production auth activation."
      : "Local profile permits governed development secret posture.",
    failDetail:
      "NEXTAUTH_SECRET is missing, too short, or using the local development fallback.",
    productionOnlyBlock: true,
  });

  check(checks, {
    id: "auth-activation.nextauth-url",
    area: "credentials",
    passed: productionProfile
      ? nextAuthUrlProductionSafe(process.env.NEXTAUTH_URL)
      : true,
    summary: "Production auth requires an HTTPS NEXTAUTH_URL.",
    passDetail: productionProfile
      ? "NEXTAUTH_URL is production safe."
      : "Local profile permits localhost URL posture.",
    failDetail:
      "NEXTAUTH_URL is missing or not an HTTPS non-localhost URL.",
    productionOnlyBlock: true,
  });

  check(checks, {
    id: "auth-activation.api-auth-required",
    area: "perimeter",
    passed: process.env.API_AUTH_ENFORCEMENT === "required",
    summary: "Production auth activation requires API auth enforcement.",
    passDetail: "API_AUTH_ENFORCEMENT is required.",
    failDetail:
      "API_AUTH_ENFORCEMENT is not set to required.",
    productionOnlyBlock: true,
  });

  check(checks, {
    id: "auth-activation.rate-limit-enabled",
    area: "perimeter",
    passed: process.env.RATE_LIMITING_ENABLED === "true",
    summary: "Production auth activation requires API rate limiting.",
    passDetail: "RATE_LIMITING_ENABLED is true.",
    failDetail:
      "RATE_LIMITING_ENABLED is not true.",
    productionOnlyBlock: true,
  });

  check(checks, {
    id: "auth-activation.credentials-mode",
    area: "credentials",
    passed:
      credentialAuthMode() === "email-allowlist" &&
      credentialAllowlistConfigured() &&
      strongCredentialSharedSecret(),
    summary:
      "Production credentials must use email allowlist plus a strong shared secret until external IdP is added.",
    passDetail:
      "Credential mode, allowlist, and shared secret are configured.",
    failDetail:
      "AUTH_CREDENTIALS_MODE=email-allowlist, AUTH_CREDENTIAL_EMAIL_ALLOWLIST, and a strong AUTH_CREDENTIAL_SHARED_SECRET are required for production activation.",
    productionOnlyBlock: true,
  });

  check(checks, {
    id: "auth-activation.role-provisioning-mode",
    area: "roles",
    passed: roleProvisioningMode() === "governed-admin-only",
    summary:
      "Production role provisioning must run in governed-admin-only mode.",
    passDetail: "ROLE_PROVISIONING_MODE is governed-admin-only.",
    failDetail:
      "ROLE_PROVISIONING_MODE is not governed-admin-only.",
    productionOnlyBlock: true,
  });

  const blocked = checks.filter((item) => item.status === "BLOCK");
  const warned = checks.filter((item) => item.status === "WARN");

  const output = {
    ok: blocked.length === 0,
    profile,
    checkedAt: new Date().toISOString(),
    summary: {
      total: checks.length,
      pass: checks.filter((item) => item.status === "PASS").length,
      warn: warned.length,
      block: blocked.length,
    },
    checks,
  };

  console.log(JSON.stringify(output, null, 2));

  if (blocked.length > 0) {
    process.exit(1);
  }
}

main();
