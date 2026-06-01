import fs from "fs";
import path from "path";

import { eventContractRegistry } from "@/lib/modules/eventContractRegistry";
import { crossModuleHandoffMap } from "@/lib/modules/handoffMap";
import { moduleManifests } from "@/lib/modules/moduleRegistry";

/**
 * Replay Conformance Test
 *
 * Verifies replay presence across modules, event contracts, handoffs, and
 * runtime schema surfaces.
 */

const repoRoot = process.cwd();

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function exists(pathname: string): boolean {
  return fs.existsSync(path.join(repoRoot, pathname));
}

function main() {
  const requiredFiles = [
    "src/lib/replay/loadReplay.ts",
    "src/lib/ledger/replayCanonicalLedger.ts",
    "src/db/schema/replayVerification.ts",
    "src/scripts/crossModuleReplaySmokeTest.ts",
  ];

  for (const pathname of requiredFiles) {
    assert(exists(pathname), `${pathname} is required for replay conformance.`);
  }

  assert(
    moduleManifests.every((manifest) => manifest.replayRequired),
    "Every module manifest must require replay."
  );
  assert(
    eventContractRegistry.every((contract) => contract.replayRequired),
    "Every event contract must require replay."
  );
  assert(
    crossModuleHandoffMap.every((handoff) => handoff.replayRequired),
    "Every handoff must require replay."
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        checkedAt: new Date().toISOString(),
        modulesChecked: moduleManifests.length,
        eventContractsChecked: eventContractRegistry.length,
        handoffsChecked: crossModuleHandoffMap.length,
        message: "Replay conformance test passed.",
      },
      null,
      2
    )
  );
}

main();
