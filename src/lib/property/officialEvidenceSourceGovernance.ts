export type OfficialEvidenceSourceId = "parcel-tax-authority" | "well-permit-authority" | "county-recorder-deed";
export type SourceActivationStatus = "pending" | "approved" | "suspended";
export type RefreshReceiptStatus = "refreshed" | "no-change" | "failed";

export interface OfficialEvidenceRefreshReceipt {
  receiptId: string;
  sourceId: OfficialEvidenceSourceId;
  attemptedAt: string;
  status: RefreshReceiptStatus;
  recordCount: number;
  sourceVersion: string;
  previousVersion?: string | null;
  reason: string;
  replayRef: string;
  connectorId?: string | null;
  parserVersion?: string | null;
  implementationHash?: string | null;
  approvalReceiptId?: string | null;
}

export interface OfficialEvidenceSnapshot<T> {
  sourceId: OfficialEvidenceSourceId;
  sourceVersion: string;
  retrievedAt: string;
  contentHash: string;
  records: T[];
  receipt: OfficialEvidenceRefreshReceipt;
}

export interface OfficialEvidenceSourceActivation {
  sourceId: OfficialEvidenceSourceId;
  status: SourceActivationStatus;
  approvedBy?: string | null;
  approvedAt?: string | null;
  staleAfterDays: number;
}

export interface OfficialEvidenceSourceResolution<T> {
  sourceId: OfficialEvidenceSourceId;
  activationStatus: SourceActivationStatus;
  freshness: "fresh" | "stale" | "unavailable";
  relianceAllowed: boolean;
  records: T[];
  lastGoodSnapshot: OfficialEvidenceSnapshot<T> | null;
  versionHistory: string[];
  refreshReceipts: OfficialEvidenceRefreshReceipt[];
  reason: string;
}

const ageDays = (iso: string, now: Date): number =>
  Math.floor((now.getTime() - new Date(iso).getTime()) / 86_400_000);

export function resolveOfficialEvidenceSource<T>(args: {
  activation: OfficialEvidenceSourceActivation;
  snapshots: OfficialEvidenceSnapshot<T>[];
  now?: Date;
}): OfficialEvidenceSourceResolution<T> {
  const now = args.now ?? new Date();
  const ordered = [...args.snapshots].sort((a, b) => Date.parse(a.retrievedAt) - Date.parse(b.retrievedAt));
  const successful = ordered.filter((snapshot) => snapshot.receipt.status !== "failed");
  const lastGood = successful.at(-1) ?? null;
  const receipts = ordered.map((snapshot) => snapshot.receipt);
  const history = ordered.map((snapshot) => snapshot.sourceVersion);

  if (args.activation.status !== "approved") {
    return {
      sourceId: args.activation.sourceId,
      activationStatus: args.activation.status,
      freshness: "unavailable",
      relianceAllowed: false,
      records: [],
      lastGoodSnapshot: lastGood,
      versionHistory: history,
      refreshReceipts: receipts,
      reason: "Source is not approved for evidence use.",
    };
  }
  if (!lastGood) {
    return {
      sourceId: args.activation.sourceId,
      activationStatus: args.activation.status,
      freshness: "unavailable",
      relianceAllowed: false,
      records: [],
      lastGoodSnapshot: null,
      versionHistory: history,
      refreshReceipts: receipts,
      reason: "No successful last-good snapshot exists.",
    };
  }
  const stale = ageDays(lastGood.retrievedAt, now) > args.activation.staleAfterDays;
  return {
    sourceId: args.activation.sourceId,
    activationStatus: args.activation.status,
    freshness: stale ? "stale" : "fresh",
    relianceAllowed: !stale,
    records: stale ? [] : lastGood.records,
    lastGoodSnapshot: lastGood,
    versionHistory: history,
    refreshReceipts: receipts,
    reason: stale
      ? "Last-good snapshot is retained for audit and replay but blocked from current reliance because it is stale."
      : "Approved fresh last-good snapshot is available for evidence use.",
  };
}

export const OFFICIAL_EVIDENCE_SOURCE_ACTIVATION: Record<OfficialEvidenceSourceId, OfficialEvidenceSourceActivation> = {
  "parcel-tax-authority": { sourceId: "parcel-tax-authority", status: "pending", staleAfterDays: 45 },
  "well-permit-authority": { sourceId: "well-permit-authority", status: "pending", staleAfterDays: 365 },
  "county-recorder-deed": { sourceId: "county-recorder-deed", status: "pending", staleAfterDays: 30 },
};
