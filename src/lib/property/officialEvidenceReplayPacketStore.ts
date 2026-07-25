import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import { runtimeStatePath } from "./runtimeStatePath";
import type { DownstreamArtifactKind, EvidenceDependency } from "./officialEvidenceDownstreamInvalidation";

export interface EvidenceReplayPacket { packetId:string; artifactId:string; propertyId:string; kind:DownstreamArtifactKind; capturedAt:string; dependencies:EvidenceDependency[]; input:unknown; inputHash:string; outputHash:string; signature:string; signatureAlgorithm:"hmac-sha256"; keyId:string; }
const FILE=runtimeStatePath("official-evidence","artifact-replay-packets.json");
const canonical=(value:unknown):string=>{ if(value===null||typeof value!=="object") return JSON.stringify(value); if(Array.isArray(value)) return `[${value.map(canonical).join(",")}]`; const obj=value as Record<string,unknown>; return `{${Object.keys(obj).sort().map(k=>`${JSON.stringify(k)}:${canonical(obj[k])}`).join(",")}}`; };
export const hashReplayValue=(value:unknown)=>createHash("sha256").update(canonical(value)).digest("hex");
const secret=()=>{const value=process.env.EVIDENCE_REPLAY_SIGNING_SECRET?.trim();if(!value)throw new Error("EVIDENCE_REPLAY_SIGNING_SECRET is required to preserve signed replay packets.");return value;};
const material=(p:Omit<EvidenceReplayPacket,"signature">)=>canonical(p);
const read=():EvidenceReplayPacket[]=>{try{return JSON.parse(fs.readFileSync(FILE,"utf8")) as EvidenceReplayPacket[]}catch{return []}};
const write=(packets:EvidenceReplayPacket[])=>{fs.mkdirSync(path.dirname(FILE),{recursive:true});const tmp=`${FILE}.${process.pid}.${Date.now()}.tmp`;fs.writeFileSync(tmp,JSON.stringify(packets,null,2)+"\n");fs.renameSync(tmp,FILE);};
export function preserveSignedReplayPacket(input:{artifactId:string;propertyId:string;kind:DownstreamArtifactKind;dependencies:EvidenceDependency[];replayInput:unknown;replayOutput:unknown;capturedAt?:string;keyId?:string}):EvidenceReplayPacket { const unsigned:Omit<EvidenceReplayPacket,"signature">={packetId:randomUUID(),artifactId:input.artifactId,propertyId:input.propertyId,kind:input.kind,capturedAt:input.capturedAt??new Date().toISOString(),dependencies:input.dependencies,input:input.replayInput,inputHash:hashReplayValue(input.replayInput),outputHash:hashReplayValue(input.replayOutput),signatureAlgorithm:"hmac-sha256",keyId:input.keyId??"evidence-replay-v1"}; const signature=createHmac("sha256",secret()).update(material(unsigned)).digest("hex"); const packet={...unsigned,signature}; const packets=read(); write([...packets.filter(p=>p.artifactId!==packet.artifactId),packet]); return packet; }
export function verifySignedReplayPacket(packet:EvidenceReplayPacket):{valid:boolean;reasons:string[]} { const reasons:string[]=[]; if(hashReplayValue(packet.input)!==packet.inputHash)reasons.push("replay-input-hash-mismatch"); const {signature,...unsigned}=packet; const expected=createHmac("sha256",secret()).update(material(unsigned)).digest("hex"); const left=Buffer.from(signature,"hex"),right=Buffer.from(expected,"hex"); if(left.length!==right.length||!timingSafeEqual(left,right))reasons.push("replay-signature-mismatch"); return {valid:reasons.length===0,reasons}; }
export function replayPacketForArtifact(artifactId:string):EvidenceReplayPacket|null{return read().find(p=>p.artifactId===artifactId)??null;}
export function listEvidenceReplayPackets():EvidenceReplayPacket[]{return read();}
