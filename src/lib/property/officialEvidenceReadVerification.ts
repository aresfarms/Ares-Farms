import { hashOfficialEvidenceRecords } from "./officialEvidenceRefreshWriter";
import { readDurableConnectorRegistry } from "./officialEvidenceConnectorRuntimeStore";
import type { OfficialEvidenceSnapshot, OfficialEvidenceSourceId } from "./officialEvidenceSourceGovernance";

export interface EvidenceReadVerification {
  valid: boolean;
  reasons: string[];
}

export function verifyOfficialEvidenceSnapshotAtRead<T>(
  sourceId: OfficialEvidenceSourceId,
  snapshot: OfficialEvidenceSnapshot<T>,
): EvidenceReadVerification {
  const reasons: string[] = [];
  const receipt = snapshot.receipt;
  if (snapshot.sourceId !== sourceId || receipt.sourceId !== sourceId) reasons.push("source-id-mismatch");
  if (receipt.sourceVersion !== snapshot.sourceVersion) reasons.push("source-version-mismatch");
  if (receipt.status !== "refreshed") reasons.push("snapshot-receipt-not-refreshed");
  if (hashOfficialEvidenceRecords(snapshot.records) !== snapshot.contentHash) reasons.push("content-hash-mismatch");

  const connectorId = receipt.connectorId?.trim();
  const parserVersion = receipt.parserVersion?.trim();
  const implementationHash = receipt.implementationHash?.trim();
  const approvalReceiptId = receipt.approvalReceiptId?.trim();
  if (!connectorId) reasons.push("connector-id-missing");
  if (!parserVersion) reasons.push("parser-version-missing");
  if (!implementationHash || !/^[a-f0-9]{64}$/.test(implementationHash)) reasons.push("implementation-hash-invalid");
  if (!approvalReceiptId) reasons.push("approval-receipt-id-missing");

  const registry = readDurableConnectorRegistry();
  const registration = registry.registrations.filter((item) => item.sourceId === sourceId).at(-1) ?? null;
  if (!registration) reasons.push("connector-registration-missing");
  else {
    if (registration.status !== "approved") reasons.push("connector-not-currently-approved");
    if (registration.connectorId !== connectorId) reasons.push("connector-registration-id-mismatch");
    if (registration.parserVersion !== parserVersion) reasons.push("connector-parser-version-mismatch");
    if (registration.implementationHash !== implementationHash) reasons.push("connector-implementation-hash-mismatch");
  }

  const approval = registry.receipts.find((item) => item.receiptId === approvalReceiptId) ?? null;
  if (!approval) reasons.push("approval-receipt-missing");
  else {
    if (approval.decision !== "APPROVE") reasons.push("receipt-is-not-approval");
    if (approval.sourceId !== sourceId) reasons.push("approval-source-mismatch");
    if (approval.connectorId !== connectorId) reasons.push("approval-connector-mismatch");
    if (approval.parserVersion !== parserVersion) reasons.push("approval-parser-version-mismatch");
    if (approval.implementationHash !== implementationHash) reasons.push("approval-implementation-hash-mismatch");
  }
  return { valid: reasons.length === 0, reasons };
}

export function verifiedSnapshotsForRead<T>(
  sourceId: OfficialEvidenceSourceId,
  snapshots: OfficialEvidenceSnapshot<T>[],
): OfficialEvidenceSnapshot<T>[] {
  return snapshots.filter((snapshot) => verifyOfficialEvidenceSnapshotAtRead(sourceId, snapshot).valid);
}
