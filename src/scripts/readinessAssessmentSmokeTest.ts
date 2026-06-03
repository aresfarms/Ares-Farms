import { borrowerOnboardingInitialState } from "@/lib/borrower/onboardingCore";
import { eventContractRegistry } from "@/lib/modules/eventContractRegistry";
import { crossModuleHandoffMap } from "@/lib/modules/handoffMap";
import { moduleManifests } from "@/lib/modules/moduleRegistry";
import {
  READINESS_ASSESSMENT_RUNTIME_VERSION,
  READINESS_DISCLOSURES,
  assessBorrowerReadiness,
} from "@/lib/readiness/readinessAssessment";

/**
 * Readiness Assessment Smoke Test
 *
 * Master Volume Governance:
 * - Vol I: protects accountable readiness guidance.
 * - Vol II: keeps readiness from becoming approval, certification, public
 *   verification, or regulatory reliance.
 * - Vol III: validates deterministic, replay-safe readiness aggregation.
 * - Vol III-B: confirms human-review-required posture and governed evidence.
 * - Vol IV: confirms operator/borrower handoff coverage.
 * - Vol V-VII: confirms registry, contract, handoff, and disclosure conformance.
 */

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function main() {
  const emptyResult = assessBorrowerReadiness({});

  assert(
    emptyResult.runtimeVersion === READINESS_ASSESSMENT_RUNTIME_VERSION,
    "Readiness assessment must emit the runtime version."
  );
  assert(
    emptyResult.productionBlocked === true,
    "Readiness assessment must remain production-blocked."
  );
  assert(
    emptyResult.humanReviewRequired === true,
    "Readiness assessment must require human review."
  );
  assert(
    emptyResult.noCertification === true &&
      emptyResult.noPublicVerification === true &&
      emptyResult.noApproval === true &&
      emptyResult.noLegalOrRegulatoryReliance === true,
    "Readiness assessment must block certification, verification, approval, and reliance claims."
  );
  assert(
    emptyResult.sections.length === 6,
    "Readiness assessment must surface six review-bound sections."
  );
  assert(
    emptyResult.sections.every(
      (section) => section.status === "NOT_STARTED" || section.status === "AWAITING_REVIEW"
    ),
    "Empty input should leave every section in NOT_STARTED or AWAITING_REVIEW posture."
  );
  assert(
    emptyResult.overallReadinessPercent <= 25,
    "Empty input should produce a low overall readiness."
  );

  const partialResult = assessBorrowerReadiness({
    borrowerId: "borrower-smoke",
    applicationId: "application-smoke",
    onboarding: {
      ...borrowerOnboardingInitialState,
      stage: "INTERMEDIATE",
      location: {
        country: "US",
        state: "MD",
        county: "Queen Anne's",
      },
      farmTypes: ["CROPS"],
      goals: ["EXPANSION"],
      acreage: 80,
      interests: {
        ...borrowerOnboardingInitialState.interests,
        financing: true,
        environmentalReports: true,
      },
    },
    financing: {
      borrowerId: "borrower-smoke",
      applicationId: "application-smoke",
      location: {
        country: "US",
        state: "MD",
        county: "Queen Anne's",
      },
      farmTypes: ["CROPS"],
      goals: ["EXPANSION"],
      acreage: 80,
      requestedAmount: 90000,
      documents: ["identity", "entity"],
      metadata: {
        purpose: "Working capital",
      },
    },
    documents: {
      requestedCount: 4,
      receivedCount: 2,
      pendingReviewCount: 2,
    },
    environmental: {
      intakeSubmitted: false,
      triggerReviewRequested: false,
      exemptionReviewRequested: false,
    },
    discovery: {
      interestsSelected: 1,
      advisoryViews: 0,
    },
    dataRights: {
      portabilityRequested: false,
      accessRequestSubmitted: false,
    },
  });

  assert(
    partialResult.overallReadinessPercent > 0 &&
      partialResult.overallReadinessPercent < 100,
    "Partial readiness input should produce a partial readiness percent."
  );
  assert(
    partialResult.sections.some(
      (section) => section.id === "documents" && section.status === "NEEDS_INPUT"
    ),
    "Partial readiness input should report documents as needing input."
  );
  assert(
    partialResult.recommendedNextRoutes.includes("/onboarding") ||
      partialResult.recommendedNextRoutes.includes("/financing-pathways"),
    "Partial readiness must route the borrower to upstream surfaces."
  );

  const completeResult = assessBorrowerReadiness({
    borrowerId: "borrower-smoke",
    applicationId: "application-smoke",
    onboarding: {
      ...borrowerOnboardingInitialState,
      stage: "ADVANCED",
      location: {
        country: "US",
        state: "MD",
        county: "Queen Anne's",
      },
      farmTypes: ["CROPS", "LIVESTOCK"],
      goals: ["EXPANSION", "SUSTAINABILITY"],
      acreage: 240,
      interests: {
        soilAnalysis: true,
        environmentalReports: true,
        financing: true,
        vendorRecommendations: true,
        commodityIntelligence: true,
      },
    },
    financing: {
      borrowerId: "borrower-smoke",
      applicationId: "application-smoke",
      location: {
        country: "US",
        state: "MD",
        county: "Queen Anne's",
      },
      farmTypes: ["CROPS", "LIVESTOCK"],
      goals: ["EXPANSION", "SUSTAINABILITY"],
      acreage: 240,
      requestedAmount: 220000,
      documents: ["identity", "entity", "property/control"],
      metadata: {
        purpose: "Expansion and working capital planning",
      },
    },
    documents: {
      requestedCount: 4,
      receivedCount: 4,
      pendingReviewCount: 0,
    },
    environmental: {
      intakeSubmitted: true,
      triggerReviewRequested: true,
      exemptionReviewRequested: false,
    },
    discovery: {
      interestsSelected: 3,
      advisoryViews: 2,
    },
    dataRights: {
      portabilityRequested: true,
      accessRequestSubmitted: true,
    },
  });

  assert(
    completeResult.overallReadinessPercent === 100,
    "Complete readiness input must reach 100 percent readiness."
  );
  assert(
    completeResult.sections.every(
      (section) => section.status === "READY_FOR_REVIEW"
    ),
    "Complete readiness input must leave every section ready for human review."
  );
  assert(
    completeResult.disclosures.includes(
      "Readiness assessment is operational guidance only."
    ),
    "Readiness disclosures must include the operational-guidance language."
  );
  assert(
    completeResult.disclosures.includes(
      "Readiness assessment is not an official certification."
    ),
    "Readiness disclosures must block official certification claims."
  );
  assert(
    completeResult.productionRestrictions.includes("no public verification"),
    "Readiness restrictions must block public verification claims."
  );
  assert(
    READINESS_DISCLOSURES.includes(
      "Readiness assessment does not authorize legal or regulatory reliance."
    ),
    "Readiness disclosure constants must block legal/regulatory reliance."
  );

  const moduleManifest = moduleManifests.find(
    (manifest) => manifest.id === "portal-borrower-readiness"
  );
  assert(
    moduleManifest !== undefined,
    "Borrower readiness module manifest must be registered."
  );
  assert(
    moduleManifest.productionBlocked,
    "Borrower readiness module must remain production-blocked."
  );
  assert(
    moduleManifest.replayRequired,
    "Borrower readiness module must require replay."
  );
  assert(
    moduleManifest.eventsPublished.includes("borrower.readiness.assessed"),
    "Borrower readiness module must publish the readiness assessed event."
  );
  assert(
    moduleManifest.eventsConsumed.includes("borrower.onboarding.submitted") &&
      moduleManifest.eventsConsumed.includes("financing.pathway.evaluated"),
    "Borrower readiness module must consume upstream onboarding and financing events."
  );

  const contract = eventContractRegistry.find(
    (eventContract) => eventContract.eventType === "borrower.readiness.assessed"
  );
  assert(
    contract !== undefined,
    "Readiness assessed event contract must be registered."
  );
  assert(
    contract.productionBlocked && contract.replayRequired,
    "Readiness event contract must be production-blocked and replay-required."
  );
  assert(
    contract.purpose.includes("without approval"),
    "Readiness event contract must preserve no-approval purpose language."
  );

  const handoffs = crossModuleHandoffMap.filter(
    (handoff) =>
      handoff.fromModuleId === "portal-borrower-readiness" ||
      handoff.toModuleId === "portal-borrower-readiness"
  );
  assert(
    handoffs.length >= 4,
    "Readiness module must have at least four governed handoff routes."
  );
  assert(
    handoffs.every(
      (handoff) => handoff.productionBlocked && handoff.humanReviewBoundary
    ),
    "Every readiness handoff must remain production-blocked and human-review-bound."
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        emptyReadiness: emptyResult.overallReadinessPercent,
        partialReadiness: partialResult.overallReadinessPercent,
        completeReadiness: completeResult.overallReadinessPercent,
        sections: completeResult.sections.length,
        handoffs: handoffs.length,
        disclosures: completeResult.disclosures.length,
        message: "Readiness assessment smoke test passed.",
      },
      null,
      2
    )
  );
}

main();
