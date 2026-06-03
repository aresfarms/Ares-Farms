import fs from "fs";
import path from "path";

import { evaluateProductionOperationsMonitoringGate } from "@/lib/governance/productionOperationsMonitoringGate";
import { eventContractRegistry } from "@/lib/modules/eventContractRegistry";
import { crossModuleHandoffMap } from "@/lib/modules/handoffMap";
import { moduleManifests } from "@/lib/modules/moduleRegistry";
import { allPortableVerticalSurfaces } from "@/lib/modules/portableVerticalSurface";

/**
 * Production Operations Monitoring Gate Smoke Test
 *
 * Verifies Module 33 assembles operations monitoring evidence while keeping
 * monitoring activation, on-call activation, incident bridge activation,
 * rollback authorization, emergency hold release, cutover authority,
 * production deployment, public production exposure, portal launch, live
 * external actions, payment capture, borrower notice sends, official report
 * publication, public verification, legal advice, and official reliance
 * blocked.
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
  const result = evaluateProductionOperationsMonitoringGate();
  const review = result.productionOperationsMonitoringReviews[0];
  const manifest = moduleManifests.find(
    (entry) => entry.id === "production-operations-monitoring"
  );
  const eventTypes = new Set(
    eventContractRegistry.map((contract) => contract.eventType)
  );

  assert(Boolean(manifest), "Module 33 manifest is missing.");
  assert(
    manifest?.moduleNumber === 33,
    "Module 33 manifest number is incorrect."
  );
  assert(
    manifest?.route === "/production-operations-monitoring",
    "Module 33 route is incorrect."
  );
  assert(
    manifest?.claimsProfile === "live-action-blocked",
    "Module 33 must use live-action-blocked claims posture."
  );
  assert(
    routeFileExists("/production-operations-monitoring"),
    "Module 33 page route file is missing."
  );
  assert(
    apiRouteExists("/api/governance/production-operations-monitoring"),
    "Module 33 production operations monitoring API route is missing."
  );
  assert(Boolean(review), "Production operations monitoring review is missing.");
  assert(
    review?.reviewStatus === "PRODUCTION_OPERATIONS_MONITORING_BLOCKED",
    "Production operations monitoring review must remain blocked."
  );
  assert(
    review?.moduleCount === moduleManifests.length &&
      review?.portableSurfaceCount === allPortableVerticalSurfaces.length,
    "Production operations monitoring review must attach module and portable surface counts."
  );
  assert(
    result.summary.totalReviews === 1 &&
      result.summary.totalOperationsItems === review?.operationsItems.length,
    "Production operations monitoring summary must match review controls."
  );
  assert(
    result.summary.blocked > 0 && result.summary.reviewRequired > 0,
    "Production operations monitoring must preserve blocked and review-required controls."
  );
  assert(
    result.summary.operationsMonitoringApprovalGranted === 0 &&
      result.summary.productionMonitoringActivated === 0 &&
      result.summary.onCallActivated === 0 &&
      result.summary.incidentBridgeActivated === 0 &&
      result.summary.rollbackAuthorized === 0 &&
      result.summary.emergencyHoldReleased === 0,
    "Production operations monitoring must not approve or activate monitoring, on-call, incident bridge, rollback, or emergency hold controls."
  );
  assert(
    result.summary.releaseBoardApprovalGranted === 0 &&
      result.summary.cutoverAuthorityGranted === 0 &&
      result.summary.productionCutoverApproved === 0 &&
      result.summary.productionCutoverExecuted === 0 &&
      result.summary.launchHoldReleased === 0 &&
      result.summary.deploymentHoldReleased === 0 &&
      result.summary.freezeHoldReleased === 0 &&
      result.summary.deploymentExecuted === 0,
    "Production operations monitoring must not approve board action, cutover authority, cutover, launch hold release, deployment hold release, freeze hold release, or deployment."
  );
  assert(
    result.summary.productionSecretsActivated === 0 &&
      result.summary.publicDnsCutoverAllowed === 0 &&
      result.summary.databaseMigrationAllowed === 0 &&
      result.summary.publicProductionApiExposureAllowed === 0 &&
      result.summary.productionPortalLaunchExecuted === 0,
    "Production operations monitoring must not activate secrets, DNS, migrations, public APIs, or portal launch."
  );
  assert(
    result.summary.liveExternalActionsAllowed === 0 &&
      result.summary.liveExternalActionsPerformed === 0 &&
      result.summary.paymentCaptureAllowed === 0 &&
      result.summary.borrowerNoticeSendsAllowed === 0 &&
      result.summary.officialReportsAllowed === 0,
    "Production operations monitoring must not allow live actions, payments, notices, or official reports."
  );
  assert(
    result.summary.publicVerificationAllowed === 0 &&
      result.summary.legalAdviceProvided === 0 &&
      result.summary.officialRelianceAllowed === 0,
    "Production operations monitoring must not grant public verification, legal advice, or official reliance."
  );
  assert(
    review?.productionBlocked &&
      review?.operationsMonitoringApprovalGranted === false &&
      review?.productionMonitoringActivated === false &&
      review?.onCallActivated === false &&
      review?.incidentBridgeActivated === false &&
      review?.rollbackAuthorized === false &&
      review?.emergencyHoldReleased === false &&
      review?.releaseBoardApprovalGranted === false &&
      review?.cutoverAuthorityGranted === false &&
      review?.productionCutoverExecuted === false &&
      review?.deploymentExecuted === false &&
      review?.productionSecretsActivated === false &&
      review?.publicProductionApiExposureAllowed === false &&
      review?.productionPortalLaunchExecuted === false &&
      review?.paymentCaptureAllowed === false &&
      review?.borrowerNoticeSendAllowed === false &&
      review?.officialReportPublicationAllowed === false &&
      review?.publicVerificationAllowed === false,
    "Production operations monitoring review must preserve operations, cutover, launch, deployment, and live-action blocks."
  );
  assert(
    review?.operationsItems.some(
      (operationsItem) =>
        operationsItem.id === "production-release-board-attached"
    ) &&
      review?.operationsItems.some(
        (operationsItem) =>
          operationsItem.id === "monitoring-alerting-slo-review"
      ) &&
      review?.operationsItems.some(
        (operationsItem) => operationsItem.id === "incident-bridge-review"
      ) &&
      review?.operationsItems.some(
        (operationsItem) => operationsItem.id === "rollback-drill-review"
      ) &&
      review?.operationsItems.some(
        (operationsItem) => operationsItem.id === "emergency-hold-review"
      ),
    "Production operations monitoring must include release board, monitoring, incident, rollback, and emergency hold controls."
  );
  assert(
    result.disclosures.includes("Your document was received.") &&
      result.disclosures.includes("Human review is pending.") &&
      result.disclosures.includes("More information may be needed.") &&
      result.disclosures.includes(
        "No production operations monitoring approval has been granted."
      ) &&
      result.disclosures.includes(
        "No production monitoring, paging, or on-call activation has been approved."
      ) &&
      result.disclosures.includes(
        "No incident bridge has been activated for production launch."
      ) &&
      result.disclosures.includes("No rollback authorization has been granted.") &&
      result.disclosures.includes("No emergency hold has been released.") &&
      result.disclosures.includes(
        "No public production API exposure has been approved."
      ) &&
      result.disclosures.includes(
        "No production portal launch has been executed."
      ) &&
      result.disclosures.includes(
        "No public verification authority has been granted."
      ) &&
      result.disclosures.includes("No payment capture has been enabled.") &&
      result.disclosures.includes("No borrower notice has been sent.") &&
      result.disclosures.includes("No official report has been published."),
    "Production operations monitoring disclosures must include required safe status, operations, launch, and public exposure messages."
  );
  assert(
    eventTypes.has("production.operations.monitoring.reviewed"),
    "Missing production.operations.monitoring.reviewed event contract."
  );
  assert(
    crossModuleHandoffMap.some(
      (handoff) =>
        handoff.fromModuleId === "production-release-board" &&
        handoff.toModuleId === "production-operations-monitoring" &&
        handoff.eventType === "production.release.board.reviewed" &&
        handoff.productionBlocked
    ),
    "Missing production release board to production operations monitoring handoff."
  );
  assert(
    crossModuleHandoffMap.some(
      (handoff) =>
        handoff.fromModuleId === "production-operations-monitoring" &&
        handoff.toModuleId === "module-readiness" &&
        handoff.eventType === "production.operations.monitoring.reviewed" &&
        handoff.productionBlocked
    ),
    "Missing production operations monitoring to module readiness handoff."
  );
  assert(
    crossModuleHandoffMap.some(
      (handoff) =>
        handoff.fromModuleId === "production-operations-monitoring" &&
        handoff.toModuleId === "governance" &&
        handoff.eventType === "production.operations.monitoring.reviewed" &&
        handoff.productionBlocked
    ),
    "Missing production operations monitoring to governance handoff."
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        checkedAt: new Date().toISOString(),
        operationsItemsChecked: result.summary.totalOperationsItems,
        blocked: result.summary.blocked,
        reviewRequired: result.summary.reviewRequired,
        operationsMonitoringApprovalGranted:
          result.summary.operationsMonitoringApprovalGranted,
        productionMonitoringActivated:
          result.summary.productionMonitoringActivated,
        productionCutoverExecuted: result.summary.productionCutoverExecuted,
        message: "Production operations monitoring gate smoke test passed.",
      },
      null,
      2
    )
  );
}

main();
