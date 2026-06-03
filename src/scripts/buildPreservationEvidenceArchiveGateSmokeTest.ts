import fs from "fs";
import path from "path";

import {
  BUILD_PRESERVATION_CHECKPOINT_COMMIT,
  BUILD_PRESERVATION_CHECKPOINT_ID,
  evaluateBuildPreservationEvidenceArchiveGate,
} from "@/lib/governance/buildPreservationEvidenceArchiveGate";
import { eventContractRegistry } from "@/lib/modules/eventContractRegistry";
import { crossModuleHandoffMap } from "@/lib/modules/handoffMap";
import { moduleManifests } from "@/lib/modules/moduleRegistry";
import { allPortableVerticalSurfaces } from "@/lib/modules/portableVerticalSurface";

/**
 * Build Preservation and Evidence Archive Gate Smoke Test
 *
 * Verifies Module 42 records the Module 41 checkpoint evidence archive while
 * keeping tree drift, ignored-sensitive-file, production launch, deployment,
 * public API exposure, portal launch, payment, notice, report, public
 * verification, official reliance, legal advice, regulatory response,
 * corrective-action, remediation, and live external action authority blocked.
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
  const result = evaluateBuildPreservationEvidenceArchiveGate();
  const review = result.buildPreservationReviews[0];
  const manifest = moduleManifests.find(
    (entry) => entry.id === "build-preservation"
  );
  const eventTypes = new Set(
    eventContractRegistry.map((contract) => contract.eventType)
  );

  assert(Boolean(manifest), "Module 42 manifest is missing.");
  assert(
    manifest?.moduleNumber === 42,
    "Module 42 manifest number is incorrect."
  );
  assert(
    manifest?.route === "/build-preservation",
    "Module 42 route is incorrect."
  );
  assert(
    manifest?.claimsProfile === "live-action-blocked",
    "Module 42 must use live-action-blocked claims posture."
  );
  assert(
    routeFileExists("/build-preservation"),
    "Module 42 page route file is missing."
  );
  assert(
    apiRouteExists("/api/governance/build-preservation"),
    "Module 42 build preservation API route is missing."
  );
  assert(Boolean(review), "Build preservation review is missing.");
  assert(
    review?.reviewStatus === "BUILD_PRESERVATION_REVIEW_BOUND",
    "Build preservation review must remain review-bound."
  );
  assert(
    result.checkpointId === BUILD_PRESERVATION_CHECKPOINT_ID &&
      review?.canonicalCheckpointId === BUILD_PRESERVATION_CHECKPOINT_ID,
    "Build preservation checkpoint id is incorrect."
  );
  assert(
    review?.checkpointCommitHash === BUILD_PRESERVATION_CHECKPOINT_COMMIT,
    "Build preservation checkpoint commit is incorrect."
  );
  assert(
    review?.archiveSnapshot.moduleManifestsAtCheckpoint === 62 &&
      review.archiveSnapshot.highestModuleNumberAtCheckpoint === 41 &&
      review.archiveSnapshot.eventContractsAtCheckpoint === 53 &&
      review.archiveSnapshot.handoffsAtCheckpoint === 86 &&
      review.archiveSnapshot.publicSurfacesAtCheckpoint === 19 &&
      review.archiveSnapshot.portableSurfacesAtCheckpoint === 42,
    "Build preservation archive must preserve Module 41 checkpoint facts."
  );
  assert(
    review?.moduleCount === moduleManifests.length &&
      review?.portableSurfaceCount === allPortableVerticalSurfaces.length,
    "Build preservation review must attach current module and portable surface counts."
  );
  assert(
    result.summary.totalReviews === 1 &&
      result.summary.totalPreservationItems === review?.preservationItems.length,
    "Build preservation summary must match review controls."
  );
  assert(
    result.summary.checkpointRecorded === 1 &&
      result.summary.buildArchiveGenerated === 1 &&
      result.summary.ignoredSensitiveFilesVerified === 1,
    "Build preservation must record checkpoint, archive, and ignored-sensitive-file evidence."
  );
  assert(
    result.summary.productionLaunchAuthorized === 0 &&
      result.summary.deploymentExecuted === 0 &&
      result.summary.publicProductionApiExposureAllowed === 0 &&
      result.summary.productionPortalLaunchExecuted === 0 &&
      result.summary.paymentCaptureAllowed === 0 &&
      result.summary.borrowerNoticeSendsAllowed === 0 &&
      result.summary.officialReportsAllowed === 0 &&
      result.summary.publicVerificationApprovalGranted === 0 &&
      result.summary.officialRelianceAllowed === 0 &&
      result.summary.legalAdviceProvided === 0 &&
      result.summary.liveExternalActionsPerformed === 0,
    "Build preservation must not approve production launch, deployment, public exposure, portal launch, payments, notices, reports, public verification, official reliance, legal advice, or live external actions."
  );
  assert(
    review?.productionBlocked &&
      review?.checkpointRecorded &&
      review?.buildArchiveGenerated &&
      review?.recoveryKeyIgnored &&
      review?.envIgnored,
    "Build preservation review must preserve checkpoint, archive, production block, and sensitive ignore evidence."
  );
  assert(
    review?.verificationEvidence.some(
      (evidence) =>
        evidence.command === "npm run verify:backend" &&
        evidence.status === "PASS"
    ) &&
      review?.verificationEvidence.some(
        (evidence) =>
          evidence.command === "npm run build" && evidence.status === "PASS"
      ),
    "Build preservation must attach verify:backend and build evidence."
  );
  assert(
    review?.preservationItems.some(
      (preservationItem) =>
        preservationItem.id === "canonical-checkpoint-recorded"
    ) &&
      review?.preservationItems.some(
        (preservationItem) =>
          preservationItem.id === "master-volume-0-vii-conformance-attached"
      ) &&
      review?.preservationItems.some(
        (preservationItem) =>
          preservationItem.id === "backend-verification-evidence-attached"
      ) &&
      review?.preservationItems.some(
        (preservationItem) => preservationItem.id === "tree-drift-check"
      ) &&
      review?.preservationItems.some(
        (preservationItem) =>
          preservationItem.id === "ignored-sensitive-files-verified"
      ) &&
      review?.preservationItems.some(
        (preservationItem) =>
          preservationItem.id === "production-authority-remains-blocked"
      ),
    "Build preservation must include checkpoint, Vol 0-VII, verification, drift, sensitive-file, and production block controls."
  );
  assert(
    result.disclosures.includes("Your document was received.") &&
      result.disclosures.includes("Human review is pending.") &&
      result.disclosures.includes("More information may be needed.") &&
      result.disclosures.includes(
        "Module 41 conforms to current Master Volumes 0-VII as of the checkpoint evidence."
      ) &&
      result.disclosures.includes(
        "Build preservation is evidence-only and does not authorize production launch."
      ) &&
      result.disclosures.includes(
        "Sensitive files must remain ignored and outside build history."
      ) &&
      result.disclosures.includes("No deployment has been executed.") &&
      result.disclosures.includes(
        "No public production API exposure has been approved."
      ) &&
      result.disclosures.includes(
        "No production portal launch has been executed."
      ) &&
      result.disclosures.includes("No payment capture has been enabled.") &&
      result.disclosures.includes("No official reliance has been created.") &&
      result.disclosures.includes("No legal advice has been provided.") &&
      result.disclosures.includes("No live external action has been performed."),
    "Build preservation disclosures must include required safe status, Vol 0-VII, sensitive-file, and production-block messages."
  );
  assert(
    eventTypes.has("build.preservation.archived"),
    "Missing build.preservation.archived event contract."
  );
  assert(
    crossModuleHandoffMap.some(
      (handoff) =>
        handoff.fromModuleId === "production-regulatory-response" &&
        handoff.toModuleId === "build-preservation" &&
        handoff.eventType === "production.regulatory.response.reviewed" &&
        handoff.productionBlocked
    ),
    "Missing production regulatory response to build preservation handoff."
  );
  assert(
    crossModuleHandoffMap.some(
      (handoff) =>
        handoff.fromModuleId === "build-preservation" &&
        handoff.toModuleId === "module-readiness" &&
        handoff.eventType === "build.preservation.archived" &&
        handoff.productionBlocked
    ),
    "Missing build preservation to module readiness handoff."
  );
  assert(
    crossModuleHandoffMap.some(
      (handoff) =>
        handoff.fromModuleId === "build-preservation" &&
        handoff.toModuleId === "governance" &&
        handoff.eventType === "build.preservation.archived" &&
        handoff.productionBlocked
    ),
    "Missing build preservation to governance handoff."
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        checkedAt: new Date().toISOString(),
        checkpointId: result.checkpointId,
        checkpointCommitHash: BUILD_PRESERVATION_CHECKPOINT_COMMIT,
        preservationItemsChecked: result.summary.totalPreservationItems,
        blocked: result.summary.blocked,
        reviewRequired: result.summary.reviewRequired,
        treeDriftDetected: result.summary.treeDriftDetected,
        ignoredSensitiveFilesVerified:
          result.summary.ignoredSensitiveFilesVerified,
        productionLaunchAuthorized: result.summary.productionLaunchAuthorized,
        deploymentExecuted: result.summary.deploymentExecuted,
        publicProductionApiExposureAllowed:
          result.summary.publicProductionApiExposureAllowed,
        legalAdviceProvided: result.summary.legalAdviceProvided,
        liveExternalActionsPerformed: result.summary.liveExternalActionsPerformed,
        message:
          "Build preservation and evidence archive gate smoke test passed.",
      },
      null,
      2
    )
  );
}

main();
