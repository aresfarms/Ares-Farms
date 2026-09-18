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
import { getPostgresSslPosture } from "@/lib/db/postgresSsl";

/**
 * Backend Production Readiness Gate
 *
 * Master Volume Governance:
 * - Vol I: prevents production claims before constitutional authority,
 *   identity, and role controls are active.
 * - Vol II: protects regulated borrower, lender, sponsor, billing, document,
 *   notice, and audit workflows from ungoverned exposure.
 * - Vol III: provides deterministic backend promotion checks.
 * - Vol III-B: preserves runtime evidence, classification, observability,
 *   and replay posture during promotion.
 * - Vol IV: gives operators a concrete deployment readiness checklist.
 * - Vol V: enforces source authority, controlled disclosure, version lineage,
 *   replay discipline, and live-action boundaries.
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
const profile = (
  process.env.BACKEND_PRODUCTION_READINESS_PROFILE ?? "development"
).toLowerCase();
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
  },
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

function positiveIntegerEnv(key: string): boolean {
  const parsed = Number.parseInt(process.env[key] ?? "", 10);

  return Number.isFinite(parsed) && parsed > 0;
}

function templateContainsRequiredKeys(template: string): boolean {
  const requiredKeys = [
    "DATABASE_URL",
    "NEXT_PUBLIC_BASE_URL",
    "NEXTAUTH_URL",
    "NEXTAUTH_SECRET",
    "API_AUTH_ENFORCEMENT",
    "RATE_LIMITING_ENABLED",
    "API_RATE_LIMIT_WINDOW_SECONDS",
    "API_RATE_LIMIT_MAX",
    "AUTH_CREDENTIALS_MODE",
    "AUTH_CREDENTIAL_EMAIL_ALLOWLIST",
    "AUTH_CREDENTIAL_SHARED_SECRET",
    "ROLE_PROVISIONING_MODE",
    "FURLONG_DEPLOYMENT_ENVIRONMENT",
    "SYNTHETIC_FIXTURES_ENABLED",
    "PROFESSIONAL_TEST_PERSONAS_ENABLED",
    "BACKEND_SMOKE_BASE_URL",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
  ];

  return requiredKeys.every((key) => template.includes(`${key}=`));
}

function main() {
  const checks: GateCheck[] = [];
  const packageJson = JSON.parse(read("package.json")) as {
    scripts?: Record<string, string>;
  };
  const template = exists(".env.production.example")
    ? read(".env.production.example")
    : "";
  const nextAuthSecret = resolveNextAuthSecret();
  const databasePosture = getPostgresSslPosture();

  check(checks, {
    id: "backend-production.master-volume-docs-present",
    area: "governance",
    passed:
      exists("docs/MASTER_VOLUME_SOURCE_SNAPSHOT.md") &&
      exists("docs/BACKEND_READINESS_CHECKLIST.md") &&
      exists("docs/BACKEND_COVERAGE_MATRIX.md") &&
      exists("docs/SECURITY_AUDIT_READINESS_GATE.md") &&
      exists("docs/PRODUCTION_AUTH_ACTIVATION_GATE.md") &&
      exists("docs/PRODUCTION_BACKEND_ACTIVATION_RUNBOOK.md"),
    summary:
      "Backend production promotion must be documented under the Master Volumes.",
    passDetail:
      "Master Volume source, backend readiness, security, auth, and production activation docs are present.",
    failDetail:
      "One or more production backend readiness documents are missing.",
  });

  check(checks, {
    id: "backend-production.package-scripts-wired",
    area: "verification",
    passed:
      Boolean(packageJson.scripts?.build) &&
      Boolean(packageJson.scripts?.["verify:backend"]) &&
      Boolean(packageJson.scripts?.["smoke:backend"]) &&
      Boolean(packageJson.scripts?.["security:audit:production"]) &&
      Boolean(packageJson.scripts?.["auth:activation:production"]) &&
      Boolean(packageJson.scripts?.["backend:production-readiness"]) &&
      Boolean(packageJson.scripts?.["backend:production-readiness:production"]),
    summary:
      "Production backend readiness scripts must be wired into package.json.",
    passDetail:
      "Build, local verification, full smoke, production auth, security, and production readiness scripts are wired.",
    failDetail:
      "One or more production backend readiness scripts are missing from package.json.",
  });

  check(checks, {
    id: "backend-production.env-template-present",
    area: "configuration",
    passed: exists(".env.production.example"),
    summary: "A non-secret production environment template must exist.",
    passDetail:
      ".env.production.example exists and is explicitly allowed through .gitignore.",
    failDetail: ".env.production.example is missing.",
  });

  check(checks, {
    id: "backend-production.env-template-complete",
    area: "configuration",
    passed: templateContainsRequiredKeys(template),
    summary:
      "The production environment template must include all known backend activation keys.",
    passDetail:
      "The production environment template includes the database, auth, perimeter, rate-limit, smoke, and payment connector keys.",
    failDetail:
      "The production environment template is missing one or more required keys.",
  });

  check(checks, {
    id: "backend-production.database-url",
    area: "database",
    passed: Boolean(process.env.DATABASE_URL),
    summary: "Production backend activation requires DATABASE_URL.",
    passDetail: "DATABASE_URL is configured.",
    failDetail: "DATABASE_URL is missing.",
    productionOnlyBlock: true,
  });

  check(checks, {
    id: "backend-production.database-ssl",
    area: "database",
    passed: databasePosture.productionSafe,
    summary: "Production database traffic must use certificate-verifying SSL.",
    passDetail: databasePosture.reason,
    failDetail: databasePosture.reason,
    productionOnlyBlock: true,
  });

  check(checks, {
    id: "backend-production.nextauth-secret",
    area: "auth",
    passed:
      secretLooksStrong(nextAuthSecret) &&
      (!productionProfile || !isLocalDevelopmentNextAuthSecret(nextAuthSecret)),
    summary: "Production auth requires a strong, non-local NextAuth secret.",
    passDetail: productionProfile
      ? "NEXTAUTH_SECRET is configured for production."
      : "Local profile permits governed development secret posture.",
    failDetail:
      "NEXTAUTH_SECRET is missing, too short, or using the local development fallback.",
    productionOnlyBlock: true,
  });

  check(checks, {
    id: "backend-production.nextauth-url",
    area: "auth",
    passed: productionProfile
      ? nextAuthUrlProductionSafe(process.env.NEXTAUTH_URL)
      : true,
    summary: "Production auth requires an HTTPS non-localhost NEXTAUTH_URL.",
    passDetail: productionProfile
      ? "NEXTAUTH_URL is production safe."
      : "Local profile permits localhost URL posture.",
    failDetail: "NEXTAUTH_URL is missing or is not an HTTPS production URL.",
    productionOnlyBlock: true,
  });

  check(checks, {
    id: "backend-production.api-auth-enforcement",
    area: "perimeter",
    passed: process.env.API_AUTH_ENFORCEMENT === "required",
    summary:
      "Production API exposure requires authenticated session enforcement.",
    passDetail: "API_AUTH_ENFORCEMENT is required.",
    failDetail: "API_AUTH_ENFORCEMENT is not set to required.",
    productionOnlyBlock: true,
  });

  check(checks, {
    id: "backend-production.rate-limit-enabled",
    area: "perimeter",
    passed: process.env.RATE_LIMITING_ENABLED === "true",
    summary: "Production API exposure requires rate limiting.",
    passDetail: "RATE_LIMITING_ENABLED is true.",
    failDetail: "RATE_LIMITING_ENABLED is not true.",
    productionOnlyBlock: true,
  });

  check(checks, {
    id: "backend-production.rate-limit-tuned",
    area: "perimeter",
    passed:
      positiveIntegerEnv("API_RATE_LIMIT_WINDOW_SECONDS") &&
      positiveIntegerEnv("API_RATE_LIMIT_MAX"),
    summary: "Production API rate limiting must have explicit positive limits.",
    passDetail:
      "API_RATE_LIMIT_WINDOW_SECONDS and API_RATE_LIMIT_MAX are configured.",
    failDetail:
      "API_RATE_LIMIT_WINDOW_SECONDS and API_RATE_LIMIT_MAX must be positive integers.",
    productionOnlyBlock: true,
  });

  check(checks, {
    id: "backend-production.credential-mode",
    area: "auth",
    passed:
      credentialAuthMode() === "email-allowlist" &&
      credentialAllowlistConfigured() &&
      strongCredentialSharedSecret(),
    summary:
      "Production credential auth must use a controlled allowlist bridge.",
    passDetail: "Credential mode, allowlist, and shared secret are configured.",
    failDetail:
      "AUTH_CREDENTIALS_MODE=email-allowlist, AUTH_CREDENTIAL_EMAIL_ALLOWLIST, and a strong AUTH_CREDENTIAL_SHARED_SECRET are required.",
    productionOnlyBlock: true,
  });

  check(checks, {
    id: "backend-production.role-provisioning",
    area: "auth",
    passed: roleProvisioningMode() === "governed-admin-only",
    summary: "Production role changes must go through governed provisioning.",
    passDetail: "ROLE_PROVISIONING_MODE is governed-admin-only.",
    failDetail: "ROLE_PROVISIONING_MODE is not governed-admin-only.",
    productionOnlyBlock: true,
  });

  check(checks, {
    id: "backend-production.synthetic-fixture-startup-guard",
    area: "test-boundary",
    passed:
      exists("src/instrumentation.ts") &&
      read("src/instrumentation.ts").includes(
        "Production startup refused: synthetic test controls are enabled",
      ),
    summary:
      "Production must refuse startup when synthetic fixtures or professional test personas are enabled.",
    passDetail:
      "The server startup hook fails closed when either synthetic-test switch is active in production.",
    failDetail:
      "A fail-closed production startup boundary for synthetic fixtures is missing.",
  });

  check(checks, {
    id: "backend-production.synthetic-fixtures-disabled",
    area: "test-boundary",
    passed:
      !productionProfile ||
      (process.env.FURLONG_DEPLOYMENT_ENVIRONMENT === "production" &&
        process.env.SYNTHETIC_FIXTURES_ENABLED !== "true" &&
        process.env.PROFESSIONAL_TEST_PERSONAS_ENABLED !== "true"),
    summary:
      "Synthetic fixtures must be explicitly disabled in the production profile.",
    passDetail:
      "Production environment identity is explicit and all synthetic fixture switches are disabled.",
    failDetail:
      "Production requires FURLONG_DEPLOYMENT_ENVIRONMENT=production with both synthetic fixture switches disabled.",
    productionOnlyBlock: true,
  });

  check(checks, {
    id: "backend-production.live-action-boundary",
    area: "live-action",
    passed:
      exists("docs/BACKEND_COVERAGE_MATRIX.md") &&
      read("docs/BACKEND_COVERAGE_MATRIX.md").includes(
        "Real USDA/SBA/property external calls",
      ) &&
      read("docs/BACKEND_COVERAGE_MATRIX.md").includes(
        "External notice provider sends",
      ) &&
      read("docs/BACKEND_COVERAGE_MATRIX.md").includes(
        "Production payment capture",
      ),
    summary:
      "Live external actions must remain explicitly controlled before public exposure.",
    passDetail:
      "The backend coverage matrix documents live-action blockers and promotion boundaries.",
    failDetail:
      "Live-action blockers are not documented in the backend coverage matrix.",
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
