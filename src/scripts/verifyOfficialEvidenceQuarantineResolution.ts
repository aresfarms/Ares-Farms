import fs from "node:fs"; import os from "node:os"; import path from "node:path";
function assert(v:unknown,m:string):asserts v{if(!v)throw new Error(m)}
async function main(){ process.env.FURLONG_RUNTIME_STATE_DIR=fs.mkdtempSync(path.join(os.tmpdir(),"furlong-quarantine-resolution-"));
 const q=await import("@/lib/property/officialEvidenceQuarantineStore"); const r=await import("@/lib/property/officialEvidenceQuarantineResolution");
 const record=q.recordOfficialEvidenceQuarantine({sourceId:"parcel-tax-authority",sourceVersion:"missing-v1",reasons:["content-hash-mismatch"],receiptId:"r1",connectorId:"tax-v1",parserVersion:"1.0.0",implementationHash:"a".repeat(64)});
 r.decideEvidenceQuarantine({quarantineId:record.quarantineId,decision:"ACKNOWLEDGE",actorId:"op1",actorName:"Reviewer",reason:"Investigating source integrity."});
 r.decideEvidenceQuarantine({quarantineId:record.quarantineId,decision:"REMEDIATION",actorId:"op1",actorName:"Reviewer",reason:"Connector approval and source snapshot must be repaired."});
 const failed=r.decideEvidenceQuarantine({quarantineId:record.quarantineId,decision:"REVERIFY",actorId:"op1",actorName:"Reviewer",reason:"Attempt independent reverification."});
 assert(failed.status==="remediation-pending","Failed reverification must not release evidence."); assert(failed.events.at(-1)?.action==="REVERIFY_FAILED","Failure receipt must be appended.");
 let overrideBlocked=false; try{r.decideEvidenceQuarantine({quarantineId:record.quarantineId,decision:"RELEASE" as any,actorId:"op1",actorName:"Reviewer",reason:"manual override"})}catch{overrideBlocked=true} assert(overrideBlocked,"Manual release must be impossible.");
 console.log(JSON.stringify({ok:true,rule:"OFFICIAL-EVIDENCE-QUARANTINE-RESOLUTION-001",status:failed.status,events:failed.events.map(x=>x.action),manualOverrideBlocked:overrideBlocked},null,2)); }
main().catch(e=>{console.error(e);process.exit(1)});
