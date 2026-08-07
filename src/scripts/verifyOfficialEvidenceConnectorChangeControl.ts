import fs from "node:fs";
import os from "node:os";
import path from "node:path";
function assert(v: unknown, m: string): asserts v { if (!v) throw new Error(m); }
async function main() {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),"furlong-connector-change-")); process.env.FURLONG_RUNTIME_STATE_DIR=dir;
  const r=await import("@/lib/property/officialEvidenceConnectorRegistry"); r.clearOfficialEvidenceConnectorRegistry();
  const base={connectorId:"tax-a",sourceId:"parcel-tax-authority" as const,sourceName:"County tax",officialAuthority:"County Treasurer",legalBasis:"Official public record",geographicScope:["County, MD"],parserVersion:"1.0.0",sourceUrl:"https://example.gov/v1",registeredAt:"2026-07-24T23:00:00Z",status:"pending" as const};
  r.registerOfficialEvidenceConnector(base,async()=>[]);
  r.decideOfficialEvidenceConnector({sourceId:"parcel-tax-authority",decision:"APPROVE",reviewerId:"op-1",reviewerName:"Reviewer",reason:"Reviewed.",decidedAt:"2026-07-24T23:10:00Z"});
  assert(r.resolveApprovedOfficialEvidenceConnector("parcel-tax-authority")!==null,"Approved original connector must execute.");
  r.registerOfficialEvidenceConnector({...base,parserVersion:"2.0.0",sourceUrl:"https://example.gov/v2",registeredAt:"2026-07-25T23:00:00Z",status:"approved",reviewedBy:"op-1",reviewedAt:"2026-07-25T23:01:00Z"},async()=>[]);
  const changed=r.getOfficialEvidenceConnectorRegistration("parcel-tax-authority");
  assert(changed?.status==="pending","Material change must reset connector to pending regardless of supplied approval fields.");
  assert(changed?.reviewedBy==null && r.resolveApprovedOfficialEvidenceConnector("parcel-tax-authority")===null,"Changed implementation must lose execution authority until re-reviewed.");
  const receipts=r.listOfficialEvidenceConnectorReceipts();
  assert(receipts.at(-1)?.decision==="CHANGE_REVIEW_REQUIRED","Change-control receipt must be durable and explicit.");
  r.decideOfficialEvidenceConnector({sourceId:"parcel-tax-authority",decision:"APPROVE",reviewerId:"op-2",reviewerName:"Second Reviewer",reason:"Parser v2 and changed endpoint reviewed.",decidedAt:"2026-07-25T23:15:00Z"});
  assert(r.resolveApprovedOfficialEvidenceConnector("parcel-tax-authority")?.registration.parserVersion==="2.0.0","Fresh review must authorize only the changed version.");
  console.log(JSON.stringify({ok:true,rule:"OFFICIAL-EVIDENCE-CONNECTOR-CHANGE-CONTROL-001",statusAfterChange:changed?.status,receipts:receipts.map(x=>x.decision),approvedVersion:"2.0.0"},null,2));
}
main().catch(e=>{console.error(e);process.exit(1)});
