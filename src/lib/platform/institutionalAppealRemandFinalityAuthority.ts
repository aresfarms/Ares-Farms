import type { InstitutionalAppealRemandMonitoringDischargeEvaluation } from "@/lib/platform/institutionalAppealRemandMonitoringDischargeAuthority";

export const INSTITUTIONAL_APPEAL_REMAND_FINALITY_SCHEMA_VERSION = "institutional-appeal-remand-finality-v1";
export type AppealRemandFinalityDecision = "ALLOW" | "BLOCK" | "REVIEW_REQUIRED";
export type AppealRemandFinalityState = "FINALIZED" | "REVIEW_PENDING" | "BLOCKED";

export type InstitutionalAppealRemandFinalityPolicy = Readonly<{
  policyId:string; governanceVersion:string; requireImmutableRecord:boolean;
  requireRetentionPolicy:boolean; requireLegalHoldAssessment:boolean;
  requireClosureNotice:boolean; requireReopeningAuthority:boolean;
  requiredEvidenceRefs:readonly string[]; auditRefs:readonly string[];
  replayRef:string; versionRefs:readonly string[];
}>;

export type InstitutionalAppealRemandFinalityEvaluation = Readonly<{
  schemaVersion:typeof INSTITUTIONAL_APPEAL_REMAND_FINALITY_SCHEMA_VERSION;
  dischargePolicyId:string; finalityPolicyId:string; reconciliationId:string;
  decision:AppealRemandFinalityDecision; resultingState:AppealRemandFinalityState;
  reasons:readonly string[]; immutableRecordRefs:readonly string[];
  evidenceRefs:readonly string[]; finalizedAt:string; auditRefs:readonly string[]; replayRef:string;
}>;

const ISO=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
function ne(v:string,f:string){const n=v.trim();if(!n)throw new Error(`${f} must be non-empty.`);return n;}
function iso(v:string,f:string){if(!ISO.test(ne(v,f)))throw new Error(`${f} must be an explicit UTC ISO-8601 timestamp.`);return v;}
function list(v:readonly string[],f:string,r=false){const n=v.map(x=>ne(x,f));if(r&&!n.length)throw new Error(`${f} must contain at least one value.`);if(new Set(n).size!==n.length)throw new Error(`${f} must not contain duplicates.`);return Object.freeze([...n].sort());}

export function createInstitutionalAppealRemandFinalityPolicy(input:InstitutionalAppealRemandFinalityPolicy):InstitutionalAppealRemandFinalityPolicy{
  return Object.freeze({...input,policyId:ne(input.policyId,"policyId"),governanceVersion:ne(input.governanceVersion,"governanceVersion"),requiredEvidenceRefs:list(input.requiredEvidenceRefs,"requiredEvidenceRefs"),auditRefs:list(input.auditRefs,"auditRefs",true),replayRef:ne(input.replayRef,"replayRef"),versionRefs:list(input.versionRefs,"versionRefs",true)});
}

export function evaluateInstitutionalAppealRemandFinality(input:{discharge:InstitutionalAppealRemandMonitoringDischargeEvaluation;policy:InstitutionalAppealRemandFinalityPolicy;immutableRecordRefs?:readonly string[];retentionPolicyRef?:string|null;legalHoldAssessmentRef?:string|null;closureNoticeRef?:string|null;reopeningAuthorityRef?:string|null;evidenceRefs:readonly string[];finalizedAt:string;auditRefs:readonly string[];replayRef:string;}):InstitutionalAppealRemandFinalityEvaluation{
  iso(input.finalizedAt,"finalizedAt");const p=createInstitutionalAppealRemandFinalityPolicy(input.policy);const records=list(input.immutableRecordRefs??[],"immutableRecordRefs");const evidence=list(input.evidenceRefs,"evidenceRefs");const reasons:string[]=[];
  if(input.discharge.decision!=="ALLOW"||input.discharge.resultingState!=="DISCHARGED")reasons.push("allowed-remand-discharge-required");
  if(p.requireImmutableRecord&&!records.length)reasons.push("immutable-record-required");
  if(p.requireRetentionPolicy&&!input.retentionPolicyRef?.trim())reasons.push("retention-policy-required");
  if(p.requireLegalHoldAssessment&&!input.legalHoldAssessmentRef?.trim())reasons.push("legal-hold-assessment-required");
  if(p.requireClosureNotice&&!input.closureNoticeRef?.trim())reasons.push("closure-notice-required");
  if(p.requireReopeningAuthority&&!input.reopeningAuthorityRef?.trim())reasons.push("reopening-authority-required");
  for(const r of p.requiredEvidenceRefs)if(!evidence.includes(r))reasons.push(`missing-evidence:${r}`);
  const reviewable=new Set(["closure-notice-required","legal-hold-assessment-required"]);const hard=reasons.some(r=>!reviewable.has(r));
  const decision:AppealRemandFinalityDecision=hard?"BLOCK":reasons.length?"REVIEW_REQUIRED":"ALLOW";
  return Object.freeze({schemaVersion:INSTITUTIONAL_APPEAL_REMAND_FINALITY_SCHEMA_VERSION,dischargePolicyId:input.discharge.dischargePolicyId,finalityPolicyId:p.policyId,reconciliationId:input.discharge.reconciliationId,decision,resultingState:decision==="ALLOW"?"FINALIZED":decision==="REVIEW_REQUIRED"?"REVIEW_PENDING":"BLOCKED",reasons:Object.freeze([...new Set(reasons)].sort()),immutableRecordRefs:records,evidenceRefs:evidence,finalizedAt:input.finalizedAt,auditRefs:list(input.auditRefs,"auditRefs",true),replayRef:ne(input.replayRef,"replayRef")});
}

export const institutionalAppealRemandFinalityAuthority=Object.freeze({createPolicy:createInstitutionalAppealRemandFinalityPolicy,evaluate:evaluateInstitutionalAppealRemandFinality});
