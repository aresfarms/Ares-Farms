import { createHash, createHmac } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";

import { runtimeStatePath } from "@/lib/property/runtimeStatePath";
import { readRequiredSecret } from "@/lib/security/requestGuards";

export type SourceReviewEvidenceKind =
  | "LEGAL_REVIEW_HOLD"
  | "PROMOTION_PACKET_HOLD"
  | "PRODUCTION_READINESS_HOLD"
  | "CONTROLLED_PROMOTION_HOLD";

export type SourceReviewEvidenceRecord = {
  evidenceId: string;
  kind: SourceReviewEvidenceKind;
  sourceId: string;
  actorId: string;
  reviewNote: string | null;
  recordedAtUtc: string;
  activationBlocked: true;
  liveFetchPerformed: false;
  externalActionPerformed: false;
  legalAdviceProvided: false;
  productionBlocked: true;
  replayRef: string;
  digest: string;
  signature: string | null;
};

type Store = {
  schemaVersion: "source-review-evidence-store-v1";
  records: SourceReviewEvidenceRecord[];
};

const storePath = () => runtimeStatePath("governance", "source-review-evidence.json");
const emptyStore = (): Store => ({ schemaVersion: "source-review-evidence-store-v1", records: [] });

function readStore(): Store {
  try {
    const parsed = JSON.parse(readFileSync(storePath(), "utf8")) as Store;
    return parsed.schemaVersion === "source-review-evidence-store-v1" && Array.isArray(parsed.records)
      ? parsed
      : emptyStore();
  } catch {
    return emptyStore();
  }
}

function writeStore(store: Store): void {
  mkdirSync(path.dirname(storePath()), { recursive: true });
  const temp = `${storePath()}.tmp-${process.pid}`;
  writeFileSync(temp, JSON.stringify(store, null, 2));
  renameSync(temp, storePath());
}

function signPayload(payload: Omit<SourceReviewEvidenceRecord, "digest" | "signature">) {
  const bytes = JSON.stringify(payload);
  const digest = createHash("sha256").update(bytes).digest("hex");
  const secret = readRequiredSecret("REPORT_SIGNING_SECRET");
  const signature = secret
    ? createHmac("sha256", secret).update(bytes).digest("base64url")
    : null;
  return { digest, signature };
}

export function recordSourceReviewEvidence(input: {
  kind: SourceReviewEvidenceKind;
  sourceId: string;
  actorId: string;
  reviewNote?: string | null;
  replayRef: string;
}): SourceReviewEvidenceRecord {
  const now = new Date().toISOString();
  const base = {
    evidenceId: `${input.kind.toLowerCase()}-${Date.now()}`,
    kind: input.kind,
    sourceId: input.sourceId,
    actorId: input.actorId,
    reviewNote: input.reviewNote ?? null,
    recordedAtUtc: now,
    activationBlocked: true as const,
    liveFetchPerformed: false as const,
    externalActionPerformed: false as const,
    legalAdviceProvided: false as const,
    productionBlocked: true as const,
    replayRef: input.replayRef,
  };
  const record = { ...base, ...signPayload(base) };
  const store = readStore();
  store.records.push(record);
  writeStore(store);
  return record;
}

export function sourceReviewEvidenceFor(
  sourceId?: string | null,
  kind?: SourceReviewEvidenceKind
): SourceReviewEvidenceRecord[] {
  return readStore().records
    .filter((record) => (!sourceId || record.sourceId === sourceId) && (!kind || record.kind === kind))
    .sort((a, b) => b.recordedAtUtc.localeCompare(a.recordedAtUtc));
}

export function latestSourceReviewEvidence(
  sourceId: string,
  kind: SourceReviewEvidenceKind
): SourceReviewEvidenceRecord | null {
  return sourceReviewEvidenceFor(sourceId, kind)[0] ?? null;
}
