import { CAPITAL_CATEGORY_GOVERNANCE } from "@/lib/capital-graph/capitalGraphRuntime";
import {
  CUSTOMER_TYPE_DISCLOSURES,
  CUSTOMER_TYPE_PRODUCTION_RESTRICTIONS,
  CUSTOMER_TYPE_REGISTRY,
  CUSTOMER_TYPE_RUNTIME_VERSION,
  CustomerArchetype,
  composeCustomerTypeRegistry,
} from "@/lib/customer-types/customerTypeRuntime";
import { eventContractRegistry } from "@/lib/modules/eventContractRegistry";
import { crossModuleHandoffMap } from "@/lib/modules/handoffMap";
import { moduleManifests } from "@/lib/modules/moduleRegistry";

/**
 * Customer Type Registry Smoke Test
 *
 * Master Volume Governance:
 * - Vol I: protects accountable canonical customer-type composition.
 * - Vol II: keeps the registry from becoming customer eligibility
 *   determination or sponsor commitment.
 * - Vol III: validates deterministic composition over the canonical
 *   archetype taxonomy, customer-type registry, and Capital Graph
 *   cross-reference.
 * - Vol III-B: confirms human-review-required posture and governed evidence.
 * - Vol IV: confirms governed handoffs to Capital Graph, financing
 *   pathway guidance, opportunity discovery, advanced intelligence, the
 *   governance evidence engine, internal certification engine, registry
 *   framework, evidence packets, audit replay, governance, reviews, and
 *   module readiness.
 * - Vol V: confirms canonical claims governance, controlled disclosure,
 *   replay, audit, portability, and source-authority boundaries.
 * - Vol VI: confirms public-safe DTO posture; no raw borrower records,
 *   no live external fetch, no source-certainty claim.
 */

const REQUIRED_ARCHETYPES: CustomerArchetype[] = [
  "AGRICULTURAL_PRODUCER",
  "RURAL_SMALL_BUSINESS",
  "AGRITOURISM_OPERATOR",
  "UTILITY_CUSTOMER",
  "COMMUNITY_FACILITY_SPONSOR",
  "HISTORIC_PRESERVATION_OWNER",
  "OPPORTUNITY_ZONE_BUSINESS",
  "WORKFORCE_DEVELOPMENT_EMPLOYER",
  "FOUNDATION_RECIPIENT",
  "COOPERATIVE",
  "NONPROFIT",
  "TRIBAL_NATION",
  "VETERAN_OWNED_BUSINESS",
  "WOMEN_OWNED_BUSINESS",
  "MINORITY_OWNED_BUSINESS",
  "ENVIRONMENTAL_MARKET_PARTICIPANT",
  "CARBON_MARKET_PARTICIPANT",
];

const CAPITAL_CATEGORY_IDS = new Set(
  CAPITAL_CATEGORY_GOVERNANCE.map((category) => category.id)
);

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function main() {
  // Canonical archetype completeness.
  const archetypesInRegistry = new Set(
    CUSTOMER_TYPE_REGISTRY.map((type) => type.archetype)
  );

  for (const required of REQUIRED_ARCHETYPES) {
    assert(
      archetypesInRegistry.has(required),
      `Customer Type Registry must include the ${required} archetype.`
    );
  }

  // Every customer type must carry doctrine refs, blocked claims, review
  // boundary, federation scope, versioning, and eligible Capital Graph
  // categories that resolve to canonical capital taxonomy IDs.
  for (const type of CUSTOMER_TYPE_REGISTRY) {
    assert(
      type.doctrineRefs.some((ref) => ref.startsWith("Vol I")),
      `Customer type ${type.typeId} must reference Vol I.`
    );
    assert(
      type.doctrineRefs.some((ref) => ref.startsWith("Vol V")),
      `Customer type ${type.typeId} must reference Vol V.`
    );
    assert(
      type.blockedClaims.includes("approval"),
      `Customer type ${type.typeId} blocked claims must include approval.`
    );
    assert(
      typeof type.reviewBoundary === "string" && type.reviewBoundary.length > 0,
      `Customer type ${type.typeId} must declare a review boundary.`
    );
    assert(
      ["SOVEREIGN", "PARTICIPANT", "PUBLIC"].includes(type.federationScope),
      `Customer type ${type.typeId} must declare a federation scope.`
    );
    assert(
      type.customerTypeVersion.startsWith("ct-"),
      `Customer type ${type.typeId} must declare a versioned customerTypeVersion.`
    );
    assert(
      type.eligibleCapitalCategories.length > 0,
      `Customer type ${type.typeId} must list at least one eligible capital category.`
    );
    for (const category of type.eligibleCapitalCategories) {
      assert(
        CAPITAL_CATEGORY_IDS.has(category),
        `Customer type ${type.typeId} eligible category ${category} must be a canonical Capital Graph category.`
      );
    }
  }

  // Default composition (no declared types) returns empty profiles but
  // preserves taxonomy posture.
  const defaultPack = composeCustomerTypeRegistry({});

  assert(
    defaultPack.runtimeVersion === CUSTOMER_TYPE_RUNTIME_VERSION,
    "Customer Type runtime must emit the runtime version."
  );
  assert(
    defaultPack.productionBlocked &&
      defaultPack.humanReviewRequired &&
      defaultPack.advisoryOnly &&
      defaultPack.customerTypeInternalOnly &&
      defaultPack.noAutonomousEligibility &&
      defaultPack.noAutonomousLending &&
      defaultPack.noPublicVerification &&
      defaultPack.noRegulatoryReliance &&
      defaultPack.noLegalReliance &&
      defaultPack.noLiveExternalAction &&
      defaultPack.replaySafe &&
      defaultPack.auditSafe &&
      defaultPack.federationScoped &&
      defaultPack.conflictPreserving,
    "Customer Type pack must preserve every constitutional flag."
  );
  assert(
    defaultPack.summary.customerTypeCount > 0,
    "Default pack must include the canonical registry."
  );
  assert(
    defaultPack.summary.matchedTypeCount === 0,
    "Default pack with no declared types must return zero matched profiles."
  );
  // Sovereign types should not appear in scope when sovereign federation
  // is not authorized (default is false).
  assert(
    defaultPack.summary.sovereignTypeCount === 0,
    "Default pack must hold sovereign types out of scope when federation is not authorized."
  );

  // Sovereign federation gate.
  const sovereignPack = composeCustomerTypeRegistry({
    borrowerContext: {
      declaredTypes: ["federally recognized tribe"],
    },
    scope: { sovereignFederationAllowed: true },
  });

  assert(
    sovereignPack.summary.sovereignTypeCount > 0,
    "Sovereign federation authorization must expose sovereign types."
  );
  assert(
    sovereignPack.profiles.some(
      (profile) => profile.customerType.federationScope === "SOVEREIGN"
    ),
    "Sovereign federation authorization must match sovereign customer types when declared."
  );

  // Token-matching against the Capital Graph.
  const pack = composeCustomerTypeRegistry({
    reviewerRole: "Qualified Governance Reviewer",
    applicationId: "application-smoke",
    borrowerContext: {
      declaredTypes: [
        "beginning farmer",
        "rural small business",
        "utility customer",
      ],
      jurisdiction: { federal: true, state: "MD" },
    },
    scope: { sovereignFederationAllowed: false },
  });

  assert(
    pack.summary.matchedTypeCount >= 3,
    "Customer Type pack must match the declared archetypes."
  );
  assert(
    pack.profiles.every(
      (profile) => profile.eligibleCapitalRefs.length > 0
    ),
    "Every matched profile must include at least one eligible capital ref from the Capital Graph."
  );
  assert(
    pack.summary.totalEligibleCapitalRefCount > 0,
    "Pack must aggregate eligible capital refs across matched profiles."
  );
  assert(
    pack.summary.conflictSignalCount > 0,
    "Pack must preserve at least one conflict signal as first-class evidence."
  );

  // Archetype scoping.
  const scoped = composeCustomerTypeRegistry({
    scope: {
      archetypes: ["AGRICULTURAL_PRODUCER", "RURAL_SMALL_BUSINESS"],
    },
  });

  assert(
    scoped.customerTypes.every((type) =>
      ["AGRICULTURAL_PRODUCER", "RURAL_SMALL_BUSINESS"].includes(type.archetype)
    ),
    "Archetype scoping must restrict the customer-type catalog."
  );

  // Disclosure / production-restriction posture.
  assert(
    pack.disclosures.includes(
      "Customer Type Registry output is advisory, replay-safe, audit-safe, and conflict-preserving."
    ),
    "Customer Type disclosures must include the advisory/replay/audit/conflict language."
  );
  assert(
    pack.productionRestrictions.includes(
      "no autonomous customer eligibility determination"
    ) &&
      pack.productionRestrictions.includes("no autonomous lending decision") &&
      pack.productionRestrictions.includes("no public verification"),
    "Customer Type production restrictions must block autonomous determination, lending decision, and public verification."
  );
  assert(
    CUSTOMER_TYPE_DISCLOSURES.includes(
      "Sovereign customer types (e.g. tribal nations) are visible only when named sovereign federation participation is authorized."
    ),
    "Customer Type disclosure constants must include the sovereign-federation boundary."
  );
  assert(
    CUSTOMER_TYPE_PRODUCTION_RESTRICTIONS.includes(
      "no autonomous customer eligibility determination"
    ),
    "Customer Type production restriction constants must block autonomous eligibility determination."
  );

  // Registry conformance.
  const moduleManifest = moduleManifests.find(
    (manifest) => manifest.id === "governance-customer-type-registry"
  );
  assert(
    moduleManifest !== undefined,
    "governance-customer-type-registry module manifest must be registered."
  );
  assert(
    moduleManifest.productionBlocked && moduleManifest.replayRequired,
    "governance-customer-type-registry must remain production-blocked and replay-required."
  );
  assert(
    moduleManifest.audience.includes("internal"),
    "governance-customer-type-registry must be internal-audience."
  );
  assert(
    moduleManifest.eventsPublished.includes(
      "governance.customer.type.composed"
    ),
    "governance-customer-type-registry must publish the customer type composed event."
  );

  const contract = eventContractRegistry.find(
    (entry) => entry.eventType === "governance.customer.type.composed"
  );
  assert(
    contract !== undefined,
    "governance.customer.type.composed contract must be registered."
  );
  assert(
    contract.productionBlocked && contract.replayRequired,
    "Customer Type event contract must be production-blocked and replay-required."
  );
  assert(
    contract.classificationLevel === "RESTRICTED",
    "Customer Type event contract must be RESTRICTED."
  );
  assert(
    contract.publicSurfaceAllowed === false,
    "Customer Type event contract must not be public-surface allowed."
  );
  assert(
    contract.purpose.includes(
      "without autonomous customer eligibility determination"
    ),
    "Customer Type contract must preserve no-autonomous-eligibility purpose language."
  );

  const handoffs = crossModuleHandoffMap.filter(
    (handoff) =>
      handoff.fromModuleId === "governance-customer-type-registry" ||
      handoff.toModuleId === "governance-customer-type-registry"
  );
  assert(
    handoffs.length >= 15,
    "Customer Type module must have at least fifteen governed handoff routes."
  );
  assert(
    handoffs.every(
      (handoff) => handoff.productionBlocked && handoff.humanReviewBoundary
    ),
    "Every Customer Type handoff must remain production-blocked and human-review-bound."
  );
  assert(
    handoffs.some(
      (handoff) => handoff.toModuleId === "governance-capital-graph"
    ),
    "Customer Type module must hand off to the Capital Graph for paired composition review."
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        runtimeVersion: CUSTOMER_TYPE_RUNTIME_VERSION,
        archetypeCount: pack.summary.archetypeCount,
        customerTypeCount: pack.summary.customerTypeCount,
        matchedTypeCount: pack.summary.matchedTypeCount,
        totalEligibleCapitalRefCount:
          pack.summary.totalEligibleCapitalRefCount,
        conflictSignalCount: pack.summary.conflictSignalCount,
        sovereignTypeCount: pack.summary.sovereignTypeCount,
        participantTypeCount: pack.summary.participantTypeCount,
        publicTypeCount: pack.summary.publicTypeCount,
        scopedTypeCount: scoped.summary.customerTypeCount,
        sovereignMatchedCount: sovereignPack.summary.matchedTypeCount,
        handoffs: handoffs.length,
        message: "Customer Type Registry smoke test passed.",
      },
      null,
      2
    )
  );
}

main();
