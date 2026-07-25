import fs from "node:fs";
import os from "node:os";
import path from "node:path";
function assert(v: unknown, m: string): asserts v { if (!v) throw new Error(m); }
async function main() {
  process.env.FURLONG_RUNTIME_STATE_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "furlong-evidence-quarantine-"));
  const { verifiedSnapshotsForRead } = await import("@/lib/property/officialEvidenceReadVerification");
  const { readOfficialEvidenceQuarantine } = await import("@/lib/property/officialEvidenceQuarantineStore");
  const snapshot:any={sourceId:"parcel-tax-authority",sourceVersion:"v1",retrievedAt:"2026-07-25T00:00:00Z",contentHash:"bad",records:[{parcelId:"p1"}],receipt:{receiptId:"r1",sourceId:"parcel-tax-authority",attemptedAt:"2026-07-25T00:00:00Z",status:"refreshed",recordCount:1,sourceVersion:"v1",reason:"test",replayRef:"replay:r1",connectorId:"tax-v1",parserVersion:"1.0.0",implementationHash:"a".repeat(64),approvalReceiptId:"missing"}};
  assert(verifiedSnapshotsForRead("parcel-tax-authority",[snapshot]).length===0,"Invalid snapshot must be withheld.");
  assert(verifiedSnapshotsForRead("parcel-tax-authority",[snapshot]).length===0,"Repeated reads must remain withheld.");
  const records=readOfficialEvidenceQuarantine();
  assert(records.length===1,"Repeated identical failures must deduplicate to one quarantine record.");
  assert(records[0].reasons.includes("content-hash-mismatch") && records[0].reasons.includes("approval-receipt-missing"),"Quarantine must preserve exact failure reasons.");
  console.log(JSON.stringify({ok:true,rule:"OFFICIAL-EVIDENCE-QUARANTINE-001",records:records.length,reasons:records[0].reasons},null,2));
}
main().catch(e=>{console.error(e);process.exit(1)});
