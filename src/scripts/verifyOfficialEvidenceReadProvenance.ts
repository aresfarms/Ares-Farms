import fs from "node:fs";
import os from "node:os";
import path from "node:path";
function assert(value: unknown, message: string): asserts value { if (!value) throw new Error(message); }
async function main() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "furlong-read-provenance-"));
  process.env.FURLONG_RUNTIME_STATE_DIR = dir;
  const registry = await import("@/lib/property/officialEvidenceConnectorRegistry");
  const { refreshOfficialEvidenceSources } = await import("@/lib/property/officialEvidenceScheduledRefresh");
  const { readOfficialEvidenceRefreshState } = await import("@/lib/property/officialEvidenceRuntimeStore");
  const { verifyOfficialEvidenceSnapshotAtRead } = await import("@/lib/property/officialEvidenceReadVerification");
  const governance = await import("@/lib/property/officialEvidenceSourceGovernance");
  governance.OFFICIAL_EVIDENCE_SOURCE_ACTIVATION["parcel-tax-authority"].status = "approved";
  registry.clearOfficialEvidenceConnectorRegistry();
  const fetcher = async () => [{ parcelId: "p-1", authority: "County Treasurer", jurisdiction: "Example County, MD", reference: "2026 tax card", retrievedAt: "2026-07-24T00:00:00Z", asOf: "2026-07-24", replayRef: "replay:tax:p1", currentAnnualTax: 4200, transferContinuityVerified: false }];
  registry.registerOfficialEvidenceConnector({ connectorId: "tax-read-v1", sourceId: "parcel-tax-authority", sourceName: "County tax", officialAuthority: "County Treasurer", legalBasis: "Official public record", geographicScope: ["Example County, MD"], parserVersion: "1.0.0", sourceUrl: "https://example.gov/tax", registeredAt: "2026-07-24T20:00:00Z", status: "pending" }, fetcher);
  registry.decideOfficialEvidenceConnector({ sourceId: "parcel-tax-authority", decision: "APPROVE", reviewerId: "op-1", reviewerName: "Reviewer", reason: "Reviewed exact implementation.", decidedAt: "2026-07-24T21:00:00Z" });
  await refreshOfficialEvidenceSources(new Date("2026-07-24T22:00:00Z"));
  const snapshot = readOfficialEvidenceRefreshState<any>("parcel-tax-authority")?.snapshots.at(-1);
  assert(snapshot, "A governed snapshot must exist.");
  const valid = verifyOfficialEvidenceSnapshotAtRead("parcel-tax-authority", snapshot);
  assert(valid.valid, `Untampered provenance must validate: ${valid.reasons.join(",")}`);
  const tampered = structuredClone(snapshot); tampered.records[0].currentAnnualTax = 9999;
  assert(!verifyOfficialEvidenceSnapshotAtRead("parcel-tax-authority", tampered).valid, "Content tampering must fail read validation.");
  const wrongApproval = structuredClone(snapshot); wrongApproval.receipt.approvalReceiptId = "missing";
  assert(!verifyOfficialEvidenceSnapshotAtRead("parcel-tax-authority", wrongApproval).valid, "Missing approval receipt must fail read validation.");
  registry.decideOfficialEvidenceConnector({ sourceId: "parcel-tax-authority", decision: "SUSPEND", reviewerId: "op-1", reviewerName: "Reviewer", reason: "Reliance suspended.", decidedAt: "2026-07-25T00:00:00Z" });
  const suspended = verifyOfficialEvidenceSnapshotAtRead("parcel-tax-authority", snapshot);
  assert(!suspended.valid && suspended.reasons.includes("connector-not-currently-approved"), "Suspended connector evidence must be withheld.");
  console.log(JSON.stringify({ ok: true, rule: "OFFICIAL-EVIDENCE-READ-PROVENANCE-001", validBeforeSuspension: valid.valid, tamperBlocked: true, missingApprovalBlocked: true, suspendedReasons: suspended.reasons }, null, 2));
}
main().catch((error) => { console.error(error); process.exit(1); });
