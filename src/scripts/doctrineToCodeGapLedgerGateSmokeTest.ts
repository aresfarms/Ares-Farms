import fs from "fs";
import path from "path";

import {
  DOCTRINE_TO_CODE_GAP_LEDGER_CHECKPOINT_ID,
  evaluateDoctrineToCodeGapLedgerGate,
} from "@/lib/governance/doctrineToCodeGapLedgerGate";
import { eventContractRegistry } from "@/lib/modules/eventContractRegistry";
import { crossModuleHandoffMap } from "@/lib/modules/handoffMap";
import { moduleManifests } from "@/lib/modules/moduleRegistry";
import { allPortableVerticalSurfaces } from "@/lib/modules/portableVerticalSurface";

/**
 * Doctrine-to-Code Gap Ledger Gate Smoke Test
 *
 * Verifies Module 43 names the three controlled-promotion doctrine gaps with
 * owners, routes, blocked reasons, required evidence, promotion conditions,
 * human authority, current Master Volume version evidence, event contracts,
 * handoffs, portable surface registration, and production authority blocks.
 */

const repoRoot = process.cwd();

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function routeFileExists(route: string): boolean {
  return fs.existsSync(path.join(repoRoot, `src/app${route}/page.tsx`));
}

function apiRouteExists(route: string): boolean {
  return fs.existsSync(path.join(repoRoot, `src/app${route}/route.ts`));
}

function main() {
  const result = evaluateDoctrineToCodeGapLedgerGate();
  const review = result.doctrineGapLedgerReviews[0];
  const manifest = moduleManifests.find(
    (entry) => entry.id === "doctrine-gap-ledger"
  );
  const eventTypes = new Set(
    eventContractRegistry.map((contract) => contract.eventType)
  );
  const gapIds = new Set(result.doctrineGaps.map((gap) => gap.id));
  const portableSurface = allPortableVerticalSurfaces.find(
    (surface) => surface.id === "internal-doctrine-gap-ledger"
  );

  assert(Boolean(manifest), "Module 43 manifest is missing.");
  assert(
    manifest?.moduleNumber === 43,
    "Module 43 manifest number is incorrect."
  );
  assert(
    manifest?.route === "/doctrine-gap-ledger",
    "Module 43 route is incorrect."
  );
  assert(
    manifest?.claimsProfile === "live-action-blocked",
    "Module 43 must use live-action-blocked claims posture."
  );
  assert(
    routeFileExists("/doctrine-gap-ledger"),
    "Module 43 page route file is missing."
  );
  assert(
    apiRouteExists("/api/governance/doctrine-gap-ledger"),
    "Module 43 doctrine gap ledger API route is missing."
  );
  assert(Boolean(review), "Doctrine gap ledger review is missing.");
  assert(
    review?.reviewStatus === "DOCTRINE_GAP_LEDGER_REVIEW_BOUND",
    "Doctrine gap ledger review must remain review-bound."
  );
  assert(
    result.checkpointId === DOCTRINE_TO_CODE_GAP_LEDGER_CHECKPOINT_ID &&
      review?.checkpointId === DOCTRINE_TO_CODE_GAP_LEDGER_CHECKPOINT_ID,
    "Doctrine gap ledger checkpoint id is incorrect."
  );
  assert(
    result.summary.totalRequirements === 60 &&
      result.summary.implementedRequirements === 57 &&
      result.summary.awaitingControlledPromotion === 3,
    "Doctrine gap ledger must preserve the 60/57/3 requirement posture."
  );
  assert(
    result.summary.namedGapCount === 3 &&
      result.summary.unnamedGapCount === 0 &&
      result.summary.allGapsNamed === 1 &&
      result.summary.allGapsOwned === 1 &&
      result.summary.allGapsRouted === 1 &&
      result.summary.allGapsHaveRequiredEvidence === 1 &&
      result.summary.allGapsHavePromotionConditions === 1,
    "Doctrine gap ledger must name, own, route, evidence, and condition every gap."
  );
  assert(
    gapIds.has("PROMOTION-GATE-001") &&
      gapIds.has("PUBLIC-SURFACE-001") &&
      gapIds.has("SURFACE-GOV-001"),
    "Doctrine gap ledger must include the three controlled-promotion gap ids."
  );
  assert(
    result.doctrineGaps.every(
      (gap) =>
        gap.status === "awaiting_controlled_promotion" &&
        gap.productionBlocked &&
        gap.publicActionBlocked &&
        gap.publicVerificationBlocked &&
        gap.officialRelianceBlocked &&
        gap.legalAdviceBlocked &&
        gap.liveExternalActionBlocked &&
        gap.owner.length > 0 &&
        gap.requiredHumanAuthority.length > 0 &&
        gap.route.startsWith("/") &&
        gap.blockedReason.length > 0 &&
        gap.requiredEvidence.length > 0 &&
        gap.promotionCondition.length > 0 &&
        gap.tests.length > 0 &&
        gap.existingEvidence.length > 0 &&
        gap.promotionTicket.startsWith("docs/tickets/")
    ),
    "Every doctrine gap must remain named, owned, routed, evidenced, ticketed, and blocked."
  );
  assert(
    review?.currentMasterVolumeVersions.some(
      (entry) => entry.key === "volumeVI" && entry.governingVersion === "v1.1"
    ) &&
      review.currentMasterVolumeVersions.some(
        (entry) => entry.key === "volumeVII"
      ) &&
      review.currentMasterVolumeVersions.some(
        (entry) => entry.key === "volumeIII-B"
      ) &&
      review.currentMasterVolumeVersions.some((entry) => entry.key === "xref"),
    "Doctrine gap ledger must attach current Vol VI, Vol VII, Vol III-B, and cross-reference version evidence."
  );
  assert(
    result.disclosures.includes("Your document was received.") &&
      result.disclosures.includes("Human review is pending.") &&
      result.disclosures.includes("More information may be needed.") &&
      result.disclosures.includes(
        "All current doctrine-to-code gaps are named, owned, routed, and review-bound."
      ) &&
      result.disclosures.includes(
        "Awaiting controlled promotion is not production approval."
      ) &&
      result.disclosures.includes("No production launch has been authorized.") &&
      result.disclosures.includes(
        "No public production API exposure has been approved."
      ) &&
      result.disclosures.includes(
        "No production portal launch has been executed."
      ) &&
      result.disclosures.includes("No payment capture has been enabled.") &&
      result.disclosures.includes(
        "No public verification authority has been granted."
      ) &&
      result.disclosures.includes("No official reliance has been created.") &&
      result.disclosures.includes("No legal advice has been provided.") &&
      result.disclosures.includes("No live external action has been performed."),
    "Doctrine gap ledger disclosures must include safe status and production-block messages."
  );
  assert(
    result.summary.productionLaunchAuthorized === 0 &&
      result.summary.publicProductionApiExposureAllowed === 0 &&
      result.summary.productionPortalLaunchExecuted === 0 &&
      result.summary.paymentCaptureAllowed === 0 &&
      result.summary.borrowerNoticeSendsAllowed === 0 &&
      result.summary.officialReportsAllowed === 0 &&
      result.summary.publicVerificationApprovalGranted === 0 &&
      result.summary.officialRelianceAllowed === 0 &&
      result.summary.legalAdviceProvided === 0 &&
      result.summary.liveExternalActionsPerformed === 0,
    "Doctrine gap ledger must not authorize launch, public exposure, portal launch, payments, notices, reports, public verification, official reliance, legal advice, or live external actions."
  );
  assert(
    eventTypes.has("doctrine.gap.ledger.reviewed"),
    "Missing doctrine.gap.ledger.reviewed event contract."
  );
  assert(
    crossModuleHandoffMap.some(
      (handoff) =>
        handoff.fromModuleId === "build-preservation" &&
        handoff.toModuleId === "doctrine-gap-ledger" &&
        handoff.eventType === "build.preservation.archived" &&
        handoff.productionBlocked
    ),
    "Missing build preservation to doctrine gap ledger handoff."
  );
  assert(
    crossModuleHandoffMap.some(
      (handoff) =>
        handoff.fromModuleId === "doctrine-gap-ledger" &&
        handoff.toModuleId === "module-readiness" &&
        handoff.eventType === "doctrine.gap.ledger.reviewed" &&
        handoff.productionBlocked
    ),
    "Missing doctrine gap ledger to module readiness handoff."
  );
  assert(
    crossModuleHandoffMap.some(
      (handoff) =>
        handoff.fromModuleId === "doctrine-gap-ledger" &&
        handoff.toModuleId === "governance" &&
        handoff.eventType === "doctrine.gap.ledger.reviewed" &&
        handoff.productionBlocked
    ),
    "Missing doctrine gap ledger to governance handoff."
  );
  assert(
    Boolean(portableSurface),
    "Doctrine gap ledger portable vertical surface is missing."
  );
  assert(
    Boolean(
      portableSurface?.safeMessages.includes(
        "Awaiting controlled promotion is not production approval."
      ) &&
        portableSurface.productionBlocks.includes(
          "no production launch authorization"
        )
    ),
    "Doctrine gap ledger portable surface must carry safe messages and production blocks."
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        checkedAt: new Date().toISOString(),
        checkpointId: result.checkpointId,
        totalRequirements: result.summary.totalRequirements,
        implementedRequirements: result.summary.implementedRequirements,
        awaitingControlledPromotion:
          result.summary.awaitingControlledPromotion,
        namedGapCount: result.summary.namedGapCount,
        unnamedGapCount: result.summary.unnamedGapCount,
        message: "Doctrine-to-code gap ledger gate smoke test passed.",
      },
      null,
      2
    )
  );
}

main();
