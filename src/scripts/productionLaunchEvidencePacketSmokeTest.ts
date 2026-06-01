import fs from "fs";
import path from "path";

import { evaluateProductionLaunchEvidencePacket } from "@/lib/governance/productionLaunchEvidencePacket";
import { eventContractRegistry } from "@/lib/modules/eventContractRegistry";
import { crossModuleHandoffMap } from "@/lib/modules/handoffMap";
import { moduleManifests } from "@/lib/modules/moduleRegistry";
import { allPortableVerticalSurfaces } from "@/lib/modules/portableVerticalSurface";

/**
 * Production Launch Evidence Packet Smoke Test
 *
 * Verifies Module 28 assembles go-live launch evidence while keeping go-live
 * release, portal launch, public verification, live external actions, payment
 * capture, borrower notice sends, official report publication, legal advice,
 * and official reliance blocked pending qualified final approval.
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
  const result = evaluateProductionLaunchEvidencePacket();
  const packet = result.launchEvidencePackets[0];
  const manifest = moduleManifests.find(
    (entry) => entry.id === "production-launch-evidence"
  );
  const eventTypes = new Set(
    eventContractRegistry.map((contract) => contract.eventType)
  );

  assert(Boolean(manifest), "Module 28 manifest is missing.");
  assert(
    manifest?.moduleNumber === 28,
    "Module 28 manifest number is incorrect."
  );
  assert(
    manifest?.route === "/production-launch-evidence",
    "Module 28 route is incorrect."
  );
  assert(
    manifest?.claimsProfile === "live-action-blocked",
    "Module 28 must use live-action-blocked claims posture."
  );
  assert(
    routeFileExists("/production-launch-evidence"),
    "Module 28 page route file is missing."
  );
  assert(
    apiRouteExists("/api/governance/production-launch-evidence"),
    "Module 28 production launch evidence API route is missing."
  );
  assert(Boolean(packet), "Production launch evidence packet is missing.");
  assert(
    packet?.packetStatus === "GO_LIVE_EVIDENCE_PACKET_BLOCKED",
    "Production launch evidence packet must remain blocked."
  );
  assert(
    packet?.moduleCount === moduleManifests.length &&
      packet?.portableSurfaceCount === allPortableVerticalSurfaces.length,
    "Production launch evidence packet must attach module and portable surface counts."
  );
  assert(
    result.summary.totalPackets === 1 &&
      result.summary.totalEvidenceItems === packet?.evidenceItems.length,
    "Production launch evidence summary must match packet evidence items."
  );
  assert(
    result.summary.blocked > 0 && result.summary.reviewRequired > 0,
    "Production launch evidence packet must preserve blocked and review-required go-live controls."
  );
  assert(
    result.summary.releaseCandidate === 0 &&
      result.summary.goLiveApproved === 0 &&
      result.summary.portalLaunchExecuted === 0 &&
      result.summary.publicLaunchAllowed === 0,
    "Production launch evidence packet must not approve or execute go-live release."
  );
  assert(
    result.summary.liveExternalActionsAllowed === 0 &&
      result.summary.liveExternalActionsPerformed === 0 &&
      result.summary.paymentCaptureAllowed === 0 &&
      result.summary.borrowerNoticeSendsAllowed === 0 &&
      result.summary.officialReportsAllowed === 0,
    "Production launch evidence packet must not allow live actions, payments, notices, or official reports."
  );
  assert(
    result.summary.publicVerificationAllowed === 0 &&
      result.summary.legalAdviceProvided === 0 &&
      result.summary.officialRelianceAllowed === 0,
    "Production launch evidence packet must not grant public verification, legal advice, or official reliance."
  );
  assert(
    packet?.productionBlocked &&
      packet?.releaseCandidate === false &&
      packet?.goLiveApproved === false &&
      packet?.portalLaunchExecuted === false &&
      packet?.publicLaunchAllowed === false &&
      packet?.liveExternalActionPerformed === false &&
      packet?.paymentCaptureAllowed === false &&
      packet?.borrowerNoticeSendAllowed === false &&
      packet?.officialReportPublicationAllowed === false &&
      packet?.publicVerificationAllowed === false,
    "Production launch evidence packet must preserve final go-live and live-action blocks."
  );
  assert(
    packet?.evidenceItems.some(
      (item) => item.id === "production-portal-readiness-attached"
    ) &&
      packet?.evidenceItems.some(
        (item) => item.id === "production-auth-final-approval"
      ) &&
      packet?.evidenceItems.some(
        (item) => item.id === "security-audit-final-approval"
      ) &&
      packet?.evidenceItems.some(
        (item) => item.id === "backend-production-final-approval"
      ) &&
      packet?.evidenceItems.some(
        (item) => item.id === "final-human-release-ceremony"
      ),
    "Production launch evidence packet must include readiness, auth, security, backend, and final release controls."
  );
  assert(
    result.disclosures.includes("Your document was received.") &&
      result.disclosures.includes("Human review is pending.") &&
      result.disclosures.includes("More information may be needed.") &&
      result.disclosures.includes("No production portal launch has been executed.") &&
      result.disclosures.includes("No public verification authority has been granted.") &&
      result.disclosures.includes("No live external source has been contacted.") &&
      result.disclosures.includes("No payment capture has been enabled.") &&
      result.disclosures.includes("No borrower notice has been sent.") &&
      result.disclosures.includes("No official report has been published.") &&
      result.disclosures.includes("No go-live release has been approved."),
    "Production launch evidence disclosures must include required safe status and release-hold messages."
  );
  assert(
    eventTypes.has("production.launch.evidence.reviewed"),
    "Missing production.launch.evidence.reviewed event contract."
  );
  assert(
    crossModuleHandoffMap.some(
      (handoff) =>
        handoff.fromModuleId === "production-portal-readiness" &&
        handoff.toModuleId === "production-launch-evidence" &&
        handoff.eventType === "production.portal.readiness.reviewed" &&
        handoff.productionBlocked
    ),
    "Missing production portal readiness to production launch evidence handoff."
  );
  assert(
    crossModuleHandoffMap.some(
      (handoff) =>
        handoff.fromModuleId === "production-launch-evidence" &&
        handoff.toModuleId === "module-readiness" &&
        handoff.eventType === "production.launch.evidence.reviewed" &&
        handoff.productionBlocked
    ),
    "Missing production launch evidence to module readiness handoff."
  );
  assert(
    crossModuleHandoffMap.some(
      (handoff) =>
        handoff.fromModuleId === "production-launch-evidence" &&
        handoff.toModuleId === "governance" &&
        handoff.eventType === "production.launch.evidence.reviewed" &&
        handoff.productionBlocked
    ),
    "Missing production launch evidence to governance handoff."
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        checkedAt: new Date().toISOString(),
        evidenceItemsChecked: result.summary.totalEvidenceItems,
        blocked: result.summary.blocked,
        reviewRequired: result.summary.reviewRequired,
        goLiveApproved: result.summary.goLiveApproved,
        portalLaunchExecuted: result.summary.portalLaunchExecuted,
        message: "Production launch evidence packet smoke test passed.",
      },
      null,
      2
    )
  );
}

main();
