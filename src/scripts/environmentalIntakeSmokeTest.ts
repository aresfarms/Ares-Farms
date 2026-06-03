import {
  ENVIRONMENTAL_INTAKE_DISCLOSURES,
  ENVIRONMENTAL_INTAKE_RUNTIME_VERSION,
  evaluateEnvironmentalIntake,
} from "@/lib/environmental/intakeRuntime";
import { eventContractRegistry } from "@/lib/modules/eventContractRegistry";
import { crossModuleHandoffMap } from "@/lib/modules/handoffMap";
import { moduleManifests } from "@/lib/modules/moduleRegistry";

/**
 * Environmental Intake Smoke Test
 *
 * Master Volume Governance:
 * - Vol I: protects Environmental Engineering Spoke authority and Banker
 *   Spoke isolation across borrower-readable intake routing.
 * - Vol II: confirms intake remains review-bound and not an environmental
 *   determination, clearance, permit, provider engagement, or reliance.
 * - Vol III: validates deterministic, replay-safe routing across NEPA,
 *   Phase I ESA, state review, and exemption pathway scenarios.
 * - Vol III-B: confirms human-review-required posture and governed evidence.
 * - Vol IV: confirms operator and borrower handoff coverage.
 * - Vol V-VII: confirms registry, contract, handoff, and disclosure conformance.
 */

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function main() {
  const emptyResult = evaluateEnvironmentalIntake({});

  assert(
    emptyResult.runtimeVersion === ENVIRONMENTAL_INTAKE_RUNTIME_VERSION,
    "Environmental intake must emit the runtime version."
  );
  assert(
    emptyResult.productionBlocked === true,
    "Environmental intake must remain production-blocked."
  );
  assert(
    emptyResult.humanReviewRequired === true,
    "Environmental intake must require human review."
  );
  assert(
    emptyResult.noEnvironmentalClearance === true &&
      emptyResult.noOfficialEnvironmentalReport === true &&
      emptyResult.noProviderEngagement === true &&
      emptyResult.noLegalOrRegulatoryReliance === true,
    "Environmental intake must block clearance, official report, provider engagement, and reliance claims."
  );
  assert(
    emptyResult.assessmentRoute === "AWAITING_INPUT" &&
      emptyResult.pathwayPosture === "INDETERMINATE",
    "Empty environmental intake input should not route a pathway."
  );
  assert(
    emptyResult.readiness.readinessPercent === 0,
    "Empty environmental intake input should have zero readiness."
  );

  const nepaResult = evaluateEnvironmentalIntake({
    borrowerId: "borrower-smoke",
    applicationId: "application-smoke",
    location: { country: "US", state: "MD", county: "Queen Anne's" },
    realPropertyCollateral: true,
    federalFundingTrigger: true,
    federalActionInvolvement: true,
    stateEnvironmentalActJurisdiction: false,
    knownEnvironmentalStatuteTrigger: false,
    knownContaminationConcern: false,
    protectedHabitatProximity: false,
    wetlandsOrFloodplainProximity: false,
    borrowerExternalFirmInterest: true,
    feeDisclosureAcknowledged: true,
  });

  assert(
    nepaResult.assessmentRoute === "NEPA_SCREENING" &&
      nepaResult.pathwayPosture === "TRIGGERED",
    "Federal funding/action involvement must route NEPA screening as triggered."
  );
  assert(
    nepaResult.readiness.readinessPercent === 100,
    "Complete NEPA intake input must reach 100 percent readiness."
  );
  assert(
    nepaResult.triggerSignals.length >= 3,
    "NEPA intake must record federal funding, federal action, and real-property trigger signals."
  );

  const exemptionResult = evaluateEnvironmentalIntake({
    borrowerId: "borrower-smoke",
    applicationId: "application-smoke",
    location: { country: "US", state: "MD", county: "Queen Anne's" },
    realPropertyCollateral: false,
    federalFundingTrigger: false,
    federalActionInvolvement: false,
    stateEnvironmentalActJurisdiction: false,
    knownEnvironmentalStatuteTrigger: false,
    knownContaminationConcern: false,
    protectedHabitatProximity: false,
    wetlandsOrFloodplainProximity: false,
    equipmentAssetValue: 75000,
    requestExemptionEvaluation: true,
    borrowerExternalFirmInterest: false,
    feeDisclosureAcknowledged: true,
  });

  assert(
    exemptionResult.assessmentRoute === "EXEMPTION_PATHWAY" &&
      exemptionResult.pathwayPosture === "POTENTIAL_EXEMPTION",
    "No-real-property posture with exemption request must route exemption pathway."
  );
  assert(
    exemptionResult.exemptionCandidates.length >= 1,
    "Exemption pathway result must include exemption candidates."
  );

  const phaseOneResult = evaluateEnvironmentalIntake({
    borrowerId: "borrower-smoke",
    applicationId: "application-smoke",
    location: { country: "US", state: "MD", county: "Queen Anne's" },
    realPropertyCollateral: true,
    federalFundingTrigger: false,
    federalActionInvolvement: false,
    stateEnvironmentalActJurisdiction: false,
    knownEnvironmentalStatuteTrigger: false,
    knownContaminationConcern: true,
    protectedHabitatProximity: false,
    wetlandsOrFloodplainProximity: false,
    borrowerExternalFirmInterest: true,
    feeDisclosureAcknowledged: true,
  });

  assert(
    phaseOneResult.assessmentRoute === "PHASE_I_ESA" &&
      phaseOneResult.pathwayPosture === "TRIGGERED",
    "Disclosed contamination must route Phase I ESA as triggered."
  );

  assert(
    ENVIRONMENTAL_INTAKE_DISCLOSURES.includes(
      "Environmental intake is operational guidance and review routing only."
    ),
    "Environmental intake disclosures must include the operational-guidance language."
  );
  assert(
    ENVIRONMENTAL_INTAKE_DISCLOSURES.includes(
      "Environmental intake does not engage an external environmental provider."
    ),
    "Environmental intake disclosures must block provider engagement claims."
  );

  const moduleManifest = moduleManifests.find(
    (manifest) => manifest.id === "portal-borrower-environmental-intake"
  );
  assert(
    moduleManifest !== undefined,
    "Borrower environmental intake module manifest must be registered."
  );
  assert(
    moduleManifest.productionBlocked && moduleManifest.replayRequired,
    "Borrower environmental intake module must remain production-blocked and replay-required."
  );
  assert(
    moduleManifest.eventsPublished.includes(
      "borrower.environmental.intake.submitted"
    ),
    "Borrower environmental intake module must publish the intake submitted event."
  );
  assert(
    moduleManifest.eventsConsumed.includes("borrower.onboarding.submitted"),
    "Borrower environmental intake module must consume upstream onboarding events."
  );

  const contract = eventContractRegistry.find(
    (eventContract) =>
      eventContract.eventType === "borrower.environmental.intake.submitted"
  );
  assert(
    contract !== undefined,
    "Environmental intake submitted event contract must be registered."
  );
  assert(
    contract.productionBlocked && contract.replayRequired,
    "Environmental intake event contract must be production-blocked and replay-required."
  );
  assert(
    contract.classificationLevel === "RESTRICTED",
    "Environmental intake event contract must be RESTRICTED."
  );
  assert(
    contract.purpose.includes("without environmental determination"),
    "Environmental intake contract must preserve no-determination purpose language."
  );

  const handoffs = crossModuleHandoffMap.filter(
    (handoff) =>
      handoff.fromModuleId === "portal-borrower-environmental-intake" ||
      handoff.toModuleId === "portal-borrower-environmental-intake"
  );
  assert(
    handoffs.length >= 6,
    "Environmental intake module must have at least six governed handoff routes."
  );
  assert(
    handoffs.every(
      (handoff) => handoff.productionBlocked && handoff.humanReviewBoundary
    ),
    "Every environmental intake handoff must remain production-blocked and human-review-bound."
  );
  assert(
    handoffs.some(
      (handoff) => handoff.toModuleId === "environmental-compliance"
    ),
    "Environmental intake must route to the Module 21 environmental compliance review."
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        emptyReadiness: emptyResult.readiness.readinessPercent,
        nepaReadiness: nepaResult.readiness.readinessPercent,
        nepaRoute: nepaResult.assessmentRoute,
        exemptionRoute: exemptionResult.assessmentRoute,
        phaseOneRoute: phaseOneResult.assessmentRoute,
        handoffs: handoffs.length,
        disclosures: nepaResult.disclosures.length,
        message: "Environmental intake smoke test passed.",
      },
      null,
      2
    )
  );
}

main();
