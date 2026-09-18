import { randomUUID } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import { runtimeStatePath } from "./runtimeStatePath";
import { attestDeterministicReplay } from "./officialEvidenceReplayExecutor";
import { listEvidenceReplayPackets } from "./officialEvidenceReplayPacketStore";
import { latestGovernedRecomputationHandler } from "./officialEvidenceRecomputationHandlerRegistry";
import type { DownstreamArtifactKind } from "./officialEvidenceDownstreamInvalidation";

export interface BatchReplayResult { kind:DownstreamArtifactKind; artifactId:string; attestationId:string; matched:boolean; reasons:string[]; }
export interface BatchReplayReceipt { receiptId:string; actorId:string; actorName:string; at:string; reason:string; results:BatchReplayResult[]; allMatched:boolean; }
const FILE=runtimeStatePath("official-evidence","batch-replay-verification.json");
const read=():BatchReplayReceipt[]=>{try{return JSON.parse(fs.readFileSync(FILE,"utf8")) as BatchReplayReceipt[]}catch{return []}};
const write=(rows:BatchReplayReceipt[])=>{fs.mkdirSync(path.dirname(FILE),{recursive:true});const tmp=`${FILE}.${process.pid}.${Date.now()}.tmp`;fs.writeFileSync(tmp,JSON.stringify(rows,null,2)+"\n");fs.renameSync(tmp,FILE)};

export function runGovernedBatchReplayVerification(input:{actorId:string;actorName:string;reason:string;at?:string}):BatchReplayReceipt{
 if(!input.actorId.trim()||!input.actorName.trim()||!input.reason.trim())throw new Error("Batch replay verification requires an attributed actor and reason.");
 const packets=listEvidenceReplayPackets().filter(p=>p.artifactId.startsWith("live-review:"));
 const byKind=new Map<DownstreamArtifactKind,typeof packets[number]>();
 for(const packet of packets)byKind.set(packet.kind,packet);
 const kinds:DownstreamArtifactKind[]=["tax-scenario","top-three","qualification-result","property-report"];
 const results:BatchReplayResult[]=[];
 for(const kind of kinds){const packet=byKind.get(kind);if(!packet)throw new Error(`Live replay packet is missing for ${kind}.`);const registration=latestGovernedRecomputationHandler(kind);if(!registration)throw new Error(`Production handler registration is missing for ${kind}.`);const attestation=attestDeterministicReplay({artifactId:packet.artifactId,handlerId:registration.handlerId,implementationHash:registration.implementationHash,at:input.at});results.push({kind,artifactId:packet.artifactId,attestationId:attestation.attestationId,matched:attestation.matched,reasons:attestation.reasons});}
 const receipt:BatchReplayReceipt={receiptId:randomUUID(),actorId:input.actorId,actorName:input.actorName,at:input.at??new Date().toISOString(),reason:input.reason,results,allMatched:results.every(r=>r.matched)};write([...read(),receipt]);return receipt;
}
export function listBatchReplayReceipts():BatchReplayReceipt[]{return read();}
