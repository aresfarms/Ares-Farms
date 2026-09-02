import assert from "node:assert/strict";
import fs from "node:fs";
import {
  evaluateBreachNotification,
  evaluateDisasterRecoveryReadiness,
  evaluateFairLendingRelease,
  evaluateModelRiskUse,
  evaluateServiceReliability,
  evaluateSuccessionReadiness,
  evaluateThirdPartyActivation,
} from "@/lib/governance/institutionalAssuranceRuntime";

const allFalse = {
  reasonCodesComplete: false,
  proxyFeatureReviewComplete: false,
  disparateImpactReviewComplete: false,
  demographicDataSeparated: false,
  humanApproval: false,
};
assert.equal(evaluateFairLendingRelease(allFalse).ready, false);
assert.equal(
  evaluateFairLendingRelease({
    ...allFalse,
    reasonCodesComplete: true,
    proxyFeatureReviewComplete: true,
    disparateImpactReviewComplete: true,
    demographicDataSeparated: true,
    humanApproval: true,
  }).ready,
  true,
);
assert.equal(
  evaluateModelRiskUse({
    inventoryRegistered: true,
    modelCardCurrent: true,
    independentValidationCurrent: true,
    driftWithinThreshold: true,
    challengerComparisonCurrent: false,
    humanApproval: true,
  }).ready,
  false,
);
assert.equal(
  evaluateThirdPartyActivation({
    vendorRegistered: true,
    dpaReviewed: true,
    dataResidencyReviewed: true,
    securityReviewCurrent: true,
    terminationPlanPresent: false,
    certified: true,
  }).ready,
  false,
);
assert.equal(
  evaluateDisasterRecoveryReadiness({
    rpoDefined: true,
    rtoDefined: true,
    backupVerified: true,
    restoreDrillPassed: false,
    runbookApproved: true,
  }).ready,
  false,
);
assert.equal(
  evaluateServiceReliability({
    sloDefined: true,
    alertingConfigured: true,
    onCallAssigned: true,
    errorBudgetTracked: true,
    incidentEscalationLinked: true,
  }).ready,
  true,
);
assert.equal(
  evaluateBreachNotification({
    incidentClassified: true,
    notificationClockStarted: true,
    jurisdictionsAssessed: true,
    requiredCounselReviewComplete: true,
    notificationDecisionRecorded: false,
    evidencePreserved: true,
  }).ready,
  false,
);
assert.equal(
  evaluateSuccessionReadiness({
    primaryAssigned: true,
    successorAssigned: true,
    emergencyDelegateAssigned: true,
    missionProtectionRecorded: true,
    activationTested: false,
  }).ready,
  false,
);

const schema = fs.readFileSync(
  "src/db/schema/institutionalAssuranceControls.ts",
  "utf8",
);
for (const table of [
  "fair_lending_review_records",
  "model_risk_governance_records",
  "third_party_risk_records",
  "disaster_recovery_test_records",
  "service_reliability_objective_records",
  "breach_notification_governance_records",
  "succession_stewardship_records",
])
  assert(schema.includes(table), `missing ${table}`);
console.log(
  JSON.stringify(
    {
      ok: true,
      fairLendingFailClosed: true,
      modelRiskFailClosed: true,
      thirdPartyRiskFailClosed: true,
      disasterRecoveryEvidenceRequired: true,
      serviceReliabilityEvidenceRequired: true,
      breachNotificationEvidenceRequired: true,
      successionEvidenceRequired: true,
    },
    null,
    2,
  ),
);
