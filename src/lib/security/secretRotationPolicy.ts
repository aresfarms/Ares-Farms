import policyJson from "../../../config/security/secret-rotation-policy.json";

export type RotationTier = "PRIVILEGED_30" | "EXTERNAL_60" | "MACHINE_90";
export type RotationAuthorityType = "INTERNAL_RANDOM" | "EXTERNAL_PROVIDER" | "DATABASE_PASSWORD";
export type RotationAutomation =
  | "AUTOMATED_INTERNAL"
  | "CONTROLLED_MANUAL"
  | "PROVIDER_ADAPTER_REQUIRED"
  | "DATABASE_ADAPTER_REQUIRED";

export type SecretRotationPolicyEntry = Readonly<{
  name: string;
  tier: RotationTier;
  authorityType: RotationAuthorityType;
  provider: string;
  overlapHours: number;
  consumers: readonly string[];
  rolloutStrategy: string;
  automation: RotationAutomation;
}>;

export type SecretRotationPolicy = Readonly<{
  schemaVersion: 1;
  defaultOverlapHours: number;
  emergency: Readonly<{
    suspectedDisclosure: "IMMEDIATE";
    targetMinutes: number;
  }>;
  tiers: Readonly<Record<RotationTier, Readonly<{
    rotationDays: 30 | 60 | 90;
    description: string;
  }>>>;
  secrets: readonly SecretRotationPolicyEntry[];
  identityMetadataExcludedFromValueRotation: readonly string[];
}>;

export const secretRotationPolicy = policyJson as SecretRotationPolicy;

export function validateSecretRotationPolicy(
  policy: SecretRotationPolicy = secretRotationPolicy
): string[] {
  const issues: string[] = [];
  const expectedDays: Readonly<Record<RotationTier, 30 | 60 | 90>> = {
    PRIVILEGED_30: 30,
    EXTERNAL_60: 60,
    MACHINE_90: 90,
  };
  const names = new Set<string>();

  if (policy.schemaVersion !== 1) issues.push("Unsupported secret-rotation policy schema.");
  if (policy.emergency.suspectedDisclosure !== "IMMEDIATE") {
    issues.push("Suspected disclosure must bypass the schedule immediately.");
  }
  if (policy.emergency.targetMinutes > 15) {
    issues.push("Emergency rotation target must be 15 minutes or less.");
  }

  for (const [tier, days] of Object.entries(expectedDays) as Array<[RotationTier, 30 | 60 | 90]>) {
    if (policy.tiers[tier]?.rotationDays !== days) {
      issues.push(`${tier} must rotate every ${days} days.`);
    }
  }

  for (const entry of policy.secrets) {
    if (names.has(entry.name)) issues.push(`Duplicate rotation policy entry: ${entry.name}`);
    names.add(entry.name);
    if (!entry.consumers.length) issues.push(`Rotation entry lacks a consumer: ${entry.name}`);
    if (!Number.isInteger(entry.overlapHours) || entry.overlapHours < 0) {
      issues.push(`Invalid overlap window: ${entry.name}`);
    }
    if (entry.authorityType === "EXTERNAL_PROVIDER" && entry.automation !== "PROVIDER_ADAPTER_REQUIRED") {
      issues.push(`External provider credential must require an adapter: ${entry.name}`);
    }
    if (entry.authorityType === "DATABASE_PASSWORD" && entry.automation !== "DATABASE_ADAPTER_REQUIRED") {
      issues.push(`Database credential must require the database adapter: ${entry.name}`);
    }
    if (entry.authorityType === "INTERNAL_RANDOM" && entry.provider !== "FURLONG") {
      issues.push(`Internal random secret has an external provider: ${entry.name}`);
    }
    if (entry.automation === "AUTOMATED_INTERNAL" && entry.rolloutStrategy.startsWith("DUAL_KEY")) {
      issues.push(`Dual-key rollout cannot be automated before application support is certified: ${entry.name}`);
    }
  }

  for (const name of policy.identityMetadataExcludedFromValueRotation) {
    if (names.has(name)) issues.push(`Identity metadata must not be value-rotated: ${name}`);
  }
  return issues;
}

export function rotationEntry(name: string): SecretRotationPolicyEntry | undefined {
  return secretRotationPolicy.secrets.find((entry) => entry.name === name);
}

export function rotationPeriodSeconds(entry: SecretRotationPolicyEntry): number {
  return secretRotationPolicy.tiers[entry.tier].rotationDays * 86_400;
}
