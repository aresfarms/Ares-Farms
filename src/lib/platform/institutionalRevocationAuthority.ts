import type { InstitutionalMonitoringEvaluation } from "@/lib/platform/institutionalPostReinstatementMonitoringAuthority";
import type { InstitutionalSuspensionScope } from "@/lib/platform/institutionalSuspensionAuthority";

export const INSTITUTIONAL_REVOCATION_SCHEMA_VERSION = "institutional-revocation-v1";
export type InstitutionalRevocationMode = "REVOKE_SELECTED" | "REVOKE_ALL" | "DECLINE_REVOCATION" | "ESCALATE";
export type InstitutionalRevocationDecision = "ALLOW" | "BLOCK" | "REVIEW_REQUIRED";
export type InstitutionalRevocationState = "PARTIALLY_REVOKED" | "FULLY_REVOKED" | "ACTIVE" | "REVIEW_PENDING" | "ESCALATED";

export type InstitutionalRevocationPolicy = Readonly<{
  policyId: string; governanceVersion: string; allowedModes: readonly InstitutionalRevocationMode[];
  requireMonitoringTrigger: boolean; requireHumanApproval: boolean; requireFinalNotice: boolean;
  fullRevocationAuthorized: boolean; claimRevocationAuthorized: boolean; publicationRevocationAuthorized: boolean;
  relianceRevocationAuthorized: boolean; actionRevocationAuthorized: boolean;
  requiredEvidenceRefs: readonly string[]; auditRefs: readonly string[]; replayRef: string; versionRefs: readonly string[];
}>;

export type InstitutionalRevocationEvaluation = Readonly<{
  schemaVersion: typeof INSTITUTIONAL_REVOCATION_SCHEMA_VERSION; monitoringPolicyId: string;
  revocationPolicyId: string; reconciliationId: string; mode: InstitutionalRevocationMode;
  revokedScopes: readonly InstitutionalSuspensionScope[]; decision: InstitutionalRevocationDecision;
  resultingState: InstitutionalRevocationState; reasons: readonly string[]; approvalRefs: readonly string[];
  evidenceRefs: readonly string[]; evaluatedAt: string; auditRefs: readonly string[]; replayRef: string;
}>;

const ISO_UTC=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
function nonEmpty(v:string,f:string){const n=v.trim();if(!n)throw new Error(`${f} must be non-empty.`);return n;}
function iso(v:string,f:string){if(!ISO_UTC.test(nonEmpty(v,f)))throw new Error(`${f} must be an explicit UTC ISO-8601 timestamp.`);return v;}
function list<T extends string>(v:readonly T[],f:string,r=false):readonly T[]{const n=v.map(x=>nonEmpty(x,f) as T);if(r&&!n.length)throw new Error(`${f} must contain at least one value.`);if(new Set(n).size!==n.length)throw new Error(`${f} must not contain duplicates.`);return Object.freeze([...n].sort()) as readonly T[];}

export function createInstitutionalRevocationPolicy(input:InstitutionalRevocationPolicy):InstitutionalRevocationPolicy{
  if(input.allowedModes.includes("REVOKE_ALL")&&!input.fullRevocationAuthorized)throw new Error("Full revocation requires explicit authority.");
  return Object.freeze({...input,policyId:nonEmpty(input.policyId,"policyId"),governanceVersion:nonEmpty(input.governanceVersion,"governanceVersion"),allowedModes:list(input.allowedModes,"allowedModes",true),requiredEvidenceRefs:list(input.requiredEvidenceRefs,"requiredEvidenceRefs"),auditRefs:list(input.auditRefs,"auditRefs",true),replayRef:nonEmpty(input.replayRef,"replayRef"),versionRefs:list(input.versionRefs,"versionRefs",true)});
}

export function evaluateInstitutionalRevocation(input:{monitoring:InstitutionalMonitoringEvaluation;policy:InstitutionalRevocationPolicy;mode:InstitutionalRevocationMode;revokeScopes?:readonly InstitutionalSuspensionScope[];approvalRefs?:readonly string[];finalNoticeRef?:string|null;evidenceRefs:readonly string[];evaluatedAt:string;auditRefs:readonly string[];replayRef:string;}):InstitutionalRevocationEvaluation{
  iso(input.evaluatedAt,"evaluatedAt");const p=createInstitutionalRevocationPolicy(input.policy);const approvals=list(input.approvalRefs??[],"approvalRefs");const evidence=list(input.evidenceRefs,"evidenceRefs");const requested=list(input.revokeScopes??[],"revokeScopes");const reasons:string[]=[];
  if(!p.allowedModes.includes(input.mode))reasons.push("revocation-mode-not-authorized");
  if(p.requireMonitoringTrigger&&!["RESUSPEND","ESCALATE"].includes(input.monitoring.decision))reasons.push("monitoring-trigger-required");
  if(input.mode==="REVOKE_SELECTED"&&!requested.length)reasons.push("revoked-scopes-required");
  const revoked=input.mode==="REVOKE_ALL"?["FULL_MATTER" as InstitutionalSuspensionScope]:input.mode==="REVOKE_SELECTED"?[...requested]:[];
  const revokes=(scope:InstitutionalSuspensionScope)=>revoked.includes(scope)||revoked.includes("FULL_MATTER");
  if(input.mode==="REVOKE_ALL"&&!p.fullRevocationAuthorized)reasons.push("full-revocation-not-authorized");
  if(revokes("CLAIM")&&!p.claimRevocationAuthorized)reasons.push("claim-revocation-not-authorized");
  if(revokes("PUBLICATION")&&!p.publicationRevocationAuthorized)reasons.push("publication-revocation-not-authorized");
  if(revokes("RELIANCE")&&!p.relianceRevocationAuthorized)reasons.push("reliance-revocation-not-authorized");
  if(revokes("ACTION")&&!p.actionRevocationAuthorized)reasons.push("action-revocation-not-authorized");
  if((input.mode==="REVOKE_ALL"||input.mode==="REVOKE_SELECTED")&&p.requireHumanApproval&&!approvals.length)reasons.push("human-approval-required");
  if((input.mode==="REVOKE_ALL"||input.mode==="REVOKE_SELECTED")&&p.requireFinalNotice&&!input.finalNoticeRef?.trim())reasons.push("final-notice-required");
  for(const r of p.requiredEvidenceRefs)if(!evidence.includes(r))reasons.push(`missing-evidence:${r}`);
  const reviewable=new Set(["human-approval-required","final-notice-required"]);const hard=reasons.some(r=>!reviewable.has(r));
  const decision:InstitutionalRevocationDecision=hard?"BLOCK":reasons.length?"REVIEW_REQUIRED":"ALLOW";
  const resultingState:InstitutionalRevocationState=decision==="REVIEW_REQUIRED"?"REVIEW_PENDING":decision!=="ALLOW"?"ACTIVE":input.mode==="ESCALATE"?"ESCALATED":input.mode==="DECLINE_REVOCATION"?"ACTIVE":input.mode==="REVOKE_ALL"?"FULLY_REVOKED":"PARTIALLY_REVOKED";
  return Object.freeze({schemaVersion:INSTITUTIONAL_REVOCATION_SCHEMA_VERSION,monitoringPolicyId:input.monitoring.monitoringPolicyId,revocationPolicyId:p.policyId,reconciliationId:input.monitoring.reconciliationId,mode:input.mode,revokedScopes:Object.freeze([...revoked].sort()),decision,resultingState,reasons:Object.freeze([...new Set(reasons)].sort()),approvalRefs:approvals,evidenceRefs:evidence,evaluatedAt:input.evaluatedAt,auditRefs:list(input.auditRefs,"auditRefs",true),replayRef:nonEmpty(input.replayRef,"replayRef")});
}

export const institutionalRevocationAuthority=Object.freeze({createPolicy:createInstitutionalRevocationPolicy,evaluate:evaluateInstitutionalRevocation});
