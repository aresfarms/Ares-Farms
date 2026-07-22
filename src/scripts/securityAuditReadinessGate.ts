import "dotenv/config";

import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";

import {
  getPostgresSslPosture,
} from "@/lib/db/postgresSsl";
import {
  isLocalDevelopmentNextAuthSecret,
  resolveNextAuthSecret,
} from "@/lib/auth/nextAuthSecurity";
import {
  externalSecretInventory,
  validateExternalSecretInventory,
} from "@/lib/security/externalSecretInventory";

/**
 * Security & Audit Readiness Gate
 *
 * Master Volume Governance:
 * - Vol I: verifies accountable backend authority before module expansion.
 * - Vol II: checks regulated identity, database, audit, credential, and
 *   disclosure controls before broader workflows rely on them.
 * - Vol III: enforces deterministic backend security posture checks.
 * - Vol IV: creates an operator-ready gate for security review, deployment,
 *   audit preparation, and incident readiness.
 * - Vol V: preserves source authority, classification, observability,
 *   replayability, controlled disclosure, and evidence discipline.
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
const profile = (process.env.SECURITY_GATE_PROFILE ?? "development").toLowerCase();
const productionProfile = profile === "production";

function file(pathname: string): string {
  return path.join(repoRoot, pathname);
}

function read(pathname: string): string {
  return fs.readFileSync(file(pathname), "utf8");
}

function exists(pathname: string): boolean {
  return fs.existsSync(file(pathname));
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
) {
  const block = input.productionOnlyBlock === true && !productionProfile
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

function gitCheckIgnored(pathname: string): boolean {
  try {
    execFileSync("git", ["check-ignore", "-q", pathname], {
      cwd: repoRoot,
      stdio: "ignore",
    });

    return true;
  } catch {
    return false;
  }
}

function parseEnvFileKeys(pathname: string): string[] {
  if (!exists(pathname)) {
    return [];
  }

  return read(pathname)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"))
    .map((line) => line.split("=")[0]?.trim())
    .filter((key): key is string => Boolean(key));
}

function suspiciousCredentialEnvKeys(keys: string[]): string[] {
  const allowed = new Set([
    "DATABASE_URL",
    "NEXTAUTH_SECRET",
    "NEXTAUTH_URL",
    "NEXT_PUBLIC_BASE_URL",
    "BACKEND_SMOKE_BASE_URL",
    "LEDGER_MODE",
    "DRY_RUN",
    "REBUILD_MODE",
    "SECURITY_GATE_PROFILE",
    "AUTH_ACTIVATION_PROFILE",
    "BACKEND_PRODUCTION_READINESS_PROFILE",
    "API_AUTH_ENFORCEMENT",
    "RATE_LIMITING_ENABLED",
    "API_RATE_LIMIT_WINDOW_SECONDS",
    "API_RATE_LIMIT_MAX",
    "AUTH_CREDENTIALS_MODE",
    "AUTH_CREDENTIAL_EMAIL_ALLOWLIST",
    "AUTH_CREDENTIAL_SHARED_SECRET",
    "ROLE_PROVISIONING_MODE",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "OPENAI_API_KEY",
  ]);

  return keys.filter((key) => {
    if (allowed.has(key)) {
      return false;
    }

    return /(PASSWORD|SECRET|TOKEN|PRIVATE_KEY|ACCESS_KEY|API_KEY|CREDENTIAL)/i.test(
      key
    );
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
  const databasePosture = getPostgresSslPosture();
  const nextAuthSecret = resolveNextAuthSecret();
  const localEnvFiles = [
    ".env",
    ".env.local",
    ".env.development",
    ".env.development.local",
    ".env.test",
    ".env.test.local",
  ].filter(exists);
  const suspiciousKeys = localEnvFiles.flatMap((pathname) =>
    suspiciousCredentialEnvKeys(parseEnvFileKeys(pathname)).map((key) => `${pathname}:${key}`)
  );
  const secretInventoryIssues = validateExternalSecretInventory();
  const pendingSecretRotations = externalSecretInventory.secrets.filter(
    (entry) => entry.rotationStatus !== "ROTATED"
  );
  const dbIndex = exists("src/lib/db/index.ts")
    ? read("src/lib/db/index.ts")
    : "";
  const authRoute = exists("src/app/api/auth/[...nextauth]/route.ts")
    ? read("src/app/api/auth/[...nextauth]/route.ts")
    : "";
  const authInitRoute = exists("src/app/api/auth/init/route.ts")
    ? read("src/app/api/auth/init/route.ts")
    : "";
  const roleProvisioningRoute = exists("src/app/api/auth/role-provisioning/route.ts")
    ? read("src/app/api/auth/role-provisioning/route.ts")
    : "";
  const apiSecurityPolicy = exists("src/lib/security/apiSecurityPolicy.ts")
    ? read("src/lib/security/apiSecurityPolicy.ts")
    : "";
  const apiSecurityProxy = exists("src/proxy.ts") ? read("src/proxy.ts") : "";
  const packageJson = JSON.parse(read("package.json")) as {
    scripts?: Record<string, string>;
  };

  check(checks, {
    id: "security.master-volume-snapshot",
    area: "governance",
    passed:
      exists("docs/MASTER_VOLUME_SOURCE_SNAPSHOT.md") &&
      exists("docs/BACKEND_COVERAGE_MATRIX.md") &&
      exists("docs/BACKEND_READINESS_CHECKLIST.md"),
    summary: "Master Volume and backend readiness documents are present.",
    passDetail:
      "Source snapshot, coverage matrix, and readiness checklist are present.",
    failDetail:
      "One or more governing readiness documents are missing from docs/.",
  });

  check(checks, {
    id: "security.env-file-ignored",
    area: "secrets",
    passed: localEnvFiles.every(gitCheckIgnored),
    summary: "Local environment files must not be committed.",
    passDetail: "Every detected local environment file is ignored by git.",
    failDetail: `One or more local environment files are not ignored: ${localEnvFiles
      .filter((pathname) => !gitCheckIgnored(pathname))
      .join(", ")}`,
  });

  check(checks, {
    id: "security.env-no-raw-agency-credentials",
    area: "secrets",
    passed: suspiciousKeys.length === 0,
    summary: "Local environment files must not contain raw agency credentials.",
    passDetail:
      "No suspicious raw agency credential keys were found in local environment files.",
    failDetail: `Suspicious credential-like keys found in local environment files: ${suspiciousKeys.join(
      ", "
    )}`,
  });

  check(checks, {
    id: "security.external-secret-rotation-evidence",
    area: "secrets",
    passed: secretInventoryIssues.length === 0 && pendingSecretRotations.length === 0,
    summary: "Migrated secrets must have recorded rotation evidence.",
    passDetail: "Every governed migrated secret has recorded rotation evidence.",
    failDetail: [
      ...secretInventoryIssues,
      ...pendingSecretRotations.map((entry) => `${entry.name}:${entry.rotationStatus}`),
    ].join(", "),
  });

  check(checks, {
    id: "security.database-url-present",
    area: "database",
    passed: Boolean(process.env.DATABASE_URL),
    summary: "DATABASE_URL must be configured.",
    passDetail: "DATABASE_URL is configured.",
    failDetail: "DATABASE_URL is missing.",
  });

  check(checks, {
    id: "security.database-ssl-policy",
    area: "database",
    passed: databasePosture.configured && databasePosture.rejectUnauthorized !== false,
    summary: "PostgreSQL SSL must be explicit and certificate-verifying.",
    passDetail: databasePosture.reason,
    failDetail: databasePosture.reason,
  });

  check(checks, {
    id: "security.database-production-ssl",
    area: "database",
    passed: databasePosture.productionSafe,
    summary: "Production database SSL should use verify-full or verify-ca.",
    passDetail: databasePosture.reason,
    failDetail: databasePosture.reason,
    productionOnlyBlock: true,
  });

  check(checks, {
    id: "security.database-runtime-ssl-helper",
    area: "database",
    passed:
      dbIndex.includes("createPostgresSslConfig") &&
      dbIndex.includes("ssl: createPostgresSslConfig()"),
    summary: "Application database pool must use the governed SSL helper.",
    passDetail:
      "The application database pool uses createPostgresSslConfig().",
    failDetail:
      "The application database pool is not wired to createPostgresSslConfig().",
  });

  check(checks, {
    id: "security.nextauth-secret",
    area: "auth",
    passed:
      secretLooksStrong(nextAuthSecret) &&
      (!productionProfile ||
        !isLocalDevelopmentNextAuthSecret(nextAuthSecret)),
    summary: "NextAuth secret must be configured with a strong value.",
    passDetail: productionProfile
      ? "NEXTAUTH_SECRET is configured for production profile."
      : isLocalDevelopmentNextAuthSecret(nextAuthSecret)
        ? "A governed local-only development secret is active."
        : "NEXTAUTH_SECRET is configured.",
    failDetail:
      "NEXTAUTH_SECRET is missing, too short, or using the local development fallback in production profile.",
    productionOnlyBlock: true,
  });

  check(checks, {
    id: "security.nextauth-url",
    area: "auth",
    passed: productionProfile
      ? nextAuthUrlProductionSafe(process.env.NEXTAUTH_URL)
      : true,
    summary: "NEXTAUTH_URL must be HTTPS and non-localhost for production.",
    passDetail: productionProfile
      ? "NEXTAUTH_URL is production safe."
      : "Local profile allows the governed localhost fallback.",
    failDetail:
      "NEXTAUTH_URL is missing or is not an HTTPS production URL.",
    productionOnlyBlock: true,
  });

  check(checks, {
    id: "security.nextauth-runtime-helper",
    area: "auth",
    passed:
      authRoute.includes("resolveNextAuthSecret") &&
      authRoute.includes("ensureLocalNextAuthUrl") &&
      authRoute.includes("secret: resolveNextAuthSecret()"),
    summary: "NextAuth route must use governed runtime security helpers.",
    passDetail:
      "NextAuth route is wired to governed URL and secret helpers.",
    failDetail:
      "NextAuth route is missing governed URL or secret helper wiring.",
  });

  check(checks, {
    id: "security.auth-activation-policy",
    area: "auth",
    passed:
      authRoute.includes("evaluateCredentialAuthPolicy") &&
      authInitRoute.includes("sanitizeSelfServiceAuthRole") &&
      exists("src/lib/auth/authActivationPolicy.ts"),
    summary:
      "Auth activation policy must block open production credentials and self-service elevated roles.",
    passDetail:
      "Auth activation policy is wired into credentials and auth initialization.",
    failDetail:
      "Auth activation policy is missing from credentials or auth initialization.",
  });

  check(checks, {
    id: "security.role-provisioning-controls",
    area: "auth",
    passed:
      roleProvisioningRoute.includes("extractSessionAuthorityFromHeaders") &&
      roleProvisioningRoute.includes("evaluateRoleProvisioningPolicy") &&
      exists("src/lib/auth/roleProvisioningStore.ts"),
    summary:
      "Elevated roles must be provisioned through governed session authority.",
    passDetail:
      "Governed role provisioning route and durable store are present.",
    failDetail:
      "Governed role provisioning route or durable store is missing.",
  });

  check(checks, {
    id: "security.auth-activation-gate-wired",
    area: "verification",
    passed:
      exists("src/scripts/productionAuthActivationGate.ts") &&
      exists("src/scripts/authActivationPolicySmokeTest.ts") &&
      Boolean(packageJson.scripts?.["auth:activation"]) &&
      Boolean(packageJson.scripts?.["verify:backend"]?.includes("auth:activation")),
    summary:
      "Production Auth Activation Gate must be wired into backend verification.",
    passDetail:
      "Production Auth Activation Gate and smoke test are wired into backend verification.",
    failDetail:
      "Production Auth Activation Gate or smoke test is not wired into backend verification.",
  });

  check(checks, {
    id: "security.api-security-policy-runtime",
    area: "auth",
    passed:
      apiSecurityPolicy.includes("apiAuthEnforcementRequired") &&
      apiSecurityPolicy.includes("apiRateLimitingEnabled") &&
      apiSecurityPolicy.includes("apiSecurityPublicReason") &&
      apiSecurityPolicy.includes("roleClaimConflictsWithSession") &&
      apiSecurityPolicy.includes("tenantClaimConflictsWithSession"),
    summary:
      "API security policy runtime must define session enforcement, public-route limits, and caller-claim conflict checks.",
    passDetail:
      "API security policy runtime defines auth enforcement, rate limiting, public-route exceptions, and claim conflict checks.",
    failDetail:
      "API security policy runtime is missing auth enforcement, rate limiting, public-route, or claim-conflict logic.",
  });

  check(checks, {
    id: "security.api-security-perimeter-proxy",
    area: "auth",
    passed:
      apiSecurityProxy.includes("export async function proxy") &&
      apiSecurityProxy.includes("getToken") &&
      apiSecurityProxy.includes("apiAuthEnforcementRequired") &&
      apiSecurityProxy.includes("apiRateLimitingEnabled") &&
      apiSecurityProxy.includes("roleClaimConflictsWithSession") &&
      (apiSecurityProxy.includes("matcher: [") && apiSecurityProxy.includes("_next/static")),
    summary:
      "Protected API routes must have a perimeter proxy for session authority and abuse control.",
    passDetail:
      "API perimeter proxy is present and wired to session enforcement, rate limiting, and caller-claim conflict checks.",
    failDetail:
      "API perimeter proxy is missing or not wired to session enforcement, rate limiting, or caller-claim conflict checks.",
  });

  check(checks, {
    id: "security.api-security-policy-smoke",
    area: "verification",
    passed:
      exists("src/scripts/apiSecurityPolicySmokeTest.ts") &&
      Boolean(packageJson.scripts?.["smoke:security-policy"]) &&
      Boolean(
        packageJson.scripts?.["verify:backend"]?.includes(
          "smoke:security-policy"
        )
      ),
    summary:
      "API security policy must have smoke coverage wired into verify:backend.",
    passDetail:
      "API security policy smoke coverage exists and is included in verify:backend.",
    failDetail:
      "API security policy smoke coverage is missing or not wired into verify:backend.",
  });

  check(checks, {
    id: "security.production-api-auth-enforcement",
    area: "auth",
    passed: process.env.API_AUTH_ENFORCEMENT === "required",
    summary:
      "Production API routes must enforce real authenticated sessions rather than caller-claimed roles.",
    passDetail: "API_AUTH_ENFORCEMENT is set to required.",
    failDetail:
      "API_AUTH_ENFORCEMENT is not set to required. This remains a production-live blocker.",
    productionOnlyBlock: true,
  });

  check(checks, {
    id: "security.production-rate-limiting",
    area: "abuse-control",
    passed: process.env.RATE_LIMITING_ENABLED === "true",
    summary: "Production API routes need rate limiting or abuse controls.",
    passDetail: "RATE_LIMITING_ENABLED is set to true.",
    failDetail:
      "RATE_LIMITING_ENABLED is not set to true. This remains a production-live blocker.",
    productionOnlyBlock: true,
  });

  check(checks, {
    id: "security.audit-ledger-admin-read",
    area: "audit",
    passed:
      exists("src/app/api/ledger/admin/route.ts") &&
      exists("src/lib/ledger/auditLedgerAdminStore.ts") &&
      exists("src/scripts/ledgerAdminReadSmokeTest.ts"),
    summary: "Audit/ledger admin-read surface must exist and be smoke-tested.",
    passDetail: "Audit/ledger admin-read route, store, and smoke test exist.",
    failDetail:
      "Audit/ledger admin-read route, store, or smoke test is missing.",
  });

  check(checks, {
    id: "security.smoke-backend-wired",
    area: "verification",
    passed:
      Boolean(packageJson.scripts?.["smoke:backend"]?.includes("smoke:ledger-admin-read")) &&
      Boolean(packageJson.scripts?.["verify:backend"]?.includes("security:audit")),
    summary: "Security-relevant smoke coverage must be wired into package scripts.",
    passDetail:
      "Backend smoke includes ledger admin-read coverage and verify:backend includes the security audit gate.",
    failDetail:
      "Backend smoke is missing ledger admin-read coverage or verify:backend is missing the security audit gate.",
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
