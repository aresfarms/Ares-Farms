import fs from "fs";
import path from "path";

import {
  eventContractModulesAreRegistered,
  eventContractRegistry,
} from "@/lib/modules/eventContractRegistry";
import { crossModuleHandoffMap } from "@/lib/modules/handoffMap";
import { moduleManifests } from "@/lib/modules/moduleRegistry";
import {
  caseContextHasRequiredFields,
  createSharedCaseContext,
} from "@/lib/modules/caseContext";

/**
 * Cross-Module Integration Smoke Test
 *
 * Verifies that module manifests, event contracts, handoffs, and shared case
 * context work together under governed conditions.
 */

const repoRoot = process.cwd();
const moduleIds = new Set(moduleManifests.map((manifest) => manifest.id));
const eventTypes = new Set(
  eventContractRegistry.map((contract) => contract.eventType)
);

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function routeFileExists(route: string): boolean {
  return ["src/app", "src/app/(public)"].some((appRoot) =>
    fs.existsSync(path.join(repoRoot, `${appRoot}${route}/page.tsx`))
  );
}

function main() {
  for (const contract of eventContractRegistry) {
    assert(
      eventContractModulesAreRegistered(contract),
      `${contract.eventType} references an unregistered module.`
    );
    assert(contract.replayRequired, `${contract.eventType} must require replay.`);
    assert(
      contract.payloadFields.includes("replay_ref") ||
        contract.payloadFields.includes("trace_id"),
      `${contract.eventType} must carry replay or trace reference.`
    );
  }

  for (const handoff of crossModuleHandoffMap) {
    assert(moduleIds.has(handoff.fromModuleId), `${handoff.id} source missing.`);
    assert(moduleIds.has(handoff.toModuleId), `${handoff.id} target missing.`);
    assert(routeFileExists(handoff.fromRoute), `${handoff.id} source route missing.`);
    assert(routeFileExists(handoff.toRoute), `${handoff.id} target route missing.`);
    assert(handoff.replayRequired, `${handoff.id} must require replay.`);
    assert(
      handoff.humanReviewBoundary,
      `${handoff.id} must preserve human review boundary.`
    );
    assert(handoff.productionBlocked, `${handoff.id} must remain production blocked.`);
    assert(
      eventTypes.has(handoff.eventType),
      `${handoff.id} references an event without a contract.`
    );
  }

  const caseContext = createSharedCaseContext({
    caseId: "integration-smoke-case",
    borrowerId: "integration-smoke-borrower",
    applicationId: "integration-smoke-application",
    propertyId: "integration-smoke-property",
    relatedModules: ["applications", "documents", "reviews"],
    auditRefs: ["audit-ref-integration-smoke"],
    replayRefs: ["replay-ref-integration-smoke"],
  });

  assert(
    caseContextHasRequiredFields(caseContext),
    "Shared case context is missing required fields."
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        checkedAt: new Date().toISOString(),
        eventContracts: eventContractRegistry.length,
        handoffs: crossModuleHandoffMap.length,
        caseContext: {
          case_id: caseContext.case_id,
          current_stage: caseContext.current_stage,
          related_modules: caseContext.related_modules,
        },
        message: "Cross-module integration smoke test passed.",
      },
      null,
      2
    )
  );
}

main();
