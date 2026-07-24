import fs from "node:fs";
import os from "node:os";
import path from "node:path";
function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }
async function main() {
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "furlong-evidence-refresh-"));
process.env.FURLONG_RUNTIME_STATE_DIR = dir;
const { refreshOfficialEvidenceSources } = await import("@/lib/property/officialEvidenceScheduledRefresh");
const { registerOfficialEvidenceConnector, clearOfficialEvidenceConnectorRegistry, decideOfficialEvidenceConnector } = await import("@/lib/property/officialEvidenceConnectorRegistry");
const { readOfficialEvidenceRefreshState } = await import("@/lib/property/officialEvidenceRuntimeStore");
const governance = await import("@/lib/property/officialEvidenceSourceGovernance");
governance.OFFICIAL_EVIDENCE_SOURCE_ACTIVATION["parcel-tax-authority"].status = "approved";
clearOfficialEvidenceConnectorRegistry();
registerOfficialEvidenceConnector({ connectorId: "test-tax-v1", sourceId: "parcel-tax-authority", sourceName: "Test county tax", officialAuthority: "County Treasurer", legalBasis: "Official public tax roll", geographicScope: ["Example County, MD"], parserVersion: "1.0.0", sourceUrl: "https://example.gov/tax", registeredAt: "2026-07-24T21:00:00Z", status: "pending" }, async () => [{ parcelId: "p-1", authority: "County Treasurer", jurisdiction: "Example County, MD", reference: "2026 tax card", retrievedAt: "2026-07-24T00:00:00Z", asOf: "2026-07-24", replayRef: "replay:tax:p1", currentAnnualTax: 4200, transferContinuityVerified: false }]);
decideOfficialEvidenceConnector({ sourceId: "parcel-tax-authority", decision: "APPROVE", reviewerId: "test-reviewer", reviewerName: "Test Reviewer", reason: "Exact connector implementation reviewed.", decidedAt: "2026-07-24T21:30:00Z" });
const first = await refreshOfficialEvidenceSources(new Date("2026-07-24T22:00:00Z"));
const stored = readOfficialEvidenceRefreshState<any>("parcel-tax-authority");
assert(first.find(x => x.sourceId === "parcel-tax-authority")?.status === "refreshed", "Scheduled refresh must publish changed approved evidence.");
assert(stored?.snapshots.length === 1 && stored.publishedVersion, "Refresh state must persist to durable runtime storage.");
const second = await refreshOfficialEvidenceSources(new Date("2026-07-25T22:00:00Z"));
const reread = readOfficialEvidenceRefreshState<any>("parcel-tax-authority");
assert(second.find(x => x.sourceId === "parcel-tax-authority")?.status === "no-change", "Scheduled rerun must detect unchanged content.");
assert(reread?.snapshots.length === 1 && reread.receipts.length === 2, "No-change must persist a receipt without duplicating the snapshot.");
console.log(JSON.stringify({ ok: true, rule: "OFFICIAL-EVIDENCE-DURABLE-REFRESH-001", stateDir: dir, publishedVersion: reread?.publishedVersion, snapshots: reread?.snapshots.length, receipts: reread?.receipts.map((x:any) => x.status) }, null, 2));
}
main().catch((error) => { console.error(error); process.exit(1); });
