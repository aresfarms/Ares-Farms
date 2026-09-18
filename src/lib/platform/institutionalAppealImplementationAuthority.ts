import type { InstitutionalRevocationAppealEvaluation } from "@/lib/platform/institutionalRevocationAppealAuthority";
import type { InstitutionalSuspensionScope } from "@/lib/platform/institutionalSuspensionAuthority";

export const INSTITUTIONAL_APPEAL_IMPLEMENTATION_SCHEMA_VERSION = "institutional-appeal-implementation-v1";
export type AppealImplementationMode = "NO_CHANGE" | "RESTORE_SELECTED" | "RESTORE_ALL" | "REMAND_FOR_ACTION";
export type AppealImplementationDecision = "ALLOW" | "BLOCK" | "REVIEW_REQUIRED";
export type AppealImplementationState = "AFFIRMED_FINAL" | "PARTIALLY_RESTORED" | "FULLY_RESTORED" | "REMANDED_PENDING" | "REVIEW_PENDING" | "BLOCKED";

export type InstitutionalAppealImplementationPolicy = Readonly<{
  policyId:string; governanceVersion:string; allowedModes:readonly AppealImplementationMode[];
  requireExecutionApproval:boolean; requireImplementationNotice:boolean; requireRestorationPlan:boolean;
  fullRestorationAuthorized:boolean; requiredEvidenceRefs:readonly string[]; auditRefs:readonly string[];
  replayRef:string; versionRefs:readonly string[];
}>;

export type InstitutionalAppealImplementationEvaluation = Readonly<{
  schemaVersion:typeof INSTITUTIONAL_APPEAL_IMPLEMENTATION_SCHEMA_VERSION; appealPolicyId:string;
  implementationPolicyId:string; reconciliationId:string; mode:AppealImplementationMode;
  restoredScopes:readonly InstitutionalSuspensionScope[]; decision:AppealImplementationDecision;
  resultingState:AppealImplementationState; reasons:readonly string[]; approvalRefs:readonly string[];
  evidenceRefs:readonly string[]; implementedAt:string; auditRefs:readonly string[]; replayRef:string;
}>;

const ISO=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
function ne(v:string,f:string){const n=v.trim();if(!n)throw new Error(`${f} must be non-empty.`);return n;}
function iso(v:string,f:string){if(!ISO.test(ne(v,f)))throw new Error(`${f} must be an explicit UTC ISO-8601 timestamp.`);return v;}
function list<T extends string>(v:readonly T[],f:string,r=false):readonly T[]{const n=v.map(x=>ne(x,f) as T);if(r&&!n.length)throw new Error(`${f} must contain at least one value.`);if(new Set(n).size!==n.length)throw new Error(`${f} must not contain duplicates.`);return Object.freeze([...n].sort()) as readonly T[];}

export function createInstitutionalAppealImplementationPolicy(input:InstitutionalAppealImplementationPolicy):InstitutionalAppealImplementationPolicy{
  if(input.allowedModes.includes("RESTORE_ALL")&&!input.fullRestorationAuthorized)throw new Error("Full restoration requires explicit authority.");
  return Object.freeze({...input,policyId:ne(input.policyId,"policyId"),governanceVersion:ne(input.governanceVersion,"governanceVersion"),allowedModes:list(input.allowedModes,"allowedModes",true),requiredEvidenceRefs:list(input.requiredEvidenceRefs,"requiredEvidenceRefs"),auditRefs:list(input.auditRefs,"auditRefs",true),replayRef:ne(input.replayRef,"replayRef"),versionRefs:list(input.versionRefs,"versionRefs",true)});
}

export function evaluateInstitutionalAppealImplementation(input:{appeal:InstitutionalRevocationAppealEvaluation;policy:InstitutionalAppealImplementationPolicy;mode:AppealImplementationMode;restoreScopes?:readonly InstitutionalSuspensionScope[];approvalRefs?:readonly string[];implementationNoticeRef?:string|null;restorationPlanRef?:string|null;evidenceRefs:readonly string[];implementedAt:string;auditRefs:readonly string[];replayRef:string;}):InstitutionalAppealImplementationEvaluation{
  iso(input.implementedAt,"implementedAt");const p=createInstitutionalAppealImplementationPolicy(input.policy);const scopes=list(input.restoreScopes??[],"restoreScopes");const approvals=list(input.approvalRefs??[],"approvalRefs");const evidence=list(input.evidenceRefs,"evidenceRefs");const reasons:string[]=[];
  if(input.appeal.decision!=="ALLOW")reasons.push("allowed-appeal-required");
  if(!p.allowedModes.includes(input.mode))reasons.push("implementation-mode-not-authorized");
  const expected=input.appeal.disposition==="AFFIRM"?"NO_CHANGE":input.appeal.disposition==="REMAND"?"REMAND_FOR_ACTION":input.appeal.disposition==="REVERSE"?"RESTORE_ALL":"RESTORE_SELECTED";
  if(input.mode!==expected)reasons.push(`mode-mismatch:${expected.toLowerCase()}`);
  if(input.mode==="RESTORE_SELECTED"&&!scopes.length)reasons.push("restore-scopes-required");
  const allowedScopes=new Set(input.appeal.appealedScopes);for(const s of scopes)if(!allowedScopes.has(s)&&!allowedScopes.has("FULL_MATTER"))reasons.push(`scope-not-authorized:${s.toLowerCase()}`);
  if(input.mode==="RESTORE_ALL"&&!p.fullRestorationAuthorized)reasons.push("full-restoration-not-authorized");
  if(input.mode!=="NO_CHANGE"&&p.requireExecutionApproval&&!approvals.length)reasons.push("execution-approval-required");
  if(input.mode!=="NO_CHANGE"&&p.requireImplementationNotice&&!input.implementationNoticeRef?.trim())reasons.push("implementation-notice-required");
  if((input.mode==="RESTORE_SELECTED"||input.mode==="RESTORE_ALL")&&p.requireRestorationPlan&&!input.restorationPlanRef?.trim())reasons.push("restoration-plan-required");
  for(const r of p.requiredEvidenceRefs)if(!evidence.includes(r))reasons.push(`missing-evidence:${r}`);
  const reviewable=new Set(["execution-approval-required","implementation-notice-required","restoration-plan-required"]);const hard=reasons.some(r=>!reviewable.has(r));
  const decision:AppealImplementationDecision=hard?"BLOCK":reasons.length?"REVIEW_REQUIRED":"ALLOW";
  const restored=input.mode==="RESTORE_ALL"?["FULL_MATTER" as InstitutionalSuspensionScope]:input.mode==="RESTORE_SELECTED"?[...scopes]:[];
  const resultingState:AppealImplementationState=decision==="BLOCK"?"BLOCKED":decision==="REVIEW_REQUIRED"?"REVIEW_PENDING":input.mode==="NO_CHANGE"?"AFFIRMED_FINAL":input.mode==="RESTORE_ALL"?"FULLY_RESTORED":input.mode==="RESTORE_SELECTED"?"PARTIALLY_RESTORED":"REMANDED_PENDING";
  return Object.freeze({schemaVersion:INSTITUTIONAL_APPEAL_IMPLEMENTATION_SCHEMA_VERSION,appealPolicyId:input.appeal.appealPolicyId,implementationPolicyId:p.policyId,reconciliationId:input.appeal.reconciliationId,mode:input.mode,restoredScopes:Object.freeze([...restored].sort()),decision,resultingState,reasons:Object.freeze([...new Set(reasons)].sort()),approvalRefs:approvals,evidenceRefs:evidence,implementedAt:input.implementedAt,auditRefs:list(input.auditRefs,"auditRefs",true),replayRef:ne(input.replayRef,"replayRef")});
}

export const institutionalAppealImplementationAuthority=Object.freeze({createPolicy:createInstitutionalAppealImplementationPolicy,evaluate:evaluateInstitutionalAppealImplementation});
