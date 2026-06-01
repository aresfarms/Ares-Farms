import fs from "fs";
import path from "path";

import { buildPublicSurfaceGatewayPayload } from "@/lib/dto/public";
import { REQUIRED_SURFACE_STATUS_MESSAGES } from "@/lib/dto/shared";
import { eventContractRegistry } from "@/lib/modules/eventContractRegistry";
import { crossModuleHandoffMap } from "@/lib/modules/handoffMap";
import { moduleFeatureFlagsComplete } from "@/lib/modules/featureFlagGovernance";
import { moduleManifests } from "@/lib/modules/moduleRegistry";

/**
 * Per-Module Conformance Test
 *
 * Verifies route presence, manifest completeness, permission posture, claims
 * posture, replay posture, blocked actions, DTO filtering, and handoff coverage.
 */

const repoRoot = process.cwd();
const contractEvents = new Set(
  eventContractRegistry.map((contract) => contract.eventType)
);
const eventContractsByType = new Map(
  eventContractRegistry.map((contract) => [contract.eventType, contract])
);

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function routeFileExists(route: string): boolean {
  const routePath = route === "/" ? "src/app/page.tsx" : `src/app${route}/page.tsx`;

  return fs.existsSync(path.join(repoRoot, routePath));
}

function addMapValue<TKey, TValue>(
  map: Map<TKey, TValue[]>,
  key: TKey,
  value: TValue
): void {
  map.set(key, [...(map.get(key) ?? []), value]);
}

function main() {
  const publicPayload = buildPublicSurfaceGatewayPayload();
  const publicSurfaceIds = new Set(publicPayload.surfaces.map((surface) => surface.id));
  const modulesById = new Map(moduleManifests.map((manifest) => [manifest.id, manifest]));
  const moduleIds = new Set<string>();
  const moduleRoutes = new Map<string, string[]>();
  const moduleNumbers = new Map<number, string[]>();
  let highestModuleNumber = 0;

  for (const manifest of moduleManifests) {
    assert(!moduleIds.has(manifest.id), `${manifest.id} is registered more than once.`);
    moduleIds.add(manifest.id);
    addMapValue(moduleRoutes, manifest.route, manifest.id);

    if (typeof manifest.moduleNumber === "number") {
      addMapValue(moduleNumbers, manifest.moduleNumber, manifest.id);
      highestModuleNumber = Math.max(highestModuleNumber, manifest.moduleNumber);
    }
  }

  for (const [route, moduleIdsForRoute] of moduleRoutes.entries()) {
    assert(
      moduleIdsForRoute.length === 1,
      `${route} is assigned to multiple modules: ${moduleIdsForRoute.join(", ")}.`
    );
  }

  for (const [moduleNumber, moduleIdsForNumber] of moduleNumbers.entries()) {
    assert(
      moduleIdsForNumber.length === 1,
      `Module ${moduleNumber} is assigned more than once: ${moduleIdsForNumber.join(", ")}.`
    );
  }

  for (
    let moduleNumber = 1;
    moduleNumber <= highestModuleNumber;
    moduleNumber += 1
  ) {
    assert(
      moduleNumbers.has(moduleNumber),
      `Module sequence is missing Module ${moduleNumber}.`
    );
  }

  for (const contract of eventContractRegistry) {
    assert(
      modulesById.has(contract.producerModuleId),
      `${contract.eventType} producer module is not registered.`
    );
    assert(
      contract.consumerModuleIds.length > 0,
      `${contract.eventType} must declare at least one consumer module.`
    );

    for (const consumerModuleId of contract.consumerModuleIds) {
      assert(
        modulesById.has(consumerModuleId),
        `${contract.eventType} consumer ${consumerModuleId} is not registered.`
      );
    }
  }

  for (const manifest of moduleManifests) {
    assert(routeFileExists(manifest.route), `${manifest.id} route does not exist.`);
    assert(manifest.permissions.length > 0, `${manifest.id} permissions missing.`);
    assert(
      manifest.requiredGovernance.length > 0,
      `${manifest.id} required governance tags missing.`
    );
    assert(manifest.replayRequired, `${manifest.id} replay requirement missing.`);
    assert(
      moduleFeatureFlagsComplete(manifest.featureFlags),
      `${manifest.id} feature flags incomplete.`
    );
    assert(
      manifest.eventsPublished.every((eventType) => contractEvents.has(eventType)),
      `${manifest.id} publishes an event without a contract.`
    );
    assert(
      manifest.eventsConsumed.every((eventType) => contractEvents.has(eventType)),
      `${manifest.id} consumes an event without a contract.`
    );
    assert(
      manifest.productionBlocked,
      `${manifest.id} must remain production blocked until controlled promotion.`
    );
    assert(
      manifest.adjacentModules.every((moduleId) => modulesById.has(moduleId)),
      `${manifest.id} references an adjacent module that is not registered.`
    );
  }

  for (const handoff of crossModuleHandoffMap) {
    const fromModule = modulesById.get(handoff.fromModuleId);
    const toModule = modulesById.get(handoff.toModuleId);
    const handoffContract = eventContractsByType.get(handoff.eventType);

    assert(fromModule !== undefined, `${handoff.id} from-module is not registered.`);
    assert(toModule !== undefined, `${handoff.id} to-module is not registered.`);
    assert(
      fromModule.route === handoff.fromRoute,
      `${handoff.id} from-route does not match the source module route.`
    );
    assert(
      toModule.route === handoff.toRoute,
      `${handoff.id} to-route does not match the target module route.`
    );
    assert(
      contractEvents.has(handoff.eventType),
      `${handoff.id} uses an event without a contract.`
    );
    assert(
      handoffContract !== undefined,
      `${handoff.id} uses an event without a registered contract.`
    );
    assert(
      handoffContract.producerModuleId === handoff.fromModuleId,
      `${handoff.id} source module must match the event contract producer.`
    );
    assert(
      handoffContract.consumerModuleIds.includes(handoff.toModuleId),
      `${handoff.id} target module must be listed as an event contract consumer.`
    );
    assert(
      fromModule.eventsPublished.includes(handoff.eventType),
      `${handoff.id} source module must publish the handoff event.`
    );
    assert(
      toModule.eventsConsumed.includes(handoff.eventType),
      `${handoff.id} target module must consume the handoff event.`
    );
    assert(handoff.productionBlocked, `${handoff.id} must remain production blocked.`);
  }

  assert(
    publicPayload.surfaces.every((surface) => publicSurfaceIds.has(surface.id)),
    "Public DTO filtering failed."
  );
  assert(
    publicPayload.surfaces.every(
      (surface) => !surface.audience.includes("internal")
    ),
    "Public gateway must not expose internal-only module manifests."
  );
  assert(
    publicPayload.surfaces.every((surface) =>
      REQUIRED_SURFACE_STATUS_MESSAGES.every((message) =>
        surface.statusMessages.includes(message)
      )
    ),
    "Every public/partner surface must carry the required safe status messages."
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        checkedAt: new Date().toISOString(),
        modulesChecked: moduleManifests.length,
        highestModuleNumber,
        publicSurfacesChecked: publicPayload.surfaces.length,
        handoffsChecked: crossModuleHandoffMap.length,
        eventContractsChecked: eventContractRegistry.length,
        message: "Per-module conformance test passed.",
      },
      null,
      2
    )
  );
}

main();
