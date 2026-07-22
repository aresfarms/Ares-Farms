import type { InstitutionalAppealRemandArchiveReopeningSuspensionEvaluation, AppealRemandReopeningSuspensionScope } from "@/lib/platform/institutionalAppealRemandArchiveReopeningSuspensionAuthority";

export const INSTITUTIONAL_APPEAL_REMAND_ARCHIVE_REOPENING_REINSTATEMENT_SCHEMA_VERSION = "institutional-appeal-remand-archive-reopening-reinstatement-v1";
export type AppealRemandReopeningReinstatementMode = "LIFT_SELECTED" | "LIFT_ALL" | "KEEP_SUSPENDED" | "ESCALATE";
export type AppealRemandReopeningReinstatementDecision = "ALLOW" | "BLOCK" | "REVIEW_REQUIRED";
export type AppealRemandReopeningReinstatementState = "PARTIALLY_REINSTATED" | "FULLY_REINSTATED" | "SUSPENDED" | "REVIEW_PENDING" | "ESCALATED";

export type InstitutionalAppealRemandArchiveReopeningReinstatementPolicy = Readonly<{
  policyId:string; governanceVersion:string; allowedModes:readonly AppealRemandReopeningReinstatementMode[];
  requireAllowedSuspension:boolean; requireRiskResolutionEvidence:boolean; requireIndependentReview:boolean;
  requireMonitoringPlan:boolean; requireAffectedPartyNotice:boolean; fullReinstatementAuthorized:boolean;
  claimReinstatementAuthorized:boolean; publicationReinstatementAuthorized:boolean; relianceReinstatementAuthorized:boolean; actionReinstatementAuthorized:boolean;
  requiredEvidenceRefs:readonly string[]; auditRefs:readonly string[]; replayRef:string; versionRefs:readonly string[];
}>;

export type InstitutionalAppealRemandArchiveReopeningReinstatementEvaluation = Readonly<{
  schemaVersion:typeof INSTITUTIONAL_APPEAL_REMAND_ARCHIVE_REOPENING_REINSTATEMENT_SCHEMA_VERSION;
  suspensionPolicyId:string; reinstatementPolicyId:string; canonicalObjectId:string; mode:AppealRemandReopeningReinstatementMode;
  restoredScopes:readonly AppealRemandReopeningSuspensionScope[]; remainingScopes:readonly AppealRemandReopeningSuspensionScope[];
  decision:AppealRemandReopeningReinstatementDecision; resultingState:AppealRemandReopeningReinstatementState;
  reasons:readonly string[]; reviewRefs:readonly string[]; evidenceRefs:readonly string[]; evaluatedAt:string; auditRefs:readonly string[]; replayRef:string;
}>;

const ISO=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
function ne(v:string,f:string){const n=v.trim();if(!n)throw new Error(`${f} must be non-empty.`);return n;}
function iso(v:string,f:string){if(!ISO.test(ne(v,f)))throw new Error(`${f} must be an explicit UTC ISO-8601 timestamp.`);return v;}
function list<T extends string>(v:readonly T[],f:string,r=false):readonly T[]{const n=v.map(x=>ne(x,f) as T);if(r&&!n.length)throw new Error(`${f} must contain at least one value.`);if(new Set(n).size!==n.length)throw new Error(`${f} must not contain duplicates.`);return Object.freeze([...n].sort()) as readonly T[];}

export function createInstitutionalAppealRemandArchiveReopeningReinstatementPolicy(input:InstitutionalAppealRemandArchiveReopeningReinstatementPolicy){
  if(input.allowedModes.includes("LIFT_ALL")&&!input.fullReinstatementAuthorized)throw new Error("Full reinstatement requires explicit authority.");
  return Object.freeze({...input,policyId:ne(input.policyId,"policyId"),governanceVersion:ne(input.governanceVersion,"governanceVersion"),allowedModes:list(input.allowedModes,"allowedModes",true),requiredEvidenceRefs:list(input.requiredEvidenceRefs,"requiredEvidenceRefs"),auditRefs:list(input.auditRefs,"auditRefs",true),replayRef:ne(input.replayRef,"replayRef"),versionRefs:list(input.versionRefs,"versionRefs",true)});
}

export function evaluateInstitutionalAppealRemandArchiveReopeningReinstatement(input:{suspension:InstitutionalAppealRemandArchiveReopeningSuspensionEvaluation;policy:InstitutionalAppealRemandArchiveReopeningReinstatementPolicy;mode:AppealRemandReopeningReinstatementMode;restoreScopes?:readonly AppealRemandReopeningSuspensionScope[];riskResolutionEvidenceRef?:string|null;independentReviewRefs?:readonly string[];monitoringPlanRef?:string|null;affectedPartyNoticeRef?:string|null;evidenceRefs:readonly string[];evaluatedAt:string;auditRefs:readonly string[];replayRef:string;}):InstitutionalAppealRemandArchiveReopeningReinstatementEvaluation{
  iso(input.evaluatedAt,"evaluatedAt");const p=createInstitutionalAppealRemandArchiveReopeningReinstatementPolicy(input.policy);const reviews=list(input.independentReviewRefs??[],"independentReviewRefs");const evidence=list(input.evidenceRefs,"evidenceRefs");const requested=list(input.restoreScopes??[],"restoreScopes");const reasons:string[]=[];
  if(p.requireAllowedSuspension&&input.suspension.decision!=="ALLOW")reasons.push(`suspension:${input.suspension.decision.toLowerCase()}`);if(!["SUSPENDED","PARTIALLY_SUSPENDED"].includes(input.suspension.resultingState))reasons.push("matter-not-suspended");if(!p.allowedModes.includes(input.mode))reasons.push("reinstatement-mode-not-authorized");if(input.mode==="LIFT_SELECTED"&&!requested.length)reasons.push("restored-scopes-required");for(const s of requested)if(!input.suspension.scopes.includes(s)&&!input.suspension.scopes.includes("FULL_MATTER"))reasons.push(`scope-not-suspended:${s.toLowerCase()}`);
  const restored=input.mode==="LIFT_ALL"?[...input.suspension.scopes]:input.mode==="LIFT_SELECTED"?[...requested]:[];const restores=(s:AppealRemandReopeningSuspensionScope)=>restored.includes(s)||restored.includes("FULL_MATTER");
  if(input.mode==="LIFT_ALL"&&!p.fullReinstatementAuthorized)reasons.push("full-reinstatement-not-authorized");if(restores("CLAIM")&&!p.claimReinstatementAuthorized)reasons.push("claim-reinstatement-not-authorized");if(restores("PUBLICATION")&&!p.publicationReinstatementAuthorized)reasons.push("publication-reinstatement-not-authorized");if(restores("RELIANCE")&&!p.relianceReinstatementAuthorized)reasons.push("reliance-reinstatement-not-authorized");if(restores("ACTION")&&!p.actionReinstatementAuthorized)reasons.push("action-reinstatement-not-authorized");
  const lifting=input.mode==="LIFT_ALL"||input.mode==="LIFT_SELECTED";if(lifting&&p.requireRiskResolutionEvidence&&!input.riskResolutionEvidenceRef?.trim())reasons.push("risk-resolution-evidence-required");if(lifting&&p.requireIndependentReview&&!reviews.length)reasons.push("independent-review-required");if(lifting&&p.requireMonitoringPlan&&!input.monitoringPlanRef?.trim())reasons.push("monitoring-plan-required");if(lifting&&p.requireAffectedPartyNotice&&!input.affectedPartyNoticeRef?.trim())reasons.push("affected-party-notice-required");if(input.suspension.replayRef!==input.replayRef)reasons.push("replay-continuity-required");for(const r of p.requiredEvidenceRefs)if(!evidence.includes(r))reasons.push(`missing-evidence:${r}`);
  const reviewable=new Set(["risk-resolution-evidence-required","independent-review-required","monitoring-plan-required","affected-party-notice-required"]);const hard=reasons.some(r=>!reviewable.has(r));const decision:AppealRemandReopeningReinstatementDecision=hard?"BLOCK":reasons.length?"REVIEW_REQUIRED":"ALLOW";const remaining=input.mode==="LIFT_ALL"?[]:input.mode==="LIFT_SELECTED"?input.suspension.scopes.filter(s=>!restored.includes(s)):input.suspension.scopes;const resultingState:AppealRemandReopeningReinstatementState=decision==="REVIEW_REQUIRED"?"REVIEW_PENDING":decision!=="ALLOW"?"SUSPENDED":input.mode==="ESCALATE"?"ESCALATED":input.mode==="KEEP_SUSPENDED"?"SUSPENDED":remaining.length?"PARTIALLY_REINSTATED":"FULLY_REINSTATED";
  return Object.freeze({schemaVersion:INSTITUTIONAL_APPEAL_REMAND_ARCHIVE_REOPENING_REINSTATEMENT_SCHEMA_VERSION,suspensionPolicyId:input.suspension.suspensionPolicyId,reinstatementPolicyId:p.policyId,canonicalObjectId:input.suspension.canonicalObjectId,mode:input.mode,restoredScopes:Object.freeze([...restored].sort()),remainingScopes:Object.freeze([...remaining].sort()),decision,resultingState,reasons:Object.freeze([...new Set(reasons)].sort()),reviewRefs:reviews,evidenceRefs:evidence,evaluatedAt:input.evaluatedAt,auditRefs:list(input.auditRefs,"auditRefs",true),replayRef:ne(input.replayRef,"replayRef")});
}
export const institutionalAppealRemandArchiveReopeningReinstatementAuthority=Object.freeze({createPolicy:createInstitutionalAppealRemandArchiveReopeningReinstatementPolicy,evaluate:evaluateInstitutionalAppealRemandArchiveReopeningReinstatement});
