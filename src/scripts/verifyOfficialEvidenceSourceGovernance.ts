import { resolveOfficialEvidenceSource, type OfficialEvidenceSnapshot } from "@/lib/property/officialEvidenceSourceGovernance";

function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }
type Row = { parcelId: string; value: number };
const snapshots: OfficialEvidenceSnapshot<Row>[] = [
  {
    sourceId: "parcel-tax-authority", sourceVersion: "v1", retrievedAt: "2026-06-01T00:00:00Z", contentHash: "hash-v1", records: [{ parcelId: "p-1", value: 4000 }],
    receipt: { receiptId: "r1", sourceId: "parcel-tax-authority", attemptedAt: "2026-06-01T00:00:00Z", status: "refreshed", recordCount: 1, sourceVersion: "v1", reason: "initial", replayRef: "replay:v1" },
  },
  {
    sourceId: "parcel-tax-authority", sourceVersion: "v2", retrievedAt: "2026-07-20T00:00:00Z", contentHash: "hash-v2", records: [{ parcelId: "p-1", value: 4200 }],
    receipt: { receiptId: "r2", sourceId: "parcel-tax-authority", attemptedAt: "2026-07-20T00:00:00Z", status: "refreshed", recordCount: 1, sourceVersion: "v2", previousVersion: "v1", reason: "updated", replayRef: "replay:v2" },
  },
];
const pending = resolveOfficialEvidenceSource({ activation: { sourceId: "parcel-tax-authority", status: "pending", staleAfterDays: 45 }, snapshots, now: new Date("2026-07-24T00:00:00Z") });
assert(!pending.relianceAllowed && pending.records.length === 0, "Pending source must fail closed.");
const fresh = resolveOfficialEvidenceSource({ activation: { sourceId: "parcel-tax-authority", status: "approved", approvedBy: "reviewer", approvedAt: "2026-07-21", staleAfterDays: 45 }, snapshots, now: new Date("2026-07-24T00:00:00Z") });
assert(fresh.relianceAllowed && fresh.records[0]?.value === 4200, "Approved source must serve latest fresh last-good snapshot.");
assert(fresh.versionHistory.join(",") === "v1,v2" && fresh.refreshReceipts.length === 2, "Version and receipt history must remain replayable.");
const stale = resolveOfficialEvidenceSource({ activation: { sourceId: "parcel-tax-authority", status: "approved", staleAfterDays: 30 }, snapshots, now: new Date("2026-09-30T00:00:00Z") });
assert(!stale.relianceAllowed && stale.freshness === "stale" && stale.records.length === 0, "Stale records must be blocked from reliance.");
assert(stale.lastGoodSnapshot?.sourceVersion === "v2", "Stale last-good must remain available for audit and replay.");
console.log(JSON.stringify({ ok: true, rule: "OFFICIAL-EVIDENCE-SOURCE-GOVERNANCE-001", pending: pending.freshness, fresh: fresh.lastGoodSnapshot?.sourceVersion, stale: stale.reason, receipts: fresh.refreshReceipts.map((x) => x.receiptId) }, null, 2));
