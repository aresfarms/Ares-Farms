import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import { runtimeStatePath } from "@/lib/property/runtimeStatePath";
import { readRequiredSecret } from "@/lib/security/requestGuards";

export type ReleaseGovernanceEvidenceKind =
  | "RELEASE_CANDIDATE_FREEZE_HOLD"
  | "PRODUCTION_CUTOVER_HOLD"
  | "PRODUCTION_RELEASE_BOARD_PACKET"
  | "PRODUCTION_FINAL_AUTHORITY_PACKET"
  | "PRODUCTION_ACTIVATION_CEREMONY_PACKET"
  | "PRODUCTION_POST_ACTIVATION_VERIFICATION_PACKET"
  | "PRODUCTION_RELIANCE_VERIFICATION_PACKET"
  | "PRODUCTION_REGULATORY_EXAMINATION_PACKET"
  | "PRODUCTION_REGULATORY_RESPONSE_PACKET"
  | "PRODUCTION_OPERATIONS_MONITORING_PACKET"
  | "PRODUCTION_INCIDENT_RESPONSE_READINESS_PACKET"
  | "PRODUCTION_SUPPORT_COMMUNICATIONS_READINESS_PACKET"
  | "PRODUCTION_PORTAL_READINESS_HOLD"
  | "PRODUCTION_LAUNCH_EVIDENCE_HOLD";

export type ReleaseGovernanceEvidenceRecord = {
  evidenceId: string;
  kind: ReleaseGovernanceEvidenceKind;
  scope: string;
  actorId: string;
  reviewNote: string | null;
  recordedAtUtc: string;
  productionBlocked: true;
  deploymentExecuted: false;
  productionSecretsActivated: false;
  publicDnsCutoverAllowed: false;
  databaseMigrationAllowed: false;
  liveExternalActionPerformed: false;
  publicVerificationAllowed: false;
  replayRef: string;
  digest: string;
  signature: string | null;
};

type Store = { schemaVersion: "release-governance-evidence-store-v1"; records: ReleaseGovernanceEvidenceRecord[] };
const legacyStorePath = () => runtimeStatePath("governance", "release-governance-evidence.json");
const recordDirectoryPath = () => runtimeStatePath("governance", "release-governance-evidence-records");
const emptyStore = (): Store => ({ schemaVersion: "release-governance-evidence-store-v1", records: [] });

function readLegacyStore(): Store {
  try {
    const parsed = JSON.parse(readFileSync(legacyStorePath(), "utf8")) as Store;
    return parsed.schemaVersion === "release-governance-evidence-store-v1" && Array.isArray(parsed.records)
      ? parsed
      : emptyStore();
  } catch {
    return emptyStore();
  }
}

function isEvidenceRecord(value: unknown): value is ReleaseGovernanceEvidenceRecord {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<ReleaseGovernanceEvidenceRecord>;
  return typeof record.evidenceId === "string"
    && typeof record.kind === "string"
    && typeof record.scope === "string"
    && typeof record.actorId === "string"
    && typeof record.recordedAtUtc === "string"
    && record.productionBlocked === true
    && record.deploymentExecuted === false
    && typeof record.digest === "string";
}

function unsignedPayload(record: ReleaseGovernanceEvidenceRecord): Omit<ReleaseGovernanceEvidenceRecord, "digest" | "signature"> {
  const { digest: _digest, signature: _signature, ...payload } = record;
  return payload;
}

function verifyEvidenceRecord(record: ReleaseGovernanceEvidenceRecord): boolean {
  const payload = unsignedPayload(record);
  const bytes = JSON.stringify(payload);
  const expectedDigest = createHash("sha256").update(bytes).digest("hex");
  if (record.digest !== expectedDigest) return false;

  const secret = readRequiredSecret("REPORT_SIGNING_SECRET");
  if (!secret) return record.signature === null;
  if (!record.signature) return false;

  const expectedSignature = createHmac("sha256", secret)
    .update(bytes)
    .digest("base64url");
  const provided = Buffer.from(record.signature);
  const expected = Buffer.from(expectedSignature);
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}

function readImmutableRecords(): ReleaseGovernanceEvidenceRecord[] {
  try {
    return readdirSync(recordDirectoryPath(), { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
      .flatMap((entry) => {
        try {
          const parsed = JSON.parse(
            readFileSync(path.join(recordDirectoryPath(), entry.name), "utf8")
          ) as unknown;
          return isEvidenceRecord(parsed) && verifyEvidenceRecord(parsed) ? [parsed] : [];
        } catch {
          return [];
        }
      });
  } catch {
    return [];
  }
}

function readAllRecords(): ReleaseGovernanceEvidenceRecord[] {
  const records = [...readLegacyStore().records, ...readImmutableRecords()]
    .filter((record) => isEvidenceRecord(record) && verifyEvidenceRecord(record));
  const unique = new Map<string, ReleaseGovernanceEvidenceRecord>();
  for (const record of records) unique.set(record.evidenceId, record);
  return [...unique.values()];
}

function writeImmutableRecord(record: ReleaseGovernanceEvidenceRecord): void {
  mkdirSync(recordDirectoryPath(), { recursive: true });
  const filePath = path.join(recordDirectoryPath(), `${record.evidenceId}.json`);
  writeFileSync(filePath, JSON.stringify(record, null, 2), { flag: "wx" });
}
function signPayload(payload: Omit<ReleaseGovernanceEvidenceRecord, "digest" | "signature">) {
  const bytes = JSON.stringify(payload);
  const digest = createHash("sha256").update(bytes).digest("hex");
  const secret = readRequiredSecret("REPORT_SIGNING_SECRET");
  return { digest, signature: secret ? createHmac("sha256", secret).update(bytes).digest("base64url") : null };
}
export function recordReleaseGovernanceEvidence(input: { kind: ReleaseGovernanceEvidenceKind; scope: string; actorId: string; reviewNote?: string | null; replayRef: string }): ReleaseGovernanceEvidenceRecord {
  const base = {
    evidenceId: `${input.kind.toLowerCase()}-${Date.now()}-${randomUUID()}`,
    kind: input.kind,
    scope: input.scope,
    actorId: input.actorId,
    reviewNote: input.reviewNote ?? null,
    recordedAtUtc: new Date().toISOString(),
    productionBlocked: true as const,
    deploymentExecuted: false as const,
    productionSecretsActivated: false as const,
    publicDnsCutoverAllowed: false as const,
    databaseMigrationAllowed: false as const,
    liveExternalActionPerformed: false as const,
    publicVerificationAllowed: false as const,
    replayRef: input.replayRef,
  };
  const record = { ...base, ...signPayload(base) };
  writeImmutableRecord(record);
  return record;
}
export function releaseGovernanceEvidenceFor(scope?: string | null, kind?: ReleaseGovernanceEvidenceKind): ReleaseGovernanceEvidenceRecord[] {
  return readAllRecords()
    .filter((record) => (!scope || record.scope === scope) && (!kind || record.kind === kind))
    .sort((a,b) => b.recordedAtUtc.localeCompare(a.recordedAtUtc));
}
export function latestReleaseGovernanceEvidence(scope: string, kind: ReleaseGovernanceEvidenceKind): ReleaseGovernanceEvidenceRecord | null {
  return releaseGovernanceEvidenceFor(scope, kind)[0] ?? null;
}
