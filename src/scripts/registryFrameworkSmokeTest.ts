import { eventContractRegistry } from "@/lib/modules/eventContractRegistry";
import { crossModuleHandoffMap } from "@/lib/modules/handoffMap";
import { moduleManifests } from "@/lib/modules/moduleRegistry";
import {
  REGISTRY_FRAMEWORK_DISCLOSURES,
  REGISTRY_FRAMEWORK_PRODUCTION_RESTRICTIONS,
  REGISTRY_FRAMEWORK_RUNTIME_VERSION,
  evaluateRegistryFramework,
} from "@/lib/registry/frameworkRuntime";

/**
 * Registry Framework Smoke Test
 *
 * Master Volume Governance:
 * - Vol I: protects accountable internal registry composition.
 * - Vol II: keeps registries from becoming external promotion, public
 *   verification, regulatory reliance, lender commitment, or legal reliance.
 * - Vol III: validates deterministic composition over the canonical
 *   registries.
 * - Vol III-B: confirms human-review-required posture and governed evidence.
 * - Vol IV: confirms governed handoffs to the Governance Evidence Engine,
 *   Internal Certification Engine, Module 16 Evidence Packet Workspace,
 *   Module Readiness Control Tower, Audit Replay Console, Governance,
 *   Reviews, Promotion, and Controlled Promotion Activation.
 * - Vol V-VII: confirms registry, contract, handoff, and disclosure conformance.
 */

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function main() {
  const defaultResult = evaluateRegistryFramework({});

  assert(
    defaultResult.runtimeVersion === REGISTRY_FRAMEWORK_RUNTIME_VERSION,
    "Registry framework must emit the runtime version."
  );
  assert(
    defaultResult.productionBlocked === true,
    "Registry framework must remain production-blocked."
  );
  assert(
    defaultResult.humanReviewRequired === true,
    "Registry framework must require human review."
  );
  assert(
    defaultResult.internalRegistryOnly === true &&
      defaultResult.noExternalPromotion === true &&
      defaultResult.noPublicVerification === true &&
      defaultResult.noRegulatoryReliance === true &&
      defaultResult.noLegalReliance === true,
    "Registry framework must block external promotion, public verification, regulatory reliance, and legal reliance."
  );
  assert(
    defaultResult.summary.catalogCount === 7,
    "Default scope must surface all seven canonical catalogs."
  );

  const catalogIds = defaultResult.catalogs.map((catalog) => catalog.id);

  for (const required of [
    "modules",
    "public_surfaces",
    "event_contracts",
    "handoffs",
    "source_authorities",
    "controlled_promotion",
    "participant_roles",
  ]) {
    assert(
      catalogIds.includes(required as (typeof catalogIds)[number]),
      `Registry framework must include the ${required} catalog.`
    );
  }

  assert(
    defaultResult.modules.length > 0,
    "Default scope must include module manifest entries."
  );
  assert(
    defaultResult.publicSurfaces.length > 0,
    "Default scope must include public surface entries."
  );
  assert(
    defaultResult.eventContracts.length > 0,
    "Default scope must include event contract entries."
  );
  assert(
    defaultResult.handoffs.length > 0,
    "Default scope must include handoff entries."
  );
  assert(
    defaultResult.sourceAuthorities.length > 0,
    "Default scope must include source authority entries."
  );
  assert(
    defaultResult.controlledPromotion.length > 0,
    "Default scope must include controlled promotion gates."
  );
  assert(
    defaultResult.participantRoles.length > 0,
    "Default scope must include participant roles."
  );
  assert(
    defaultResult.participantRoles.some(
      (role) => role.label === "Constitutional Authority"
    ),
    "Participant role registry must name the Constitutional Authority."
  );

  const scopedResult = evaluateRegistryFramework({
    scope: { catalogIds: ["modules", "participant_roles"] },
  });

  assert(
    scopedResult.summary.catalogCount === 2,
    "Catalog scoping must restrict the catalog list."
  );
  assert(
    scopedResult.eventContracts.length === 0 &&
      scopedResult.handoffs.length === 0 &&
      scopedResult.sourceAuthorities.length === 0 &&
      scopedResult.controlledPromotion.length === 0,
    "Catalog scoping must exclude unrequested catalogs."
  );

  const borrowerScoped = evaluateRegistryFramework({
    scope: { audience: "borrower" },
  });

  assert(
    borrowerScoped.modules.every((module) => module.audience.includes("borrower")),
    "Audience filter must restrict the modules catalog by audience."
  );

  assert(
    defaultResult.disclosures.includes(
      "Registry framework output is internal evidence only."
    ),
    "Registry framework disclosures must include the internal-only language."
  );
  assert(
    defaultResult.disclosures.includes(
      "Registry framework output remains internal evidence unless separately promoted through governed controlled-promotion gates."
    ),
    "Registry framework disclosures must include the promotion-required language."
  );
  assert(
    defaultResult.productionRestrictions.includes("no external promotion") &&
      defaultResult.productionRestrictions.includes("no public verification") &&
      defaultResult.productionRestrictions.includes("no regulatory reliance"),
    "Registry framework restrictions must block external promotion, public verification, and regulatory reliance."
  );
  assert(
    REGISTRY_FRAMEWORK_DISCLOSURES.includes(
      "Participant role registry describes named, qualified review authorities. The framework does not grant authority."
    ),
    "Registry framework disclosure constants must preserve the authority boundary."
  );
  assert(
    REGISTRY_FRAMEWORK_PRODUCTION_RESTRICTIONS.includes("no external promotion"),
    "Registry framework production restriction constants must block external promotion."
  );

  const moduleManifest = moduleManifests.find(
    (manifest) => manifest.id === "governance-registry-framework"
  );
  assert(
    moduleManifest !== undefined,
    "Registry framework module manifest must be registered."
  );
  assert(
    moduleManifest.productionBlocked && moduleManifest.replayRequired,
    "Registry framework module must remain production-blocked and replay-required."
  );
  assert(
    moduleManifest.audience.includes("internal"),
    "Registry framework module must be internal-audience."
  );
  assert(
    moduleManifest.eventsPublished.includes(
      "governance.registry.framework.composed"
    ),
    "Registry framework module must publish the framework composed event."
  );

  const contract = eventContractRegistry.find(
    (entry) => entry.eventType === "governance.registry.framework.composed"
  );
  assert(
    contract !== undefined,
    "Registry framework event contract must be registered."
  );
  assert(
    contract.productionBlocked && contract.replayRequired,
    "Registry framework event contract must be production-blocked and replay-required."
  );
  assert(
    contract.classificationLevel === "RESTRICTED",
    "Registry framework event contract must be RESTRICTED."
  );
  assert(
    contract.publicSurfaceAllowed === false,
    "Registry framework event contract must not be public-surface allowed."
  );
  assert(
    contract.purpose.includes("without external promotion"),
    "Registry framework contract must preserve no-external-promotion purpose language."
  );

  const handoffs = crossModuleHandoffMap.filter(
    (handoff) =>
      handoff.fromModuleId === "governance-registry-framework" ||
      handoff.toModuleId === "governance-registry-framework"
  );
  assert(
    handoffs.length >= 9,
    "Registry framework module must have at least nine governed handoff routes."
  );
  assert(
    handoffs.every(
      (handoff) => handoff.productionBlocked && handoff.humanReviewBoundary
    ),
    "Every registry framework handoff must remain production-blocked and human-review-bound."
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        catalogCount: defaultResult.summary.catalogCount,
        totalEntryCount: defaultResult.summary.totalEntryCount,
        moduleCount: defaultResult.modules.length,
        publicSurfaceCount: defaultResult.publicSurfaces.length,
        eventContractCount: defaultResult.eventContracts.length,
        handoffCount: defaultResult.handoffs.length,
        sourceAuthorityCount: defaultResult.sourceAuthorities.length,
        controlledPromotionCount: defaultResult.controlledPromotion.length,
        participantRoleCount: defaultResult.participantRoles.length,
        handoffs: handoffs.length,
        disclosures: defaultResult.disclosures.length,
        message: "Registry framework smoke test passed.",
      },
      null,
      2
    )
  );
}

main();
