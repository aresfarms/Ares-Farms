import { eventContractRegistry } from "@/lib/modules/eventContractRegistry";
import { crossModuleHandoffMap } from "@/lib/modules/handoffMap";
import { moduleManifests } from "@/lib/modules/moduleRegistry";
import {
  allPortableVerticalSurfaces,
  portableSurfaceSafeMessages,
} from "@/lib/modules/portableVerticalSurface";

/**
 * Whole-Platform Smoke Test
 *
 * Verifies the governed platform workflow chain and confirms that replay,
 * classification, claims, and production blocks remain active across module
 * transitions.
 */

const expectedChain = [
  ["applications", "documents"],
  ["documents", "reviews"],
  ["reviews", "rules"],
  ["rules", "decisions"],
  ["decisions", "notices"],
  ["notices", "audit-replay"],
  ["audit-replay", "evidence-packets"],
  ["evidence-packets", "module-readiness"],
  ["module-readiness", "promotion"],
] as const;

const eventTypes = new Set(
  eventContractRegistry.map((contract) => contract.eventType)
);

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function hasHandoff(fromModuleId: string, toModuleId: string): boolean {
  return crossModuleHandoffMap.some(
    (handoff) =>
      handoff.fromModuleId === fromModuleId &&
      handoff.toModuleId === toModuleId &&
      handoff.replayRequired &&
      handoff.humanReviewBoundary &&
      handoff.productionBlocked &&
      eventTypes.has(handoff.eventType)
  );
}

function main() {
  for (const [fromModuleId, toModuleId] of expectedChain) {
    assert(
      hasHandoff(fromModuleId, toModuleId),
      `Missing governed platform handoff ${fromModuleId} -> ${toModuleId}.`
    );
  }

  assert(
    moduleManifests.every((manifest) => manifest.productionBlocked),
    "Platform modules must remain production blocked."
  );
  assert(
    moduleManifests.every((manifest) =>
      manifest.requiredGovernance.includes("CANON-CLAIMS-001")
    ),
    "Platform modules must carry claims governance."
  );
  assert(
    moduleManifests.every((manifest) =>
      manifest.requiredGovernance.includes("CANON-CLASS-001")
    ),
    "Platform modules must carry classification governance."
  );
  assert(
    allPortableVerticalSurfaces.every((surface) =>
      portableSurfaceSafeMessages.every((message) =>
        surface.safeMessages.includes(message)
      )
    ),
    "Every portable vertical surface must include the required safe status messages."
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        checkedAt: new Date().toISOString(),
        chainTransitions: expectedChain.length,
        modulesChecked: moduleManifests.length,
        message: "Whole-platform smoke test passed.",
      },
      null,
      2
    )
  );
}

main();
