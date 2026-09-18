import { randomUUID } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import { runtimeStatePath } from "./runtimeStatePath";
import { buildPostSaleTaxScenario } from "./ownershipCostModel";
import { buildPropertyBriefIntelligence } from "./propertyBriefIntelligence";
import { buildScenarioRankingPlan } from "@/lib/intelligence/scenarioRankingPlan";
import { evaluateFinancingIntake } from "@/lib/financing/intakeRuntime";
import { hashReplayValue, replayPacketForArtifact, verifySignedReplayPacket } from "./officialEvidenceReplayPacketStore";
import type { DownstreamArtifactKind } from "./officialEvidenceDownstreamInvalidation";

export interface ReplayAttestation {
  attestationId:string; artifactId:string; kind:DownstreamArtifactKind; packetId:string;
  handlerId:string; implementationHash:string; executedAt:string; inputHash:string;
  expectedOutputHash:string; actualOutputHash:string; matched:boolean; reasons:string[];
}
const FILE=runtimeStatePath("official-evidence","replay-attestations.json");
const read=():ReplayAttestation[]=>{try{return JSON.parse(fs.readFileSync(FILE,"utf8")) as ReplayAttestation[]}catch{return []}};
const write=(rows:ReplayAttestation[])=>{fs.mkdirSync(path.dirname(FILE),{recursive:true});const tmp=`${FILE}.${process.pid}.${Date.now()}.tmp`;fs.writeFileSync(tmp,JSON.stringify(rows,null,2)+"\n");fs.renameSync(tmp,FILE)};

export function executeReplayBuilder(kind:DownstreamArtifactKind,input:any,capturedAt:string):unknown {
  if(kind==="tax-scenario") return buildPostSaleTaxScenario({price:input.price,sellerCurrentAnnualTax:input.sellerCurrentAnnualTax,currentTaxTransfersUnchanged:input.currentTaxTransfersUnchanged},input.ownershipContext);
  if(kind==="top-three") return buildScenarioRankingPlan(input);
  if(kind==="property-report") return buildPropertyBriefIntelligence(input);
  const result=evaluateFinancingIntake(input);
  return {...result,generatedAt:capturedAt};
}
export function attestDeterministicReplay(input:{artifactId:string;handlerId:string;implementationHash:string;at?:string}):ReplayAttestation {
  const packet=replayPacketForArtifact(input.artifactId); if(!packet) throw new Error("Signed replay packet not found.");
  const verification=verifySignedReplayPacket(packet); const reasons=[...verification.reasons];
  let actualOutputHash="";
  if(verification.valid){try{actualOutputHash=hashReplayValue(executeReplayBuilder(packet.kind,packet.input,packet.capturedAt));if(actualOutputHash!==packet.outputHash)reasons.push("replayed-output-hash-mismatch");}catch(error){reasons.push(`replay-execution-failed:${(error as Error).message}`)}}
  const row:ReplayAttestation={attestationId:randomUUID(),artifactId:packet.artifactId,kind:packet.kind,packetId:packet.packetId,handlerId:input.handlerId,implementationHash:input.implementationHash,executedAt:input.at??new Date().toISOString(),inputHash:packet.inputHash,expectedOutputHash:packet.outputHash,actualOutputHash,matched:reasons.length===0,reasons};
  write([...read(),row]); return row;
}
export function latestSuccessfulReplayAttestation(kind:DownstreamArtifactKind,handlerId:string,implementationHash:string):ReplayAttestation|null{return read().filter(x=>x.kind===kind&&x.handlerId===handlerId&&x.implementationHash===implementationHash&&x.matched).at(-1)??null;}
export function listReplayAttestations():ReplayAttestation[]{return read();}
