import type { InstitutionalLifecycleCycleMonitoringDischargeEvaluation } from "@/lib/platform/institutionalLifecycleCycleMonitoringDischargeAuthority";

export const INSTITUTIONAL_LIFECYCLE_CYCLE_FINALITY_SCHEMA_VERSION = "institutional-lifecycle-cycle-finality-v1";
export type InstitutionalLifecycleCycleFinalityDecision = "ALLOW" | "BLOCK" | "REVIEW_REQUIRED";
export type InstitutionalLifecycleCycleFinalityState = "FINALIZED" | "REVIEW_PENDING" | "BLOCKED";

export type InstitutionalLifecycleCycleFinalityPolicy = Readonly<{
  policyId:string; governanceVersion:string; requireImmutableRecord:boolean;
  requireRetentionPolicy:boolean; requireLegalHoldAssessment:boolean; requireClosureNotice:boolean;
  requireReopeningAuthority:boolean; requiredEvidenceRefs:readonly string[]; auditRefs:readonly string[];
  replayRef:string; versionRefs:readonly string[];
}>;

export type InstitutionalLifecycleCycleFinalityEvaluation = Readonly<{
  schemaVersion:typeof INSTITUTIONAL_LIFECYCLE_CYCLE_FINALITY_SCHEMA_VERSION;
  cyclePolicyId:string; cycleId:string; generation:number; dischargePolicyId:string; finalityPolicyId:string; canonicalObjectId:string;
  decision:InstitutionalLifecycleCycleFinalityDecision; resultingState:InstitutionalLifecycleCycleFinalityState;
  reasons:readonly string[]; immutableRecordRefs:readonly string[]; evidenceRefs:readonly string[];
  finalizedAt:string; auditRefs:readonly string[]; replayRef:string;
}>;

const ISO=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
function ne(v:string,f:string){const n=v.trim();if(!n)throw new Error(`${f} must be non-empty.`);return n;}
function iso(v:string,f:string){if(!ISO.test(ne(v,f)))throw new Error(`${f} must be an explicit UTC ISO-8601 timestamp.`);return v;}
function list(v:readonly string[],f:string,r=false){const n=v.map(x=>ne(x,f));if(r&&!n.length)throw new Error(`${f} must contain at least one value.`);if(new Set(n).size!==n.length)throw new Error(`${f} must not contain duplicates.`);return Object.freeze([...n].sort());}

export function createInstitutionalLifecycleCycleFinalityPolicy(input:InstitutionalLifecycleCycleFinalityPolicy):InstitutionalLifecycleCycleFinalityPolicy{
  return Object.freeze({...input,policyId:ne(input.policyId,"policyId"),governanceVersion:ne(input.governanceVersion,"governanceVersion"),requiredEvidenceRefs:list(input.requiredEvidenceRefs,"requiredEvidenceRefs"),auditRefs:list(input.auditRefs,"auditRefs",true),replayRef:ne(input.replayRef,"replayRef"),versionRefs:list(input.versionRefs,"versionRefs",true)});
}

export function evaluateInstitutionalLifecycleCycleFinality(input:{discharge:InstitutionalLifecycleCycleMonitoringDischargeEvaluation;policy:InstitutionalLifecycleCycleFinalityPolicy;immutableRecordRefs?:readonly string[];retentionPolicyRef?:string|null;legalHoldAssessmentRef?:string|null;closureNoticeRef?:string|null;reopeningAuthorityRef?:string|null;evidenceRefs:readonly string[];finalizedAt:string;auditRefs:readonly string[];replayRef:string;}):InstitutionalLifecycleCycleFinalityEvaluation{
  iso(input.finalizedAt,"finalizedAt");const p=createInstitutionalLifecycleCycleFinalityPolicy(input.policy);const records=list(input.immutableRecordRefs??[],"immutableRecordRefs");const evidence=list(input.evidenceRefs,"evidenceRefs");const reasons:string[]=[];
  if(input.discharge.decision!=="ALLOW"||input.discharge.resultingState!=="DISCHARGED")reasons.push("allowed-cycle-discharge-required");
  if(input.discharge.replayRef!==input.replayRef)reasons.push("replay-continuity-required");
  if(p.requireImmutableRecord&&!records.length)reasons.push("immutable-record-required");
  if(p.requireRetentionPolicy&&!input.retentionPolicyRef?.trim())reasons.push("retention-policy-required");
  if(p.requireLegalHoldAssessment&&!input.legalHoldAssessmentRef?.trim())reasons.push("legal-hold-assessment-required");
  if(p.requireClosureNotice&&!input.closureNoticeRef?.trim())reasons.push("closure-notice-required");
  if(p.requireReopeningAuthority&&!input.reopeningAuthorityRef?.trim())reasons.push("reopening-authority-required");
  for(const r of p.requiredEvidenceRefs)if(!evidence.includes(r))reasons.push(`missing-evidence:${r}`);
  const reviewable=new Set(["closure-notice-required","legal-hold-assessment-required"]);const hard=reasons.some(r=>!reviewable.has(r));const decision:InstitutionalLifecycleCycleFinalityDecision=hard?"BLOCK":reasons.length?"REVIEW_REQUIRED":"ALLOW";
  return Object.freeze({schemaVersion:INSTITUTIONAL_LIFECYCLE_CYCLE_FINALITY_SCHEMA_VERSION,cyclePolicyId:input.discharge.cyclePolicyId,cycleId:input.discharge.cycleId,generation:input.discharge.generation,dischargePolicyId:input.discharge.dischargePolicyId,finalityPolicyId:p.policyId,canonicalObjectId:input.discharge.canonicalObjectId,decision,resultingState:decision==="ALLOW"?"FINALIZED":decision==="REVIEW_REQUIRED"?"REVIEW_PENDING":"BLOCKED",reasons:Object.freeze([...new Set(reasons)].sort()),immutableRecordRefs:records,evidenceRefs:evidence,finalizedAt:input.finalizedAt,auditRefs:list(input.auditRefs,"auditRefs",true),replayRef:ne(input.replayRef,"replayRef")});
}

export const institutionalLifecycleCycleFinalityAuthority=Object.freeze({createPolicy:createInstitutionalLifecycleCycleFinalityPolicy,evaluate:evaluateInstitutionalLifecycleCycleFinality});
