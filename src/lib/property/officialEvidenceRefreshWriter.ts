import { createHash, randomUUID } from "node:crypto";
import type { OfficialEvidenceSourceId, OfficialEvidenceSnapshot, OfficialEvidenceRefreshReceipt, OfficialEvidenceSourceActivation } from "./officialEvidenceSourceGovernance";

export interface OfficialEvidenceRefreshState<T> {
  sourceId: OfficialEvidenceSourceId;
  snapshots: OfficialEvidenceSnapshot<T>[];
  receipts: OfficialEvidenceRefreshReceipt[];
  publishedVersion: string | null;
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, canonicalize(item)]));
  }
  return value;
}
const stableJson = (value: unknown): string => JSON.stringify(canonicalize(value));
export const hashOfficialEvidenceRecords = (records: unknown[]): string => createHash("sha256").update(stableJson(records)).digest("hex");

export function writeOfficialEvidenceRefresh<T>(args: {
  activation: OfficialEvidenceSourceActivation;
  previous?: OfficialEvidenceRefreshState<T> | null;
  records?: T[];
  attemptedAt: string;
  failureReason?: string | null;
}): OfficialEvidenceRefreshState<T> {
  const previous = args.previous ?? { sourceId: args.activation.sourceId, snapshots: [], receipts: [], publishedVersion: null };
  const lastGood = [...previous.snapshots].reverse().find((snapshot) => snapshot.receipt.status !== "failed") ?? null;
  const receiptId = randomUUID();

  if (args.failureReason) {
    const receipt: OfficialEvidenceRefreshReceipt = {
      receiptId, sourceId: args.activation.sourceId, attemptedAt: args.attemptedAt, status: "failed",
      recordCount: 0, sourceVersion: lastGood?.sourceVersion ?? "none", previousVersion: lastGood?.sourceVersion ?? null,
      reason: args.failureReason, replayRef: `replay:${args.activation.sourceId}:${receiptId}`,
    };
    return { ...previous, receipts: [...previous.receipts, receipt] };
  }

  const records = args.records ?? [];
  const contentHash = hashOfficialEvidenceRecords(records);
  if (lastGood?.contentHash === contentHash) {
    const receipt: OfficialEvidenceRefreshReceipt = {
      receiptId, sourceId: args.activation.sourceId, attemptedAt: args.attemptedAt, status: "no-change",
      recordCount: records.length, sourceVersion: lastGood.sourceVersion, previousVersion: lastGood.sourceVersion,
      reason: "Official source content hash is unchanged.", replayRef: `replay:${args.activation.sourceId}:${receiptId}`,
    };
    return { ...previous, receipts: [...previous.receipts, receipt] };
  }

  const sourceVersion = `${args.attemptedAt}:${contentHash.slice(0, 12)}`;
  const receipt: OfficialEvidenceRefreshReceipt = {
    receiptId, sourceId: args.activation.sourceId, attemptedAt: args.attemptedAt, status: "refreshed",
    recordCount: records.length, sourceVersion, previousVersion: lastGood?.sourceVersion ?? null,
    reason: lastGood ? "Official source changed; new immutable version created." : "Initial official source version created.",
    replayRef: `replay:${args.activation.sourceId}:${sourceVersion}`,
  };
  const snapshot: OfficialEvidenceSnapshot<T> = {
    sourceId: args.activation.sourceId, sourceVersion, retrievedAt: args.attemptedAt, contentHash, records, receipt,
  };
  return {
    sourceId: args.activation.sourceId,
    snapshots: [...previous.snapshots, snapshot],
    receipts: [...previous.receipts, receipt],
    publishedVersion: args.activation.status === "approved" ? sourceVersion : previous.publishedVersion,
  };
}
