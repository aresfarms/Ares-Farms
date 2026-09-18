import fs from "fs";
import path from "path";

import { evaluateSourcePromotionPacketGate } from "@/lib/governance/sourcePromotionPacketGate";
import { eventContractRegistry } from "@/lib/modules/eventContractRegistry";
import { crossModuleHandoffMap } from "@/lib/modules/handoffMap";
import { moduleManifests } from "@/lib/modules/moduleRegistry";
import { SOURCE_STACK_REGISTRY } from "@/lib/platform/authorities/source";

/**
 * Source Promotion Packet Gate Smoke Test
 *
 * Verifies Module 24 packages source promotion evidence while keeping legal
 * approval, live fetch, external action, public verification, and production
 * promotion blocked pending qualified human approval.
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
  const result = evaluateSourcePromotionPacketGate();
  const manifest = moduleManifests.find(
    (entry) => entry.id === "source-promotion-packets"
  );
  const eventTypes = new Set(
    eventContractRegistry.map((contract) => contract.eventType)
  );

  assert(Boolean(manifest), "Module 24 manifest is missing.");
  assert(
    manifest?.route === "/source-promotion-packets",
    "Module 24 route is incorrect."
  );
  assert(
    manifest?.claimsProfile === "live-action-blocked",
    "Module 24 must use live-action-blocked claims posture."
  );
  assert(
    routeFileExists("/source-promotion-packets"),
    "Module 24 page route file is missing."
  );
  assert(
    apiRouteExists("/api/governance/source-promotion-packets"),
    "Module 24 source promotion packet API route is missing."
  );
  assert(
    result.summary.totalPackets === SOURCE_STACK_REGISTRY.length,
    "Source promotion packet gate must package every source-stack profile."
  );
  assert(
    result.summary.promotionReady === 0,
    "Local source promotion packet gate must not mark sources promotion-ready."
  );
  assert(
    result.summary.liveFetchEnabled === 0 &&
      result.summary.externalActionsPerformed === 0,
    "Live fetch and external actions must remain disabled for every packet."
  );
  assert(
    result.summary.legalAdviceProvided === 0 &&
      result.summary.publicVerificationAllowed === 0,
    "Source promotion packets must not provide legal advice or public verification authority."
  );
  assert(
    result.sourcePromotionPackets.every((packet) => packet.productionBlocked),
    "Every source promotion packet must remain production-blocked."
  );
  assert(
    result.sourcePromotionPackets.every(
      (packet) =>
        packet.legalAdviceProvided === false &&
        packet.humanPromotionRequired === true
    ),
    "Every source promotion packet must require human promotion and provide no legal advice."
  );
  assert(
    result.sourcePromotionPackets.every((packet) =>
      packet.checks.some((gate) => gate.id === "source-legal-review-packet")
    ),
    "Every source promotion packet must include source legal review evidence."
  );
  assert(
    result.sourcePromotionPackets.every((packet) =>
      packet.checks.some((gate) => gate.id === "human-source-promotion-approval")
    ),
    "Every source promotion packet must require human source promotion approval."
  );
  assert(
    result.disclosures.includes("Your document was received.") &&
      result.disclosures.includes("Human review is pending.") &&
      result.disclosures.includes("More information may be needed."),
    "Source promotion packet disclosures must include required safe status messages."
  );
  assert(
    eventTypes.has("source.promotion.packet.reviewed"),
    "Missing source.promotion.packet.reviewed event contract."
  );
  assert(
    crossModuleHandoffMap.some(
      (handoff) =>
        handoff.fromModuleId === "source-promotion-packets" &&
        handoff.toModuleId === "promotion" &&
        handoff.eventType === "source.promotion.packet.reviewed" &&
        handoff.productionBlocked
    ),
    "Missing source promotion packet to promotion handoff."
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        checkedAt: new Date().toISOString(),
        packetsReviewed: result.summary.totalPackets,
        promotionReady: result.summary.promotionReady,
        liveFetchEnabled: result.summary.liveFetchEnabled,
        message: "Source promotion packet gate smoke test passed.",
      },
      null,
      2
    )
  );
}

main();
