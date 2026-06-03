import {
  CAPITAL_CATEGORY_GOVERNANCE,
  CAPITAL_GRAPH_DISCLOSURES,
  CAPITAL_GRAPH_PRODUCTION_RESTRICTIONS,
  CAPITAL_GRAPH_REGISTRY,
  CAPITAL_GRAPH_RUNTIME_VERSION,
  CapitalCategoryId,
  composeCapitalGraph,
  evaluateCapitalEligibility,
} from "@/lib/capital-graph/capitalGraphRuntime";
import { eventContractRegistry } from "@/lib/modules/eventContractRegistry";
import { crossModuleHandoffMap } from "@/lib/modules/handoffMap";
import { moduleManifests } from "@/lib/modules/moduleRegistry";

/**
 * Capital Graph Smoke Test
 *
 * Master Volume Governance:
 * - Vol I: protects accountable canonical capital pathway composition.
 * - Vol II: keeps Capital Graph from becoming program approval,
 *   regulatory determination, or sponsor commitment.
 * - Vol III: validates deterministic composition across the canonical
 *   23-category capital taxonomy and program registry.
 * - Vol III-B: confirms human-review-required posture and governed evidence.
 * - Vol IV: confirms governed handoffs to financing pathway guidance,
 *   opportunity discovery, advanced intelligence, lender workflow, the
 *   governance evidence engine, internal certification engine, registry
 *   framework, connector certification, evidence packets, audit replay,
 *   governance, reviews, and module readiness.
 * - Vol V: confirms canonical claims governance, controlled disclosure,
 *   replay, audit, portability, and source-authority boundaries.
 * - Vol VI: confirms public-safe DTO posture; no raw sponsor records, no
 *   live external fetch, no source-certainty claim.
 */

const REQUIRED_CATEGORY_IDS: CapitalCategoryId[] = [
  "USDA",
  "SBA",
  "FSA",
  "REAP",
  "COMMUNITY_FACILITIES",
  "CDFI",
  "NEW_MARKETS_TAX_CREDITS",
  "OPPORTUNITY_ZONES",
  "HISTORIC_TAX_CREDITS",
  "ENERGY_CREDITS",
  "UTILITY_INCENTIVES",
  "STATE_INCENTIVE_PROGRAMS",
  "MUNICIPAL_INCENTIVES",
  "WORKFORCE_PROGRAMS",
  "FOUNDATION_GRANTS",
  "PHILANTHROPIC_FUNDING",
  "ENVIRONMENTAL_MARKETS",
  "CARBON_MARKETS",
  "PRIVATE_LENDING",
  "CONVENTIONAL_BANKING",
  "EQUIPMENT_FINANCING",
  "VENDOR_FINANCING",
  "REVENUE_BASED_FINANCING",
];

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function main() {
  // Canonical taxonomy completeness — all 23 categories required.
  assert(
    CAPITAL_CATEGORY_GOVERNANCE.length === REQUIRED_CATEGORY_IDS.length,
    `Capital taxonomy must contain ${REQUIRED_CATEGORY_IDS.length} canonical categories.`
  );
  const taxonomyIds = new Set(
    CAPITAL_CATEGORY_GOVERNANCE.map((category) => category.id)
  );
  for (const required of REQUIRED_CATEGORY_IDS) {
    assert(
      taxonomyIds.has(required),
      `Capital taxonomy must include ${required}.`
    );
  }

  // Every category must carry doctrine refs and at least one blocked claim.
  for (const category of CAPITAL_CATEGORY_GOVERNANCE) {
    assert(
      category.doctrineRefs.some((ref) => ref.startsWith("Vol I")),
      `Category ${category.id} must reference Vol I.`
    );
    assert(
      category.doctrineRefs.some((ref) => ref.startsWith("Vol II")),
      `Category ${category.id} must reference Vol II.`
    );
    assert(
      category.doctrineRefs.some((ref) => ref.startsWith("Vol V")),
      `Category ${category.id} must reference Vol V.`
    );
    assert(
      category.blockedClaims.includes("approval") &&
        category.blockedClaims.includes("regulatory reliance"),
      `Category ${category.id} blocked claims must include approval and regulatory reliance.`
    );
  }

  // Registry seed completeness — at least one program per category.
  const registryCategoryIds = new Set(
    CAPITAL_GRAPH_REGISTRY.map((program) => program.categoryId)
  );
  for (const required of REQUIRED_CATEGORY_IDS) {
    assert(
      registryCategoryIds.has(required),
      `Capital Graph Registry must seed at least one program for ${required}.`
    );
  }

  // Every program must carry replay/audit posture and doctrine refs.
  for (const program of CAPITAL_GRAPH_REGISTRY) {
    assert(
      program.replayPosture === "REPLAY_SAFE",
      `Program ${program.programId} must declare REPLAY_SAFE posture.`
    );
    assert(
      program.auditPosture === "AUDIT_ANCHORED",
      `Program ${program.programId} must declare AUDIT_ANCHORED posture.`
    );
    assert(
      program.doctrineRefs.length >= 3,
      `Program ${program.programId} must carry at least three doctrine refs.`
    );
    assert(
      program.blockedClaims.length > 0,
      `Program ${program.programId} must declare blocked claims.`
    );
    assert(
      program.programVersion.startsWith("cap-"),
      `Program ${program.programId} must declare a versioned programVersion.`
    );
  }

  // Eligibility matcher determinism.
  const eligibility = evaluateCapitalEligibility({
    customerTypes: ["beginning farmer", "rural small business"],
    intendedUses: ["working capital", "equipment", "energy efficiency"],
    jurisdiction: { federal: true, state: "MD", utilityTerritory: "PEPCO" },
    sovereignFederationAllowed: false,
  });

  assert(
    eligibility.matched.length > 0,
    "Eligibility matcher must return at least one matched program for federal + state input."
  );
  assert(
    eligibility.matched.every((finding) => finding.blockingReasons.length === 0),
    "Matched findings must carry no blocking reasons."
  );
  assert(
    eligibility.unreviewed.some(
      (finding) =>
        finding.blockingReasons.some((reason) =>
          reason.toLowerCase().includes("sovereign")
        )
    ),
    "Sovereign sponsor programs must surface as unreviewed when federation participation is not authorized."
  );

  // Full pack composition.
  const pack = composeCapitalGraph({
    reviewerRole: "Qualified Capital Coordination Reviewer",
    applicationId: "application-smoke",
    eligibility: {
      customerTypes: ["beginning farmer", "rural small business"],
      intendedUses: ["working capital", "equipment", "energy efficiency"],
      jurisdiction: { federal: true, state: "MD" },
      sovereignFederationAllowed: false,
    },
  });

  assert(
    pack.runtimeVersion === CAPITAL_GRAPH_RUNTIME_VERSION,
    "Capital Graph runtime must emit the runtime version."
  );
  assert(
    pack.productionBlocked &&
      pack.humanReviewRequired &&
      pack.advisoryOnly &&
      pack.capitalGraphInternalOnly &&
      pack.noAutonomousLending &&
      pack.noProgramApproval &&
      pack.noPublicVerification &&
      pack.noRegulatoryReliance &&
      pack.noLegalReliance &&
      pack.noLiveExternalAction &&
      pack.replaySafe &&
      pack.auditSafe &&
      pack.federationScoped &&
      pack.conflictPreserving,
    "Capital Graph pack must preserve every constitutional flag."
  );
  assert(
    pack.summary.categoryCount === REQUIRED_CATEGORY_IDS.length,
    "Pack summary categoryCount must equal the taxonomy size."
  );
  assert(
    pack.summary.programCount >= REQUIRED_CATEGORY_IDS.length,
    "Pack summary programCount must include at least one program per category."
  );
  assert(
    pack.summary.pathwayCandidateCount > 0,
    "Pack must return at least one pathway candidate for the supplied borrower context."
  );
  assert(
    pack.summary.conflictSignalCount > 0,
    "Pack must preserve at least one conflict signal as first-class evidence."
  );
  assert(
    pack.disclosures.includes(
      "Capital Graph output is advisory, replay-safe, audit-safe, and conflict-preserving."
    ),
    "Capital Graph disclosures must include the advisory/replay/audit/conflict language."
  );
  assert(
    pack.productionRestrictions.includes("no autonomous lending decision") &&
      pack.productionRestrictions.includes("no program approval") &&
      pack.productionRestrictions.includes("no public verification") &&
      pack.productionRestrictions.includes("no regulatory reliance"),
    "Capital Graph production restrictions must block autonomous lending, program approval, public verification, and regulatory reliance."
  );
  assert(
    CAPITAL_GRAPH_DISCLOSURES.includes(
      "Federation scope governs which sovereign and participant programs are visible; sovereign programs require named sovereign participant review."
    ),
    "Capital Graph disclosure constants must include the federation-scope boundary."
  );
  assert(
    CAPITAL_GRAPH_PRODUCTION_RESTRICTIONS.includes(
      "no autonomous lending decision"
    ),
    "Capital Graph production restriction constants must block autonomous lending."
  );

  // Scoped composition.
  const scoped = composeCapitalGraph({
    scope: { categoryIds: ["USDA", "FSA", "REAP", "CARBON_MARKETS"] },
  });

  assert(
    scoped.summary.categoryCount === 4,
    "Category scoping must restrict the taxonomy view."
  );
  assert(
    scoped.programs.every((program) =>
      ["USDA", "FSA", "REAP", "CARBON_MARKETS"].includes(program.categoryId)
    ),
    "Scoped programs must respect the categoryIds scope."
  );

  // Sovereign federation gate.
  const sovereignPack = composeCapitalGraph({
    eligibility: {
      customerTypes: ["mission-aligned borrower"],
      intendedUses: ["working capital"],
      jurisdiction: { federal: false, state: null },
      sovereignFederationAllowed: false,
    },
  });

  assert(
    sovereignPack.eligibility.matched.every(
      (finding) =>
        CAPITAL_GRAPH_REGISTRY.find(
          (program) => program.programId === finding.programId
        )?.federationScope !== "SOVEREIGN"
    ),
    "Sovereign programs must not appear as matched when federation authorization is withheld."
  );

  // Registry conformance.
  const moduleManifest = moduleManifests.find(
    (manifest) => manifest.id === "governance-capital-graph"
  );
  assert(
    moduleManifest !== undefined,
    "governance-capital-graph module manifest must be registered."
  );
  assert(
    moduleManifest.productionBlocked && moduleManifest.replayRequired,
    "governance-capital-graph must remain production-blocked and replay-required."
  );
  assert(
    moduleManifest.audience.includes("internal"),
    "governance-capital-graph must be internal-audience."
  );
  assert(
    moduleManifest.eventsPublished.includes("governance.capital.graph.composed"),
    "governance-capital-graph must publish the capital graph composed event."
  );

  const contract = eventContractRegistry.find(
    (entry) => entry.eventType === "governance.capital.graph.composed"
  );
  assert(
    contract !== undefined,
    "governance.capital.graph.composed contract must be registered."
  );
  assert(
    contract.productionBlocked && contract.replayRequired,
    "Capital Graph event contract must be production-blocked and replay-required."
  );
  assert(
    contract.classificationLevel === "RESTRICTED",
    "Capital Graph event contract must be RESTRICTED."
  );
  assert(
    contract.publicSurfaceAllowed === false,
    "Capital Graph event contract must not be public-surface allowed."
  );
  assert(
    contract.purpose.includes("without autonomous lending decision"),
    "Capital Graph contract must preserve no-autonomous-lending purpose language."
  );

  const handoffs = crossModuleHandoffMap.filter(
    (handoff) =>
      handoff.fromModuleId === "governance-capital-graph" ||
      handoff.toModuleId === "governance-capital-graph"
  );
  assert(
    handoffs.length >= 15,
    "Capital Graph module must have at least fifteen governed handoff routes."
  );
  assert(
    handoffs.every(
      (handoff) => handoff.productionBlocked && handoff.humanReviewBoundary
    ),
    "Every Capital Graph handoff must remain production-blocked and human-review-bound."
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        runtimeVersion: CAPITAL_GRAPH_RUNTIME_VERSION,
        categoryCount: pack.summary.categoryCount,
        programCount: pack.summary.programCount,
        matchedProgramCount: pack.summary.matchedProgramCount,
        pathwayCandidateCount: pack.summary.pathwayCandidateCount,
        conflictSignalCount: pack.summary.conflictSignalCount,
        sovereignProgramCount: pack.summary.sovereignProgramCount,
        participantProgramCount: pack.summary.participantProgramCount,
        publicProgramCount: pack.summary.publicProgramCount,
        scopedCategoryCount: scoped.summary.categoryCount,
        handoffs: handoffs.length,
        message: "Capital Graph smoke test passed.",
      },
      null,
      2
    )
  );
}

main();
