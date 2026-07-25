import fs from "node:fs";import os from "node:os";import path from "node:path";
function ok(v:unknown,m:string):asserts v{if(!v)throw new Error(m)}
async function main(){process.env.FURLONG_RUNTIME_STATE_DIR=fs.mkdtempSync(path.join(os.tmpdir(),"furlong-recompute-"));
 const inv=await import("@/lib/property/officialEvidenceDownstreamInvalidation"); const store=await import("@/lib/property/officialEvidenceRuntimeStore"); const orch=await import("@/lib/property/officialEvidenceRecomputationOrchestrator");
 store.writeOfficialEvidenceRefreshState({sourceId:"parcel-tax-authority",snapshots:[],receipts:[],publishedVersion:"tax-v2"}); store.writeOfficialEvidenceRefreshState({sourceId:"well-permit-authority",snapshots:[],receipts:[],publishedVersion:"well-v2"});
 for(const kind of ["property-report","qualification-result","top-three","tax-scenario"] as const) inv.registerDownstreamArtifact({artifactId:`p1-${kind}`,propertyId:"p1",kind,dependencies:[{sourceId:"parcel-tax-authority",sourceVersion:"tax-v1"}]});
 inv.invalidateArtifactsForQuarantine({sourceId:"parcel-tax-authority",sourceVersion:"tax-v1",quarantineId:"q1",reason:"tampered"}); orch.enqueueStaleEvidenceArtifacts("p1","2026-07-25T16:00:00Z");
 let blocked=false;try{orch.assertPropertyEvidenceChainCurrent("p1")}catch{blocked=true}ok(blocked,"Whole property chain must remain blocked before recomputation.");
 const calls:string[]=[]; const handlers:any={"tax-scenario":()=>calls.push("tax-scenario"),"top-three":()=>calls.push("top-three"),"qualification-result":()=>calls.push("qualification-result"),"property-report":()=>calls.push("property-report")};
 const jobs=await orch.processEvidenceRecomputationQueue(handlers,()=>"2026-07-25T16:05:00Z"); ok(jobs.every(j=>j.status==="completed"),"Every queued artifact must complete."); ok(calls.join(",")==="tax-scenario,top-three,qualification-result,property-report","Artifacts must recompute in dependency order.");
 const current=orch.assertPropertyEvidenceChainCurrent("p1"); ok(current.every(a=>a.dependencies.some(d=>d.sourceVersion==="tax-v2")),"Recomputed artifacts must bind current evidence versions.");
 console.log(JSON.stringify({ok:true,rule:"OFFICIAL-EVIDENCE-RECOMPUTATION-ORCHESTRATION-001",order:calls,current:current.length},null,2));}
main().catch(e=>{console.error(e);process.exit(1)});
