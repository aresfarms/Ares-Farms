import fs from "node:fs";
import os from "node:os";
import path from "node:path";
function assert(v: unknown, m: string): asserts v { if (!v) throw new Error(m); }
async function main() {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),"furlong-connector-registry-")); process.env.FURLONG_RUNTIME_STATE_DIR=dir;
  const registry=await import("@/lib/property/officialEvidenceConnectorRegistry");
  registry.clearOfficialEvidenceConnectorRegistry();
  registry.registerOfficialEvidenceConnector({connectorId:"tax-a",sourceId:"parcel-tax-authority",sourceName:"County tax",officialAuthority:"County Treasurer",legalBasis:"Official public record",geographicScope:["County, MD"],parserVersion:"1.0.0",sourceUrl:"https://example.gov",registeredAt:"2026-07-24T23:00:00Z",status:"pending"},async()=>[]);
  registry.decideOfficialEvidenceConnector({sourceId:"parcel-tax-authority",decision:"APPROVE",reviewerId:"op-1",reviewerName:"Reviewer",reason:"Authority, scope, parser, and legal basis reviewed.",decidedAt:"2026-07-24T23:10:00Z"});
  assert(registry.getOfficialEvidenceConnectorRegistration("parcel-tax-authority")?.status==="approved","Approval must persist.");
  registry.decideOfficialEvidenceConnector({sourceId:"parcel-tax-authority",decision:"SUSPEND",reviewerId:"op-1",reviewerName:"Reviewer",reason:"Parser drift detected.",decidedAt:"2026-07-25T23:10:00Z"});
  assert(registry.getOfficialEvidenceConnectorRegistration("parcel-tax-authority")?.status==="suspended","Suspension must persist.");
  const receipts=registry.listOfficialEvidenceConnectorReceipts();
  assert(receipts.map(x=>x.decision).join(",")==="REGISTER,APPROVE,SUSPEND","Review history must be append-only and replayable.");
  console.log(JSON.stringify({ok:true,rule:"OFFICIAL-EVIDENCE-CONNECTOR-DURABILITY-001",stateDir:dir,status:"suspended",receipts:receipts.map(x=>x.decision)},null,2));
}
main().catch(e=>{console.error(e);process.exit(1)});
