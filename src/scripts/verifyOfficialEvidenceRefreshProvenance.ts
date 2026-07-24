import fs from "node:fs";
import os from "node:os";
import path from "node:path";
function assert(value: unknown, message: string): asserts value { if (!value) throw new Error(message); }
async function main() {
  process.env.FURLONG_RUNTIME_STATE_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "furlong-refresh-provenance-"));
  const registry = await import("@/lib/property/officialEvidenceConnectorRegistry");
  const governance = await import("@/lib/property/officialEvidenceSourceGovernance");
  const scheduled = await import("@/lib/property/officialEvidenceScheduledRefresh");
  const store = await import("@/lib/property/officialEvidenceRuntimeStore");
  registry.clearOfficialEvidenceConnectorRegistry();
  governance.OFFICIAL_EVIDENCE_SOURCE_ACTIVATION["parcel-tax-authority"].status = "approved";
  const fetcher = async () => [{ parcelId:"p1", authority:"County", jurisdiction:"County, MD", reference:"tax", retrievedAt:"2026-07-24T00:00:00Z", asOf:"2026-07-24", replayRef:"source:tax:p1", currentAnnualTax:4200, transferContinuityVerified:false }];
  registry.registerOfficialEvidenceConnector({ connectorId:"tax-v1", sourceId:"parcel-tax-authority", sourceName:"County tax", officialAuthority:"County", legalBasis:"Official public record", geographicScope:["County, MD"], parserVersion:"1.0.0", sourceUrl:"https://example.gov/tax", registeredAt:"2026-07-24T20:00:00Z", status:"pending" }, fetcher);
  const approved = registry.decideOfficialEvidenceConnector({ sourceId:"parcel-tax-authority", decision:"APPROVE", reviewerId:"reviewer-1", reviewerName:"Reviewer", reason:"Reviewed exact implementation.", decidedAt:"2026-07-24T20:05:00Z" });
  const approval = registry.approvalReceiptForConnector(approved);
  assert(approval, "Exact approval receipt must resolve.");
  await scheduled.refreshOfficialEvidenceSources(new Date("2026-07-24T22:00:00Z"));
  const state = store.readOfficialEvidenceRefreshState<any>("parcel-tax-authority");
  const receipt = state?.receipts.at(-1);
  const snapshot = state?.snapshots.at(-1);
  assert(receipt?.connectorId === approved.connectorId, "Refresh receipt must bind connector ID.");
  assert(receipt?.parserVersion === approved.parserVersion, "Refresh receipt must bind parser version.");
  assert(receipt?.implementationHash === approved.implementationHash, "Refresh receipt must bind implementation hash.");
  assert(receipt?.approvalReceiptId === approval.receiptId, "Refresh receipt must bind approval receipt.");
  assert(snapshot?.receipt.approvalReceiptId === approval.receiptId, "Published snapshot must preserve the same provenance chain.");
  console.log(JSON.stringify({ ok:true, rule:"OFFICIAL-EVIDENCE-REFRESH-PROVENANCE-001", connectorId:receipt.connectorId, parserVersion:receipt.parserVersion, implementationHash:receipt.implementationHash, approvalReceiptId:receipt.approvalReceiptId, sourceVersion:snapshot.sourceVersion }, null, 2));
}
main().catch(error => { console.error(error); process.exit(1); });
