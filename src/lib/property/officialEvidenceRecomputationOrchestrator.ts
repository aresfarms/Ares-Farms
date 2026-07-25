import { randomUUID } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import { runtimeStatePath } from "./runtimeStatePath";
import { currentOfficialEvidenceDependencies } from "./officialEvidenceGenerationCapture";
import { listDownstreamArtifacts, recomputeDownstreamArtifact, readDownstreamArtifactForServe, type DownstreamArtifactKind, type DownstreamArtifactRecord } from "./officialEvidenceDownstreamInvalidation";

export type RecomputationJobStatus = "queued" | "running" | "completed" | "failed" | "blocked";
export interface RecomputationJob { jobId:string; artifactId:string; propertyId:string; kind:DownstreamArtifactKind; order:number; status:RecomputationJobStatus; queuedAt:string; startedAt?:string|null; finishedAt?:string|null; reason:string; attemptCount:number; }
interface QueueState { jobs: RecomputationJob[]; }
const FILE=runtimeStatePath("official-evidence","recomputation-queue.json");
const ORDER:Record<DownstreamArtifactKind,number>={"tax-scenario":10,"top-three":20,"qualification-result":30,"property-report":40};
const read=():QueueState=>{try{return JSON.parse(fs.readFileSync(FILE,"utf8")) as QueueState}catch{return {jobs:[]}}};
const write=(state:QueueState)=>{fs.mkdirSync(path.dirname(FILE),{recursive:true});const tmp=`${FILE}.${process.pid}.${Date.now()}.tmp`;fs.writeFileSync(tmp,JSON.stringify(state,null,2)+"\n");fs.renameSync(tmp,FILE)};
export function enqueueStaleEvidenceArtifacts(propertyId?:string,at=new Date().toISOString()):RecomputationJob[]{
 const state=read(); const stale=listDownstreamArtifacts().filter(a=>a.status==="stale"&&(!propertyId||a.propertyId===propertyId));
 const added=stale.filter(a=>!state.jobs.some(j=>j.artifactId===a.artifactId&&["queued","running","blocked"].includes(j.status))).map(a=>({jobId:randomUUID(),artifactId:a.artifactId,propertyId:a.propertyId,kind:a.kind,order:ORDER[a.kind],status:"queued" as const,queuedAt:at,reason:"Artifact invalidated by quarantined official evidence.",attemptCount:0}));
 const jobs=[...state.jobs,...added].sort((a,b)=>a.order-b.order||a.queuedAt.localeCompare(b.queuedAt)); write({jobs}); return added;
}
import type { GovernedRecomputationHandler } from "./officialEvidenceRecomputationHandlerRegistry";
export type RecomputationHandler=GovernedRecomputationHandler;
export async function processEvidenceRecomputationQueue(handlers:Partial<Record<DownstreamArtifactKind,RecomputationHandler>>,now=()=>new Date().toISOString()):Promise<RecomputationJob[]>{
 const state=read(); const jobs=[...state.jobs];
 for(const job of jobs.filter(j=>j.status==="queued"||j.status==="blocked").sort((a,b)=>a.order-b.order)){
  const index=jobs.findIndex(x=>x.jobId===job.jobId); const artifact=listDownstreamArtifacts().find(a=>a.artifactId===job.artifactId);
  if(!artifact){jobs[index]={...job,status:"failed",finishedAt:now(),reason:"Artifact no longer exists.",attemptCount:job.attemptCount+1};continue}
  const priorPending=jobs.some(other=>other.propertyId===job.propertyId&&other.order<job.order&&other.status!=="completed");
  if(priorPending){jobs[index]={...job,status:"blocked",reason:"Waiting for upstream artifact recomputation."};continue}
  const handler=handlers[job.kind]; if(!handler){jobs[index]={...job,status:"blocked",reason:`No approved recomputation handler for ${job.kind}.`};continue}
  jobs[index]={...job,status:"running",startedAt:now(),attemptCount:job.attemptCount+1}; write({jobs});
  try{const result=await handler(artifact); if(!result.productionEvidence) throw new Error("Recomputation result is not production evidence."); if(!/^[a-f0-9]{64}$/.test(result.artifactHash)) throw new Error("Recomputation result requires a valid artifact SHA-256 hash."); const dependencies=currentOfficialEvidenceDependencies(); if(dependencies.length===0) throw new Error("No current published official evidence dependencies are available."); const expected=JSON.stringify(dependencies); if(JSON.stringify(result.dependencies)!==expected) throw new Error("Recomputation result dependencies do not match current official evidence."); recomputeDownstreamArtifact({artifactId:job.artifactId,dependencies,at:result.generatedAt||now()}); readDownstreamArtifactForServe(job.artifactId); jobs[index]={...jobs[index],status:"completed",finishedAt:now(),reason:"Recomputed and verified against current official evidence."};}
  catch(error){jobs[index]={...jobs[index],status:"failed",finishedAt:now(),reason:(error as Error).message};}
  write({jobs});
 }
 write({jobs}); return jobs;
}
export function assertPropertyEvidenceChainCurrent(propertyId:string):DownstreamArtifactRecord[]{const artifacts=listDownstreamArtifacts().filter(a=>a.propertyId===propertyId);if(artifacts.some(a=>a.status!=="current"))throw new Error("Property evidence chain is not current; recomputation must complete before serving.");return artifacts.map(a=>readDownstreamArtifactForServe(a.artifactId));}
export function listEvidenceRecomputationJobs():RecomputationJob[]{return read().jobs;}
