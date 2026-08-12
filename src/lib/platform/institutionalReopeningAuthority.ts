import type { InstitutionalClosureEvaluation } from "@/lib/platform/institutionalClosureAuthority";

export const INSTITUTIONAL_REOPENING_SCHEMA_VERSION = "institutional-reopening-v1";
export type InstitutionalReopeningBasis = "NEW_EVIDENCE" | "APPEAL" | "FRAUD_INDICATOR" | "LEGAL_MANDATE" | "MONITORING_FAILURE";
export type InstitutionalReopeningDecision = "ALLOW" | "BLOCK" | "REVIEW_REQUIRED";
export type InstitutionalReopeningState = "REOPENED_RESTRICTED" | "REOPENED_FULL" | "REVIEW_PENDING" | "CLOSED";

export type InstitutionalReopeningPolicy = Readonly<{
  policyId: string; governanceVersion: string; allowedBases: readonly InstitutionalReopeningBasis[];
  requireClosedMatter: boolean; requireIndependentReview: boolean; requireMaterialityEvidence: boolean;
  requireLegalReview: boolean; requireFraudEscalation: boolean; fullReopeningAuthorized: boolean;
  requiredEvidenceRefs: readonly string[]; auditRefs: readonly string[]; replayRef: string; versionRefs: readonly string[];
}>;

export type InstitutionalReopeningEvaluation = Readonly<{
  schemaVersion: typeof INSTITUTIONAL_REOPENING_SCHEMA_VERSION; closurePolicyId: string; reopeningPolicyId: string;
  reconciliationId: string; basis: InstitutionalReopeningBasis; decision: InstitutionalReopeningDecision;
  resultingState: InstitutionalReopeningState; reasons: readonly string[]; reviewRefs: readonly string[];
  evidenceRefs: readonly string[]; evaluatedAt: string; auditRefs: readonly string[]; replayRef: string;
}>;

const ISO_UTC=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
function nonEmpty(v:string,f:string){const n=v.trim();if(!n)throw new Error(`${f} must be non-empty.`);return n;}
function iso(v:string,f:string){if(!ISO_UTC.test(nonEmpty(v,f)))throw new Error(`${f} must be an explicit UTC ISO-8601 timestamp.`);return v;}
function list<T extends string>(v:readonly T[],f:string,r=false):readonly T[]{const n=v.map(x=>nonEmpty(x,f) as T);if(r&&!n.length)throw new Error(`${f} must contain at least one value.`);if(new Set(n).size!==n.length)throw new Error(`${f} must not contain duplicates.`);return Object.freeze([...n].sort()) as readonly T[];}

export function createInstitutionalReopeningPolicy(input:InstitutionalReopeningPolicy):InstitutionalReopeningPolicy{
  return Object.freeze({...input,policyId:nonEmpty(input.policyId,"policyId"),governanceVersion:nonEmpty(input.governanceVersion,"governanceVersion"),allowedBases:list(input.allowedBases,"allowedBases",true),requiredEvidenceRefs:list(input.requiredEvidenceRefs,"requiredEvidenceRefs"),auditRefs:list(input.auditRefs,"auditRefs",true),replayRef:nonEmpty(input.replayRef,"replayRef"),versionRefs:list(input.versionRefs,"versionRefs",true)});
}

export function evaluateInstitutionalReopening(input:{closure:InstitutionalClosureEvaluation;policy:InstitutionalReopeningPolicy;basis:InstitutionalReopeningBasis;fullReopeningRequested:boolean;independentReviewRefs?:readonly string[];materialityEvidenceRef?:string|null;legalReviewRef?:string|null;fraudEscalationRef?:string|null;evidenceRefs:readonly string[];evaluatedAt:string;auditRefs:readonly string[];replayRef:string;}):InstitutionalReopeningEvaluation{
  iso(input.evaluatedAt,"evaluatedAt");const p=createInstitutionalReopeningPolicy(input.policy);const reviews=list(input.independentReviewRefs??[],"independentReviewRefs");const evidence=list(input.evidenceRefs,"evidenceRefs");const reasons:string[]=[];
  if(p.requireClosedMatter&&!input.closure.resultingState.startsWith("CLOSED_"))reasons.push("matter-not-closed");
  if(input.closure.decision!=="ALLOW")reasons.push(`closure:${input.closure.decision.toLowerCase()}`);
  if(!p.allowedBases.includes(input.basis))reasons.push("reopening-basis-not-authorized");
  if(p.requireIndependentReview&&!reviews.length)reasons.push("independent-review-required");
  if(p.requireMaterialityEvidence&&!input.materialityEvidenceRef?.trim())reasons.push("materiality-evidence-required");
  if((p.requireLegalReview||input.basis==="LEGAL_MANDATE")&&!input.legalReviewRef?.trim())reasons.push("legal-review-required");
  if((p.requireFraudEscalation||input.basis==="FRAUD_INDICATOR")&&!input.fraudEscalationRef?.trim())reasons.push("fraud-escalation-required");
  for(const r of p.requiredEvidenceRefs)if(!evidence.includes(r))reasons.push(`missing-evidence:${r}`);
  if(input.fullReopeningRequested&&!p.fullReopeningAuthorized)reasons.push("full-reopening-not-authorized");
  const reviewable=new Set(["independent-review-required","materiality-evidence-required","legal-review-required","fraud-escalation-required"]);
  const hard=reasons.some(r=>!reviewable.has(r));const decision:InstitutionalReopeningDecision=hard?"BLOCK":reasons.length?"REVIEW_REQUIRED":"ALLOW";
  const resultingState:InstitutionalReopeningState=decision==="REVIEW_REQUIRED"?"REVIEW_PENDING":decision!=="ALLOW"?"CLOSED":input.fullReopeningRequested?"REOPENED_FULL":"REOPENED_RESTRICTED";
  return Object.freeze({schemaVersion:INSTITUTIONAL_REOPENING_SCHEMA_VERSION,closurePolicyId:input.closure.closurePolicyId,reopeningPolicyId:p.policyId,reconciliationId:input.closure.reconciliationId,basis:input.basis,decision,resultingState,reasons:Object.freeze([...new Set(reasons)].sort()),reviewRefs:reviews,evidenceRefs:evidence,evaluatedAt:input.evaluatedAt,auditRefs:list(input.auditRefs,"auditRefs",true),replayRef:nonEmpty(input.replayRef,"replayRef")});
}

export const institutionalReopeningAuthority=Object.freeze({createPolicy:createInstitutionalReopeningPolicy,evaluate:evaluateInstitutionalReopening});
