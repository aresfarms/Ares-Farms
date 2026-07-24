import { canonicalLandRegisterAuthority } from "@/lib/platform/authorities/landRegister";
import { writeOfficialEvidenceRefresh } from "./officialEvidenceRefreshWriter";
import { OFFICIAL_EVIDENCE_SOURCE_ACTIVATION, type OfficialEvidenceSourceId } from "./officialEvidenceSourceGovernance";
import { readOfficialEvidenceRefreshState, writeOfficialEvidenceRefreshState } from "./officialEvidenceRuntimeStore";
import type { ParcelTaxAuthorityRecord, WellPermitAuthorityRecord } from "./officialPropertySourceAdapters";

type EvidenceRows = ParcelTaxAuthorityRecord[] | WellPermitAuthorityRecord[];
type Fetcher = () => Promise<EvidenceRows>;

const fetchers: Partial<Record<OfficialEvidenceSourceId, Fetcher>> = {};

export function registerOfficialEvidenceFetcher(sourceId: OfficialEvidenceSourceId, fetcher: Fetcher): void {
  fetchers[sourceId] = fetcher;
}

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
    const fetcher = fetchers[sourceId];
    if (!fetcher) {
      results.push({ sourceId, status: "skipped", recordCount: 0, publishedVersion: previous?.publishedVersion ?? null, reason: "No approved official connector fetcher is registered." });
      continue;
    }
    try {
      const rows = await fetcher();
      const next = writeOfficialEvidenceRefresh({ activation, previous, records: rows, attemptedAt: now.toISOString() });
      writeOfficialEvidenceRefreshState(next);
      const receipt = next.receipts.at(-1)!;
      results.push({ sourceId, status: receipt.status, recordCount: receipt.recordCount, publishedVersion: next.publishedVersion, reason: receipt.reason });
    } catch (error) {
      const next = writeOfficialEvidenceRefresh({ activation, previous, attemptedAt: now.toISOString(), failureReason: (error as Error).message });
      writeOfficialEvidenceRefreshState(next);
      results.push({ sourceId, status: "failed", recordCount: 0, publishedVersion: next.publishedVersion, reason: (error as Error).message });
    }
  }
  for (const result of results) canonicalLandRegisterAuthority.append({ actorId: "system:source-refresh", actorName: "source-refresh-job", domain: "official-evidence-refresh", subject: result.sourceId, decision: result.status.toUpperCase(), reason: result.reason, detail: { recordCount: result.recordCount, publishedVersion: result.publishedVersion } });
  return results;
}
