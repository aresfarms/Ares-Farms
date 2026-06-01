import fs from "fs";
import path from "path";

import { evaluateProductionSupportCommunicationsReadinessGate } from "@/lib/governance/productionSupportCommunicationsReadinessGate";
import { eventContractRegistry } from "@/lib/modules/eventContractRegistry";
import { crossModuleHandoffMap } from "@/lib/modules/handoffMap";
import { moduleManifests } from "@/lib/modules/moduleRegistry";
import { allPortableVerticalSurfaces } from "@/lib/modules/portableVerticalSurface";

/**
 * Production Support Communications Readiness Gate Smoke Test
 *
 * Verifies Module 35 assembles support communications readiness evidence while
 * keeping support activation, support escalation, customer communications,
 * regulatory communications, public status page, borrower notice sends,
 * official reports, public verification, legal advice, official reliance,
 * incident activation, rollback authorization, cutover authority, production
 * deployment, public production exposure, portal launch, live external actions,
 * and payment capture blocked.
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
  const result = evaluateProductionSupportCommunicationsReadinessGate();
  const review = result.productionSupportCommunicationsReadinessReviews[0];
  const manifest = moduleManifests.find(
    (entry) => entry.id === "production-support-communications-readiness"
  );
  const eventTypes = new Set(
    eventContractRegistry.map((contract) => contract.eventType)
  );

  assert(Boolean(manifest), "Module 35 manifest is missing.");
  assert(
    manifest?.moduleNumber === 35,
    "Module 35 manifest number is incorrect."
  );
  assert(
    manifest?.route === "/production-support-communications-readiness",
    "Module 35 route is incorrect."
  );
  assert(
    manifest?.claimsProfile === "live-action-blocked",
    "Module 35 must use live-action-blocked claims posture."
  );
  assert(
    routeFileExists("/production-support-communications-readiness"),
    "Module 35 page route file is missing."
  );
  assert(
    apiRouteExists("/api/governance/production-support-communications-readiness"),
    "Module 35 production support communications readiness API route is missing."
  );
  assert(
    Boolean(review),
    "Production support communications readiness review is missing."
  );
  assert(
    review?.reviewStatus === "PRODUCTION_SUPPORT_COMMUNICATIONS_READINESS_BLOCKED",
    "Production support communications readiness review must remain blocked."
  );
  assert(
    review?.moduleCount === moduleManifests.length &&
      review?.portableSurfaceCount === allPortableVerticalSurfaces.length,
    "Production support communications readiness review must attach module and portable surface counts."
  );
  assert(
    result.summary.totalReviews === 1 &&
      result.summary.totalSupportItems === review?.supportItems.length,
    "Production support communications readiness summary must match review controls."
  );
  assert(
    result.summary.blocked > 0 && result.summary.reviewRequired > 0,
    "Production support communications readiness must preserve blocked and review-required controls."
  );
  assert(
    result.summary.supportCommunicationsApprovalGranted === 0 &&
      result.summary.supportOperationsActivated === 0 &&
      result.summary.supportEscalationActivated === 0 &&
      result.summary.customerCommunicationsReleased === 0 &&
      result.summary.regulatoryCommunicationsReleased === 0 &&
      result.summary.publicStatusPageEnabled === 0,
    "Production support communications readiness must not approve support, activate support, release communications, or enable public status."
  );
  assert(
    result.summary.borrowerNoticeSendsAllowed === 0 &&
      result.summary.officialReportsAllowed === 0 &&
      result.summary.publicVerificationAllowed === 0 &&
      result.summary.legalAdviceProvided === 0 &&
      result.summary.officialRelianceAllowed === 0,
    "Production support communications readiness must not allow notices, official reports, public verification, legal advice, or official reliance."
  );
  assert(
    result.summary.incidentResponseActivated === 0 &&
      result.summary.incidentBridgeActivated === 0 &&
      result.summary.rollbackAuthorized === 0 &&
      result.summary.emergencyRollbackExecuted === 0 &&
      result.summary.emergencyHoldReleased === 0 &&
      result.summary.killSwitchActivated === 0,
    "Production support communications readiness must not activate incident response, incident bridge, rollback, emergency rollback, emergency hold, or kill switch."
  );
  assert(
    result.summary.cutoverAuthorityGranted === 0 &&
      result.summary.productionCutoverApproved === 0 &&
      result.summary.productionCutoverExecuted === 0 &&
      result.summary.launchHoldReleased === 0 &&
      result.summary.deploymentHoldReleased === 0 &&
      result.summary.freezeHoldReleased === 0 &&
      result.summary.deploymentExecuted === 0,
    "Production support communications readiness must not approve cutover authority, cutover, launch hold release, deployment hold release, freeze hold release, or deployment."
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
    "Production support communications readiness must not activate secrets, DNS, migrations, public APIs, portal launch, live actions, or payment capture."
  );
  assert(
    review?.productionBlocked &&
      review?.supportCommunicationsApprovalGranted === false &&
      review?.supportOperationsActivated === false &&
      review?.supportEscalationActivated === false &&
      review?.customerCommunicationsReleased === false &&
      review?.regulatoryCommunicationsReleased === false &&
      review?.publicStatusPageEnabled === false &&
      review?.borrowerNoticeSendAllowed === false &&
      review?.officialReportPublicationAllowed === false &&
      review?.publicVerificationAllowed === false &&
      review?.legalAdviceProvided === false &&
      review?.officialRelianceAllowed === false &&
      review?.incidentResponseActivated === false &&
      review?.incidentBridgeActivated === false &&
      review?.productionCutoverExecuted === false &&
      review?.deploymentExecuted === false &&
      review?.publicProductionApiExposureAllowed === false &&
      review?.productionPortalLaunchExecuted === false &&
      review?.paymentCaptureAllowed === false,
    "Production support communications readiness review must preserve support, communications, incident, cutover, launch, deployment, and live-action blocks."
  );
  assert(
    review?.supportItems.some(
      (supportItem) =>
        supportItem.id === "production-incident-response-readiness-attached"
    ) &&
      review?.supportItems.some(
        (supportItem) => supportItem.id === "support-queue-routing-review"
      ) &&
      review?.supportItems.some(
        (supportItem) => supportItem.id === "customer-safe-language-review"
      ) &&
      review?.supportItems.some(
        (supportItem) => supportItem.id === "public-status-page-review"
      ) &&
      review?.supportItems.some(
        (supportItem) => supportItem.id === "notice-boundary-review"
      ) &&
      review?.supportItems.some(
        (supportItem) => supportItem.id === "redaction-data-rights-review"
      ),
    "Production support communications readiness must include incident readiness, support routing, customer-safe language, public status, notice boundary, and redaction/data-rights controls."
  );
  assert(
    result.disclosures.includes("Your document was received.") &&
      result.disclosures.includes("Human review is pending.") &&
      result.disclosures.includes("More information may be needed.") &&
      result.disclosures.includes(
        "No production support communications approval has been granted."
      ) &&
      result.disclosures.includes(
        "No support operations activation has been approved."
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
    "Production support communications readiness disclosures must include required safe status, support, communications, launch, and public exposure messages."
  );
  assert(
    eventTypes.has("production.support.communications.readiness.reviewed"),
    "Missing production.support.communications.readiness.reviewed event contract."
  );
  assert(
    crossModuleHandoffMap.some(
      (handoff) =>
        handoff.fromModuleId === "production-incident-response-readiness" &&
        handoff.toModuleId === "production-support-communications-readiness" &&
        handoff.eventType ===
          "production.incident.response.readiness.reviewed" &&
        handoff.productionBlocked
    ),
    "Missing production incident response readiness to production support communications readiness handoff."
  );
  assert(
    crossModuleHandoffMap.some(
      (handoff) =>
        handoff.fromModuleId === "production-support-communications-readiness" &&
        handoff.toModuleId === "module-readiness" &&
        handoff.eventType ===
          "production.support.communications.readiness.reviewed" &&
        handoff.productionBlocked
    ),
    "Missing production support communications readiness to module readiness handoff."
  );
  assert(
    crossModuleHandoffMap.some(
      (handoff) =>
        handoff.fromModuleId === "production-support-communications-readiness" &&
        handoff.toModuleId === "governance" &&
        handoff.eventType ===
          "production.support.communications.readiness.reviewed" &&
        handoff.productionBlocked
    ),
    "Missing production support communications readiness to governance handoff."
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        checkedAt: new Date().toISOString(),
        supportItemsChecked: result.summary.totalSupportItems,
        blocked: result.summary.blocked,
        reviewRequired: result.summary.reviewRequired,
        supportCommunicationsApprovalGranted:
          result.summary.supportCommunicationsApprovalGranted,
        supportOperationsActivated: result.summary.supportOperationsActivated,
        productionCutoverExecuted: result.summary.productionCutoverExecuted,
        message:
          "Production support communications readiness gate smoke test passed.",
      },
      null,
      2
    )
  );
}

main();
