import type { CanonicalInstitutionalObjectEnvelope } from "@/lib/platform/canonicalInstitutionalObjectAuthority";
import type { InstitutionalAppealRemandArchiveReopeningFinalityEvaluation } from "@/lib/platform/institutionalAppealRemandArchiveReopeningFinalityAuthority";

export const INSTITUTIONAL_APPEAL_REMAND_ARCHIVE_REOPENING_ARCHIVE_PROJECTION_SCHEMA_VERSION = "institutional-appeal-remand-archive-reopening-archive-projection-v1";
export type AppealRemandArchiveReopeningArchiveProjectionDecision = "ALLOW" | "REVIEW_REQUIRED" | "BLOCK";
export type AppealRemandArchiveReopeningArchiveProjectionState = "ARCHIVED" | "REVIEW_PENDING" | "BLOCKED";

export type InstitutionalAppealRemandArchiveReopeningArchiveProjectionPolicy = Readonly<{
  policyId:string; governanceVersion:string; requireArchivedLifecycle:boolean;
  requireRetentionContinuity:boolean; requireLegalHoldContinuity:boolean;
  requireFinalityRecordLink:boolean; requiredEvidenceRefs:readonly string[];
  auditRefs:readonly string[]; replayRef:string; versionRefs:readonly string[];
}>;

export type InstitutionalAppealRemandArchiveReopeningArchiveProjectionEvaluation = Readonly<{
  schemaVersion:typeof INSTITUTIONAL_APPEAL_REMAND_ARCHIVE_REOPENING_ARCHIVE_PROJECTION_SCHEMA_VERSION;
  finalityPolicyId:string; projectionPolicyId:string; canonicalObjectId:string;
  decision:AppealRemandArchiveReopeningArchiveProjectionDecision; resultingState:AppealRemandArchiveReopeningArchiveProjectionState;
  reasons:readonly string[]; evidenceRefs:readonly string[]; projectedAt:string;
  auditRefs:readonly string[]; replayRef:string;
}>;

const ISO=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
function ne(v:string,f:string){const n=v.trim();if(!n)throw new Error(`${f} must be non-empty.`);return n;}
function iso(v:string,f:string){if(!ISO.test(ne(v,f)))throw new Error(`${f} must be an explicit UTC ISO-8601 timestamp.`);return v;}
function list(v:readonly string[],f:string,r=false){const n=v.map(x=>ne(x,f));if(r&&!n.length)throw new Error(`${f} must contain at least one value.`);if(new Set(n).size!==n.length)throw new Error(`${f} must not contain duplicates.`);return Object.freeze([...n].sort());}

export function createInstitutionalAppealRemandArchiveReopeningArchiveProjectionPolicy(input:InstitutionalAppealRemandArchiveReopeningArchiveProjectionPolicy):InstitutionalAppealRemandArchiveReopeningArchiveProjectionPolicy{
  return Object.freeze({...input,policyId:ne(input.policyId,"policyId"),governanceVersion:ne(input.governanceVersion,"governanceVersion"),requiredEvidenceRefs:list(input.requiredEvidenceRefs,"requiredEvidenceRefs"),auditRefs:list(input.auditRefs,"auditRefs",true),replayRef:ne(input.replayRef,"replayRef"),versionRefs:list(input.versionRefs,"versionRefs",true)});
}

export function evaluateInstitutionalAppealRemandArchiveReopeningArchiveProjection(input:{finality:InstitutionalAppealRemandArchiveReopeningFinalityEvaluation;policy:InstitutionalAppealRemandArchiveReopeningArchiveProjectionPolicy;canonicalObject:CanonicalInstitutionalObjectEnvelope;finalityRecordRef?:string|null;retentionContinuityConfirmed:boolean;legalHoldContinuityConfirmed:boolean;evidenceRefs:readonly string[];projectedAt:string;auditRefs:readonly string[];replayRef:string;}):InstitutionalAppealRemandArchiveReopeningArchiveProjectionEvaluation{
  iso(input.projectedAt,"projectedAt");const p=createInstitutionalAppealRemandArchiveReopeningArchiveProjectionPolicy(input.policy);const evidence=list(input.evidenceRefs,"evidenceRefs");const reasons:string[]=[];
  if(input.finality.decision!=="ALLOW"||input.finality.resultingState!=="FINALIZED")reasons.push("finalized-remand-reopening-required");
  if(input.finality.canonicalObjectId!==input.canonicalObject.canonicalObjectId)reasons.push("canonical-object-mismatch");
  if(input.finality.replayRef!==input.replayRef)reasons.push("replay-continuity-required");
  if(p.requireArchivedLifecycle&&input.canonicalObject.lifecycle.state!=="ARCHIVED")reasons.push("archived-canonical-lifecycle-required");
  if(Date.parse(input.canonicalObject.lifecycle.effectiveAt)<Date.parse(input.finality.finalizedAt))reasons.push("archive-effective-time-precedes-finality");
  if(p.requireRetentionContinuity&&!input.retentionContinuityConfirmed)reasons.push("retention-continuity-required");
  if(p.requireLegalHoldContinuity&&!input.legalHoldContinuityConfirmed)reasons.push("legal-hold-continuity-required");
  if(p.requireFinalityRecordLink&&!input.finalityRecordRef?.trim())reasons.push("finality-record-link-required");
  if(input.canonicalObject.replayRef!==input.replayRef)reasons.push("replay-continuity-required");
  for(const r of p.requiredEvidenceRefs)if(!evidence.includes(r))reasons.push(`missing-evidence:${r}`);
  const reviewable=new Set(["finality-record-link-required"]);const hard=reasons.some(r=>!reviewable.has(r));
  const decision:AppealRemandArchiveReopeningArchiveProjectionDecision=hard?"BLOCK":reasons.length?"REVIEW_REQUIRED":"ALLOW";
  return Object.freeze({schemaVersion:INSTITUTIONAL_APPEAL_REMAND_ARCHIVE_REOPENING_ARCHIVE_PROJECTION_SCHEMA_VERSION,finalityPolicyId:input.finality.finalityPolicyId,projectionPolicyId:p.policyId,canonicalObjectId:input.canonicalObject.canonicalObjectId,decision,resultingState:decision==="ALLOW"?"ARCHIVED":decision==="REVIEW_REQUIRED"?"REVIEW_PENDING":"BLOCKED",reasons:Object.freeze([...new Set(reasons)].sort()),evidenceRefs:evidence,projectedAt:input.projectedAt,auditRefs:list(input.auditRefs,"auditRefs",true),replayRef:ne(input.replayRef,"replayRef")});
}

export const institutionalAppealRemandArchiveReopeningArchiveProjectionAuthority=Object.freeze({createPolicy:createInstitutionalAppealRemandArchiveReopeningArchiveProjectionPolicy,evaluate:evaluateInstitutionalAppealRemandArchiveReopeningArchiveProjection});
