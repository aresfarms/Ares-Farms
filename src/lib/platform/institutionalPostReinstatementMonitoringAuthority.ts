import type { InstitutionalReinstatementEvaluation } from "@/lib/platform/institutionalReinstatementAuthority";
import type { InstitutionalSuspensionScope } from "@/lib/platform/institutionalSuspensionAuthority";

export const INSTITUTIONAL_POST_REINSTATEMENT_MONITORING_SCHEMA_VERSION = "institutional-post-reinstatement-monitoring-v1";
export type MonitoringSignalSeverity = "INFO" | "WARNING" | "MATERIAL" | "CRITICAL";
export type MonitoringDecision = "CONTINUE" | "REVIEW_REQUIRED" | "RESUSPEND" | "ESCALATE";
export type MonitoringState = "ACTIVE" | "REVIEW_PENDING" | "RESUSPENSION_REQUIRED" | "ESCALATED" | "COMPLETE";

export type InstitutionalMonitoringPolicy = Readonly<{
  policyId: string;
  governanceVersion: string;
  monitoredScopes: readonly InstitutionalSuspensionScope[];
  reviewThreshold: number;
  resuspensionThreshold: number;
  criticalSignalForcesEscalation: boolean;
  requireHumanReviewForMaterialSignals: boolean;
  requireNoticeOnResuspension: boolean;
  requiredEvidenceRefs: readonly string[];
  auditRefs: readonly string[];
  replayRef: string;
  versionRefs: readonly string[];
}>;

export type InstitutionalMonitoringSignal = Readonly<{
  signalId: string;
  scope: InstitutionalSuspensionScope;
  severity: MonitoringSignalSeverity;
  score: number;
  evidenceRefs: readonly string[];
  observedAt: string;
}>;

export type InstitutionalMonitoringEvaluation = Readonly<{
  schemaVersion: typeof INSTITUTIONAL_POST_REINSTATEMENT_MONITORING_SCHEMA_VERSION;
  reinstatementPolicyId: string;
  monitoringPolicyId: string;
  reconciliationId: string;
  decision: MonitoringDecision;
  resultingState: MonitoringState;
  aggregateScore: number;
  reasons: readonly string[];
  affectedScopes: readonly InstitutionalSuspensionScope[];
  signalRefs: readonly string[];
  reviewRefs: readonly string[];
  evidenceRefs: readonly string[];
  evaluatedAt: string;
  auditRefs: readonly string[];
  replayRef: string;
}>;

const ISO_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
function nonEmpty(value: string, field: string): string { const normalized = value.trim(); if (!normalized) throw new Error(`${field} must be non-empty.`); return normalized; }
function iso(value: string, field: string): string { if (!ISO_UTC.test(nonEmpty(value, field))) throw new Error(`${field} must be an explicit UTC ISO-8601 timestamp.`); return value; }
function list<T extends string>(values: readonly T[], field: string, required = false): readonly T[] { const normalized = values.map((value) => nonEmpty(value, field) as T); if (required && !normalized.length) throw new Error(`${field} must contain at least one value.`); if (new Set(normalized).size !== normalized.length) throw new Error(`${field} must not contain duplicates.`); return Object.freeze([...normalized].sort()) as readonly T[]; }
function threshold(value: number, field: string): number { if (!Number.isFinite(value) || value < 0 || value > 1) throw new Error(`${field} must be between 0 and 1.`); return value; }

export function createInstitutionalMonitoringPolicy(input: InstitutionalMonitoringPolicy): InstitutionalMonitoringPolicy {
  const reviewThreshold = threshold(input.reviewThreshold, "reviewThreshold");
  const resuspensionThreshold = threshold(input.resuspensionThreshold, "resuspensionThreshold");
  if (reviewThreshold >= resuspensionThreshold) throw new Error("reviewThreshold must be lower than resuspensionThreshold.");
  return Object.freeze({ ...input, policyId: nonEmpty(input.policyId, "policyId"), governanceVersion: nonEmpty(input.governanceVersion, "governanceVersion"), monitoredScopes: list(input.monitoredScopes, "monitoredScopes", true), reviewThreshold, resuspensionThreshold, requiredEvidenceRefs: list(input.requiredEvidenceRefs, "requiredEvidenceRefs"), auditRefs: list(input.auditRefs, "auditRefs", true), replayRef: nonEmpty(input.replayRef, "replayRef"), versionRefs: list(input.versionRefs, "versionRefs", true) });
}

export function createInstitutionalMonitoringSignal(input: InstitutionalMonitoringSignal): InstitutionalMonitoringSignal {
  return Object.freeze({ ...input, signalId: nonEmpty(input.signalId, "signalId"), score: threshold(input.score, "score"), evidenceRefs: list(input.evidenceRefs, "evidenceRefs", true), observedAt: iso(input.observedAt, "observedAt") });
}

export function evaluateInstitutionalPostReinstatementMonitoring(input: { reinstatement: InstitutionalReinstatementEvaluation; policy: InstitutionalMonitoringPolicy; signals: readonly InstitutionalMonitoringSignal[]; humanReviewRefs?: readonly string[]; resuspensionNoticeRef?: string | null; evidenceRefs: readonly string[]; evaluatedAt: string; auditRefs: readonly string[]; replayRef: string; monitoringComplete?: boolean; }): InstitutionalMonitoringEvaluation {
  iso(input.evaluatedAt, "evaluatedAt");
  const policy = createInstitutionalMonitoringPolicy(input.policy);
  const signals = input.signals.map(createInstitutionalMonitoringSignal);
  const reviews = list(input.humanReviewRefs ?? [], "humanReviewRefs");
  const evidence = list(input.evidenceRefs, "evidenceRefs");
  const reasons: string[] = [];
  if (input.reinstatement.decision !== "ALLOW") reasons.push(`reinstatement:${input.reinstatement.decision.toLowerCase()}`);
  if (!["PARTIALLY_REINSTATED", "FULLY_REINSTATED"].includes(input.reinstatement.resultingState)) reasons.push("matter-not-reinstated");
  for (const signal of signals) if (!policy.monitoredScopes.includes(signal.scope) && !policy.monitoredScopes.includes("FULL_MATTER")) reasons.push(`scope-not-monitored:${signal.scope.toLowerCase()}`);
  for (const required of policy.requiredEvidenceRefs) if (!evidence.includes(required)) reasons.push(`missing-evidence:${required}`);
  const aggregateScore = signals.length ? Math.max(...signals.map((signal) => signal.score)) : 0;
  const critical = signals.some((signal) => signal.severity === "CRITICAL");
  const material = signals.some((signal) => signal.severity === "MATERIAL" || signal.severity === "CRITICAL");
  if (material && policy.requireHumanReviewForMaterialSignals && !reviews.length) reasons.push("human-review-required");
  const resuspensionTriggered = aggregateScore >= policy.resuspensionThreshold;
  if (resuspensionTriggered && policy.requireNoticeOnResuspension && !input.resuspensionNoticeRef?.trim()) reasons.push("resuspension-notice-required");
  const hard = reasons.some((reason) => reason.startsWith("reinstatement:") || reason === "matter-not-reinstated" || reason.startsWith("scope-not-monitored:") || reason.startsWith("missing-evidence:"));
  let decision: MonitoringDecision = "CONTINUE";
  if (hard || (critical && policy.criticalSignalForcesEscalation)) decision = "ESCALATE";
  else if (resuspensionTriggered && !reasons.includes("resuspension-notice-required")) decision = "RESUSPEND";
  else if (aggregateScore >= policy.reviewThreshold || reasons.length) decision = "REVIEW_REQUIRED";
  const resultingState: MonitoringState = input.monitoringComplete && decision === "CONTINUE" ? "COMPLETE" : decision === "ESCALATE" ? "ESCALATED" : decision === "RESUSPEND" ? "RESUSPENSION_REQUIRED" : decision === "REVIEW_REQUIRED" ? "REVIEW_PENDING" : "ACTIVE";
  return Object.freeze({ schemaVersion: INSTITUTIONAL_POST_REINSTATEMENT_MONITORING_SCHEMA_VERSION, reinstatementPolicyId: input.reinstatement.reinstatementPolicyId, monitoringPolicyId: policy.policyId, reconciliationId: input.reinstatement.reconciliationId, decision, resultingState, aggregateScore, reasons: Object.freeze([...new Set(reasons)].sort()), affectedScopes: list(signals.map((signal) => signal.scope), "affectedScopes"), signalRefs: list(signals.map((signal) => signal.signalId), "signalRefs"), reviewRefs: reviews, evidenceRefs: evidence, evaluatedAt: input.evaluatedAt, auditRefs: list(input.auditRefs, "auditRefs", true), replayRef: nonEmpty(input.replayRef, "replayRef") });
}

export const institutionalPostReinstatementMonitoringAuthority = Object.freeze({ createPolicy: createInstitutionalMonitoringPolicy, createSignal: createInstitutionalMonitoringSignal, evaluate: evaluateInstitutionalPostReinstatementMonitoring });
