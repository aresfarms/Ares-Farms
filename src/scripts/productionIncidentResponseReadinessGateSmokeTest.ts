import fs from "fs";
import path from "path";

import { evaluateProductionIncidentResponseReadinessGate } from "@/lib/governance/productionIncidentResponseReadinessGate";
import { eventContractRegistry } from "@/lib/modules/eventContractRegistry";
import { crossModuleHandoffMap } from "@/lib/modules/handoffMap";
import { moduleManifests } from "@/lib/modules/moduleRegistry";
import { allPortableVerticalSurfaces } from "@/lib/modules/portableVerticalSurface";

/**
 * Production Incident Response Readiness Gate Smoke Test
 *
 * Verifies Module 34 assembles incident response readiness evidence while
 * keeping incident response activation, incident bridge activation, rollback
 * authorization, emergency rollback, emergency hold release, kill-switch
 * activation, customer communications, public status page, support escalation,
 * cutover authority, production deployment, public production exposure, portal
 * launch, live external actions, payment capture, borrower notice sends,
 * official report publication, public verification, legal advice, and official
 * reliance blocked.
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
  const result = evaluateProductionIncidentResponseReadinessGate();
  const review = result.productionIncidentResponseReadinessReviews[0];
  const manifest = moduleManifests.find(
    (entry) => entry.id === "production-incident-response-readiness"
  );
  const eventTypes = new Set(
    eventContractRegistry.map((contract) => contract.eventType)
  );

  assert(Boolean(manifest), "Module 34 manifest is missing.");
  assert(
    manifest?.moduleNumber === 34,
    "Module 34 manifest number is incorrect."
  );
  assert(
    manifest?.route === "/production-incident-response-readiness",
    "Module 34 route is incorrect."
  );
  assert(
    manifest?.claimsProfile === "live-action-blocked",
    "Module 34 must use live-action-blocked claims posture."
  );
  assert(
    routeFileExists("/production-incident-response-readiness"),
    "Module 34 page route file is missing."
  );
  assert(
    apiRouteExists("/api/governance/production-incident-response-readiness"),
    "Module 34 production incident response readiness API route is missing."
  );
  assert(Boolean(review), "Production incident response readiness review is missing.");
  assert(
    review?.reviewStatus === "PRODUCTION_INCIDENT_RESPONSE_READINESS_BLOCKED",
    "Production incident response readiness review must remain blocked."
  );
  assert(
    review?.moduleCount === moduleManifests.length &&
      review?.portableSurfaceCount === allPortableVerticalSurfaces.length,
    "Production incident response readiness review must attach module and portable surface counts."
  );
  assert(
    result.summary.totalReviews === 1 &&
      result.summary.totalIncidentItems === review?.incidentItems.length,
    "Production incident response readiness summary must match review controls."
  );
  assert(
    result.summary.blocked > 0 && result.summary.reviewRequired > 0,
    "Production incident response readiness must preserve blocked and review-required controls."
  );
  assert(
    result.summary.incidentResponseApprovalGranted === 0 &&
      result.summary.incidentResponseActivated === 0 &&
      result.summary.incidentBridgeActivated === 0 &&
      result.summary.onCallActivated === 0 &&
      result.summary.rollbackAuthorized === 0 &&
      result.summary.emergencyRollbackExecuted === 0 &&
      result.summary.emergencyHoldReleased === 0 &&
      result.summary.killSwitchActivated === 0,
    "Production incident response readiness must not approve or activate incident response, incident bridge, on-call, rollback, emergency rollback, emergency hold, or kill-switch controls."
  );
  assert(
    result.summary.customerCommunicationsReleased === 0 &&
      result.summary.regulatoryCommunicationsReleased === 0 &&
      result.summary.publicStatusPageEnabled === 0 &&
      result.summary.supportEscalationActivated === 0,
    "Production incident response readiness must not release communications, public status, or support escalation."
  );
  assert(
    result.summary.operationsMonitoringApprovalGranted === 0 &&
      result.summary.productionMonitoringActivated === 0 &&
      result.summary.cutoverAuthorityGranted === 0 &&
      result.summary.productionCutoverApproved === 0 &&
      result.summary.productionCutoverExecuted === 0 &&
      result.summary.launchHoldReleased === 0 &&
      result.summary.deploymentHoldReleased === 0 &&
      result.summary.freezeHoldReleased === 0 &&
      result.summary.deploymentExecuted === 0,
    "Production incident response readiness must not approve operations monitoring, cutover authority, cutover, launch hold release, deployment hold release, freeze hold release, or deployment."
  );
  assert(
    result.summary.productionSecretsActivated === 0 &&
      result.summary.publicDnsCutoverAllowed === 0 &&
      result.summary.databaseMigrationAllowed === 0 &&
      result.summary.publicProductionApiExposureAllowed === 0 &&
      result.summary.productionPortalLaunchExecuted === 0,
    "Production incident response readiness must not activate secrets, DNS, migrations, public APIs, or portal launch."
  );
  assert(
    result.summary.liveExternalActionsAllowed === 0 &&
      result.summary.liveExternalActionsPerformed === 0 &&
      result.summary.paymentCaptureAllowed === 0 &&
      result.summary.borrowerNoticeSendsAllowed === 0 &&
      result.summary.officialReportsAllowed === 0,
    "Production incident response readiness must not allow live actions, payments, notices, or official reports."
  );
  assert(
    result.summary.publicVerificationAllowed === 0 &&
      result.summary.legalAdviceProvided === 0 &&
      result.summary.officialRelianceAllowed === 0,
    "Production incident response readiness must not grant public verification, legal advice, or official reliance."
  );
  assert(
    review?.productionBlocked &&
      review?.incidentResponseApprovalGranted === false &&
      review?.incidentResponseActivated === false &&
      review?.incidentBridgeActivated === false &&
      review?.onCallActivated === false &&
      review?.rollbackAuthorized === false &&
      review?.emergencyRollbackExecuted === false &&
      review?.emergencyHoldReleased === false &&
      review?.killSwitchActivated === false &&
      review?.customerCommunicationsReleased === false &&
      review?.publicStatusPageEnabled === false &&
      review?.supportEscalationActivated === false &&
      review?.productionCutoverExecuted === false &&
      review?.deploymentExecuted === false &&
      review?.publicProductionApiExposureAllowed === false &&
      review?.productionPortalLaunchExecuted === false &&
      review?.paymentCaptureAllowed === false &&
      review?.borrowerNoticeSendAllowed === false &&
      review?.officialReportPublicationAllowed === false &&
      review?.publicVerificationAllowed === false,
    "Production incident response readiness review must preserve incident, rollback, communications, cutover, launch, deployment, and live-action blocks."
  );
  assert(
    review?.incidentItems.some(
      (incidentItem) =>
        incidentItem.id === "production-operations-monitoring-attached"
    ) &&
      review?.incidentItems.some(
        (incidentItem) => incidentItem.id === "severity-model-review"
      ) &&
      review?.incidentItems.some(
        (incidentItem) =>
          incidentItem.id === "incident-command-roles-review"
      ) &&
      review?.incidentItems.some(
        (incidentItem) =>
          incidentItem.id === "rollback-decision-tree-review"
      ) &&
      review?.incidentItems.some(
        (incidentItem) =>
          incidentItem.id === "emergency-hold-kill-switch-review"
      ),
    "Production incident response readiness must include operations monitoring, severity, command roles, rollback, and emergency hold controls."
  );
  assert(
    result.disclosures.includes("Your document was received.") &&
      result.disclosures.includes("Human review is pending.") &&
      result.disclosures.includes("More information may be needed.") &&
      result.disclosures.includes(
        "No production incident response approval has been granted."
      ) &&
      result.disclosures.includes(
        "No incident response activation has been approved."
      ) &&
      result.disclosures.includes(
        "No incident bridge has been activated for production launch."
      ) &&
      result.disclosures.includes("No rollback authorization has been granted.") &&
      result.disclosures.includes("No emergency rollback has been executed.") &&
      result.disclosures.includes("No customer communication has been released.") &&
      result.disclosures.includes("No public status page has been enabled.") &&
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
    "Production incident response readiness disclosures must include required safe status, incident, launch, and public exposure messages."
  );
  assert(
    eventTypes.has("production.incident.response.readiness.reviewed"),
    "Missing production.incident.response.readiness.reviewed event contract."
  );
  assert(
    crossModuleHandoffMap.some(
      (handoff) =>
        handoff.fromModuleId === "production-operations-monitoring" &&
        handoff.toModuleId === "production-incident-response-readiness" &&
        handoff.eventType === "production.operations.monitoring.reviewed" &&
        handoff.productionBlocked
    ),
    "Missing production operations monitoring to production incident response readiness handoff."
  );
  assert(
    crossModuleHandoffMap.some(
      (handoff) =>
        handoff.fromModuleId === "production-incident-response-readiness" &&
        handoff.toModuleId === "module-readiness" &&
        handoff.eventType ===
          "production.incident.response.readiness.reviewed" &&
        handoff.productionBlocked
    ),
    "Missing production incident response readiness to module readiness handoff."
  );
  assert(
    crossModuleHandoffMap.some(
      (handoff) =>
        handoff.fromModuleId === "production-incident-response-readiness" &&
        handoff.toModuleId === "governance" &&
        handoff.eventType ===
          "production.incident.response.readiness.reviewed" &&
        handoff.productionBlocked
    ),
    "Missing production incident response readiness to governance handoff."
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        checkedAt: new Date().toISOString(),
        incidentItemsChecked: result.summary.totalIncidentItems,
        blocked: result.summary.blocked,
        reviewRequired: result.summary.reviewRequired,
        incidentResponseApprovalGranted:
          result.summary.incidentResponseApprovalGranted,
        incidentResponseActivated: result.summary.incidentResponseActivated,
        productionCutoverExecuted: result.summary.productionCutoverExecuted,
        message:
          "Production incident response readiness gate smoke test passed.",
      },
      null,
      2
    )
  );
}

main();
