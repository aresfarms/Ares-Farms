import type { InstitutionalAppealRemandArchiveReopeningEvaluation } from "@/lib/platform/institutionalAppealRemandArchiveReopeningAuthority";

export const INSTITUTIONAL_APPEAL_REMAND_ARCHIVE_REOPENING_SUSPENSION_SCHEMA_VERSION = "institutional-appeal-remand-archive-reopening-suspension-v1";
export type AppealRemandReopeningSuspensionScope = "CLAIM" | "PUBLICATION" | "RELIANCE" | "ACTION" | "FULL_MATTER";
export type AppealRemandReopeningSuspensionDecision = "ALLOW" | "BLOCK" | "REVIEW_REQUIRED";
export type AppealRemandReopeningSuspensionState = "SUSPENDED" | "PARTIALLY_SUSPENDED" | "REVIEW_PENDING" | "ACTIVE";

export type InstitutionalAppealRemandArchiveReopeningSuspensionPolicy = Readonly<{
  policyId:string; governanceVersion:string; allowedScopes:readonly AppealRemandReopeningSuspensionScope[];
  requireReopenedMatter:boolean; requireRiskEvidence:boolean; requireHumanApproval:boolean;
  requireNotice:boolean; fullMatterSuspensionAuthorized:boolean; emergencySuspensionAuthorized:boolean;
  requiredEvidenceRefs:readonly string[]; auditRefs:readonly string[]; replayRef:string; versionRefs:readonly string[];
}>;

export type InstitutionalAppealRemandArchiveReopeningSuspensionEvaluation = Readonly<{
  schemaVersion:typeof INSTITUTIONAL_APPEAL_REMAND_ARCHIVE_REOPENING_SUSPENSION_SCHEMA_VERSION;
  reopeningPolicyId:string; suspensionPolicyId:string; canonicalObjectId:string;
  scopes:readonly AppealRemandReopeningSuspensionScope[]; emergency:boolean;
  decision:AppealRemandReopeningSuspensionDecision; resultingState:AppealRemandReopeningSuspensionState;
  reasons:readonly string[]; approvalRefs:readonly string[]; evidenceRefs:readonly string[];
  evaluatedAt:string; auditRefs:readonly string[]; replayRef:string;
}>;

const ISO=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
function ne(v:string,f:string){const n=v.trim();if(!n)throw new Error(`${f} must be non-empty.`);return n;}
function iso(v:string,f:string){if(!ISO.test(ne(v,f)))throw new Error(`${f} must be an explicit UTC ISO-8601 timestamp.`);return v;}
function list<T extends string>(v:readonly T[],f:string,r=false):readonly T[]{const n=v.map(x=>ne(x,f) as T);if(r&&!n.length)throw new Error(`${f} must contain at least one value.`);if(new Set(n).size!==n.length)throw new Error(`${f} must not contain duplicates.`);return Object.freeze([...n].sort()) as readonly T[];}

export function createInstitutionalAppealRemandArchiveReopeningSuspensionPolicy(input:InstitutionalAppealRemandArchiveReopeningSuspensionPolicy):InstitutionalAppealRemandArchiveReopeningSuspensionPolicy{
  if(input.allowedScopes.includes("FULL_MATTER")&&!input.fullMatterSuspensionAuthorized)throw new Error("Full-matter suspension requires explicit authority.");
  return Object.freeze({...input,policyId:ne(input.policyId,"policyId"),governanceVersion:ne(input.governanceVersion,"governanceVersion"),allowedScopes:list(input.allowedScopes,"allowedScopes",true),requiredEvidenceRefs:list(input.requiredEvidenceRefs,"requiredEvidenceRefs"),auditRefs:list(input.auditRefs,"auditRefs",true),replayRef:ne(input.replayRef,"replayRef"),versionRefs:list(input.versionRefs,"versionRefs",true)});
}

export function evaluateInstitutionalAppealRemandArchiveReopeningSuspension(input:{reopening:InstitutionalAppealRemandArchiveReopeningEvaluation;policy:InstitutionalAppealRemandArchiveReopeningSuspensionPolicy;scopes:readonly AppealRemandReopeningSuspensionScope[];emergency:boolean;approvalRefs?:readonly string[];riskEvidenceRef?:string|null;noticeRef?:string|null;evidenceRefs:readonly string[];evaluatedAt:string;auditRefs:readonly string[];replayRef:string;}):InstitutionalAppealRemandArchiveReopeningSuspensionEvaluation{
  iso(input.evaluatedAt,"evaluatedAt");const p=createInstitutionalAppealRemandArchiveReopeningSuspensionPolicy(input.policy);const scopes=list(input.scopes,"scopes",true);const approvals=list(input.approvalRefs??[],"approvalRefs");const evidence=list(input.evidenceRefs,"evidenceRefs");const reasons:string[]=[];
  if(p.requireReopenedMatter&&!input.reopening.resultingState.startsWith("REOPENED_"))reasons.push("matter-not-reopened");
  if(input.reopening.decision!=="ALLOW")reasons.push(`reopening:${input.reopening.decision.toLowerCase()}`);
  for(const scope of scopes)if(!p.allowedScopes.includes(scope))reasons.push(`scope-not-authorized:${scope.toLowerCase()}`);
  if(scopes.includes("FULL_MATTER")&&!p.fullMatterSuspensionAuthorized)reasons.push("full-matter-suspension-not-authorized");
  if(input.emergency&&!p.emergencySuspensionAuthorized)reasons.push("emergency-suspension-not-authorized");
  if(p.requireRiskEvidence&&!input.riskEvidenceRef?.trim())reasons.push("risk-evidence-required");
  if(p.requireHumanApproval&&!approvals.length&&!input.emergency)reasons.push("human-approval-required");
  if(p.requireNotice&&!input.noticeRef?.trim())reasons.push("notice-required");
  if(input.reopening.replayRef!==input.replayRef)reasons.push("replay-continuity-required");
  for(const r of p.requiredEvidenceRefs)if(!evidence.includes(r))reasons.push(`missing-evidence:${r}`);
  const reviewable=new Set(["risk-evidence-required","human-approval-required","notice-required"]);const hard=reasons.some(r=>!reviewable.has(r));
  const decision:AppealRemandReopeningSuspensionDecision=hard?"BLOCK":reasons.length?"REVIEW_REQUIRED":"ALLOW";
  const resultingState:AppealRemandReopeningSuspensionState=decision==="REVIEW_REQUIRED"?"REVIEW_PENDING":decision!=="ALLOW"?"ACTIVE":scopes.includes("FULL_MATTER")?"SUSPENDED":"PARTIALLY_SUSPENDED";
  return Object.freeze({schemaVersion:INSTITUTIONAL_APPEAL_REMAND_ARCHIVE_REOPENING_SUSPENSION_SCHEMA_VERSION,reopeningPolicyId:input.reopening.reopeningPolicyId,suspensionPolicyId:p.policyId,canonicalObjectId:input.reopening.canonicalObjectId,scopes,emergency:input.emergency,decision,resultingState,reasons:Object.freeze([...new Set(reasons)].sort()),approvalRefs:approvals,evidenceRefs:evidence,evaluatedAt:input.evaluatedAt,auditRefs:list(input.auditRefs,"auditRefs",true),replayRef:ne(input.replayRef,"replayRef")});
}

export const institutionalAppealRemandArchiveReopeningSuspensionAuthority=Object.freeze({createPolicy:createInstitutionalAppealRemandArchiveReopeningSuspensionPolicy,evaluate:evaluateInstitutionalAppealRemandArchiveReopeningSuspension});
