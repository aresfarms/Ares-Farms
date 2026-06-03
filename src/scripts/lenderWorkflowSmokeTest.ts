import {
  LENDER_WORKFLOW_DISCLOSURES,
  LENDER_WORKFLOW_PRODUCTION_RESTRICTIONS,
  LENDER_WORKFLOW_RUNTIME_VERSION,
  LenderApplicationInput,
  evaluateLenderWorkflow,
} from "@/lib/lender/workflowRuntime";
import { eventContractRegistry } from "@/lib/modules/eventContractRegistry";
import { crossModuleHandoffMap } from "@/lib/modules/handoffMap";
import { moduleManifests } from "@/lib/modules/moduleRegistry";

/**
 * Lender Workflow Smoke Test
 *
 * Master Volume Governance:
 * - Vol I: protects lender coordination accountability.
 * - Vol II: keeps coordination from becoming approval, eligibility,
 *   underwriting, credit decision, or lender commitment.
 * - Vol III: validates deterministic aggregation across application
 *   intake, overlay review, evidence preparation, borrower packet
 *   readiness, and partner workflow state.
 * - Vol III-B: confirms human-review-required posture and governed evidence.
 * - Vol IV: confirms operator/lender handoff coverage.
 * - Vol V-VII: confirms registry, contract, handoff, and disclosure conformance.
 */

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function main() {
  const emptyResult = evaluateLenderWorkflow({});

  assert(
    emptyResult.runtimeVersion === LENDER_WORKFLOW_RUNTIME_VERSION,
    "Lender workflow must emit the runtime version."
  );
  assert(
    emptyResult.productionBlocked === true,
    "Lender workflow must remain production-blocked."
  );
  assert(
    emptyResult.humanReviewRequired === true,
    "Lender workflow must require human review."
  );
  assert(
    emptyResult.coordinationOnly === true &&
      emptyResult.noUnderwritingReliance === true &&
      emptyResult.noLenderCommitment === true &&
      emptyResult.noOfficialCreditDecision === true &&
      emptyResult.noBorrowerNoticeSend === true &&
      emptyResult.noLegalOrRegulatoryReliance === true,
    "Lender workflow must block underwriting reliance, lender commitment, official credit decision, borrower notice send, and legal/regulatory reliance."
  );
  assert(
    emptyResult.totals.applicationCount === 0 &&
      emptyResult.queueItems.length === 0,
    "Empty lender workflow input should produce an empty queue."
  );
  assert(
    emptyResult.sections.length === 5,
    "Lender workflow must surface five coordination sections."
  );

  const applications: LenderApplicationInput[] = [
    {
      applicationId: "app-smoke-ready",
      borrowerId: "borrower-smoke-ready",
      intakeReadinessPercent: 100,
      documentsRequested: 3,
      documentsReceived: 3,
      documentsPendingReview: 0,
      overlayCount: 2,
      overlayReviewedCount: 2,
      evidencePacketReady: true,
      borrowerPacketReady: true,
      partnerWorkflowState: "AWAITING_LENDER_REVIEW",
    },
    {
      applicationId: "app-smoke-overlay",
      borrowerId: "borrower-smoke-overlay",
      intakeReadinessPercent: 90,
      documentsRequested: 3,
      documentsReceived: 3,
      documentsPendingReview: 0,
      overlayCount: 2,
      overlayReviewedCount: 1,
      evidencePacketReady: false,
      borrowerPacketReady: false,
      partnerWorkflowState: "OPENED",
    },
    {
      applicationId: "app-smoke-evidence",
      borrowerId: "borrower-smoke-evidence",
      intakeReadinessPercent: 60,
      documentsRequested: 4,
      documentsReceived: 2,
      documentsPendingReview: 1,
      overlayCount: 0,
      overlayReviewedCount: 0,
      evidencePacketReady: false,
      borrowerPacketReady: false,
      partnerWorkflowState: "OPENED",
    },
    {
      applicationId: "app-smoke-onhold",
      borrowerId: "borrower-smoke-onhold",
      status: "ON_HOLD",
      intakeReadinessPercent: 50,
      documentsRequested: 3,
      documentsReceived: 1,
      documentsPendingReview: 0,
      overlayCount: 1,
      overlayReviewedCount: 0,
      evidencePacketReady: false,
      borrowerPacketReady: false,
      partnerWorkflowState: "OPENED",
    },
  ];

  const result = evaluateLenderWorkflow({
    lenderId: "lender-smoke",
    applications,
  });

  assert(
    result.totals.applicationCount === applications.length,
    "Lender workflow totals must reflect the supplied application count."
  );
  assert(
    result.totals.readyForReviewCount === 1,
    "Lender workflow must classify a complete application as ready for review."
  );
  assert(
    result.totals.overlayReviewPendingCount === 1,
    "Lender workflow must classify an overlay-pending application correctly."
  );
  assert(
    result.totals.evidencePendingCount === 1,
    "Lender workflow must classify an evidence-pending application correctly."
  );
  assert(
    result.totals.onHoldCount === 1,
    "Lender workflow must surface on-hold applications."
  );

  assert(
    result.queueItems.every((item) =>
      item.blockedClaims.includes("approval")
    ),
    "Every lender queue item must block approval claims."
  );

  assert(
    result.queueItems.every((item) =>
      !item.borrowerIdMasked.startsWith("borrower-smoke")
        ? true
        : item.borrowerIdMasked.includes("***")
    ),
    "Borrower identifiers must be masked on the lender surface."
  );

  assert(
    result.disclosures.includes(
      "Lender workflow coordination is review-bound and coordination only."
    ),
    "Lender workflow disclosures must include the coordination-only language."
  );
  assert(
    result.disclosures.includes(
      "Lender workflow coordination does not create a lender commitment."
    ),
    "Lender workflow disclosures must block lender commitment claims."
  );
  assert(
    result.productionRestrictions.includes("no lender commitment") &&
      result.productionRestrictions.includes("no underwriting decision") &&
      result.productionRestrictions.includes("no credit decision"),
    "Lender workflow production restrictions must block lender commitment, underwriting decision, and credit decision."
  );
  assert(
    LENDER_WORKFLOW_DISCLOSURES.includes(
      "Lender-ready means organized and complete against intake requirements only."
    ),
    "Lender workflow disclosure constants must preserve lender-ready governance."
  );
  assert(
    LENDER_WORKFLOW_PRODUCTION_RESTRICTIONS.includes("no approval"),
    "Lender workflow production restriction constants must include the no-approval boundary."
  );

  const filteredResult = evaluateLenderWorkflow({
    lenderId: "lender-smoke",
    applications,
    filter: { onlyPacketReady: true },
  });

  assert(
    filteredResult.totals.applicationCount === 1 &&
      filteredResult.queueItems.every(
        (item) => item.applicationStatus === "PACKET_READY_FOR_REVIEW"
      ),
    "Lender workflow filter onlyPacketReady must restrict the queue."
  );

  const moduleManifest = moduleManifests.find(
    (manifest) => manifest.id === "lender-workflow"
  );
  assert(
    moduleManifest !== undefined,
    "Lender workflow module manifest must be registered."
  );
  assert(
    moduleManifest.productionBlocked && moduleManifest.replayRequired,
    "Lender workflow module must remain production-blocked and replay-required."
  );
  assert(
    moduleManifest.claimsProfile === "lender-coordination",
    "Lender workflow module must use the lender-coordination claims profile."
  );
  assert(
    moduleManifest.eventsPublished.includes("lender.workflow.viewed"),
    "Lender workflow module must publish the workflow viewed event."
  );

  const contract = eventContractRegistry.find(
    (eventContract) => eventContract.eventType === "lender.workflow.viewed"
  );
  assert(
    contract !== undefined,
    "Lender workflow viewed event contract must be registered."
  );
  assert(
    contract.productionBlocked && contract.replayRequired,
    "Lender workflow event contract must be production-blocked and replay-required."
  );
  assert(
    contract.classificationLevel === "CONFIDENTIAL",
    "Lender workflow event contract must be CONFIDENTIAL."
  );
  assert(
    contract.purpose.includes("without approval"),
    "Lender workflow contract must preserve no-approval purpose language."
  );

  const handoffs = crossModuleHandoffMap.filter(
    (handoff) =>
      handoff.fromModuleId === "lender-workflow" ||
      handoff.toModuleId === "lender-workflow"
  );
  assert(
    handoffs.length >= 6,
    "Lender workflow module must have at least six governed handoff routes."
  );
  assert(
    handoffs.every(
      (handoff) => handoff.productionBlocked && handoff.humanReviewBoundary
    ),
    "Every lender workflow handoff must remain production-blocked and human-review-bound."
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        emptyApplications: emptyResult.totals.applicationCount,
        populatedApplications: result.totals.applicationCount,
        readyForReview: result.totals.readyForReviewCount,
        overlayReviewPending: result.totals.overlayReviewPendingCount,
        evidencePending: result.totals.evidencePendingCount,
        onHold: result.totals.onHoldCount,
        handoffs: handoffs.length,
        disclosures: result.disclosures.length,
        message: "Lender workflow smoke test passed.",
      },
      null,
      2
    )
  );
}

main();
