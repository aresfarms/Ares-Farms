import fs from "node:fs";
import os from "node:os";
import path from "node:path";
function assert(v: unknown, m: string): asserts v { if (!v) throw new Error(m); }
async function main() {
  process.env.FURLONG_RUNTIME_STATE_DIR=fs.mkdtempSync(path.join(os.tmpdir(),"furlong-connector-hash-"));
  const r=await import("@/lib/property/officialEvidenceConnectorRegistry");
  r.clearOfficialEvidenceConnectorRegistry();
  const base={connectorId:"tax-hash",sourceId:"parcel-tax-authority" as const,sourceName:"County tax",officialAuthority:"County Treasurer",legalBasis:"Official public record",geographicScope:["County, MD"],parserVersion:"1.0.0",sourceUrl:"https://example.gov",registeredAt:"2026-07-24T23:00:00Z",status:"pending" as const};
  const fetchV1=async()=>[{parcelId:"p1",value:1}];
  r.registerOfficialEvidenceConnector(base,fetchV1 as any);
  const first=r.getOfficialEvidenceConnectorRegistration("parcel-tax-authority")!;
  assert(first.implementationHash?.length===64,"Registration must bind a SHA-256 implementation hash.");
  r.decideOfficialEvidenceConnector({sourceId:"parcel-tax-authority",decision:"APPROVE",reviewerId:"op",reviewerName:"Reviewer",reason:"Reviewed exact implementation.",decidedAt:"2026-07-24T23:10:00Z"});
  assert(r.resolveApprovedOfficialEvidenceConnector("parcel-tax-authority")!==null,"Reviewed implementation must execute.");
  const fetchV2=async()=>[{parcelId:"p1",value:2}];
  r.registerOfficialEvidenceConnector({...base,registeredAt:"2026-07-25T23:00:00Z",status:"approved",reviewedBy:"op",reviewedAt:"2026-07-24T23:10:00Z"},fetchV2 as any);
  const changed=r.getOfficialEvidenceConnectorRegistration("parcel-tax-authority")!;
  assert(changed.status==="pending"&&changed.implementationHash!==first.implementationHash,"Changed code with unchanged metadata must reset approval.");
  assert(r.resolveApprovedOfficialEvidenceConnector("parcel-tax-authority")===null,"Changed implementation must not execute before fresh review.");
  console.log(JSON.stringify({ok:true,rule:"OFFICIAL-EVIDENCE-CONNECTOR-IMPLEMENTATION-BINDING-001",firstHash:first.implementationHash,changedHash:changed.implementationHash,status:changed.status},null,2));
}
main().catch(e=>{console.error(e);process.exit(1)});
