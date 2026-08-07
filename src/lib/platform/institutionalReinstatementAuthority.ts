import type { InstitutionalSuspensionEvaluation, InstitutionalSuspensionScope } from "@/lib/platform/institutionalSuspensionAuthority";

export const INSTITUTIONAL_REINSTATEMENT_SCHEMA_VERSION = "institutional-reinstatement-v1";
export type InstitutionalReinstatementMode = "LIFT_SELECTED" | "LIFT_ALL" | "KEEP_SUSPENDED" | "ESCALATE";
export type InstitutionalReinstatementDecision = "ALLOW" | "BLOCK" | "REVIEW_REQUIRED";
export type InstitutionalReinstatementState = "PARTIALLY_REINSTATED" | "FULLY_REINSTATED" | "SUSPENDED" | "REVIEW_PENDING" | "ESCALATED";

export type InstitutionalReinstatementPolicy = Readonly<{
  policyId: string; governanceVersion: string; allowedModes: readonly InstitutionalReinstatementMode[];
  requireAllowedSuspension: boolean; requireRiskResolutionEvidence: boolean; requireIndependentReview: boolean;
  requireMonitoringPlan: boolean; requireAffectedPartyNotice: boolean; fullReinstatementAuthorized: boolean;
  claimReinstatementAuthorized: boolean; publicationReinstatementAuthorized: boolean;
  relianceReinstatementAuthorized: boolean; actionReinstatementAuthorized: boolean;
  requiredEvidenceRefs: readonly string[]; auditRefs: readonly string[]; replayRef: string; versionRefs: readonly string[];
}>;

export type InstitutionalReinstatementEvaluation = Readonly<{
  schemaVersion: typeof INSTITUTIONAL_REINSTATEMENT_SCHEMA_VERSION; suspensionPolicyId: string;
  reinstatementPolicyId: string; reconciliationId: string; mode: InstitutionalReinstatementMode;
  restoredScopes: readonly InstitutionalSuspensionScope[]; remainingScopes: readonly InstitutionalSuspensionScope[];
  decision: InstitutionalReinstatementDecision; resultingState: InstitutionalReinstatementState;
  reasons: readonly string[]; reviewRefs: readonly string[]; evidenceRefs: readonly string[];
  evaluatedAt: string; auditRefs: readonly string[]; replayRef: string;
}>;

const ISO_UTC=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
function nonEmpty(v:string,f:string){const n=v.trim();if(!n)throw new Error(`${f} must be non-empty.`);return n;}
function iso(v:string,f:string){if(!ISO_UTC.test(nonEmpty(v,f)))throw new Error(`${f} must be an explicit UTC ISO-8601 timestamp.`);return v;}
function list<T extends string>(v:readonly T[],f:string,r=false):readonly T[]{const n=v.map(x=>nonEmpty(x,f) as T);if(r&&!n.length)throw new Error(`${f} must contain at least one value.`);if(new Set(n).size!==n.length)throw new Error(`${f} must not contain duplicates.`);return Object.freeze([...n].sort()) as readonly T[];}

export function createInstitutionalReinstatementPolicy(input:InstitutionalReinstatementPolicy):InstitutionalReinstatementPolicy{
  if(input.allowedModes.includes("LIFT_ALL")&&!input.fullReinstatementAuthorized)throw new Error("Full reinstatement requires explicit authority.");
  return Object.freeze({...input,policyId:nonEmpty(input.policyId,"policyId"),governanceVersion:nonEmpty(input.governanceVersion,"governanceVersion"),allowedModes:list(input.allowedModes,"allowedModes",true),requiredEvidenceRefs:list(input.requiredEvidenceRefs,"requiredEvidenceRefs"),auditRefs:list(input.auditRefs,"auditRefs",true),replayRef:nonEmpty(input.replayRef,"replayRef"),versionRefs:list(input.versionRefs,"versionRefs",true)});
}

export function evaluateInstitutionalReinstatement(input:{suspension:InstitutionalSuspensionEvaluation;policy:InstitutionalReinstatementPolicy;mode:InstitutionalReinstatementMode;restoreScopes?:readonly InstitutionalSuspensionScope[];riskResolutionEvidenceRef?:string|null;independentReviewRefs?:readonly string[];monitoringPlanRef?:string|null;affectedPartyNoticeRef?:string|null;evidenceRefs:readonly string[];evaluatedAt:string;auditRefs:readonly string[];replayRef:string;}):InstitutionalReinstatementEvaluation{
  iso(input.evaluatedAt,"evaluatedAt");const p=createInstitutionalReinstatementPolicy(input.policy);const reviews=list(input.independentReviewRefs??[],"independentReviewRefs");const evidence=list(input.evidenceRefs,"evidenceRefs");const requested=list(input.restoreScopes??[],"restoreScopes");const reasons:string[]=[];
  if(p.requireAllowedSuspension&&input.suspension.decision!=="ALLOW")reasons.push(`suspension:${input.suspension.decision.toLowerCase()}`);
  if(!["SUSPENDED","PARTIALLY_SUSPENDED"].includes(input.suspension.resultingState))reasons.push("matter-not-suspended");
  if(!p.allowedModes.includes(input.mode))reasons.push("reinstatement-mode-not-authorized");
  if(input.mode==="LIFT_SELECTED"&&!requested.length)reasons.push("restored-scopes-required");
  for(const scope of requested)if(!input.suspension.scopes.includes(scope)&&!input.suspension.scopes.includes("FULL_MATTER"))reasons.push(`scope-not-suspended:${scope.toLowerCase()}`);
  const restored=input.mode==="LIFT_ALL"?[...input.suspension.scopes]:input.mode==="LIFT_SELECTED"?[...requested]:[];
  const restores=(scope:InstitutionalSuspensionScope)=>restored.includes(scope)||restored.includes("FULL_MATTER");
  if(input.mode==="LIFT_ALL"&&!p.fullReinstatementAuthorized)reasons.push("full-reinstatement-not-authorized");
  if(restores("CLAIM")&&!p.claimReinstatementAuthorized)reasons.push("claim-reinstatement-not-authorized");
  if(restores("PUBLICATION")&&!p.publicationReinstatementAuthorized)reasons.push("publication-reinstatement-not-authorized");
  if(restores("RELIANCE")&&!p.relianceReinstatementAuthorized)reasons.push("reliance-reinstatement-not-authorized");
  if(restores("ACTION")&&!p.actionReinstatementAuthorized)reasons.push("action-reinstatement-not-authorized");
  if((input.mode==="LIFT_ALL"||input.mode==="LIFT_SELECTED")&&p.requireRiskResolutionEvidence&&!input.riskResolutionEvidenceRef?.trim())reasons.push("risk-resolution-evidence-required");
  if((input.mode==="LIFT_ALL"||input.mode==="LIFT_SELECTED")&&p.requireIndependentReview&&!reviews.length)reasons.push("independent-review-required");
  if((input.mode==="LIFT_ALL"||input.mode==="LIFT_SELECTED")&&p.requireMonitoringPlan&&!input.monitoringPlanRef?.trim())reasons.push("monitoring-plan-required");
  if((input.mode==="LIFT_ALL"||input.mode==="LIFT_SELECTED")&&p.requireAffectedPartyNotice&&!input.affectedPartyNoticeRef?.trim())reasons.push("affected-party-notice-required");
  for(const r of p.requiredEvidenceRefs)if(!evidence.includes(r))reasons.push(`missing-evidence:${r}`);
  const reviewable=new Set(["risk-resolution-evidence-required","independent-review-required","monitoring-plan-required","affected-party-notice-required"]);
  const hard=reasons.some(r=>!reviewable.has(r));const decision:InstitutionalReinstatementDecision=hard?"BLOCK":reasons.length?"REVIEW_REQUIRED":"ALLOW";
  const remaining=input.mode==="LIFT_ALL"?[]:input.mode==="LIFT_SELECTED"?input.suspension.scopes.filter(scope=>!restored.includes(scope)):input.suspension.scopes;
  const resultingState:InstitutionalReinstatementState=decision==="REVIEW_REQUIRED"?"REVIEW_PENDING":decision!=="ALLOW"?"SUSPENDED":input.mode==="ESCALATE"?"ESCALATED":input.mode==="KEEP_SUSPENDED"?"SUSPENDED":remaining.length?"PARTIALLY_REINSTATED":"FULLY_REINSTATED";
  return Object.freeze({schemaVersion:INSTITUTIONAL_REINSTATEMENT_SCHEMA_VERSION,suspensionPolicyId:input.suspension.suspensionPolicyId,reinstatementPolicyId:p.policyId,reconciliationId:input.suspension.reconciliationId,mode:input.mode,restoredScopes:Object.freeze([...restored].sort()),remainingScopes:Object.freeze([...remaining].sort()),decision,resultingState,reasons:Object.freeze([...new Set(reasons)].sort()),reviewRefs:reviews,evidenceRefs:evidence,evaluatedAt:input.evaluatedAt,auditRefs:list(input.auditRefs,"auditRefs",true),replayRef:nonEmpty(input.replayRef,"replayRef")});
}

export const institutionalReinstatementAuthority=Object.freeze({createPolicy:createInstitutionalReinstatementPolicy,evaluate:evaluateInstitutionalReinstatement});
