import fs from "fs";
import path from "path";

import { evaluateProductionFinalAuthorityGate } from "@/lib/governance/productionFinalAuthorityGate";
import { eventContractRegistry } from "@/lib/modules/eventContractRegistry";
import { crossModuleHandoffMap } from "@/lib/modules/handoffMap";
import { moduleManifests } from "@/lib/modules/moduleRegistry";
import { allPortableVerticalSurfaces } from "@/lib/modules/portableVerticalSurface";

/**
 * Production Final Authority Gate Smoke Test
 *
 * Verifies Module 36 assembles final authority evidence while keeping final
 * approval, go-live, production launch, hold release, deployment, public
 * exposure, support activation, customer communications, notices, official
 * reports, public verification, legal advice, official reliance, live external
 * actions, and payment capture blocked.
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
  const result = evaluateProductionFinalAuthorityGate();
  const review = result.productionFinalAuthorityReviews[0];
  const manifest = moduleManifests.find(
    (entry) => entry.id === "production-final-authority"
  );
  const eventTypes = new Set(
    eventContractRegistry.map((contract) => contract.eventType)
  );

  assert(Boolean(manifest), "Module 36 manifest is missing.");
  assert(
    manifest?.moduleNumber === 36,
    "Module 36 manifest number is incorrect."
  );
  assert(
    manifest?.route === "/production-final-authority",
    "Module 36 route is incorrect."
  );
  assert(
    manifest?.claimsProfile === "live-action-blocked",
    "Module 36 must use live-action-blocked claims posture."
  );
  assert(
    routeFileExists("/production-final-authority"),
    "Module 36 page route file is missing."
  );
  assert(
    apiRouteExists("/api/governance/production-final-authority"),
    "Module 36 production final authority API route is missing."
  );
  assert(Boolean(review), "Production final authority review is missing.");
  assert(
    review?.reviewStatus === "PRODUCTION_FINAL_AUTHORITY_BLOCKED",
    "Production final authority review must remain blocked."
  );
  assert(
    review?.moduleCount === moduleManifests.length &&
      review?.portableSurfaceCount === allPortableVerticalSurfaces.length,
    "Production final authority review must attach module and portable surface counts."
  );
  assert(
    result.summary.totalReviews === 1 &&
      result.summary.totalAuthorityItems === review?.authorityItems.length,
    "Production final authority summary must match review controls."
  );
  assert(
    result.summary.blocked > 0 && result.summary.reviewRequired > 0,
    "Production final authority must preserve blocked and review-required controls."
  );
  assert(
    result.summary.finalAuthorityApprovalGranted === 0 &&
      result.summary.goLiveApproved === 0 &&
      result.summary.productionLaunchAuthorized === 0 &&
      result.summary.constitutionalOfficerAttestationReceived === 0 &&
      result.summary.qualifiedReleaseManagerApprovalGranted === 0,
    "Production final authority must not approve final authority, go-live, production launch, constitutional attestation, or release-manager approval."
  );
  assert(
    result.summary.supportCommunicationsApprovalGranted === 0 &&
      result.summary.supportOperationsActivated === 0 &&
      result.summary.supportEscalationActivated === 0 &&
      result.summary.customerCommunicationsReleased === 0 &&
      result.summary.regulatoryCommunicationsReleased === 0 &&
      result.summary.publicStatusPageEnabled === 0,
    "Production final authority must not approve support, activate support, release communications, or enable public status."
  );
  assert(
    result.summary.borrowerNoticeSendsAllowed === 0 &&
      result.summary.officialReportsAllowed === 0 &&
      result.summary.publicVerificationAllowed === 0 &&
      result.summary.legalAdviceProvided === 0 &&
      result.summary.officialRelianceAllowed === 0,
    "Production final authority must not allow notices, official reports, public verification, legal advice, or official reliance."
  );
  assert(
    result.summary.incidentResponseActivated === 0 &&
      result.summary.incidentBridgeActivated === 0 &&
      result.summary.rollbackAuthorized === 0 &&
      result.summary.emergencyRollbackExecuted === 0 &&
      result.summary.emergencyHoldReleased === 0 &&
      result.summary.killSwitchActivated === 0,
    "Production final authority must not activate incident response, incident bridge, rollback, emergency rollback, emergency hold, or kill switch."
  );
  assert(
    result.summary.cutoverAuthorityGranted === 0 &&
      result.summary.productionCutoverApproved === 0 &&
      result.summary.productionCutoverExecuted === 0 &&
      result.summary.launchHoldReleased === 0 &&
      result.summary.deploymentHoldReleased === 0 &&
      result.summary.freezeHoldReleased === 0 &&
      result.summary.deploymentExecuted === 0,
    "Production final authority must not approve cutover authority, cutover, launch hold release, deployment hold release, freeze hold release, or deployment."
  );
  assert(
    result.summary.productionSecretsActivated === 0 &&
      result.summary.publicDnsCutoverAllowed === 0 &&
      result.summary.databaseMigrationAllowed === 0 &&
      result.summary.publicProductionApiExposureAllowed === 0 &&
      result.summary.productionPortalLaunchExecuted === 0 &&
      result.summary.liveExternalActionsAllowed === 0 &&
      result.summary.liveExternalActionsPerformed === 0 &&
      result.summary.paymentCaptureAllowed === 0,
    "Production final authority must not activate secrets, DNS, migrations, public APIs, portal launch, live actions, or payment capture."
  );
  assert(
    review?.productionBlocked &&
      review?.finalAuthorityApprovalGranted === false &&
      review?.goLiveApproved === false &&
      review?.productionLaunchAuthorized === false &&
      review?.constitutionalOfficerAttestationReceived === false &&
      review?.qualifiedReleaseManagerApprovalGranted === false &&
      review?.supportCommunicationsApprovalGranted === false &&
      review?.supportOperationsActivated === false &&
      review?.customerCommunicationsReleased === false &&
      review?.publicStatusPageEnabled === false &&
      review?.borrowerNoticeSendAllowed === false &&
      review?.officialReportPublicationAllowed === false &&
      review?.publicVerificationAllowed === false &&
      review?.legalAdviceProvided === false &&
      review?.officialRelianceAllowed === false &&
      review?.productionCutoverExecuted === false &&
      review?.deploymentExecuted === false &&
      review?.publicProductionApiExposureAllowed === false &&
      review?.productionPortalLaunchExecuted === false &&
      review?.paymentCaptureAllowed === false,
    "Production final authority review must preserve final authority, launch, support, communications, cutover, deployment, and live-action blocks."
  );
  assert(
    review?.authorityItems.some(
      (authorityItem) =>
        authorityItem.id ===
        "production-support-communications-readiness-attached"
    ) &&
      review?.authorityItems.some(
        (authorityItem) =>
          authorityItem.id === "constitutional-authority-review"
      ) &&
      review?.authorityItems.some(
        (authorityItem) =>
          authorityItem.id === "qualified-release-manager-review"
      ) &&
      review?.authorityItems.some(
        (authorityItem) =>
          authorityItem.id === "security-production-exposure-review"
      ) &&
      review?.authorityItems.some(
        (authorityItem) =>
          authorityItem.id === "data-rights-privacy-redaction-review"
      ) &&
      review?.authorityItems.some(
        (authorityItem) => authorityItem.id === "final-authority-approval"
      ),
    "Production final authority must include support readiness, constitutional, release-manager, security, data-rights, and final approval controls."
  );
  assert(
    result.disclosures.includes("Your document was received.") &&
      result.disclosures.includes("Human review is pending.") &&
      result.disclosures.includes("More information may be needed.") &&
      result.disclosures.includes(
        "No final production authority approval has been granted."
      ) &&
      result.disclosures.includes("No go-live approval has been granted.") &&
      result.disclosures.includes(
        "No production launch authorization has been granted."
      ) &&
      result.disclosures.includes(
        "No constitutional officer final attestation has been received."
      ) &&
      result.disclosures.includes(
        "No qualified release manager final approval has been granted."
      ) &&
      result.disclosures.includes("No customer communication has been released.") &&
      result.disclosures.includes("No public status page has been enabled.") &&
      result.disclosures.includes("No borrower notice has been sent.") &&
      result.disclosures.includes("No official report has been published.") &&
      result.disclosures.includes(
        "No public verification authority has been granted."
      ) &&
      result.disclosures.includes("No legal advice has been provided.") &&
      result.disclosures.includes("No official reliance has been created.") &&
      result.disclosures.includes(
        "No public production API exposure has been approved."
      ) &&
      result.disclosures.includes(
        "No production portal launch has been executed."
      ) &&
      result.disclosures.includes("No payment capture has been enabled."),
    "Production final authority disclosures must include required safe status, launch, authority, public exposure, and live-action messages."
  );
  assert(
    eventTypes.has("production.final.authority.reviewed"),
    "Missing production.final.authority.reviewed event contract."
  );
  assert(
    crossModuleHandoffMap.some(
      (handoff) =>
        handoff.fromModuleId ===
          "production-support-communications-readiness" &&
        handoff.toModuleId === "production-final-authority" &&
        handoff.eventType ===
          "production.support.communications.readiness.reviewed" &&
        handoff.productionBlocked
    ),
    "Missing production support communications readiness to production final authority handoff."
  );
  assert(
    crossModuleHandoffMap.some(
      (handoff) =>
        handoff.fromModuleId === "production-final-authority" &&
        handoff.toModuleId === "module-readiness" &&
        handoff.eventType === "production.final.authority.reviewed" &&
        handoff.productionBlocked
    ),
    "Missing production final authority to module readiness handoff."
  );
  assert(
    crossModuleHandoffMap.some(
      (handoff) =>
        handoff.fromModuleId === "production-final-authority" &&
        handoff.toModuleId === "governance" &&
        handoff.eventType === "production.final.authority.reviewed" &&
        handoff.productionBlocked
    ),
    "Missing production final authority to governance handoff."
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        checkedAt: new Date().toISOString(),
        authorityItemsChecked: result.summary.totalAuthorityItems,
        blocked: result.summary.blocked,
        reviewRequired: result.summary.reviewRequired,
        finalAuthorityApprovalGranted:
          result.summary.finalAuthorityApprovalGranted,
        goLiveApproved: result.summary.goLiveApproved,
        productionLaunchAuthorized: result.summary.productionLaunchAuthorized,
        productionCutoverExecuted: result.summary.productionCutoverExecuted,
        message: "Production final authority gate smoke test passed.",
      },
      null,
      2
    )
  );
}

main();
