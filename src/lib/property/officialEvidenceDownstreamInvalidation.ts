import { randomUUID } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import { runtimeStatePath } from "./runtimeStatePath";
import type { OfficialEvidenceSourceId } from "./officialEvidenceSourceGovernance";

export type DownstreamArtifactKind = "property-report" | "top-three" | "tax-scenario" | "qualification-result";
export type DownstreamArtifactStatus = "current" | "stale";
export interface EvidenceDependency { sourceId: OfficialEvidenceSourceId; sourceVersion: string; }
export interface DownstreamArtifactRecord {
  artifactId: string; propertyId: string; kind: DownstreamArtifactKind; status: DownstreamArtifactStatus;
  generatedAt: string; dependencies: EvidenceDependency[]; invalidatedAt?: string | null;
  invalidationReason?: string | null; invalidationReceiptId?: string | null; recomputedAt?: string | null;
}
export interface DownstreamInvalidationReceipt {
  receiptId: string; sourceId: OfficialEvidenceSourceId; sourceVersion: string; quarantineId: string;
  invalidatedAt: string; artifactIds: string[]; reason: string;
}
interface State { artifacts: DownstreamArtifactRecord[]; receipts: DownstreamInvalidationReceipt[]; }
const FILE = runtimeStatePath("official-evidence", "downstream-artifacts.json");
function read(): State { try { return JSON.parse(fs.readFileSync(FILE,"utf8")) as State; } catch { return {artifacts:[],receipts:[]}; } }
function write(state: State): void { fs.mkdirSync(path.dirname(FILE),{recursive:true}); const tmp=`${FILE}.${process.pid}.${Date.now()}.tmp`; fs.writeFileSync(tmp,JSON.stringify(state,null,2)+"\n","utf8"); fs.renameSync(tmp,FILE); }
export function registerDownstreamArtifact(input: Omit<DownstreamArtifactRecord,"status"|"generatedAt"> & { generatedAt?: string }): DownstreamArtifactRecord {
  const state=read(); const artifact:DownstreamArtifactRecord={...input,status:"current",generatedAt:input.generatedAt??new Date().toISOString(),invalidatedAt:null,invalidationReason:null,invalidationReceiptId:null,recomputedAt:null};
  write({artifacts:[...state.artifacts.filter(x=>x.artifactId!==artifact.artifactId),artifact],receipts:state.receipts}); return artifact;
}
export function invalidateArtifactsForQuarantine(input:{sourceId:OfficialEvidenceSourceId;sourceVersion:string;quarantineId:string;reason:string;at?:string}):DownstreamInvalidationReceipt {
  const state=read(); const at=input.at??new Date().toISOString(); const affected=state.artifacts.filter(a=>a.dependencies.some(d=>d.sourceId===input.sourceId&&d.sourceVersion===input.sourceVersion));
  const existing=state.receipts.find(r=>r.quarantineId===input.quarantineId); if(existing) return existing;
  const receipt:DownstreamInvalidationReceipt={receiptId:randomUUID(),sourceId:input.sourceId,sourceVersion:input.sourceVersion,quarantineId:input.quarantineId,invalidatedAt:at,artifactIds:affected.map(a=>a.artifactId),reason:input.reason};
  const artifacts=state.artifacts.map(a=>receipt.artifactIds.includes(a.artifactId)?{...a,status:"stale" as const,invalidatedAt:at,invalidationReason:input.reason,invalidationReceiptId:receipt.receiptId}:a);
  write({artifacts,receipts:[...state.receipts,receipt]}); return receipt;
}
export function recomputeDownstreamArtifact(input:{artifactId:string;dependencies:EvidenceDependency[];at?:string}):DownstreamArtifactRecord {
  const state=read(); const current=state.artifacts.find(a=>a.artifactId===input.artifactId); if(!current) throw new Error("Downstream artifact not found.");
  const next:DownstreamArtifactRecord={...current,status:"current",dependencies:input.dependencies,generatedAt:input.at??new Date().toISOString(),recomputedAt:input.at??new Date().toISOString(),invalidatedAt:null,invalidationReason:null,invalidationReceiptId:null};
  write({artifacts:state.artifacts.map(a=>a.artifactId===next.artifactId?next:a),receipts:state.receipts}); return next;
}
export function readDownstreamArtifactForServe(artifactId:string):DownstreamArtifactRecord {
  const artifact=read().artifacts.find(a=>a.artifactId===artifactId); if(!artifact) throw new Error("Downstream artifact not found.");
  if(artifact.status!=="current") throw new Error("Downstream artifact is stale and must be recomputed before serving."); return artifact;
}
export function listDownstreamArtifacts():DownstreamArtifactRecord[]{ return read().artifacts; }
export function listDownstreamInvalidationReceipts():DownstreamInvalidationReceipt[]{ return read().receipts; }
