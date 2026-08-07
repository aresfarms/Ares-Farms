import { createHash } from "node:crypto";

export const PRODUCTION_PROMOTION_READINESS_RULE =
  "PRODUCTION-PROMOTION-READINESS-PERIMETER-001" as const;

export type SecretBinding = {
  envName: string;
  secretName: string;
  version: string;
};

export type ProductionPromotionReadinessInput = {
  serviceUrl: string;
  stableUrl: string;
  apiAuthEnforcement: string | null;
  rateLimitingEnabled: string | null;
  rateLimitWindowSeconds: string | null;
  rateLimitMax: string | null;
  credentialsMode: string | null;
  credentialAllowlistConfigured: boolean;
  roleProvisioningMode: string | null;
  secretBindings: SecretBinding[];
  requiredSecretNames: string[];
  iapProtected: boolean;
  releaseBoardApproved: boolean;
  constitutionalAuthorityApproved: boolean;
  qualifiedReleaseManagerApproved: boolean;
  finalActivationApproved: boolean;
};

export type ProductionPromotionReadinessPacket = {
  rule: typeof PRODUCTION_PROMOTION_READINESS_RULE;
  status: "READY_FOR_HUMAN_PROMOTION_DECISION" | "BLOCKED";
  technicalPerimeterReady: boolean;
  finalPromotionAuthorized: false;
  liveActionAuthorityGranted: false;
  serviceUrl: string;
  stableUrl: string;
  secretBindingNames: string[];
  checks: Array<{ id: string; passed: boolean; reason: string }>;
  blockers: string[];
  packetSha256: string;
};

function positiveInteger(value: string | null): boolean {
  if (!value) return false;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0;
}

function httpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, child]) => `${JSON.stringify(key)}:${stable(child)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

export function buildProductionPromotionReadinessPacket(
  input: ProductionPromotionReadinessInput,
): ProductionPromotionReadinessPacket {
  const boundSecrets = new Set(
    input.secretBindings.map((binding) => `${binding.envName}:${binding.secretName}`),
  );
  const requiredSecretsBound = input.requiredSecretNames.every((name) =>
    input.secretBindings.some(
      (binding) => binding.envName === name && binding.secretName === name,
    ),
  );

  const checks = [
    {
      id: "canonical-https-urls",
      passed: httpsUrl(input.serviceUrl) && httpsUrl(input.stableUrl),
      reason: "Service and stable URLs must both be canonical HTTPS endpoints.",
    },
    {
      id: "iap-perimeter",
      passed: input.iapProtected,
      reason: "The service must remain protected by the approved identity perimeter.",
    },
    {
      id: "required-secret-bindings",
      passed: requiredSecretsBound,
      reason: "Required secrets must be injected by reference under matching environment names.",
    },
    {
      id: "api-auth-enforcement",
      passed: input.apiAuthEnforcement === "required",
      reason: "API_AUTH_ENFORCEMENT must be required.",
    },
    {
      id: "rate-limiting",
      passed:
        input.rateLimitingEnabled === "true" &&
        positiveInteger(input.rateLimitWindowSeconds) &&
        positiveInteger(input.rateLimitMax),
      reason: "Rate limiting must be enabled with explicit positive limits.",
    },
    {
      id: "credential-allowlist",
      passed:
        input.credentialsMode === "email-allowlist" &&
        input.credentialAllowlistConfigured,
      reason: "Credential access requires an explicit attributed email allowlist.",
    },
    {
      id: "governed-role-provisioning",
      passed: input.roleProvisioningMode === "governed-admin-only",
      reason: "Role changes must use governed-admin-only provisioning.",
    },
  ];

  const technicalPerimeterReady = checks.every((check) => check.passed);
  const humanApprovals = [
    ["release-board-approval", input.releaseBoardApproved],
    ["constitutional-authority-approval", input.constitutionalAuthorityApproved],
    ["qualified-release-manager-approval", input.qualifiedReleaseManagerApproved],
    ["final-activation-approval", input.finalActivationApproved],
  ] as const;

  const blockers = [
    ...checks.filter((check) => !check.passed).map((check) => check.id),
    ...humanApprovals.filter(([, approved]) => !approved).map(([id]) => id),
  ];

  const unsigned = {
    rule: PRODUCTION_PROMOTION_READINESS_RULE,
    status: technicalPerimeterReady
      ? ("READY_FOR_HUMAN_PROMOTION_DECISION" as const)
      : ("BLOCKED" as const),
    technicalPerimeterReady,
    finalPromotionAuthorized: false as const,
    liveActionAuthorityGranted: false as const,
    serviceUrl: input.serviceUrl,
    stableUrl: input.stableUrl,
    secretBindingNames: [...boundSecrets].sort(),
    checks,
    blockers,
  };

  return {
    ...unsigned,
    packetSha256: createHash("sha256").update(stable(unsigned)).digest("hex"),
  };
}
