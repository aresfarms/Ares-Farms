import type { InstitutionalAppealImplementationEvaluation } from "@/lib/platform/institutionalAppealImplementationAuthority";

export const INSTITUTIONAL_APPEAL_REMAND_RESOLUTION_SCHEMA_VERSION = "institutional-appeal-remand-resolution-v1";
export type AppealRemandResolutionMode = "RETURN_AFFIRMED" | "RETURN_MODIFIED" | "RETURN_REVERSED" | "REQUIRE_FURTHER_ACTION";
export type AppealRemandResolutionDecision = "ALLOW" | "BLOCK" | "REVIEW_REQUIRED";
export type AppealRemandResolutionState = "RESOLVED_AFFIRMED" | "RESOLVED_MODIFIED" | "RESOLVED_REVERSED" | "FURTHER_ACTION_REQUIRED" | "REVIEW_PENDING" | "BLOCKED";

export type InstitutionalAppealRemandResolutionPolicy = Readonly<{
  policyId:string; governanceVersion:string; allowedModes:readonly AppealRemandResolutionMode[];
  requireAssignedAuthority:boolean; requireCompletionEvidence:boolean; requireDispositionApproval:boolean;
  requireResolutionNotice:boolean; requiredEvidenceRefs:readonly string[]; auditRefs:readonly string[];
  replayRef:string; versionRefs:readonly string[];
}>;

export type InstitutionalAppealRemandResolutionEvaluation = Readonly<{
  schemaVersion:typeof INSTITUTIONAL_APPEAL_REMAND_RESOLUTION_SCHEMA_VERSION; implementationPolicyId:string;
  remandPolicyId:string; reconciliationId:string; mode:AppealRemandResolutionMode;
  decision:AppealRemandResolutionDecision; resultingState:AppealRemandResolutionState; reasons:readonly string[];
  authorityRefs:readonly string[]; approvalRefs:readonly string[]; evidenceRefs:readonly string[];
  resolvedAt:string; auditRefs:readonly string[]; replayRef:string;
}>;

const ISO=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
function ne(v:string,f:string){const n=v.trim();if(!n)throw new Error(`${f} must be non-empty.`);return n;}
function iso(v:string,f:string){if(!ISO.test(ne(v,f)))throw new Error(`${f} must be an explicit UTC ISO-8601 timestamp.`);return v;}
function list<T extends string>(v:readonly T[],f:string,r=false):readonly T[]{const n=v.map(x=>ne(x,f) as T);if(r&&!n.length)throw new Error(`${f} must contain at least one value.`);if(new Set(n).size!==n.length)throw new Error(`${f} must not contain duplicates.`);return Object.freeze([...n].sort()) as readonly T[];}

export function createInstitutionalAppealRemandResolutionPolicy(input:InstitutionalAppealRemandResolutionPolicy):InstitutionalAppealRemandResolutionPolicy{
  return Object.freeze({...input,policyId:ne(input.policyId,"policyId"),governanceVersion:ne(input.governanceVersion,"governanceVersion"),allowedModes:list(input.allowedModes,"allowedModes",true),requiredEvidenceRefs:list(input.requiredEvidenceRefs,"requiredEvidenceRefs"),auditRefs:list(input.auditRefs,"auditRefs",true),replayRef:ne(input.replayRef,"replayRef"),versionRefs:list(input.versionRefs,"versionRefs",true)});
}

export function evaluateInstitutionalAppealRemandResolution(input:{implementation:InstitutionalAppealImplementationEvaluation;policy:InstitutionalAppealRemandResolutionPolicy;mode:AppealRemandResolutionMode;authorityRefs?:readonly string[];completionEvidenceRef?:string|null;approvalRefs?:readonly string[];resolutionNoticeRef?:string|null;evidenceRefs:readonly string[];resolvedAt:string;auditRefs:readonly string[];replayRef:string;}):InstitutionalAppealRemandResolutionEvaluation{
  iso(input.resolvedAt,"resolvedAt");const p=createInstitutionalAppealRemandResolutionPolicy(input.policy);const authorities=list(input.authorityRefs??[],"authorityRefs");const approvals=list(input.approvalRefs??[],"approvalRefs");const evidence=list(input.evidenceRefs,"evidenceRefs");const reasons:string[]=[];
  if(input.implementation.decision!=="ALLOW"||input.implementation.resultingState!=="REMANDED_PENDING")reasons.push("pending-remand-required");
  if(!p.allowedModes.includes(input.mode))reasons.push("remand-resolution-mode-not-authorized");
  if(p.requireAssignedAuthority&&!authorities.length)reasons.push("assigned-authority-required");
  if(p.requireCompletionEvidence&&!input.completionEvidenceRef?.trim())reasons.push("completion-evidence-required");
  if(input.mode!=="REQUIRE_FURTHER_ACTION"&&p.requireDispositionApproval&&!approvals.length)reasons.push("disposition-approval-required");
  if(p.requireResolutionNotice&&!input.resolutionNoticeRef?.trim())reasons.push("resolution-notice-required");
  for(const r of p.requiredEvidenceRefs)if(!evidence.includes(r))reasons.push(`missing-evidence:${r}`);
  const reviewable=new Set(["assigned-authority-required","completion-evidence-required","disposition-approval-required","resolution-notice-required"]);const hard=reasons.some(r=>!reviewable.has(r));
  const decision:AppealRemandResolutionDecision=hard?"BLOCK":reasons.length?"REVIEW_REQUIRED":"ALLOW";
  const resultingState:AppealRemandResolutionState=decision==="BLOCK"?"BLOCKED":decision==="REVIEW_REQUIRED"?"REVIEW_PENDING":input.mode==="RETURN_AFFIRMED"?"RESOLVED_AFFIRMED":input.mode==="RETURN_MODIFIED"?"RESOLVED_MODIFIED":input.mode==="RETURN_REVERSED"?"RESOLVED_REVERSED":"FURTHER_ACTION_REQUIRED";
  return Object.freeze({schemaVersion:INSTITUTIONAL_APPEAL_REMAND_RESOLUTION_SCHEMA_VERSION,implementationPolicyId:input.implementation.implementationPolicyId,remandPolicyId:p.policyId,reconciliationId:input.implementation.reconciliationId,mode:input.mode,decision,resultingState,reasons:Object.freeze([...new Set(reasons)].sort()),authorityRefs:authorities,approvalRefs:approvals,evidenceRefs:evidence,resolvedAt:input.resolvedAt,auditRefs:list(input.auditRefs,"auditRefs",true),replayRef:ne(input.replayRef,"replayRef")});
}

export const institutionalAppealRemandResolutionAuthority=Object.freeze({createPolicy:createInstitutionalAppealRemandResolutionPolicy,evaluate:evaluateInstitutionalAppealRemandResolution});
