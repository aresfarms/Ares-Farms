import fs from "fs";
import path from "path";

import { evaluateReleaseCandidateFreezePlan } from "@/lib/governance/releaseCandidateFreezePlan";
import { eventContractRegistry } from "@/lib/modules/eventContractRegistry";
import { crossModuleHandoffMap } from "@/lib/modules/handoffMap";
import { moduleManifests } from "@/lib/modules/moduleRegistry";
import { allPortableVerticalSurfaces } from "@/lib/modules/portableVerticalSurface";

/**
 * Release Candidate Freeze Plan Smoke Test
 *
 * Verifies Module 30 assembles final release-candidate freeze evidence while
 * keeping freeze approval, candidate freeze, deployment, environment
 * promotion, production secret activation, DNS cutover, production database
 * migrations, live external actions, payment capture, borrower notice sends,
 * official report publication, public verification, legal advice, and official
 * reliance blocked pending qualified release approval.
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
  const result = evaluateReleaseCandidateFreezePlan();
  const plan = result.releaseCandidateFreezePlans[0];
  const manifest = moduleManifests.find(
    (entry) => entry.id === "release-candidate-freeze"
  );
  const eventTypes = new Set(
    eventContractRegistry.map((contract) => contract.eventType)
  );

  assert(Boolean(manifest), "Module 30 manifest is missing.");
  assert(
    manifest?.moduleNumber === 30,
    "Module 30 manifest number is incorrect."
  );
  assert(
    manifest?.route === "/release-candidate-freeze",
    "Module 30 route is incorrect."
  );
  assert(
    manifest?.claimsProfile === "live-action-blocked",
    "Module 30 must use live-action-blocked claims posture."
  );
  assert(
    routeFileExists("/release-candidate-freeze"),
    "Module 30 page route file is missing."
  );
  assert(
    apiRouteExists("/api/governance/release-candidate-freeze"),
    "Module 30 release-candidate freeze API route is missing."
  );
  assert(Boolean(plan), "Release candidate freeze plan is missing.");
  assert(
    plan?.planStatus === "RELEASE_CANDIDATE_FREEZE_BLOCKED",
    "Release candidate freeze plan must remain blocked."
  );
  assert(
    plan?.moduleCount === moduleManifests.length &&
      plan?.portableSurfaceCount === allPortableVerticalSurfaces.length,
    "Release candidate freeze plan must attach module and portable surface counts."
  );
  assert(
    result.summary.totalPlans === 1 &&
      result.summary.totalFreezeItems === plan?.freezeItems.length,
    "Release candidate freeze summary must match plan freeze items."
  );
  assert(
    result.summary.blocked > 0 && result.summary.reviewRequired > 0,
    "Release candidate freeze must preserve blocked and review-required controls."
  );
  assert(
    result.summary.releaseCandidateFreezeApproved === 0 &&
      result.summary.releaseCandidateFrozen === 0 &&
      result.summary.releaseCandidateApproved === 0 &&
      result.summary.deploymentExecuted === 0 &&
      result.summary.environmentPromotionAllowed === 0 &&
      result.summary.productionSecretsActivated === 0 &&
      result.summary.publicDnsCutoverAllowed === 0 &&
      result.summary.databaseMigrationAllowed === 0,
    "Release candidate freeze must not approve freeze, candidate, deployment, secrets, DNS, or migrations."
  );
  assert(
    result.summary.liveExternalActionsAllowed === 0 &&
      result.summary.liveExternalActionsPerformed === 0 &&
      result.summary.paymentCaptureAllowed === 0 &&
      result.summary.borrowerNoticeSendsAllowed === 0 &&
      result.summary.officialReportsAllowed === 0,
    "Release candidate freeze must not allow live actions, payments, notices, or official reports."
  );
  assert(
    result.summary.publicVerificationAllowed === 0 &&
      result.summary.legalAdviceProvided === 0 &&
      result.summary.officialRelianceAllowed === 0,
    "Release candidate freeze must not grant public verification, legal advice, or official reliance."
  );
  assert(
    plan?.productionBlocked &&
      plan?.releaseCandidateFreezeApproved === false &&
      plan?.releaseCandidateFrozen === false &&
      plan?.releaseCandidateApproved === false &&
      plan?.deploymentExecuted === false &&
      plan?.environmentPromotionAllowed === false &&
      plan?.productionSecretsActivated === false &&
      plan?.publicDnsCutoverAllowed === false &&
      plan?.databaseMigrationAllowed === false &&
      plan?.liveExternalActionPerformed === false &&
      plan?.paymentCaptureAllowed === false &&
      plan?.borrowerNoticeSendAllowed === false &&
      plan?.officialReportPublicationAllowed === false &&
      plan?.publicVerificationAllowed === false,
    "Release candidate freeze plan must preserve freeze, deployment, and live-action blocks."
  );
  assert(
    plan?.freezeItems.some(
      (freezeItem) =>
        freezeItem.id === "deployment-environment-readiness-attached"
    ) &&
      plan?.freezeItems.some(
        (freezeItem) => freezeItem.id === "final-build-artifact-freeze"
      ) &&
      plan?.freezeItems.some(
        (freezeItem) => freezeItem.id === "final-backend-smoke-freeze"
      ) &&
      plan?.freezeItems.some(
        (freezeItem) => freezeItem.id === "production-env-secret-manifest-lock"
      ) &&
      plan?.freezeItems.some(
        (freezeItem) =>
          freezeItem.id === "final-qualified-release-manager-signoff"
      ),
    "Release candidate freeze must include deployment readiness, build, backend smoke, secrets, and release manager controls."
  );
  assert(
    result.disclosures.includes("Your document was received.") &&
      result.disclosures.includes("Human review is pending.") &&
      result.disclosures.includes("More information may be needed.") &&
      result.disclosures.includes(
        "No release candidate has been frozen or approved."
      ) &&
      result.disclosures.includes("No deployment has been executed.") &&
      result.disclosures.includes("No production secret has been activated.") &&
      result.disclosures.includes("No public DNS cutover has been approved.") &&
      result.disclosures.includes("No production database migration has been approved.") &&
      result.disclosures.includes("No production portal launch has been executed.") &&
      result.disclosures.includes("No public verification authority has been granted.") &&
      result.disclosures.includes("No payment capture has been enabled.") &&
      result.disclosures.includes("No borrower notice has been sent.") &&
      result.disclosures.includes("No official report has been published."),
    "Release candidate freeze disclosures must include required safe status and freeze-hold messages."
  );
  assert(
    eventTypes.has("release.candidate.freeze.reviewed"),
    "Missing release.candidate.freeze.reviewed event contract."
  );
  assert(
    crossModuleHandoffMap.some(
      (handoff) =>
        handoff.fromModuleId === "deployment-environment-readiness" &&
        handoff.toModuleId === "release-candidate-freeze" &&
        handoff.eventType === "deployment.environment.readiness.reviewed" &&
        handoff.productionBlocked
    ),
    "Missing deployment environment readiness to release candidate freeze handoff."
  );
  assert(
    crossModuleHandoffMap.some(
      (handoff) =>
        handoff.fromModuleId === "release-candidate-freeze" &&
        handoff.toModuleId === "module-readiness" &&
        handoff.eventType === "release.candidate.freeze.reviewed" &&
        handoff.productionBlocked
    ),
    "Missing release candidate freeze to module readiness handoff."
  );
  assert(
    crossModuleHandoffMap.some(
      (handoff) =>
        handoff.fromModuleId === "release-candidate-freeze" &&
        handoff.toModuleId === "governance" &&
        handoff.eventType === "release.candidate.freeze.reviewed" &&
        handoff.productionBlocked
    ),
    "Missing release candidate freeze to governance handoff."
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        checkedAt: new Date().toISOString(),
        freezeItemsChecked: result.summary.totalFreezeItems,
        blocked: result.summary.blocked,
        reviewRequired: result.summary.reviewRequired,
        releaseCandidateFreezeApproved:
          result.summary.releaseCandidateFreezeApproved,
        releaseCandidateFrozen: result.summary.releaseCandidateFrozen,
        deploymentExecuted: result.summary.deploymentExecuted,
        message: "Release candidate freeze plan smoke test passed.",
      },
      null,
      2
    )
  );
}

main();
