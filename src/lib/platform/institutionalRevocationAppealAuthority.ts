import type { InstitutionalRevocationEvaluation } from "@/lib/platform/institutionalRevocationAuthority";
import type { InstitutionalSuspensionScope } from "@/lib/platform/institutionalSuspensionAuthority";

export const INSTITUTIONAL_REVOCATION_APPEAL_SCHEMA_VERSION = "institutional-revocation-appeal-v1";
export type InstitutionalAppealDisposition = "AFFIRM" | "MODIFY" | "REVERSE" | "REMAND";
export type InstitutionalAppealDecision = "ALLOW" | "BLOCK" | "REVIEW_REQUIRED";
export type InstitutionalAppealState = "AFFIRMED" | "MODIFIED" | "REVERSED" | "REMANDED" | "REVIEW_PENDING" | "BLOCKED";

export type InstitutionalRevocationAppealPolicy = Readonly<{
  policyId: string;
  governanceVersion: string;
  allowedDispositions: readonly InstitutionalAppealDisposition[];
  filingWindowDays: number;
  requireStanding: boolean;
  requireIndependentReview: boolean;
  requireDispositionApproval: boolean;
  requireFinalNotice: boolean;
  scopeRestorationAuthorized: boolean;
  requiredEvidenceRefs: readonly string[];
  auditRefs: readonly string[];
  replayRef: string;
  versionRefs: readonly string[];
}>;

export type InstitutionalRevocationAppealEvaluation = Readonly<{
  schemaVersion: typeof INSTITUTIONAL_REVOCATION_APPEAL_SCHEMA_VERSION;
  revocationPolicyId: string;
  appealPolicyId: string;
  reconciliationId: string;
  disposition: InstitutionalAppealDisposition;
  appealedScopes: readonly InstitutionalSuspensionScope[];
  decision: InstitutionalAppealDecision;
  resultingState: InstitutionalAppealState;
  reasons: readonly string[];
  standingRefs: readonly string[];
  reviewRefs: readonly string[];
  approvalRefs: readonly string[];
  evidenceRefs: readonly string[];
  filedAt: string;
  evaluatedAt: string;
  auditRefs: readonly string[];
  replayRef: string;
}>;

const ISO_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
function nonEmpty(value:string, field:string){const normalized=value.trim();if(!normalized)throw new Error(`${field} must be non-empty.`);return normalized;}
function iso(value:string, field:string){if(!ISO_UTC.test(nonEmpty(value,field)))throw new Error(`${field} must be an explicit UTC ISO-8601 timestamp.`);return value;}
function list<T extends string>(values:readonly T[],field:string,required=false):readonly T[]{const normalized=values.map(value=>nonEmpty(value,field) as T);if(required&&!normalized.length)throw new Error(`${field} must contain at least one value.`);if(new Set(normalized).size!==normalized.length)throw new Error(`${field} must not contain duplicates.`);return Object.freeze([...normalized].sort()) as readonly T[];}

export function createInstitutionalRevocationAppealPolicy(input:InstitutionalRevocationAppealPolicy):InstitutionalRevocationAppealPolicy{
  if(!Number.isInteger(input.filingWindowDays)||input.filingWindowDays<1)throw new Error("filingWindowDays must be a positive integer.");
  if((input.allowedDispositions.includes("MODIFY")||input.allowedDispositions.includes("REVERSE"))&&!input.scopeRestorationAuthorized)throw new Error("Restorative dispositions require explicit authority.");
  return Object.freeze({...input,policyId:nonEmpty(input.policyId,"policyId"),governanceVersion:nonEmpty(input.governanceVersion,"governanceVersion"),allowedDispositions:list(input.allowedDispositions,"allowedDispositions",true),requiredEvidenceRefs:list(input.requiredEvidenceRefs,"requiredEvidenceRefs"),auditRefs:list(input.auditRefs,"auditRefs",true),replayRef:nonEmpty(input.replayRef,"replayRef"),versionRefs:list(input.versionRefs,"versionRefs",true)});
}

export function evaluateInstitutionalRevocationAppeal(input:{revocation:InstitutionalRevocationEvaluation;policy:InstitutionalRevocationAppealPolicy;disposition:InstitutionalAppealDisposition;appealedScopes?:readonly InstitutionalSuspensionScope[];filedAt:string;evaluatedAt:string;standingRefs?:readonly string[];independentReviewRefs?:readonly string[];approvalRefs?:readonly string[];finalNoticeRef?:string|null;evidenceRefs:readonly string[];auditRefs:readonly string[];replayRef:string;}):InstitutionalRevocationAppealEvaluation{
  iso(input.filedAt,"filedAt");iso(input.evaluatedAt,"evaluatedAt");
  const policy=createInstitutionalRevocationAppealPolicy(input.policy);const scopes=list(input.appealedScopes??[],"appealedScopes");const standing=list(input.standingRefs??[],"standingRefs");const reviews=list(input.independentReviewRefs??[],"independentReviewRefs");const approvals=list(input.approvalRefs??[],"approvalRefs");const evidence=list(input.evidenceRefs,"evidenceRefs");const reasons:string[]=[];
  if(input.revocation.decision!=="ALLOW"||!["PARTIALLY_REVOKED","FULLY_REVOKED"].includes(input.revocation.resultingState))reasons.push("appealable-revocation-required");
  if(!policy.allowedDispositions.includes(input.disposition))reasons.push("appeal-disposition-not-authorized");
  const filed=Date.parse(input.filedAt);const revoked=Date.parse(input.revocation.evaluatedAt);if(filed<revoked||filed-revoked>policy.filingWindowDays*86400000)reasons.push("appeal-filing-window-exceeded");
  if(!scopes.length)reasons.push("appealed-scopes-required");
  const revokedScopes=new Set(input.revocation.revokedScopes);for(const scope of scopes)if(!revokedScopes.has(scope)&&!revokedScopes.has("FULL_MATTER"))reasons.push(`scope-not-revoked:${scope.toLowerCase()}`);
  if((input.disposition==="MODIFY"||input.disposition==="REVERSE")&&!policy.scopeRestorationAuthorized)reasons.push("scope-restoration-not-authorized");
  if(policy.requireStanding&&!standing.length)reasons.push("standing-required");
  if(policy.requireIndependentReview&&!reviews.length)reasons.push("independent-review-required");
  if(policy.requireDispositionApproval&&!approvals.length)reasons.push("disposition-approval-required");
  if(policy.requireFinalNotice&&!input.finalNoticeRef?.trim())reasons.push("final-notice-required");
  for(const required of policy.requiredEvidenceRefs)if(!evidence.includes(required))reasons.push(`missing-evidence:${required}`);
  const reviewable=new Set(["standing-required","independent-review-required","disposition-approval-required","final-notice-required"]);const hard=reasons.some(reason=>!reviewable.has(reason));
  const decision:InstitutionalAppealDecision=hard?"BLOCK":reasons.length?"REVIEW_REQUIRED":"ALLOW";
  const resultingState:InstitutionalAppealState=decision==="BLOCK"?"BLOCKED":decision==="REVIEW_REQUIRED"?"REVIEW_PENDING":input.disposition==="AFFIRM"?"AFFIRMED":input.disposition==="MODIFY"?"MODIFIED":input.disposition==="REVERSE"?"REVERSED":"REMANDED";
  return Object.freeze({schemaVersion:INSTITUTIONAL_REVOCATION_APPEAL_SCHEMA_VERSION,revocationPolicyId:input.revocation.revocationPolicyId,appealPolicyId:policy.policyId,reconciliationId:input.revocation.reconciliationId,disposition:input.disposition,appealedScopes:scopes,decision,resultingState,reasons:Object.freeze([...new Set(reasons)].sort()),standingRefs:standing,reviewRefs:reviews,approvalRefs:approvals,evidenceRefs:evidence,filedAt:input.filedAt,evaluatedAt:input.evaluatedAt,auditRefs:list(input.auditRefs,"auditRefs",true),replayRef:nonEmpty(input.replayRef,"replayRef")});
}

export const institutionalRevocationAppealAuthority=Object.freeze({createPolicy:createInstitutionalRevocationAppealPolicy,evaluate:evaluateInstitutionalRevocationAppeal});
