import { eventContractRegistry } from "@/lib/modules/eventContractRegistry";
import { crossModuleHandoffMap } from "@/lib/modules/handoffMap";
import { moduleManifests } from "@/lib/modules/moduleRegistry";

/**
 * Cross-Module Replay Smoke Test
 *
 * Verifies that manifests, handoffs, and event contracts preserve replay as a
 * cross-module requirement.
 */

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function main() {
  const moduleReplayGaps = moduleManifests.filter(
    (manifest) => !manifest.replayRequired
  );
  const contractReplayGaps = eventContractRegistry.filter(
    (contract) => !contract.replayRequired
  );
  const handoffReplayGaps = crossModuleHandoffMap.filter(
    (handoff) => !handoff.replayRequired
  );

  assert(moduleReplayGaps.length === 0, "All module manifests must require replay.");
  assert(
    contractReplayGaps.length === 0,
    "All event contracts must require replay."
  );
  assert(handoffReplayGaps.length === 0, "All handoffs must require replay.");

  console.log(
    JSON.stringify(
      {
        ok: true,
        checkedAt: new Date().toISOString(),
        modulesChecked: moduleManifests.length,
        eventContractsChecked: eventContractRegistry.length,
        handoffsChecked: crossModuleHandoffMap.length,
        message: "Cross-module replay smoke test passed.",
      },
      null,
      2
    )
  );
}

main();
