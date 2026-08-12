import type { InstitutionalLifecycleCyclePostReinstatementMonitoringEvaluation } from "@/lib/platform/institutionalLifecycleCyclePostReinstatementMonitoringAuthority";

export const INSTITUTIONAL_LIFECYCLE_CYCLE_MONITORING_DISCHARGE_SCHEMA_VERSION = "institutional-lifecycle-cycle-monitoring-discharge-v1";
export type InstitutionalLifecycleCycleMonitoringDischargeMode = "DISCHARGE" | "EXTEND" | "ESCALATE";
export type InstitutionalLifecycleCycleMonitoringDischargeDecision = "ALLOW" | "BLOCK" | "REVIEW_REQUIRED";
export type InstitutionalLifecycleCycleMonitoringDischargeState = "DISCHARGED" | "MONITORING_EXTENDED" | "ESCALATED" | "REVIEW_PENDING" | "BLOCKED";

export type InstitutionalLifecycleCycleMonitoringDischargePolicy = Readonly<{
  policyId:string; governanceVersion:string; minimumMonitoringDays:number;
  requireCleanReviewHistory:boolean; requireFinalAssessment:boolean; requireHumanApproval:boolean; requireFinalNotice:boolean;
  requiredEvidenceRefs:readonly string[]; auditRefs:readonly string[]; replayRef:string; versionRefs:readonly string[];
}>;

export type InstitutionalLifecycleCycleMonitoringDischargeEvaluation = Readonly<{
  schemaVersion:typeof INSTITUTIONAL_LIFECYCLE_CYCLE_MONITORING_DISCHARGE_SCHEMA_VERSION;
  cyclePolicyId:string; cycleId:string; generation:number; monitoringPolicyId:string; dischargePolicyId:string; canonicalObjectId:string;
  mode:InstitutionalLifecycleCycleMonitoringDischargeMode; decision:InstitutionalLifecycleCycleMonitoringDischargeDecision;
  resultingState:InstitutionalLifecycleCycleMonitoringDischargeState; reasons:readonly string[];
  approvalRefs:readonly string[]; evidenceRefs:readonly string[]; evaluatedAt:string; auditRefs:readonly string[]; replayRef:string;
}>;

const ISO=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
function ne(v:string,f:string){const n=v.trim();if(!n)throw new Error(`${f} must be non-empty.`);return n;}
function iso(v:string,f:string){if(!ISO.test(ne(v,f)))throw new Error(`${f} must be an explicit UTC ISO-8601 timestamp.`);return v;}
function list<T extends string>(v:readonly T[],f:string,r=false):readonly T[]{const n=v.map(x=>ne(x,f) as T);if(r&&!n.length)throw new Error(`${f} must contain at least one value.`);if(new Set(n).size!==n.length)throw new Error(`${f} must not contain duplicates.`);return Object.freeze([...n].sort()) as readonly T[];}

export function createInstitutionalLifecycleCycleMonitoringDischargePolicy(input:InstitutionalLifecycleCycleMonitoringDischargePolicy){
  if(!Number.isInteger(input.minimumMonitoringDays)||input.minimumMonitoringDays<1)throw new Error("minimumMonitoringDays must be a positive integer.");
  return Object.freeze({...input,policyId:ne(input.policyId,"policyId"),governanceVersion:ne(input.governanceVersion,"governanceVersion"),requiredEvidenceRefs:list(input.requiredEvidenceRefs,"requiredEvidenceRefs"),auditRefs:list(input.auditRefs,"auditRefs",true),replayRef:ne(input.replayRef,"replayRef"),versionRefs:list(input.versionRefs,"versionRefs",true)});
}

export function evaluateInstitutionalLifecycleCycleMonitoringDischarge(input:{monitoring:InstitutionalLifecycleCyclePostReinstatementMonitoringEvaluation;policy:InstitutionalLifecycleCycleMonitoringDischargePolicy;mode:InstitutionalLifecycleCycleMonitoringDischargeMode;monitoringStartedAt:string;evaluatedAt:string;cleanReviewHistory:boolean;finalAssessmentRef?:string|null;approvalRefs?:readonly string[];finalNoticeRef?:string|null;evidenceRefs:readonly string[];auditRefs:readonly string[];replayRef:string;}):InstitutionalLifecycleCycleMonitoringDischargeEvaluation{
  iso(input.monitoringStartedAt,"monitoringStartedAt");iso(input.evaluatedAt,"evaluatedAt");const p=createInstitutionalLifecycleCycleMonitoringDischargePolicy(input.policy);const approvals=list(input.approvalRefs??[],"approvalRefs");const evidence=list(input.evidenceRefs,"evidenceRefs");const reasons:string[]=[];
  if(input.monitoring.decision!=="CONTINUE"||!["ACTIVE","COMPLETE"].includes(input.monitoring.resultingState))reasons.push("stable-cycle-monitoring-required");
  if(input.monitoring.replayRef!==input.replayRef)reasons.push("replay-continuity-required");
  const days=(Date.parse(input.evaluatedAt)-Date.parse(input.monitoringStartedAt))/86400000;if(days<p.minimumMonitoringDays)reasons.push("minimum-monitoring-period-not-met");
  if(input.mode==="DISCHARGE"&&p.requireCleanReviewHistory&&!input.cleanReviewHistory)reasons.push("clean-review-history-required");
  if(input.mode==="DISCHARGE"&&p.requireFinalAssessment&&!input.finalAssessmentRef?.trim())reasons.push("final-assessment-required");
  if(input.mode==="DISCHARGE"&&p.requireHumanApproval&&!approvals.length)reasons.push("human-approval-required");
  if(input.mode==="DISCHARGE"&&p.requireFinalNotice&&!input.finalNoticeRef?.trim())reasons.push("final-notice-required");
  for(const r of p.requiredEvidenceRefs)if(!evidence.includes(r))reasons.push(`missing-evidence:${r}`);
  const reviewable=new Set(["final-assessment-required","human-approval-required","final-notice-required"]);const hard=reasons.some(r=>!reviewable.has(r));const decision:InstitutionalLifecycleCycleMonitoringDischargeDecision=hard?"BLOCK":reasons.length?"REVIEW_REQUIRED":"ALLOW";
  const resultingState:InstitutionalLifecycleCycleMonitoringDischargeState=decision==="BLOCK"?"BLOCKED":decision==="REVIEW_REQUIRED"?"REVIEW_PENDING":input.mode==="DISCHARGE"?"DISCHARGED":input.mode==="EXTEND"?"MONITORING_EXTENDED":"ESCALATED";
  return Object.freeze({schemaVersion:INSTITUTIONAL_LIFECYCLE_CYCLE_MONITORING_DISCHARGE_SCHEMA_VERSION,cyclePolicyId:input.monitoring.cyclePolicyId,cycleId:input.monitoring.cycleId,generation:input.monitoring.generation,monitoringPolicyId:input.monitoring.monitoringPolicyId,dischargePolicyId:p.policyId,canonicalObjectId:input.monitoring.canonicalObjectId,mode:input.mode,decision,resultingState,reasons:Object.freeze([...new Set(reasons)].sort()),approvalRefs:approvals,evidenceRefs:evidence,evaluatedAt:input.evaluatedAt,auditRefs:list(input.auditRefs,"auditRefs",true),replayRef:ne(input.replayRef,"replayRef")});
}

export const institutionalLifecycleCycleMonitoringDischargeAuthority=Object.freeze({createPolicy:createInstitutionalLifecycleCycleMonitoringDischargePolicy,evaluate:evaluateInstitutionalLifecycleCycleMonitoringDischarge});
