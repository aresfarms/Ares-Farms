import type { InstitutionalLifecycleCycleReinstatementEvaluation } from "@/lib/platform/institutionalLifecycleCycleReinstatementAuthority";
import type { AppealRemandReopeningSuspensionScope } from "@/lib/platform/institutionalAppealRemandArchiveReopeningSuspensionAuthority";

export const INSTITUTIONAL_LIFECYCLE_CYCLE_POST_REINSTATEMENT_MONITORING_SCHEMA_VERSION = "institutional-lifecycle-cycle-post-reinstatement-monitoring-v1";
export type AppealRemandPostReinstatementSignalSeverity = "INFO" | "WARNING" | "MATERIAL" | "CRITICAL";
export type InstitutionalLifecycleCyclePostReinstatementMonitoringDecision = "CONTINUE" | "REVIEW_REQUIRED" | "RESUSPEND" | "ESCALATE";
export type InstitutionalLifecycleCyclePostReinstatementMonitoringState = "ACTIVE" | "REVIEW_PENDING" | "RESUSPENSION_REQUIRED" | "ESCALATED" | "COMPLETE";

export type InstitutionalLifecycleCyclePostReinstatementMonitoringPolicy = Readonly<{
  policyId:string; governanceVersion:string; monitoredScopes:readonly AppealRemandReopeningSuspensionScope[];
  reviewThreshold:number; resuspensionThreshold:number; criticalSignalForcesEscalation:boolean;
  requireHumanReviewForMaterialSignals:boolean; requireNoticeOnResuspension:boolean;
  requiredEvidenceRefs:readonly string[]; auditRefs:readonly string[]; replayRef:string; versionRefs:readonly string[];
}>;

export type InstitutionalLifecycleCyclePostReinstatementMonitoringSignal = Readonly<{
  signalId:string; scope:AppealRemandReopeningSuspensionScope; severity:AppealRemandPostReinstatementSignalSeverity;
  score:number; evidenceRefs:readonly string[]; observedAt:string;
}>;

export type InstitutionalLifecycleCyclePostReinstatementMonitoringEvaluation = Readonly<{
  schemaVersion:typeof INSTITUTIONAL_LIFECYCLE_CYCLE_POST_REINSTATEMENT_MONITORING_SCHEMA_VERSION;
  cyclePolicyId:string; cycleId:string; generation:number; reinstatementPolicyId:string; monitoringPolicyId:string; canonicalObjectId:string;
  decision:InstitutionalLifecycleCyclePostReinstatementMonitoringDecision; resultingState:InstitutionalLifecycleCyclePostReinstatementMonitoringState;
  aggregateScore:number; reasons:readonly string[]; affectedScopes:readonly AppealRemandReopeningSuspensionScope[];
  signalRefs:readonly string[]; reviewRefs:readonly string[]; evidenceRefs:readonly string[];
  evaluatedAt:string; auditRefs:readonly string[]; replayRef:string;
}>;

const ISO=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
function ne(v:string,f:string){const n=v.trim();if(!n)throw new Error(`${f} must be non-empty.`);return n;}
function iso(v:string,f:string){if(!ISO.test(ne(v,f)))throw new Error(`${f} must be an explicit UTC ISO-8601 timestamp.`);return v;}
function list<T extends string>(v:readonly T[],f:string,r=false):readonly T[]{const n=v.map(x=>ne(x,f) as T);if(r&&!n.length)throw new Error(`${f} must contain at least one value.`);if(new Set(n).size!==n.length)throw new Error(`${f} must not contain duplicates.`);return Object.freeze([...n].sort()) as readonly T[];}
function threshold(v:number,f:string){if(!Number.isFinite(v)||v<0||v>1)throw new Error(`${f} must be between 0 and 1.`);return v;}

export function createInstitutionalLifecycleCyclePostReinstatementMonitoringPolicy(input:InstitutionalLifecycleCyclePostReinstatementMonitoringPolicy){
  const reviewThreshold=threshold(input.reviewThreshold,"reviewThreshold");const resuspensionThreshold=threshold(input.resuspensionThreshold,"resuspensionThreshold");if(reviewThreshold>=resuspensionThreshold)throw new Error("reviewThreshold must be lower than resuspensionThreshold.");
  return Object.freeze({...input,policyId:ne(input.policyId,"policyId"),governanceVersion:ne(input.governanceVersion,"governanceVersion"),monitoredScopes:list(input.monitoredScopes,"monitoredScopes",true),reviewThreshold,resuspensionThreshold,requiredEvidenceRefs:list(input.requiredEvidenceRefs,"requiredEvidenceRefs"),auditRefs:list(input.auditRefs,"auditRefs",true),replayRef:ne(input.replayRef,"replayRef"),versionRefs:list(input.versionRefs,"versionRefs",true)});
}

export function createInstitutionalLifecycleCyclePostReinstatementMonitoringSignal(input:InstitutionalLifecycleCyclePostReinstatementMonitoringSignal){
  return Object.freeze({...input,signalId:ne(input.signalId,"signalId"),score:threshold(input.score,"score"),evidenceRefs:list(input.evidenceRefs,"evidenceRefs",true),observedAt:iso(input.observedAt,"observedAt")});
}

export function evaluateInstitutionalLifecycleCyclePostReinstatementMonitoring(input:{reinstatement:InstitutionalLifecycleCycleReinstatementEvaluation;policy:InstitutionalLifecycleCyclePostReinstatementMonitoringPolicy;signals:readonly InstitutionalLifecycleCyclePostReinstatementMonitoringSignal[];humanReviewRefs?:readonly string[];resuspensionNoticeRef?:string|null;evidenceRefs:readonly string[];evaluatedAt:string;auditRefs:readonly string[];replayRef:string;monitoringComplete?:boolean;}):InstitutionalLifecycleCyclePostReinstatementMonitoringEvaluation{
  iso(input.evaluatedAt,"evaluatedAt");const p=createInstitutionalLifecycleCyclePostReinstatementMonitoringPolicy(input.policy);const signals=input.signals.map(createInstitutionalLifecycleCyclePostReinstatementMonitoringSignal);const reviews=list(input.humanReviewRefs??[],"humanReviewRefs");const evidence=list(input.evidenceRefs,"evidenceRefs");const reasons:string[]=[];
  if(input.reinstatement.decision!=="ALLOW")reasons.push(`reinstatement:${input.reinstatement.decision.toLowerCase()}`);if(!["PARTIALLY_REINSTATED","FULLY_REINSTATED"].includes(input.reinstatement.resultingState))reasons.push("matter-not-reinstated");if(input.reinstatement.replayRef!==input.replayRef)reasons.push("replay-continuity-required");
  for(const signal of signals)if(!p.monitoredScopes.includes(signal.scope)&&!p.monitoredScopes.includes("FULL_MATTER"))reasons.push(`scope-not-monitored:${signal.scope.toLowerCase()}`);for(const r of p.requiredEvidenceRefs)if(!evidence.includes(r))reasons.push(`missing-evidence:${r}`);
  const aggregateScore=signals.length?Math.max(...signals.map(s=>s.score)):0;const critical=signals.some(s=>s.severity==="CRITICAL");const material=signals.some(s=>s.severity==="MATERIAL"||s.severity==="CRITICAL");if(material&&p.requireHumanReviewForMaterialSignals&&!reviews.length)reasons.push("human-review-required");const resuspensionTriggered=aggregateScore>=p.resuspensionThreshold;if(resuspensionTriggered&&p.requireNoticeOnResuspension&&!input.resuspensionNoticeRef?.trim())reasons.push("resuspension-notice-required");
  const hard=reasons.some(r=>r.startsWith("reinstatement:")||r==="matter-not-reinstated"||r==="replay-continuity-required"||r.startsWith("scope-not-monitored:")||r.startsWith("missing-evidence:"));let decision:InstitutionalLifecycleCyclePostReinstatementMonitoringDecision="CONTINUE";if(hard||(critical&&p.criticalSignalForcesEscalation))decision="ESCALATE";else if(resuspensionTriggered&&!reasons.includes("resuspension-notice-required"))decision="RESUSPEND";else if(aggregateScore>=p.reviewThreshold||reasons.length)decision="REVIEW_REQUIRED";const resultingState:InstitutionalLifecycleCyclePostReinstatementMonitoringState=input.monitoringComplete&&decision==="CONTINUE"?"COMPLETE":decision==="ESCALATE"?"ESCALATED":decision==="RESUSPEND"?"RESUSPENSION_REQUIRED":decision==="REVIEW_REQUIRED"?"REVIEW_PENDING":"ACTIVE";
  return Object.freeze({schemaVersion:INSTITUTIONAL_LIFECYCLE_CYCLE_POST_REINSTATEMENT_MONITORING_SCHEMA_VERSION,cyclePolicyId:input.reinstatement.cyclePolicyId,cycleId:input.reinstatement.cycleId,generation:input.reinstatement.generation,reinstatementPolicyId:input.reinstatement.reinstatementPolicyId,monitoringPolicyId:p.policyId,canonicalObjectId:input.reinstatement.canonicalObjectId,decision,resultingState,aggregateScore,reasons:Object.freeze([...new Set(reasons)].sort()),affectedScopes:list(signals.map(s=>s.scope),"affectedScopes"),signalRefs:list(signals.map(s=>s.signalId),"signalRefs"),reviewRefs:reviews,evidenceRefs:evidence,evaluatedAt:input.evaluatedAt,auditRefs:list(input.auditRefs,"auditRefs",true),replayRef:ne(input.replayRef,"replayRef")});
}

export const institutionalLifecycleCyclePostReinstatementMonitoringAuthority=Object.freeze({createPolicy:createInstitutionalLifecycleCyclePostReinstatementMonitoringPolicy,createSignal:createInstitutionalLifecycleCyclePostReinstatementMonitoringSignal,evaluate:evaluateInstitutionalLifecycleCyclePostReinstatementMonitoring});
