import {
  FINANCING_PATHWAY_DISCLOSURES,
  evaluateFinancingPathways,
} from "@/lib/financing/pathwayEngine";
import { eventContractRegistry } from "@/lib/modules/eventContractRegistry";
import { crossModuleHandoffMap } from "@/lib/modules/handoffMap";
import { moduleManifests } from "@/lib/modules/moduleRegistry";

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function main() {
  const incompleteResult = evaluateFinancingPathways({
    borrowerId: "borrower-smoke",
    location: {
      country: "US",
      state: "MD",
      county: "",
    },
    farmTypes: [],
    goals: ["EXPANSION"],
    acreage: 0,
    requestedAmount: null,
    documents: [],
  });

  assert(
    incompleteResult.productionBlocked,
    "Financing pathway engine must remain production-blocked."
  );
  assert(
    incompleteResult.humanReviewRequired,
    "Financing pathway engine must require human review."
  );
  assert(
    incompleteResult.noApproval &&
      incompleteResult.noGuarantee &&
      incompleteResult.noLegalOrRegulatoryReliance,
    "Financing pathway engine must block approval, guarantee, and reliance claims."
  );
  assert(
    incompleteResult.readiness.missingItems.includes("farm type"),
    "Incomplete pathway input should identify missing farm type."
  );
  assert(
    incompleteResult.readiness.missingItems.includes("supporting documents"),
    "Incomplete pathway input should identify missing supporting documents."
  );

  const completeResult = evaluateFinancingPathways({
    borrowerId: "borrower-smoke",
    applicationId: "application-smoke",
    location: {
      country: "US",
      state: "MD",
      county: "Queen Anne's",
    },
    farmTypes: ["CROPS"],
    goals: ["EXPANSION", "SUSTAINABILITY"],
    acreage: 120,
    requestedAmount: 125000,
    documents: ["identity", "entity", "property/control"],
    metadata: {
      purpose: "Expansion and working capital planning",
    },
  });

  assert(
    completeResult.readiness.readinessPercent === 100,
    "Complete financing pathway input should reach 100 percent readiness."
  );
  assert(
    completeResult.pathways.length >= 3,
    "Financing pathway engine should return program graph pathway candidates."
  );
  assert(
    completeResult.pathways.every((pathway) =>
      pathway.blockedClaims.includes("approval")
    ),
    "Every pathway must block approval claims."
  );
  assert(
    completeResult.disclosures.includes("No approval has been granted."),
    "Financing pathway disclosures must include no-approval language."
  );
  assert(
    completeResult.disclosures.includes(
      "No legal or regulatory reliance is authorized."
    ),
    "Financing pathway disclosures must include no legal/regulatory reliance language."
  );
  assert(
    FINANCING_PATHWAY_DISCLOSURES.includes(
      "No lender commitment has been made."
    ),
    "Financing pathway disclosures must block lender commitment claims."
  );

  const moduleManifest = moduleManifests.find(
    (manifest) => manifest.id === "portal-borrower-financing-pathways"
  );
  assert(
    moduleManifest !== undefined,
    "Borrower financing pathway module manifest must be registered."
  );
  assert(
    moduleManifest.productionBlocked,
    "Borrower financing pathway module must remain production-blocked."
  );
  assert(
    moduleManifest.eventsPublished.includes("financing.pathway.evaluated"),
    "Borrower financing pathway module must publish its evaluated event."
  );

  const contract = eventContractRegistry.find(
    (eventContract) => eventContract.eventType === "financing.pathway.evaluated"
  );
  assert(
    contract !== undefined,
    "Financing pathway evaluated event contract must be registered."
  );
  assert(
    contract.productionBlocked && contract.replayRequired,
    "Financing pathway event contract must be production-blocked and replay-required."
  );
  assert(
    contract.purpose.includes("without approval"),
    "Financing pathway event contract must preserve no-approval purpose language."
  );

  const handoffs = crossModuleHandoffMap.filter(
    (handoff) => handoff.fromModuleId === "portal-borrower-financing-pathways"
  );
  assert(
    handoffs.length >= 2,
    "Financing pathway module must hand off to downstream borrower workflows."
  );
  assert(
    handoffs.every(
      (handoff) => handoff.productionBlocked && handoff.humanReviewBoundary
    ),
    "Financing pathway handoffs must remain production-blocked and human-review-bound."
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        incompleteReadiness: incompleteResult.readiness.readinessPercent,
        completeReadiness: completeResult.readiness.readinessPercent,
        pathwayCount: completeResult.pathways.length,
        handoffs: handoffs.length,
        disclosures: completeResult.disclosures.length,
        message: "Financing pathway engine smoke test passed.",
      },
      null,
      2
    )
  );
}

main();
