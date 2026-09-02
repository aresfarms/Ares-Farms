export const INSTITUTIONAL_ASSURANCE_VERSION = "institutional-assurance-v1.0.0";

type Decision = Readonly<{ ready: boolean; blockers: string[] }>;
const result = (blockers: string[]): Decision => ({
  ready: blockers.length === 0,
  blockers,
});

export function evaluateFairLendingRelease(input: {
  reasonCodesComplete: boolean;
  proxyFeatureReviewComplete: boolean;
  disparateImpactReviewComplete: boolean;
  demographicDataSeparated: boolean;
  humanApproval: boolean;
}): Decision {
  const b: string[] = [];
  if (!input.reasonCodesComplete)
    b.push("FAIR_LENDING_REASON_CODES_INCOMPLETE");
  if (!input.proxyFeatureReviewComplete)
    b.push("FAIR_LENDING_PROXY_REVIEW_MISSING");
  if (!input.disparateImpactReviewComplete)
    b.push("FAIR_LENDING_DISPARATE_IMPACT_REVIEW_MISSING");
  if (!input.demographicDataSeparated)
    b.push("FAIR_LENDING_DEMOGRAPHIC_SEPARATION_MISSING");
  if (!input.humanApproval) b.push("FAIR_LENDING_HUMAN_APPROVAL_MISSING");
  return result(b);
}

export function evaluateModelRiskUse(input: {
  inventoryRegistered: boolean;
  modelCardCurrent: boolean;
  independentValidationCurrent: boolean;
  driftWithinThreshold: boolean;
  challengerComparisonCurrent: boolean;
  humanApproval: boolean;
}): Decision {
  const b: string[] = [];
  if (!input.inventoryRegistered) b.push("MODEL_INVENTORY_MISSING");
  if (!input.modelCardCurrent) b.push("MODEL_CARD_STALE_OR_MISSING");
  if (!input.independentValidationCurrent)
    b.push("MODEL_VALIDATION_STALE_OR_MISSING");
  if (!input.driftWithinThreshold) b.push("MODEL_DRIFT_OUTSIDE_THRESHOLD");
  if (!input.challengerComparisonCurrent)
    b.push("MODEL_CHALLENGER_REVIEW_MISSING");
  if (!input.humanApproval) b.push("MODEL_RISK_HUMAN_APPROVAL_MISSING");
  return result(b);
}

export function evaluateThirdPartyActivation(input: {
  vendorRegistered: boolean;
  dpaReviewed: boolean;
  dataResidencyReviewed: boolean;
  securityReviewCurrent: boolean;
  terminationPlanPresent: boolean;
  certified: boolean;
}): Decision {
  const b: string[] = [];
  if (!input.vendorRegistered) b.push("VENDOR_REGISTRY_MISSING");
  if (!input.dpaReviewed) b.push("VENDOR_DPA_REVIEW_MISSING");
  if (!input.dataResidencyReviewed)
    b.push("VENDOR_DATA_RESIDENCY_REVIEW_MISSING");
  if (!input.securityReviewCurrent) b.push("VENDOR_SECURITY_REVIEW_MISSING");
  if (!input.terminationPlanPresent) b.push("VENDOR_TERMINATION_PLAN_MISSING");
  if (!input.certified) b.push("VENDOR_CERTIFICATION_MISSING");
  return result(b);
}

export function evaluateDisasterRecoveryReadiness(input: {
  rpoDefined: boolean;
  rtoDefined: boolean;
  backupVerified: boolean;
  restoreDrillPassed: boolean;
  runbookApproved: boolean;
}): Decision {
  const b: string[] = [];
  if (!input.rpoDefined) b.push("DR_RPO_UNDEFINED");
  if (!input.rtoDefined) b.push("DR_RTO_UNDEFINED");
  if (!input.backupVerified) b.push("DR_BACKUP_UNVERIFIED");
  if (!input.restoreDrillPassed) b.push("DR_RESTORE_DRILL_NOT_PASSED");
  if (!input.runbookApproved) b.push("DR_RUNBOOK_NOT_APPROVED");
  return result(b);
}

export function evaluateServiceReliability(input: {
  sloDefined: boolean;
  alertingConfigured: boolean;
  onCallAssigned: boolean;
  errorBudgetTracked: boolean;
  incidentEscalationLinked: boolean;
}): Decision {
  const b: string[] = [];
  if (!input.sloDefined) b.push("SRE_SLO_UNDEFINED");
  if (!input.alertingConfigured) b.push("SRE_ALERTING_NOT_CONFIGURED");
  if (!input.onCallAssigned) b.push("SRE_ON_CALL_NOT_ASSIGNED");
  if (!input.errorBudgetTracked) b.push("SRE_ERROR_BUDGET_NOT_TRACKED");
  if (!input.incidentEscalationLinked)
    b.push("SRE_INCIDENT_ESCALATION_NOT_LINKED");
  return result(b);
}

export function evaluateBreachNotification(input: {
  incidentClassified: boolean;
  notificationClockStarted: boolean;
  jurisdictionsAssessed: boolean;
  requiredCounselReviewComplete: boolean;
  notificationDecisionRecorded: boolean;
  evidencePreserved: boolean;
}): Decision {
  const b: string[] = [];
  if (!input.incidentClassified) b.push("BREACH_INCIDENT_NOT_CLASSIFIED");
  if (!input.notificationClockStarted)
    b.push("BREACH_NOTIFICATION_CLOCK_NOT_STARTED");
  if (!input.jurisdictionsAssessed)
    b.push("BREACH_JURISDICTION_ASSESSMENT_MISSING");
  if (!input.requiredCounselReviewComplete)
    b.push("BREACH_COUNSEL_REVIEW_INCOMPLETE");
  if (!input.notificationDecisionRecorded)
    b.push("BREACH_NOTIFICATION_DECISION_MISSING");
  if (!input.evidencePreserved) b.push("BREACH_EVIDENCE_NOT_PRESERVED");
  return result(b);
}

export function evaluateSuccessionReadiness(input: {
  primaryAssigned: boolean;
  successorAssigned: boolean;
  emergencyDelegateAssigned: boolean;
  missionProtectionRecorded: boolean;
  activationTested: boolean;
}): Decision {
  const b: string[] = [];
  if (!input.primaryAssigned) b.push("SUCCESSION_PRIMARY_MISSING");
  if (!input.successorAssigned) b.push("SUCCESSION_SUCCESSOR_MISSING");
  if (!input.emergencyDelegateAssigned)
    b.push("SUCCESSION_EMERGENCY_DELEGATE_MISSING");
  if (!input.missionProtectionRecorded)
    b.push("SUCCESSION_MISSION_PROTECTION_MISSING");
  if (!input.activationTested) b.push("SUCCESSION_ACTIVATION_NOT_TESTED");
  return result(b);
}
