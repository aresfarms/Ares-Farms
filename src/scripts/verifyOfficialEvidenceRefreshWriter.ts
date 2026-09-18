import { writeOfficialEvidenceRefresh } from "@/lib/property/officialEvidenceRefreshWriter";
function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }
const pending = { sourceId: "parcel-tax-authority" as const, status: "pending" as const, staleAfterDays: 45 };
const approved = { ...pending, status: "approved" as const, approvedBy: "reviewer", approvedAt: "2026-07-24" };
const v1 = writeOfficialEvidenceRefresh({ activation: pending, records: [{ parcelId: "p1", tax: 4200 }], attemptedAt: "2026-07-24T22:00:00Z" });
assert(v1.snapshots.length === 1 && v1.publishedVersion === null, "Pending source may version data but cannot publish it.");
const v2 = writeOfficialEvidenceRefresh({ activation: approved, previous: v1, records: [{ parcelId: "p1", tax: 4200 }], attemptedAt: "2026-07-25T22:00:00Z" });
assert(v2.snapshots.length === 1 && v2.receipts.at(-1)?.status === "no-change", "Unchanged content must create a receipt but no duplicate snapshot.");
const v3 = writeOfficialEvidenceRefresh({ activation: approved, previous: v2, records: [{ parcelId: "p1", tax: 4500 }], attemptedAt: "2026-07-26T22:00:00Z" });
assert(v3.snapshots.length === 2 && v3.publishedVersion === v3.snapshots.at(-1)?.sourceVersion, "Approved changed content must publish the new immutable version.");
const failed = writeOfficialEvidenceRefresh({ activation: approved, previous: v3, attemptedAt: "2026-07-27T22:00:00Z", failureReason: "simulated timeout" });
assert(failed.snapshots.length === 2 && failed.publishedVersion === v3.publishedVersion && failed.receipts.at(-1)?.status === "failed", "Failure must preserve last-good publication and append a failure receipt.");
console.log(JSON.stringify({ ok: true, rule: "OFFICIAL-EVIDENCE-REFRESH-WRITER-001", snapshots: failed.snapshots.map(x => x.sourceVersion), receipts: failed.receipts.map(x => x.status), publishedVersion: failed.publishedVersion }, null, 2));
