import inventoryJson from "../../../config/security/external-secret-inventory.json";

export const governedLocalSecretNames = Object.freeze([
  "NASS_API_KEY",
  "REPORT_SIGNING_SECRET",
  "EIA_API_KEY",
  "FCC_BROADBAND_API_TOKEN",
  "MARS_API_KEY",
  "REPLIERS_API_KEY",
  "SI_API_KEY",
] as const);

export type GovernedLocalSecretName = (typeof governedLocalSecretNames)[number];
export type SecretRotationStatus =
  | "MIGRATED_PENDING_PROVIDER_ROTATION"
  | "MIGRATED_PENDING_CONTROLLED_ROTATION"
  | "ROTATED";

export type ExternalSecretInventoryEntry = Readonly<{
  name: GovernedLocalSecretName;
  purpose: string;
  rotationStatus: SecretRotationStatus;
  rotationEvidence: string | null;
}>;

export const externalSecretInventory = inventoryJson as Readonly<{
  schemaVersion: 1;
  gcpProjectId: string;
  approvedStore: "GCP_SECRET_MANAGER";
  secrets: ExternalSecretInventoryEntry[];
}>;

export function validateExternalSecretInventory(): string[] {
  const issues: string[] = [];
  const entries = new Map(externalSecretInventory.secrets.map((entry) => [entry.name, entry]));
  for (const name of governedLocalSecretNames) {
    const entry = entries.get(name);
    if (!entry) {
      issues.push(`Missing inventory entry: ${name}`);
      continue;
    }
    if (entry.rotationStatus === "ROTATED" && !entry.rotationEvidence?.trim()) {
      issues.push(`ROTATED secret lacks rotation evidence: ${name}`);
    }
  }
  for (const name of entries.keys()) {
    if (!governedLocalSecretNames.includes(name)) {
      issues.push(`Unexpected inventory entry: ${name}`);
    }
  }
  return issues;
}
