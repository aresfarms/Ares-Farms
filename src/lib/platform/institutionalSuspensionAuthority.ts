import type { InstitutionalReopeningEvaluation } from "@/lib/platform/institutionalReopeningAuthority";

export const INSTITUTIONAL_SUSPENSION_SCHEMA_VERSION = "institutional-suspension-v1";
export type InstitutionalSuspensionScope = "CLAIM" | "PUBLICATION" | "RELIANCE" | "ACTION" | "FULL_MATTER";
export type InstitutionalSuspensionDecision = "ALLOW" | "BLOCK" | "REVIEW_REQUIRED";
export type InstitutionalSuspensionState = "SUSPENDED" | "PARTIALLY_SUSPENDED" | "REVIEW_PENDING" | "ACTIVE";

export type InstitutionalSuspensionPolicy = Readonly<{
  policyId:string; governanceVersion:string; allowedScopes:readonly InstitutionalSuspensionScope[];
  requireReopenedMatter:boolean; requireRiskEvidence:boolean; requireHumanApproval:boolean;
  requireNotice:boolean; fullMatterSuspensionAuthorized:boolean; emergencySuspensionAuthorized:boolean;
  requiredEvidenceRefs:readonly string[]; auditRefs:readonly string[]; replayRef:string; versionRefs:readonly string[];
}>;

export type InstitutionalSuspensionEvaluation = Readonly<{
  schemaVersion:typeof INSTITUTIONAL_SUSPENSION_SCHEMA_VERSION; reopeningPolicyId:string; suspensionPolicyId:string;
  reconciliationId:string; scopes:readonly InstitutionalSuspensionScope[]; emergency:boolean;
  decision:InstitutionalSuspensionDecision; resultingState:InstitutionalSuspensionState; reasons:readonly string[];
  approvalRefs:readonly string[]; evidenceRefs:readonly string[]; evaluatedAt:string; auditRefs:readonly string[]; replayRef:string;
}>;

const ISO_UTC=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
function nonEmpty(v:string,f:string){const n=v.trim();if(!n)throw new Error(`${f} must be non-empty.`);return n;}
function iso(v:string,f:string){if(!ISO_UTC.test(nonEmpty(v,f)))throw new Error(`${f} must be an explicit UTC ISO-8601 timestamp.`);return v;}
function list<T extends string>(v:readonly T[],f:string,r=false):readonly T[]{const n=v.map(x=>nonEmpty(x,f) as T);if(r&&!n.length)throw new Error(`${f} must contain at least one value.`);if(new Set(n).size!==n.length)throw new Error(`${f} must not contain duplicates.`);return Object.freeze([...n].sort()) as readonly T[];}

export function createInstitutionalSuspensionPolicy(input:InstitutionalSuspensionPolicy):InstitutionalSuspensionPolicy{
  if(input.allowedScopes.includes("FULL_MATTER")&&!input.fullMatterSuspensionAuthorized)throw new Error("Full-matter suspension requires explicit authority.");
  return Object.freeze({...input,policyId:nonEmpty(input.policyId,"policyId"),governanceVersion:nonEmpty(input.governanceVersion,"governanceVersion"),allowedScopes:list(input.allowedScopes,"allowedScopes",true),requiredEvidenceRefs:list(input.requiredEvidenceRefs,"requiredEvidenceRefs"),auditRefs:list(input.auditRefs,"auditRefs",true),replayRef:nonEmpty(input.replayRef,"replayRef"),versionRefs:list(input.versionRefs,"versionRefs",true)});
}

export function evaluateInstitutionalSuspension(input:{reopening:InstitutionalReopeningEvaluation;policy:InstitutionalSuspensionPolicy;scopes:readonly InstitutionalSuspensionScope[];emergency:boolean;approvalRefs?:readonly string[];riskEvidenceRef?:string|null;noticeRef?:string|null;evidenceRefs:readonly string[];evaluatedAt:string;auditRefs:readonly string[];replayRef:string;}):InstitutionalSuspensionEvaluation{
  iso(input.evaluatedAt,"evaluatedAt");const p=createInstitutionalSuspensionPolicy(input.policy);const scopes=list(input.scopes,"scopes",true);const approvals=list(input.approvalRefs??[],"approvalRefs");const evidence=list(input.evidenceRefs,"evidenceRefs");const reasons:string[]=[];
  if(p.requireReopenedMatter&&!input.reopening.resultingState.startsWith("REOPENED_"))reasons.push("matter-not-reopened");
  if(input.reopening.decision!=="ALLOW")reasons.push(`reopening:${input.reopening.decision.toLowerCase()}`);
  for(const scope of scopes)if(!p.allowedScopes.includes(scope))reasons.push(`scope-not-authorized:${scope.toLowerCase()}`);
  if(scopes.includes("FULL_MATTER")&&!p.fullMatterSuspensionAuthorized)reasons.push("full-matter-suspension-not-authorized");
  if(input.emergency&&!p.emergencySuspensionAuthorized)reasons.push("emergency-suspension-not-authorized");
  if(p.requireRiskEvidence&&!input.riskEvidenceRef?.trim())reasons.push("risk-evidence-required");
  if(p.requireHumanApproval&&!approvals.length&&!input.emergency)reasons.push("human-approval-required");
  if(p.requireNotice&&!input.noticeRef?.trim())reasons.push("notice-required");
  for(const r of p.requiredEvidenceRefs)if(!evidence.includes(r))reasons.push(`missing-evidence:${r}`);
  const reviewable=new Set(["risk-evidence-required","human-approval-required","notice-required"]);
  const hard=reasons.some(r=>!reviewable.has(r));const decision:InstitutionalSuspensionDecision=hard?"BLOCK":reasons.length?"REVIEW_REQUIRED":"ALLOW";
  const resultingState:InstitutionalSuspensionState=decision==="REVIEW_REQUIRED"?"REVIEW_PENDING":decision!=="ALLOW"?"ACTIVE":scopes.includes("FULL_MATTER")?"SUSPENDED":"PARTIALLY_SUSPENDED";
  return Object.freeze({schemaVersion:INSTITUTIONAL_SUSPENSION_SCHEMA_VERSION,reopeningPolicyId:input.reopening.reopeningPolicyId,suspensionPolicyId:p.policyId,reconciliationId:input.reopening.reconciliationId,scopes,emergency:input.emergency,decision,resultingState,reasons:Object.freeze([...new Set(reasons)].sort()),approvalRefs:approvals,evidenceRefs:evidence,evaluatedAt:input.evaluatedAt,auditRefs:list(input.auditRefs,"auditRefs",true),replayRef:nonEmpty(input.replayRef,"replayRef")});
}

export const institutionalSuspensionAuthority=Object.freeze({createPolicy:createInstitutionalSuspensionPolicy,evaluate:evaluateInstitutionalSuspension});
