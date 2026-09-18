import fs from "node:fs";
import os from "node:os";
import path from "node:path";
function assert(v:unknown,m:string):asserts v{if(!v)throw new Error(m)}
async function main(){
 process.env.FURLONG_RUNTIME_STATE_DIR=fs.mkdtempSync(path.join(os.tmpdir(),"furlong-downstream-invalidation-"));
 const downstream=await import("@/lib/property/officialEvidenceDownstreamInvalidation");
 const quarantine=await import("@/lib/property/officialEvidenceQuarantineStore");
 const dep={sourceId:"parcel-tax-authority" as const,sourceVersion:"tax-v1"};
 for(const kind of ["property-report","top-three","tax-scenario","qualification-result"] as const) downstream.registerDownstreamArtifact({artifactId:`a-${kind}`,propertyId:"property-1",kind,dependencies:[dep]});
 quarantine.recordOfficialEvidenceQuarantine({sourceId:dep.sourceId,sourceVersion:dep.sourceVersion,reasons:["content-hash-mismatch"],receiptId:"r1",connectorId:"c1",parserVersion:"1",implementationHash:"a".repeat(64),detectedAt:"2026-07-25T15:00:00Z"});
 const artifacts=downstream.listDownstreamArtifacts(); assert(artifacts.every(a=>a.status==="stale"),"Every dependent artifact must become stale.");
 let blocked=0; for(const a of artifacts){try{downstream.readDownstreamArtifactForServe(a.artifactId)}catch{blocked++}} assert(blocked===4,"All stale artifact types must be blocked from serving.");
 downstream.recomputeDownstreamArtifact({artifactId:"a-property-report",dependencies:[{...dep,sourceVersion:"tax-v2"}],at:"2026-07-25T16:00:00Z"});
 assert(downstream.readDownstreamArtifactForServe("a-property-report").status==="current","Recomputed artifact may be served.");
 assert(downstream.listDownstreamInvalidationReceipts().length===1,"Quarantine must create one durable invalidation receipt.");
 console.log(JSON.stringify({ok:true,rule:"OFFICIAL-EVIDENCE-DOWNSTREAM-INVALIDATION-001",stale:artifacts.length,blocked,recomputed:"a-property-report"},null,2));
}
main().catch(e=>{console.error(e);process.exit(1)});
