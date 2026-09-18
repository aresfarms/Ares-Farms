import { existsSync, readFileSync } from "node:fs";
import { relative, resolve } from "node:path";

import inventoryJson from "../../../config/security/external-secret-inventory.json";

export const governedLocalSecretNames = Object.freeze([
  "AIRNOW_API_KEY",
  "ARCGIS_API_KEY",
  "BEA_API_KEY",
  "BLS_API_KEY",
  "CENSUS_API_KEY",
  "DATA_GOV_API_KEY",
  "EIA_API_KEY",
  "EPA_API_KEY",
  "EPA_AQS_API_KEY",
  "EPA_AQS_EMAIL",
  "FCC_BROADBAND_API_TOKEN",
  "FCC_BROADBAND_API_USERNAME",
  "FRED_API_KEY",
  "GRANTS_GOV_API_KEY",
  "HUDUSER_API_TOKEN",
  "MARS_API_KEY",
  "NASS_API_KEY",
  "NOAA_CDO_TOKEN",
  "NREL_API_KEY",
  "REPORT_SIGNING_SECRET",
  "SAM_GOV_API_KEY",
  "SEC_USER_AGENT",
  "SI_API_KEY",
] as const);

export type GovernedLocalSecretName = (typeof governedLocalSecretNames)[number];
export type SecretRotationStatus =
  | "MIGRATED_PENDING_PROVIDER_ROTATION"
  | "MIGRATED_PENDING_CONTROLLED_ROTATION"
  | "CURRENT_NEWLY_ISSUED"
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
  attestedAtUtc?: string;
  attestedBy?: string;
  attestationAuthority?: string;
  rotationPolicyDays?: number;
  credentials?: ReadonlyArray<Readonly<{
    name?: string;
    credentialKind?: string;
    activatedSecretVersion?: string;
    secretVersionCreatedAtUtc?: string;
    currentStatus?: string;
    previousProviderCredentialRevoked?: boolean | null;
    providerEventReference?: string;
    connectorVerification?: Readonly<{
      status?: string;
      evidence?: string;
    }>;
    nextRotationDueAtUtc?: string;
  }>>;
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

function validateCurrentIssuanceEvidence(
  entry: ExternalSecretInventoryEntry,
  inventory: ExternalSecretInventory,
  repositoryRoot: string
): string[] {
  const issues: string[] = [];
  const evidenceReference = entry.rotationEvidence?.trim();
  if (!evidenceReference) return [`Current credential lacks issuance evidence: ${entry.name}`];
  if (evidenceReference.startsWith("/") || evidenceReference.includes("..")) {
    return [`Issuance evidence must be a repository-relative path: ${entry.name}`];
  }

  const evidencePath = resolve(repositoryRoot, evidenceReference);
  const relativePath = relative(repositoryRoot, evidencePath);
  if (relativePath.startsWith("..") || !relativePath.startsWith("artifacts/")) {
    return [`Issuance evidence must remain under artifacts/: ${entry.name}`];
  }
  if (!existsSync(evidencePath)) return [`Issuance evidence file is missing: ${entry.name}`];

  let evidence: RotationEvidence;
  try {
    evidence = JSON.parse(readFileSync(evidencePath, "utf8")) as RotationEvidence;
  } catch {
    return [`Issuance evidence is not valid JSON: ${entry.name}`];
  }

  if (evidence.event !== "PROVIDER_CREDENTIAL_CURRENT_ISSUANCE") {
    issues.push(`Issuance evidence has an unsupported event type: ${entry.name}`);
  }
  if (evidence.gcpProjectId !== inventory.gcpProjectId) {
    issues.push(`Issuance evidence project mismatch: ${entry.name}`);
  }
  if (evidence.secretValueDisplayed !== false) {
    issues.push(`Issuance evidence does not affirm secret non-disclosure: ${entry.name}`);
  }
  if (evidence.combinedProductionReady !== false) {
    issues.push(`Issuance evidence does not preserve the production hold: ${entry.name}`);
  }
  if (!evidence.attestedAtUtc || Number.isNaN(Date.parse(evidence.attestedAtUtc))) {
    issues.push(`Issuance evidence lacks a valid owner-attestation time: ${entry.name}`);
  }
  if (!evidence.attestedBy?.trim() || evidence.attestationAuthority !== "owner") {
    issues.push(`Issuance evidence lacks owner authority: ${entry.name}`);
  }

  const credential = evidence.credentials?.find((candidate) => candidate.name === entry.name);
  if (!credential) return [...issues, `Issuance evidence lacks credential entry: ${entry.name}`];
  if (!/^\d+$/.test(credential.activatedSecretVersion ?? "")) {
    issues.push(`Issuance evidence lacks an activated secret version: ${entry.name}`);
  }
  if (!credential.secretVersionCreatedAtUtc || Number.isNaN(Date.parse(credential.secretVersionCreatedAtUtc))) {
    issues.push(`Issuance evidence lacks Secret Manager version time: ${entry.name}`);
  }
  if (credential.currentStatus !== "CURRENT_NEWLY_ISSUED") {
    issues.push(`Issuance evidence does not mark credential current: ${entry.name}`);
  }
  if (!credential.providerEventReference?.trim()) {
    issues.push(`Issuance evidence lacks provider event reference: ${entry.name}`);
  }
  if (
    credential.connectorVerification?.status !== "OWNER_ATTESTED_PASS" ||
    !credential.connectorVerification.evidence?.trim()
  ) {
    issues.push(`Issuance evidence lacks owner-attested connector verification: ${entry.name}`);
  }
  if (
    credential.credentialKind === "PROVIDER_CREDENTIAL" &&
    credential.previousProviderCredentialRevoked !== true
  ) {
    issues.push(`Issuance evidence lacks prior-credential revocation: ${entry.name}`);
  }
  const nextRotation = Date.parse(credential.nextRotationDueAtUtc ?? "");
  if (!Number.isFinite(nextRotation)) {
    issues.push(`Issuance evidence lacks next rotation due time: ${entry.name}`);
  } else if (nextRotation <= Date.now()) {
    issues.push(`Provider credential rotation is due: ${entry.name}`);
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
    } else if (entry.rotationStatus === "CURRENT_NEWLY_ISSUED") {
      issues.push(...validateCurrentIssuanceEvidence(entry, inventory, repositoryRoot));
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
