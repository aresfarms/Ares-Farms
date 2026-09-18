export const INSTITUTIONAL_LIFECYCLE_CYCLE_SCHEMA_VERSION = "institutional-lifecycle-cycle-v1";
export type InstitutionalLifecycleCycleDecision = "ALLOW" | "BLOCK" | "REVIEW_REQUIRED";
export type InstitutionalLifecycleCycleState = "OPEN" | "REVIEW_PENDING" | "BLOCKED";

export type InstitutionalLifecycleArchiveProjection = Readonly<{
  schemaVersion:string; projectionPolicyId:string; canonicalObjectId:string;
  decision:"ALLOW"|"REVIEW_REQUIRED"|"BLOCK"; resultingState:"ARCHIVED"|"REVIEW_PENDING"|"BLOCKED"; replayRef:string;
}>;
export type InstitutionalLifecycleCyclePolicy = Readonly<{
  policyId:string; governanceVersion:string; maximumGeneration:number;
  requireHumanApprovalAfterInitialCycle:boolean; requiredEvidenceRefs:readonly string[];
  auditRefs:readonly string[]; replayRef:string; versionRefs:readonly string[];
}>;
export type InstitutionalLifecycleCycleEvaluation = Readonly<{
  schemaVersion:typeof INSTITUTIONAL_LIFECYCLE_CYCLE_SCHEMA_VERSION;
  cyclePolicyId:string; cycleId:string; parentCycleId:string|null; canonicalObjectId:string;
  generation:number; sourceProjectionSchemaVersion:string; sourceProjectionPolicyId:string;
  decision:InstitutionalLifecycleCycleDecision; resultingState:InstitutionalLifecycleCycleState;
  reasons:readonly string[]; approvalRefs:readonly string[]; evidenceRefs:readonly string[];
  openedAt:string; auditRefs:readonly string[]; replayRef:string;
}>;
const ISO=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
function ne(v:string,f:string){const n=v.trim();if(!n)throw new Error(`${f} must be non-empty.`);return n;}
function iso(v:string,f:string){if(!ISO.test(ne(v,f)))throw new Error(`${f} must be an explicit UTC ISO-8601 timestamp.`);return v;}
function list(v:readonly string[],f:string,r=false){const n=v.map(x=>ne(x,f));if(r&&!n.length)throw new Error(`${f} must contain at least one value.`);if(new Set(n).size!==n.length)throw new Error(`${f} must not contain duplicates.`);return Object.freeze([...n].sort());}
export function createInstitutionalLifecycleCyclePolicy(input:InstitutionalLifecycleCyclePolicy){if(!Number.isInteger(input.maximumGeneration)||input.maximumGeneration<1)throw new Error("maximumGeneration must be a positive integer.");return Object.freeze({...input,policyId:ne(input.policyId,"policyId"),governanceVersion:ne(input.governanceVersion,"governanceVersion"),requiredEvidenceRefs:list(input.requiredEvidenceRefs,"requiredEvidenceRefs"),auditRefs:list(input.auditRefs,"auditRefs",true),replayRef:ne(input.replayRef,"replayRef"),versionRefs:list(input.versionRefs,"versionRefs",true)});}
export function evaluateInstitutionalLifecycleCycle(input:{archive:InstitutionalLifecycleArchiveProjection;policy:InstitutionalLifecycleCyclePolicy;cycleId:string;previousCycle?:InstitutionalLifecycleCycleEvaluation|null;approvalRefs?:readonly string[];evidenceRefs:readonly string[];openedAt:string;auditRefs:readonly string[];replayRef:string;}):InstitutionalLifecycleCycleEvaluation{
  iso(input.openedAt,"openedAt");const p=createInstitutionalLifecycleCyclePolicy(input.policy);const approvals=list(input.approvalRefs??[],"approvalRefs");const evidence=list(input.evidenceRefs,"evidenceRefs");const cycleId=ne(input.cycleId,"cycleId");const reasons:string[]=[];const generation=input.previousCycle?input.previousCycle.generation+1:1;
  if(input.archive.decision!=="ALLOW"||input.archive.resultingState!=="ARCHIVED")reasons.push("allowed-archive-projection-required");if(input.archive.replayRef!==input.replayRef)reasons.push("archive-replay-continuity-required");if(input.previousCycle){if(input.previousCycle.decision!=="ALLOW"||input.previousCycle.resultingState!=="OPEN")reasons.push("allowed-parent-cycle-required");if(input.previousCycle.canonicalObjectId!==input.archive.canonicalObjectId)reasons.push("canonical-object-continuity-required");if(input.previousCycle.replayRef!==input.replayRef)reasons.push("parent-replay-continuity-required");if(input.previousCycle.cycleId===cycleId)reasons.push("cycle-id-must-advance");}
  if(generation>p.maximumGeneration)reasons.push("maximum-generation-exceeded");if(generation>1&&p.requireHumanApprovalAfterInitialCycle&&!approvals.length)reasons.push("human-approval-required");for(const r of p.requiredEvidenceRefs)if(!evidence.includes(r))reasons.push(`missing-evidence:${r}`);
  const reviewable=new Set(["human-approval-required"]);const hard=reasons.some(r=>!reviewable.has(r));const decision:InstitutionalLifecycleCycleDecision=hard?"BLOCK":reasons.length?"REVIEW_REQUIRED":"ALLOW";
  return Object.freeze({schemaVersion:INSTITUTIONAL_LIFECYCLE_CYCLE_SCHEMA_VERSION,cyclePolicyId:p.policyId,cycleId,parentCycleId:input.previousCycle?.cycleId??null,canonicalObjectId:input.archive.canonicalObjectId,generation,sourceProjectionSchemaVersion:ne(input.archive.schemaVersion,"archive.schemaVersion"),sourceProjectionPolicyId:ne(input.archive.projectionPolicyId,"archive.projectionPolicyId"),decision,resultingState:decision==="ALLOW"?"OPEN":decision==="REVIEW_REQUIRED"?"REVIEW_PENDING":"BLOCKED",reasons:Object.freeze([...new Set(reasons)].sort()),approvalRefs:approvals,evidenceRefs:evidence,openedAt:input.openedAt,auditRefs:list(input.auditRefs,"auditRefs",true),replayRef:ne(input.replayRef,"replayRef")});
}
export const institutionalLifecycleCycleAuthority=Object.freeze({createPolicy:createInstitutionalLifecycleCyclePolicy,evaluate:evaluateInstitutionalLifecycleCycle});
