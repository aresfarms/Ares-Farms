import {
  borrowerOnboardingInitialState,
  createBorrowerOnboardingWorkflow,
} from "@/lib/borrower/onboardingCore";

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function main() {
  const incompleteWorkflow = createBorrowerOnboardingWorkflow(
    borrowerOnboardingInitialState
  );

  assert(
    incompleteWorkflow.productionBlocked,
    "Borrower onboarding must remain production-blocked."
  );
  assert(
    incompleteWorkflow.humanReviewRequired,
    "Borrower onboarding must require human review."
  );
  assert(
    incompleteWorkflow.missingItems.includes("farm stage"),
    "Incomplete onboarding should identify missing farm stage."
  );
  assert(
    incompleteWorkflow.disclosures.includes("No approval has been granted."),
    "Borrower onboarding must include no-approval disclosure."
  );

  const completeWorkflow = createBorrowerOnboardingWorkflow({
    ...borrowerOnboardingInitialState,
    stage: "INTERMEDIATE",
    location: {
      country: "US",
      state: "MD",
      county: "Queen Anne's",
    },
    farmTypes: ["CROPS"],
    goals: ["EXPANSION"],
    acreage: 120,
    interests: {
      soilAnalysis: true,
      environmentalReports: true,
      financing: true,
      vendorRecommendations: false,
      commodityIntelligence: true,
    },
  });

  assert(
    completeWorkflow.readinessPercent === 100,
    "Complete onboarding should reach 100 percent readiness."
  );
  assert(
    completeWorkflow.handoffs.some(
      (handoff) => handoff.route === "/portal/borrower/applications"
    ),
    "Borrower onboarding must hand off to borrower applications."
  );
  assert(
    completeWorkflow.handoffs.some(
      (handoff) => handoff.route === "/environmental-compliance"
    ),
    "Borrower onboarding must hand off to environmental intake."
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        incompleteReadiness: incompleteWorkflow.readinessPercent,
        completeReadiness: completeWorkflow.readinessPercent,
        handoffs: completeWorkflow.handoffs.length,
        disclosures: completeWorkflow.disclosures.length,
        message: "Borrower onboarding core smoke test passed.",
      },
      null,
      2
    )
  );
}

main();
