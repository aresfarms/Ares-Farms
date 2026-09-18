import type { InstitutionalAppealImplementationEvaluation } from "@/lib/platform/institutionalAppealImplementationAuthority";
import type { InstitutionalSuspensionScope } from "@/lib/platform/institutionalSuspensionAuthority";

export const INSTITUTIONAL_APPEAL_RESTORATION_MONITORING_SCHEMA_VERSION = "institutional-appeal-restoration-monitoring-v1";
export type AppealRestorationSignalSeverity = "INFO" | "WARNING" | "MATERIAL" | "CRITICAL";
export type AppealRestorationMonitoringDecision = "CONTINUE" | "REVIEW_REQUIRED" | "RESUSPEND" | "ESCALATE";
export type AppealRestorationMonitoringState = "ACTIVE" | "REVIEW_PENDING" | "RESUSPENSION_REQUIRED" | "ESCALATED" | "COMPLETE";

export type InstitutionalAppealRestorationMonitoringPolicy = Readonly<{
  policyId:string; governanceVersion:string; monitoredScopes:readonly InstitutionalSuspensionScope[];
  reviewThreshold:number; resuspensionThreshold:number; criticalSignalForcesEscalation:boolean;
  requireHumanReviewForMaterialSignals:boolean; requireNoticeOnResuspension:boolean;
  requiredEvidenceRefs:readonly string[]; auditRefs:readonly string[]; replayRef:string; versionRefs:readonly string[];
}>;

export type InstitutionalAppealRestorationSignal = Readonly<{
  signalId:string; scope:InstitutionalSuspensionScope; severity:AppealRestorationSignalSeverity;
  score:number; evidenceRefs:readonly string[]; observedAt:string;
}>;

export type InstitutionalAppealRestorationMonitoringEvaluation = Readonly<{
  schemaVersion:typeof INSTITUTIONAL_APPEAL_RESTORATION_MONITORING_SCHEMA_VERSION;
  implementationPolicyId:string; monitoringPolicyId:string; reconciliationId:string;
  decision:AppealRestorationMonitoringDecision; resultingState:AppealRestorationMonitoringState;
  aggregateScore:number; reasons:readonly string[]; affectedScopes:readonly InstitutionalSuspensionScope[];
  signalRefs:readonly string[]; reviewRefs:readonly string[]; evidenceRefs:readonly string[];
  evaluatedAt:string; auditRefs:readonly string[]; replayRef:string;
}>;

const ISO=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
function ne(v:string,f:string){const n=v.trim();if(!n)throw new Error(`${f} must be non-empty.`);return n;}
function iso(v:string,f:string){if(!ISO.test(ne(v,f)))throw new Error(`${f} must be an explicit UTC ISO-8601 timestamp.`);return v;}
function list<T extends string>(v:readonly T[],f:string,r=false):readonly T[]{const n=v.map(x=>ne(x,f) as T);if(r&&!n.length)throw new Error(`${f} must contain at least one value.`);if(new Set(n).size!==n.length)throw new Error(`${f} must not contain duplicates.`);return Object.freeze([...n].sort()) as readonly T[];}
function threshold(v:number,f:string){if(!Number.isFinite(v)||v<0||v>1)throw new Error(`${f} must be between 0 and 1.`);return v;}

export function createInstitutionalAppealRestorationMonitoringPolicy(input:InstitutionalAppealRestorationMonitoringPolicy):InstitutionalAppealRestorationMonitoringPolicy{
  const reviewThreshold=threshold(input.reviewThreshold,"reviewThreshold");const resuspensionThreshold=threshold(input.resuspensionThreshold,"resuspensionThreshold");
  if(reviewThreshold>=resuspensionThreshold)throw new Error("reviewThreshold must be lower than resuspensionThreshold.");
  return Object.freeze({...input,policyId:ne(input.policyId,"policyId"),governanceVersion:ne(input.governanceVersion,"governanceVersion"),monitoredScopes:list(input.monitoredScopes,"monitoredScopes",true),reviewThreshold,resuspensionThreshold,requiredEvidenceRefs:list(input.requiredEvidenceRefs,"requiredEvidenceRefs"),auditRefs:list(input.auditRefs,"auditRefs",true),replayRef:ne(input.replayRef,"replayRef"),versionRefs:list(input.versionRefs,"versionRefs",true)});
}

export function createInstitutionalAppealRestorationSignal(input:InstitutionalAppealRestorationSignal):InstitutionalAppealRestorationSignal{
  return Object.freeze({...input,signalId:ne(input.signalId,"signalId"),score:threshold(input.score,"score"),evidenceRefs:list(input.evidenceRefs,"evidenceRefs",true),observedAt:iso(input.observedAt,"observedAt")});
}

export function evaluateInstitutionalAppealRestorationMonitoring(input:{implementation:InstitutionalAppealImplementationEvaluation;policy:InstitutionalAppealRestorationMonitoringPolicy;signals:readonly InstitutionalAppealRestorationSignal[];humanReviewRefs?:readonly string[];resuspensionNoticeRef?:string|null;evidenceRefs:readonly string[];evaluatedAt:string;auditRefs:readonly string[];replayRef:string;monitoringComplete?:boolean;}):InstitutionalAppealRestorationMonitoringEvaluation{
  iso(input.evaluatedAt,"evaluatedAt");const p=createInstitutionalAppealRestorationMonitoringPolicy(input.policy);const signals=input.signals.map(createInstitutionalAppealRestorationSignal);const reviews=list(input.humanReviewRefs??[],"humanReviewRefs");const evidence=list(input.evidenceRefs,"evidenceRefs");const reasons:string[]=[];
  if(input.implementation.decision!=="ALLOW")reasons.push("allowed-implementation-required");
  if(!["PARTIALLY_RESTORED","FULLY_RESTORED"].includes(input.implementation.resultingState))reasons.push("restored-authority-required");
  const restored=new Set(input.implementation.restoredScopes);for(const signal of signals){if(!restored.has(signal.scope)&&!restored.has("FULL_MATTER"))reasons.push(`scope-not-restored:${signal.scope.toLowerCase()}`);if(!p.monitoredScopes.includes(signal.scope)&&!p.monitoredScopes.includes("FULL_MATTER"))reasons.push(`scope-not-monitored:${signal.scope.toLowerCase()}`);}
  for(const r of p.requiredEvidenceRefs)if(!evidence.includes(r))reasons.push(`missing-evidence:${r}`);
  const aggregateScore=signals.length?Math.max(...signals.map(s=>s.score)):0;const critical=signals.some(s=>s.severity==="CRITICAL");const material=signals.some(s=>s.severity==="MATERIAL"||s.severity==="CRITICAL");
  if(material&&p.requireHumanReviewForMaterialSignals&&!reviews.length)reasons.push("human-review-required");const resuspend=aggregateScore>=p.resuspensionThreshold;if(resuspend&&p.requireNoticeOnResuspension&&!input.resuspensionNoticeRef?.trim())reasons.push("resuspension-notice-required");
  const hard=reasons.some(r=>r==="allowed-implementation-required"||r==="restored-authority-required"||r.startsWith("scope-not-restored:")||r.startsWith("scope-not-monitored:")||r.startsWith("missing-evidence:"));
  let decision:AppealRestorationMonitoringDecision="CONTINUE";if(hard||(critical&&p.criticalSignalForcesEscalation))decision="ESCALATE";else if(resuspend&&!reasons.includes("resuspension-notice-required"))decision="RESUSPEND";else if(aggregateScore>=p.reviewThreshold||reasons.length)decision="REVIEW_REQUIRED";
  const resultingState:AppealRestorationMonitoringState=input.monitoringComplete&&decision==="CONTINUE"?"COMPLETE":decision==="ESCALATE"?"ESCALATED":decision==="RESUSPEND"?"RESUSPENSION_REQUIRED":decision==="REVIEW_REQUIRED"?"REVIEW_PENDING":"ACTIVE";
  return Object.freeze({schemaVersion:INSTITUTIONAL_APPEAL_RESTORATION_MONITORING_SCHEMA_VERSION,implementationPolicyId:input.implementation.implementationPolicyId,monitoringPolicyId:p.policyId,reconciliationId:input.implementation.reconciliationId,decision,resultingState,aggregateScore,reasons:Object.freeze([...new Set(reasons)].sort()),affectedScopes:list(signals.map(s=>s.scope),"affectedScopes"),signalRefs:list(signals.map(s=>s.signalId),"signalRefs"),reviewRefs:reviews,evidenceRefs:evidence,evaluatedAt:input.evaluatedAt,auditRefs:list(input.auditRefs,"auditRefs",true),replayRef:ne(input.replayRef,"replayRef")});
}

export const institutionalAppealRestorationMonitoringAuthority=Object.freeze({createPolicy:createInstitutionalAppealRestorationMonitoringPolicy,createSignal:createInstitutionalAppealRestorationSignal,evaluate:evaluateInstitutionalAppealRestorationMonitoring});
