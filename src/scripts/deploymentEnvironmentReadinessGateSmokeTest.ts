import fs from "fs";
import path from "path";

import { evaluateDeploymentEnvironmentReadinessGate } from "@/lib/governance/deploymentEnvironmentReadinessGate";
import { eventContractRegistry } from "@/lib/modules/eventContractRegistry";
import { crossModuleHandoffMap } from "@/lib/modules/handoffMap";
import { moduleManifests } from "@/lib/modules/moduleRegistry";
import { allPortableVerticalSurfaces } from "@/lib/modules/portableVerticalSurface";

/**
 * Deployment Environment Readiness Gate Smoke Test
 *
 * Verifies Module 29 assembles release-candidate and production environment
 * evidence while keeping deployment, environment promotion, production secret
 * activation, DNS cutover, production database migration, live external
 * actions, payment capture, borrower notice sends, official report
 * publication, public verification, legal advice, and official reliance
 * blocked pending qualified release approval.
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
  const result = evaluateDeploymentEnvironmentReadinessGate();
  const review = result.deploymentEnvironmentReviews[0];
  const manifest = moduleManifests.find(
    (entry) => entry.id === "deployment-environment-readiness"
  );
  const eventTypes = new Set(
    eventContractRegistry.map((contract) => contract.eventType)
  );

  assert(Boolean(manifest), "Module 29 manifest is missing.");
  assert(
    manifest?.moduleNumber === 29,
    "Module 29 manifest number is incorrect."
  );
  assert(
    manifest?.route === "/deployment-environment-readiness",
    "Module 29 route is incorrect."
  );
  assert(
    manifest?.claimsProfile === "live-action-blocked",
    "Module 29 must use live-action-blocked claims posture."
  );
  assert(
    routeFileExists("/deployment-environment-readiness"),
    "Module 29 page route file is missing."
  );
  assert(
    apiRouteExists("/api/governance/deployment-environment-readiness"),
    "Module 29 deployment environment readiness API route is missing."
  );
  assert(Boolean(review), "Deployment environment readiness review is missing.");
  assert(
    review?.reviewStatus === "DEPLOYMENT_ENVIRONMENT_READINESS_BLOCKED",
    "Deployment environment readiness review must remain blocked."
  );
  assert(
    review?.moduleCount === moduleManifests.length &&
      review?.portableSurfaceCount === allPortableVerticalSurfaces.length,
    "Deployment environment readiness review must attach module and portable surface counts."
  );
  assert(
    result.summary.totalReviews === 1 &&
      result.summary.totalEnvironmentItems === review?.environmentItems.length,
    "Deployment environment readiness summary must match review environment items."
  );
  assert(
    result.summary.blocked > 0 && result.summary.reviewRequired > 0,
    "Deployment environment readiness must preserve blocked and review-required controls."
  );
  assert(
    result.summary.releaseCandidateApproved === 0 &&
      result.summary.deploymentExecuted === 0 &&
      result.summary.environmentPromotionAllowed === 0 &&
      result.summary.productionSecretsActivated === 0 &&
      result.summary.publicDnsCutoverAllowed === 0 &&
      result.summary.databaseMigrationAllowed === 0,
    "Deployment environment readiness must not approve release candidate, deployment, secrets, DNS, or migrations."
  );
  assert(
    result.summary.liveExternalActionsAllowed === 0 &&
      result.summary.liveExternalActionsPerformed === 0 &&
      result.summary.paymentCaptureAllowed === 0 &&
      result.summary.borrowerNoticeSendsAllowed === 0 &&
      result.summary.officialReportsAllowed === 0,
    "Deployment environment readiness must not allow live actions, payments, notices, or official reports."
  );
  assert(
    result.summary.publicVerificationAllowed === 0 &&
      result.summary.legalAdviceProvided === 0 &&
      result.summary.officialRelianceAllowed === 0,
    "Deployment environment readiness must not grant public verification, legal advice, or official reliance."
  );
  assert(
    review?.productionBlocked &&
      review?.releaseCandidateApproved === false &&
      review?.deploymentExecuted === false &&
      review?.environmentPromotionAllowed === false &&
      review?.productionSecretsActivated === false &&
      review?.publicDnsCutoverAllowed === false &&
      review?.databaseMigrationAllowed === false &&
      review?.liveExternalActionPerformed === false &&
      review?.paymentCaptureAllowed === false &&
      review?.borrowerNoticeSendAllowed === false &&
      review?.officialReportPublicationAllowed === false &&
      review?.publicVerificationAllowed === false,
    "Deployment environment readiness review must preserve deployment and live-action blocks."
  );
  assert(
    review?.environmentItems.some(
      (environmentItem) =>
        environmentItem.id === "production-launch-evidence-attached"
    ) &&
      review?.environmentItems.some(
        (environmentItem) =>
          environmentItem.id === "production-secret-inventory-approval"
      ) &&
      review?.environmentItems.some(
        (environmentItem) =>
          environmentItem.id === "production-database-migration-approval"
      ) &&
      review?.environmentItems.some(
        (environmentItem) =>
          environmentItem.id === "dns-cdn-tls-waf-approval"
      ) &&
      review?.environmentItems.some(
        (environmentItem) =>
          environmentItem.id === "final-release-manager-attestation"
      ),
    "Deployment environment readiness must include launch evidence, secrets, migrations, edge, and release manager controls."
  );
  assert(
    result.disclosures.includes("Your document was received.") &&
      result.disclosures.includes("Human review is pending.") &&
      result.disclosures.includes("More information may be needed.") &&
      result.disclosures.includes("No deployment has been executed.") &&
      result.disclosures.includes("No release candidate has been approved.") &&
      result.disclosures.includes("No production secret has been activated.") &&
      result.disclosures.includes("No public DNS cutover has been approved.") &&
      result.disclosures.includes("No production database migration has been approved.") &&
      result.disclosures.includes("No production portal launch has been executed.") &&
      result.disclosures.includes("No public verification authority has been granted.") &&
      result.disclosures.includes("No payment capture has been enabled.") &&
      result.disclosures.includes("No borrower notice has been sent.") &&
      result.disclosures.includes("No official report has been published."),
    "Deployment environment disclosures must include required safe status and deployment-hold messages."
  );
  assert(
    eventTypes.has("deployment.environment.readiness.reviewed"),
    "Missing deployment.environment.readiness.reviewed event contract."
  );
  assert(
    crossModuleHandoffMap.some(
      (handoff) =>
        handoff.fromModuleId === "production-launch-evidence" &&
        handoff.toModuleId === "deployment-environment-readiness" &&
        handoff.eventType === "production.launch.evidence.reviewed" &&
        handoff.productionBlocked
    ),
    "Missing production launch evidence to deployment environment readiness handoff."
  );
  assert(
    crossModuleHandoffMap.some(
      (handoff) =>
        handoff.fromModuleId === "deployment-environment-readiness" &&
        handoff.toModuleId === "module-readiness" &&
        handoff.eventType === "deployment.environment.readiness.reviewed" &&
        handoff.productionBlocked
    ),
    "Missing deployment environment readiness to module readiness handoff."
  );
  assert(
    crossModuleHandoffMap.some(
      (handoff) =>
        handoff.fromModuleId === "deployment-environment-readiness" &&
        handoff.toModuleId === "governance" &&
        handoff.eventType === "deployment.environment.readiness.reviewed" &&
        handoff.productionBlocked
    ),
    "Missing deployment environment readiness to governance handoff."
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        checkedAt: new Date().toISOString(),
        environmentItemsChecked: result.summary.totalEnvironmentItems,
        blocked: result.summary.blocked,
        reviewRequired: result.summary.reviewRequired,
        releaseCandidateApproved: result.summary.releaseCandidateApproved,
        deploymentExecuted: result.summary.deploymentExecuted,
        message: "Deployment environment readiness gate smoke test passed.",
      },
      null,
      2
    )
  );
}

main();
