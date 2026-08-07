import { canonicalLandRegisterAuthority } from "@/lib/platform/authorities/landRegister";
import { writeOfficialEvidenceRefresh } from "./officialEvidenceRefreshWriter";
import { OFFICIAL_EVIDENCE_SOURCE_ACTIVATION, type OfficialEvidenceSourceId } from "./officialEvidenceSourceGovernance";
import { readOfficialEvidenceRefreshState, writeOfficialEvidenceRefreshState } from "./officialEvidenceRuntimeStore";
import type { ParcelTaxAuthorityRecord, WellPermitAuthorityRecord } from "./officialPropertySourceAdapters";
import { approvalReceiptForConnector, resolveApprovedOfficialEvidenceConnector } from "./officialEvidenceConnectorRegistry";

type EvidenceRows = ParcelTaxAuthorityRecord[] | WellPermitAuthorityRecord[];

export interface OfficialEvidenceScheduledRefreshResult {
  sourceId: OfficialEvidenceSourceId;
  status: "skipped" | "refreshed" | "no-change" | "failed";
  recordCount: number;
  publishedVersion: string | null;
  reason: string;
}

export async function refreshOfficialEvidenceSources(now = new Date()): Promise<OfficialEvidenceScheduledRefreshResult[]> {
  const results: OfficialEvidenceScheduledRefreshResult[] = [];
  for (const sourceId of Object.keys(OFFICIAL_EVIDENCE_SOURCE_ACTIVATION) as OfficialEvidenceSourceId[]) {
    const activation = OFFICIAL_EVIDENCE_SOURCE_ACTIVATION[sourceId];
    const previous = readOfficialEvidenceRefreshState<EvidenceRows[number]>(sourceId);
    const connector = resolveApprovedOfficialEvidenceConnector(sourceId);
    if (!connector) {
      results.push({ sourceId, status: "skipped", recordCount: 0, publishedVersion: previous?.publishedVersion ?? null, reason: "No approved official connector registration is available." });
      continue;
    }
    const fetcher = connector.fetcher;
    const approvalReceipt = approvalReceiptForConnector(connector.registration);
    if (!approvalReceipt || !connector.registration.implementationHash) {
      results.push({ sourceId, status: "skipped", recordCount: 0, publishedVersion: previous?.publishedVersion ?? null, reason: "Approved connector is missing an exact approval receipt or implementation hash." });
      continue;
    }
    const provenance = { connectorId: connector.registration.connectorId, parserVersion: connector.registration.parserVersion, implementationHash: connector.registration.implementationHash, approvalReceiptId: approvalReceipt.receiptId };
    try {
      const rows = await fetcher();
      const next = writeOfficialEvidenceRefresh({ activation, previous, records: rows, attemptedAt: now.toISOString(), provenance });
      writeOfficialEvidenceRefreshState(next);
      const receipt = next.receipts.at(-1)!;
      results.push({ sourceId, status: receipt.status, recordCount: receipt.recordCount, publishedVersion: next.publishedVersion, reason: receipt.reason });
    } catch (error) {
      const next = writeOfficialEvidenceRefresh({ activation, previous, attemptedAt: now.toISOString(), failureReason: (error as Error).message, provenance });
      writeOfficialEvidenceRefreshState(next);
      results.push({ sourceId, status: "failed", recordCount: 0, publishedVersion: next.publishedVersion, reason: (error as Error).message });
    }
  }
  for (const result of results) canonicalLandRegisterAuthority.append({ actorId: "system:source-refresh", actorName: "source-refresh-job", domain: "official-evidence-refresh", subject: result.sourceId, decision: result.status.toUpperCase(), reason: result.reason, detail: { recordCount: result.recordCount, publishedVersion: result.publishedVersion, connector: resolveApprovedOfficialEvidenceConnector(result.sourceId)?.registration.connectorId ?? null } });
  return results;
}
