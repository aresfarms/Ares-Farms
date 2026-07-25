import fs from "node:fs";
import os from "node:os";
import path from "node:path";
function ok(v:unknown,m:string):asserts v{if(!v)throw new Error(m)}
async function main(){
 process.env.FURLONG_RUNTIME_STATE_DIR=fs.mkdtempSync(path.join(os.tmpdir(),"furlong-scheduled-recompute-"));
 process.env.EVIDENCE_RECOMPUTATION_CRON_SECRET="scheduled-secret";
 process.env.EVIDENCE_REPLAY_SIGNING_SECRET="scheduled-replay-secret";
 const inv=await import("@/lib/property/officialEvidenceDownstreamInvalidation");
 const store=await import("@/lib/property/officialEvidenceRuntimeStore");
 const registry=await import("@/lib/property/officialEvidenceRecomputationHandlerRegistry");
 const packets=await import("@/lib/property/officialEvidenceReplayPacketStore");
 const replay=await import("@/lib/property/officialEvidenceReplayExecutor");
 const tax=await import("@/lib/property/ownershipCostModel");
 const {POST}=await import("@/app/api/internal/evidence-recomputation/route");
 store.writeOfficialEvidenceRefreshState({sourceId:"parcel-tax-authority",snapshots:[],receipts:[],publishedVersion:"tax-v9"});
 store.writeOfficialEvidenceRefreshState({sourceId:"well-permit-authority",snapshots:[],receipts:[],publishedVersion:"well-v4"});
 inv.registerDownstreamArtifact({artifactId:"p2-tax",propertyId:"p2",kind:"tax-scenario",dependencies:[{sourceId:"parcel-tax-authority",sourceVersion:"tax-v8"}]});
 inv.invalidateArtifactsForQuarantine({sourceId:"parcel-tax-authority",sourceVersion:"tax-v8",quarantineId:"q2",reason:"invalid"});
 let placeholderBlocked=false;try{registry.registerGovernedRecomputationHandler({handlerId:"mock-tax",kind:"tax-scenario",sourcePath:"mock.ts",status:"approved",reviewedBy:"r1",reviewedAt:"2026-07-25T16:00:00Z",reviewReason:"test"},()=>({artifactHash:"a".repeat(64),dependencies:[],generatedAt:new Date().toISOString(),productionEvidence:true}))}catch{placeholderBlocked=true}
 ok(placeholderBlocked,"Placeholder handler registration must be blocked.");
 const deps=[{sourceId:"parcel-tax-authority" as const,sourceVersion:"tax-v9"},{sourceId:"well-permit-authority" as const,sourceVersion:"well-v4"}];
 const handler=()=>({artifactHash:"b".repeat(64),dependencies:deps,generatedAt:"2026-07-25T16:10:00Z",productionEvidence:true as const});
 const registration=registry.registerGovernedRecomputationHandler({handlerId:"ownership-tax-recompute-v1",kind:"tax-scenario",sourcePath:"src/lib/property/ownershipCostModel.ts",status:"pending"},handler);
 const replayInput={price:180000,sellerCurrentAnnualTax:900,currentTaxTransfersUnchanged:false,ownershipContext:{rates:{weekOf:"2026-07-23",rate30:6.1,rate15:null},taxContext:null,electricity:null,hpi:null}};
 const replayOutput=tax.buildPostSaleTaxScenario({price:180000,sellerCurrentAnnualTax:900,currentTaxTransfersUnchanged:false},replayInput.ownershipContext as any);
 packets.preserveSignedReplayPacket({artifactId:"scheduled-tax-proof",propertyId:"p2",kind:"tax-scenario",dependencies:deps,replayInput,replayOutput,capturedAt:"2026-07-25T15:59:00Z"});
 replay.attestDeterministicReplay({artifactId:"scheduled-tax-proof",handlerId:registration.handlerId,implementationHash:registration.implementationHash,at:"2026-07-25T15:59:30Z"});
 registry.decideGovernedRecomputationHandler({kind:"tax-scenario",decision:"APPROVE",reviewerId:"source-legal-reviewer",reviewerName:"Source Legal Reviewer",reason:"Exact governed calculation path reviewed.",at:"2026-07-25T16:00:00Z"});
 const unauthorized=await POST(new Request("http://localhost/api/internal/evidence-recomputation",{method:"POST",body:"{}"})); ok(unauthorized.status===401,"Scheduled endpoint must reject unauthenticated requests.");
 const response=await POST(new Request("http://localhost/api/internal/evidence-recomputation",{method:"POST",headers:{authorization:"Bearer scheduled-secret","content-type":"application/json"},body:JSON.stringify({propertyId:"p2"})}));
 const body:any=await response.json(); ok(response.status===200&&body.ok,"Authenticated scheduled execution must run.");
 ok(inv.readDownstreamArtifactForServe("p2-tax").status==="current","Approved production handler must restore current status.");
 console.log(JSON.stringify({ok:true,rule:"OFFICIAL-EVIDENCE-SCHEDULED-RECOMPUTATION-001",unauthorized:unauthorized.status,placeholderBlocked,jobs:body.jobs.map((x:any)=>x.status)},null,2));
}
main().catch(e=>{console.error(e);process.exit(1)});
