import { createHash, createHmac } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
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
  | "PRODUCTION_PORTAL_READINESS_HOLD";

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
const storePath = () => runtimeStatePath("governance", "release-governance-evidence.json");
const emptyStore = (): Store => ({ schemaVersion: "release-governance-evidence-store-v1", records: [] });

function readStore(): Store {
  try {
    const parsed = JSON.parse(readFileSync(storePath(), "utf8")) as Store;
    return parsed.schemaVersion === "release-governance-evidence-store-v1" && Array.isArray(parsed.records) ? parsed : emptyStore();
  } catch { return emptyStore(); }
}
function writeStore(store: Store): void {
  mkdirSync(path.dirname(storePath()), { recursive: true });
  const temp = `${storePath()}.tmp-${process.pid}`;
  writeFileSync(temp, JSON.stringify(store, null, 2));
  renameSync(temp, storePath());
}
function signPayload(payload: Omit<ReleaseGovernanceEvidenceRecord, "digest" | "signature">) {
  const bytes = JSON.stringify(payload);
  const digest = createHash("sha256").update(bytes).digest("hex");
  const secret = readRequiredSecret("REPORT_SIGNING_SECRET");
  return { digest, signature: secret ? createHmac("sha256", secret).update(bytes).digest("base64url") : null };
}
export function recordReleaseGovernanceEvidence(input: { kind: ReleaseGovernanceEvidenceKind; scope: string; actorId: string; reviewNote?: string | null; replayRef: string }): ReleaseGovernanceEvidenceRecord {
  const base = {
    evidenceId: `${input.kind.toLowerCase()}-${Date.now()}`, kind: input.kind, scope: input.scope, actorId: input.actorId,
    reviewNote: input.reviewNote ?? null, recordedAtUtc: new Date().toISOString(), productionBlocked: true as const,
    deploymentExecuted: false as const, productionSecretsActivated: false as const, publicDnsCutoverAllowed: false as const,
    databaseMigrationAllowed: false as const, liveExternalActionPerformed: false as const, publicVerificationAllowed: false as const,
    replayRef: input.replayRef,
  };
  const record = { ...base, ...signPayload(base) };
  const store = readStore(); store.records.push(record); writeStore(store); return record;
}
export function releaseGovernanceEvidenceFor(scope?: string | null, kind?: ReleaseGovernanceEvidenceKind): ReleaseGovernanceEvidenceRecord[] {
  return readStore().records.filter((record) => (!scope || record.scope === scope) && (!kind || record.kind === kind)).sort((a,b) => b.recordedAtUtc.localeCompare(a.recordedAtUtc));
}
export function latestReleaseGovernanceEvidence(scope: string, kind: ReleaseGovernanceEvidenceKind): ReleaseGovernanceEvidenceRecord | null {
  return releaseGovernanceEvidenceFor(scope, kind)[0] ?? null;
}
