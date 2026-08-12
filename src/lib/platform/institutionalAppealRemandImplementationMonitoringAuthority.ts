import type { InstitutionalAppealRemandDispositionImplementationEvaluation } from "@/lib/platform/institutionalAppealRemandDispositionImplementationAuthority";
import type { InstitutionalSuspensionScope } from "@/lib/platform/institutionalSuspensionAuthority";

export const INSTITUTIONAL_APPEAL_REMAND_IMPLEMENTATION_MONITORING_SCHEMA_VERSION = "institutional-appeal-remand-implementation-monitoring-v1";
export type AppealRemandMonitoringSeverity = "INFO" | "WARNING" | "MATERIAL" | "CRITICAL";
export type AppealRemandMonitoringDecision = "CONTINUE" | "REVIEW_REQUIRED" | "CORRECTIVE_ACTION" | "ESCALATE";
export type AppealRemandMonitoringState = "ACTIVE" | "REVIEW_PENDING" | "CORRECTIVE_ACTION_REQUIRED" | "ESCALATED" | "COMPLETE";

export type InstitutionalAppealRemandImplementationMonitoringPolicy = Readonly<{
  policyId:string; governanceVersion:string; monitoredScopes:readonly InstitutionalSuspensionScope[];
  reviewThreshold:number; correctiveActionThreshold:number; criticalSignalForcesEscalation:boolean;
  requireHumanReviewForMaterialSignals:boolean; requireCorrectiveActionNotice:boolean;
  requiredEvidenceRefs:readonly string[]; auditRefs:readonly string[]; replayRef:string; versionRefs:readonly string[];
}>;

export type InstitutionalAppealRemandImplementationSignal = Readonly<{
  signalId:string; scope:InstitutionalSuspensionScope; severity:AppealRemandMonitoringSeverity;
  score:number; evidenceRefs:readonly string[]; observedAt:string;
}>;

export type InstitutionalAppealRemandImplementationMonitoringEvaluation = Readonly<{
  schemaVersion:typeof INSTITUTIONAL_APPEAL_REMAND_IMPLEMENTATION_MONITORING_SCHEMA_VERSION;
  implementationPolicyId:string; monitoringPolicyId:string; reconciliationId:string;
  decision:AppealRemandMonitoringDecision; resultingState:AppealRemandMonitoringState;
  aggregateScore:number; reasons:readonly string[]; affectedScopes:readonly InstitutionalSuspensionScope[];
  signalRefs:readonly string[]; reviewRefs:readonly string[]; evidenceRefs:readonly string[];
  evaluatedAt:string; auditRefs:readonly string[]; replayRef:string;
}>;

const ISO=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
function ne(v:string,f:string){const n=v.trim();if(!n)throw new Error(`${f} must be non-empty.`);return n;}
function iso(v:string,f:string){if(!ISO.test(ne(v,f)))throw new Error(`${f} must be an explicit UTC ISO-8601 timestamp.`);return v;}
function list<T extends string>(v:readonly T[],f:string,r=false):readonly T[]{const n=v.map(x=>ne(x,f) as T);if(r&&!n.length)throw new Error(`${f} must contain at least one value.`);if(new Set(n).size!==n.length)throw new Error(`${f} must not contain duplicates.`);return Object.freeze([...n].sort()) as readonly T[];}
function threshold(v:number,f:string){if(!Number.isFinite(v)||v<0||v>1)throw new Error(`${f} must be between 0 and 1.`);return v;}

export function createInstitutionalAppealRemandImplementationMonitoringPolicy(input:InstitutionalAppealRemandImplementationMonitoringPolicy):InstitutionalAppealRemandImplementationMonitoringPolicy{
  const reviewThreshold=threshold(input.reviewThreshold,"reviewThreshold");const correctiveActionThreshold=threshold(input.correctiveActionThreshold,"correctiveActionThreshold");
  if(reviewThreshold>=correctiveActionThreshold)throw new Error("reviewThreshold must be lower than correctiveActionThreshold.");
  return Object.freeze({...input,policyId:ne(input.policyId,"policyId"),governanceVersion:ne(input.governanceVersion,"governanceVersion"),monitoredScopes:list(input.monitoredScopes,"monitoredScopes",true),reviewThreshold,correctiveActionThreshold,requiredEvidenceRefs:list(input.requiredEvidenceRefs,"requiredEvidenceRefs"),auditRefs:list(input.auditRefs,"auditRefs",true),replayRef:ne(input.replayRef,"replayRef"),versionRefs:list(input.versionRefs,"versionRefs",true)});
}

export function createInstitutionalAppealRemandImplementationSignal(input:InstitutionalAppealRemandImplementationSignal):InstitutionalAppealRemandImplementationSignal{
  return Object.freeze({...input,signalId:ne(input.signalId,"signalId"),score:threshold(input.score,"score"),evidenceRefs:list(input.evidenceRefs,"evidenceRefs",true),observedAt:iso(input.observedAt,"observedAt")});
}

export function evaluateInstitutionalAppealRemandImplementationMonitoring(input:{implementation:InstitutionalAppealRemandDispositionImplementationEvaluation;policy:InstitutionalAppealRemandImplementationMonitoringPolicy;signals:readonly InstitutionalAppealRemandImplementationSignal[];humanReviewRefs?:readonly string[];correctiveActionNoticeRef?:string|null;evidenceRefs:readonly string[];evaluatedAt:string;auditRefs:readonly string[];replayRef:string;monitoringComplete?:boolean;}):InstitutionalAppealRemandImplementationMonitoringEvaluation{
  iso(input.evaluatedAt,"evaluatedAt");const p=createInstitutionalAppealRemandImplementationMonitoringPolicy(input.policy);const signals=input.signals.map(createInstitutionalAppealRemandImplementationSignal);const reviews=list(input.humanReviewRefs??[],"humanReviewRefs");const evidence=list(input.evidenceRefs,"evidenceRefs");const reasons:string[]=[];
  if(input.implementation.decision!=="ALLOW")reasons.push("allowed-remand-implementation-required");
  if(!["PARTIALLY_IMPLEMENTED","FULLY_IMPLEMENTED"].includes(input.implementation.resultingState))reasons.push("implemented-remand-disposition-required");
  const implemented=new Set(input.implementation.affectedScopes);for(const signal of signals){if(!implemented.has(signal.scope)&&input.implementation.resultingState!=="FULLY_IMPLEMENTED")reasons.push(`scope-not-implemented:${signal.scope.toLowerCase()}`);if(!p.monitoredScopes.includes(signal.scope)&&!p.monitoredScopes.includes("FULL_MATTER"))reasons.push(`scope-not-monitored:${signal.scope.toLowerCase()}`);}
  for(const r of p.requiredEvidenceRefs)if(!evidence.includes(r))reasons.push(`missing-evidence:${r}`);
  const aggregateScore=signals.length?Math.max(...signals.map(s=>s.score)):0;const critical=signals.some(s=>s.severity==="CRITICAL");const material=signals.some(s=>s.severity==="MATERIAL"||s.severity==="CRITICAL");
  if(material&&p.requireHumanReviewForMaterialSignals&&!reviews.length)reasons.push("human-review-required");const corrective=aggregateScore>=p.correctiveActionThreshold;if(corrective&&p.requireCorrectiveActionNotice&&!input.correctiveActionNoticeRef?.trim())reasons.push("corrective-action-notice-required");
  const hard=reasons.some(r=>r==="allowed-remand-implementation-required"||r==="implemented-remand-disposition-required"||r.startsWith("scope-not-implemented:")||r.startsWith("scope-not-monitored:")||r.startsWith("missing-evidence:"));
  let decision:AppealRemandMonitoringDecision="CONTINUE";if(hard||(critical&&p.criticalSignalForcesEscalation))decision="ESCALATE";else if(corrective&&!reasons.includes("corrective-action-notice-required"))decision="CORRECTIVE_ACTION";else if(aggregateScore>=p.reviewThreshold||reasons.length)decision="REVIEW_REQUIRED";
  const resultingState:AppealRemandMonitoringState=input.monitoringComplete&&decision==="CONTINUE"?"COMPLETE":decision==="ESCALATE"?"ESCALATED":decision==="CORRECTIVE_ACTION"?"CORRECTIVE_ACTION_REQUIRED":decision==="REVIEW_REQUIRED"?"REVIEW_PENDING":"ACTIVE";
  return Object.freeze({schemaVersion:INSTITUTIONAL_APPEAL_REMAND_IMPLEMENTATION_MONITORING_SCHEMA_VERSION,implementationPolicyId:input.implementation.implementationPolicyId,monitoringPolicyId:p.policyId,reconciliationId:input.implementation.reconciliationId,decision,resultingState,aggregateScore,reasons:Object.freeze([...new Set(reasons)].sort()),affectedScopes:list(signals.map(s=>s.scope),"affectedScopes"),signalRefs:list(signals.map(s=>s.signalId),"signalRefs"),reviewRefs:reviews,evidenceRefs:evidence,evaluatedAt:input.evaluatedAt,auditRefs:list(input.auditRefs,"auditRefs",true),replayRef:ne(input.replayRef,"replayRef")});
}

export const institutionalAppealRemandImplementationMonitoringAuthority=Object.freeze({createPolicy:createInstitutionalAppealRemandImplementationMonitoringPolicy,createSignal:createInstitutionalAppealRemandImplementationSignal,evaluate:evaluateInstitutionalAppealRemandImplementationMonitoring});
