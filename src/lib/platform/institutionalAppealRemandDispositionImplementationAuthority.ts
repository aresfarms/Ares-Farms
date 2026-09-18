import type { InstitutionalAppealRemandResolutionEvaluation } from "@/lib/platform/institutionalAppealRemandResolutionAuthority";
import type { InstitutionalSuspensionScope } from "@/lib/platform/institutionalSuspensionAuthority";

export const INSTITUTIONAL_APPEAL_REMAND_DISPOSITION_IMPLEMENTATION_SCHEMA_VERSION = "institutional-appeal-remand-disposition-implementation-v1";
export type AppealRemandDispositionImplementationMode = "NO_CHANGE" | "APPLY_SELECTED" | "APPLY_ALL";
export type AppealRemandDispositionImplementationDecision = "ALLOW" | "BLOCK" | "REVIEW_REQUIRED";
export type AppealRemandDispositionImplementationState = "AFFIRMED_FINAL" | "PARTIALLY_IMPLEMENTED" | "FULLY_IMPLEMENTED" | "REVIEW_PENDING" | "BLOCKED";

export type InstitutionalAppealRemandDispositionImplementationPolicy = Readonly<{
  policyId:string; governanceVersion:string; allowedModes:readonly AppealRemandDispositionImplementationMode[];
  requireExecutionApproval:boolean; requireImplementationNotice:boolean; requireActionPlan:boolean;
  fullImplementationAuthorized:boolean; requiredEvidenceRefs:readonly string[]; auditRefs:readonly string[];
  replayRef:string; versionRefs:readonly string[];
}>;

export type InstitutionalAppealRemandDispositionImplementationEvaluation = Readonly<{
  schemaVersion:typeof INSTITUTIONAL_APPEAL_REMAND_DISPOSITION_IMPLEMENTATION_SCHEMA_VERSION;
  remandPolicyId:string; implementationPolicyId:string; reconciliationId:string;
  mode:AppealRemandDispositionImplementationMode; affectedScopes:readonly InstitutionalSuspensionScope[];
  decision:AppealRemandDispositionImplementationDecision; resultingState:AppealRemandDispositionImplementationState;
  reasons:readonly string[]; approvalRefs:readonly string[]; evidenceRefs:readonly string[];
  implementedAt:string; auditRefs:readonly string[]; replayRef:string;
}>;

const ISO=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
function ne(v:string,f:string){const n=v.trim();if(!n)throw new Error(`${f} must be non-empty.`);return n;}
function iso(v:string,f:string){if(!ISO.test(ne(v,f)))throw new Error(`${f} must be an explicit UTC ISO-8601 timestamp.`);return v;}
function list<T extends string>(v:readonly T[],f:string,r=false):readonly T[]{const n=v.map(x=>ne(x,f) as T);if(r&&!n.length)throw new Error(`${f} must contain at least one value.`);if(new Set(n).size!==n.length)throw new Error(`${f} must not contain duplicates.`);return Object.freeze([...n].sort()) as readonly T[];}

export function createInstitutionalAppealRemandDispositionImplementationPolicy(input:InstitutionalAppealRemandDispositionImplementationPolicy):InstitutionalAppealRemandDispositionImplementationPolicy{
  if(input.allowedModes.includes("APPLY_ALL")&&!input.fullImplementationAuthorized)throw new Error("Full remand implementation requires explicit authority.");
  return Object.freeze({...input,policyId:ne(input.policyId,"policyId"),governanceVersion:ne(input.governanceVersion,"governanceVersion"),allowedModes:list(input.allowedModes,"allowedModes",true),requiredEvidenceRefs:list(input.requiredEvidenceRefs,"requiredEvidenceRefs"),auditRefs:list(input.auditRefs,"auditRefs",true),replayRef:ne(input.replayRef,"replayRef"),versionRefs:list(input.versionRefs,"versionRefs",true)});
}

export function evaluateInstitutionalAppealRemandDispositionImplementation(input:{resolution:InstitutionalAppealRemandResolutionEvaluation;policy:InstitutionalAppealRemandDispositionImplementationPolicy;mode:AppealRemandDispositionImplementationMode;affectedScopes?:readonly InstitutionalSuspensionScope[];approvalRefs?:readonly string[];implementationNoticeRef?:string|null;actionPlanRef?:string|null;evidenceRefs:readonly string[];implementedAt:string;auditRefs:readonly string[];replayRef:string;}):InstitutionalAppealRemandDispositionImplementationEvaluation{
  iso(input.implementedAt,"implementedAt");const p=createInstitutionalAppealRemandDispositionImplementationPolicy(input.policy);const scopes=list(input.affectedScopes??[],"affectedScopes");const approvals=list(input.approvalRefs??[],"approvalRefs");const evidence=list(input.evidenceRefs,"evidenceRefs");const reasons:string[]=[];
  if(input.resolution.decision!=="ALLOW")reasons.push("allowed-remand-resolution-required");
  const expected=input.resolution.resultingState==="RESOLVED_AFFIRMED"?"NO_CHANGE":input.resolution.resultingState==="RESOLVED_MODIFIED"?"APPLY_SELECTED":input.resolution.resultingState==="RESOLVED_REVERSED"?"APPLY_ALL":null;
  if(!expected)reasons.push("resolved-remand-disposition-required");else if(input.mode!==expected)reasons.push(`mode-mismatch:${expected.toLowerCase()}`);
  if(!p.allowedModes.includes(input.mode))reasons.push("implementation-mode-not-authorized");
  if(input.mode==="APPLY_SELECTED"&&!scopes.length)reasons.push("affected-scopes-required");
  if(input.mode==="APPLY_ALL"&&!p.fullImplementationAuthorized)reasons.push("full-implementation-not-authorized");
  if(input.mode!=="NO_CHANGE"&&p.requireExecutionApproval&&!approvals.length)reasons.push("execution-approval-required");
  if(p.requireImplementationNotice&&!input.implementationNoticeRef?.trim())reasons.push("implementation-notice-required");
  if(input.mode!=="NO_CHANGE"&&p.requireActionPlan&&!input.actionPlanRef?.trim())reasons.push("action-plan-required");
  for(const r of p.requiredEvidenceRefs)if(!evidence.includes(r))reasons.push(`missing-evidence:${r}`);
  const reviewable=new Set(["execution-approval-required","implementation-notice-required","action-plan-required"]);const hard=reasons.some(r=>!reviewable.has(r));
  const decision:AppealRemandDispositionImplementationDecision=hard?"BLOCK":reasons.length?"REVIEW_REQUIRED":"ALLOW";
  const resultingState:AppealRemandDispositionImplementationState=decision==="BLOCK"?"BLOCKED":decision==="REVIEW_REQUIRED"?"REVIEW_PENDING":input.mode==="NO_CHANGE"?"AFFIRMED_FINAL":input.mode==="APPLY_ALL"?"FULLY_IMPLEMENTED":"PARTIALLY_IMPLEMENTED";
  return Object.freeze({schemaVersion:INSTITUTIONAL_APPEAL_REMAND_DISPOSITION_IMPLEMENTATION_SCHEMA_VERSION,remandPolicyId:input.resolution.remandPolicyId,implementationPolicyId:p.policyId,reconciliationId:input.resolution.reconciliationId,mode:input.mode,affectedScopes:scopes,decision,resultingState,reasons:Object.freeze([...new Set(reasons)].sort()),approvalRefs:approvals,evidenceRefs:evidence,implementedAt:input.implementedAt,auditRefs:list(input.auditRefs,"auditRefs",true),replayRef:ne(input.replayRef,"replayRef")});
}

export const institutionalAppealRemandDispositionImplementationAuthority=Object.freeze({createPolicy:createInstitutionalAppealRemandDispositionImplementationPolicy,evaluate:evaluateInstitutionalAppealRemandDispositionImplementation});
