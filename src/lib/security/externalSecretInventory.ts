import { existsSync, readFileSync } from "node:fs";
import { relative, resolve } from "node:path";

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

export type ExternalSecretInventory = Readonly<{
  schemaVersion: 1;
  gcpProjectId: string;
  approvedStore: "GCP_SECRET_MANAGER";
  secrets: ExternalSecretInventoryEntry[];
}>;

export const externalSecretInventory = inventoryJson as ExternalSecretInventory;

type RotationEvidence = Readonly<{
  event?: string;
  gcpProjectId?: string;
  secret?: string;
  activatedSecretVersion?: string;
  rotatedAtUtc?: string;
  secretValueDisplayed?: boolean;
  combinedProductionReady?: boolean;
  previousProviderCredentialRevoked?: boolean;
  providerEventReference?: string;
  connectorVerification?: Readonly<{
    status?: string;
    evidence?: string;
  }>;
}>;

function validateRotationEvidence(
  entry: ExternalSecretInventoryEntry,
  inventory: ExternalSecretInventory,
  repositoryRoot: string
): string[] {
  const issues: string[] = [];
  const evidenceReference = entry.rotationEvidence?.trim();
  if (!evidenceReference) return [`ROTATED secret lacks rotation evidence: ${entry.name}`];
  if (evidenceReference.startsWith("/") || evidenceReference.includes("..")) {
    return [`Rotation evidence must be a repository-relative path: ${entry.name}`];
  }

  const evidencePath = resolve(repositoryRoot, evidenceReference);
  const relativePath = relative(repositoryRoot, evidencePath);
  if (relativePath.startsWith("..") || !relativePath.startsWith("artifacts/")) {
    return [`Rotation evidence must remain under artifacts/: ${entry.name}`];
  }
  if (!existsSync(evidencePath)) return [`Rotation evidence file is missing: ${entry.name}`];

  let evidence: RotationEvidence;
  try {
    evidence = JSON.parse(readFileSync(evidencePath, "utf8")) as RotationEvidence;
  } catch {
    return [`Rotation evidence is not valid JSON: ${entry.name}`];
  }

  if (evidence.secret !== entry.name) issues.push(`Rotation evidence secret mismatch: ${entry.name}`);
  if (evidence.gcpProjectId !== inventory.gcpProjectId) {
    issues.push(`Rotation evidence project mismatch: ${entry.name}`);
  }
  if (!/^\d+$/.test(evidence.activatedSecretVersion ?? "")) {
    issues.push(`Rotation evidence lacks an activated secret version: ${entry.name}`);
  }
  if (!evidence.rotatedAtUtc || Number.isNaN(Date.parse(evidence.rotatedAtUtc))) {
    issues.push(`Rotation evidence lacks a valid UTC timestamp: ${entry.name}`);
  }
  if (evidence.secretValueDisplayed !== false) {
    issues.push(`Rotation evidence does not affirm secret non-disclosure: ${entry.name}`);
  }
  if (evidence.combinedProductionReady !== false) {
    issues.push(`Rotation evidence does not preserve the production hold: ${entry.name}`);
  }

  if (evidence.event === "PROVIDER_SECRET_ROTATION") {
    if (evidence.previousProviderCredentialRevoked !== true) {
      issues.push(`Provider rotation lacks previous-credential revocation: ${entry.name}`);
    }
    if (!evidence.providerEventReference?.trim()) {
      issues.push(`Provider rotation lacks a provider event reference: ${entry.name}`);
    }
    if (evidence.connectorVerification?.status !== "PASS" || !evidence.connectorVerification.evidence?.trim()) {
      issues.push(`Provider rotation lacks passing connector evidence: ${entry.name}`);
    }
  } else if (evidence.event !== "CONTROLLED_SECRET_ROTATION") {
    issues.push(`Rotation evidence has an unsupported event type: ${entry.name}`);
  }

  return issues;
}

export function validateExternalSecretInventory(
  inventory: ExternalSecretInventory = externalSecretInventory,
  repositoryRoot: string = process.cwd()
): string[] {
  const issues: string[] = [];
  const entries = new Map(inventory.secrets.map((entry) => [entry.name, entry]));
  for (const name of governedLocalSecretNames) {
    const entry = entries.get(name);
    if (!entry) {
      issues.push(`Missing inventory entry: ${name}`);
      continue;
    }
    if (entry.rotationStatus === "ROTATED") {
      issues.push(...validateRotationEvidence(entry, inventory, repositoryRoot));
    } else if (entry.rotationEvidence !== null) {
      issues.push(`Pending secret must not claim rotation evidence: ${name}`);
    }
  }
  for (const name of entries.keys()) {
    if (!governedLocalSecretNames.includes(name)) {
      issues.push(`Unexpected inventory entry: ${name}`);
    }
  }
  return issues;
}
