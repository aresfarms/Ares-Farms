import {
  ADVANCED_INTELLIGENCE_DISCLOSURES,
  ADVANCED_INTELLIGENCE_PRODUCTION_RESTRICTIONS,
  ADVANCED_INTELLIGENCE_RUNTIME_VERSION,
  evaluateAdvancedIntelligence,
} from "@/lib/intelligence/advancedIntelligenceRuntime";
import { eventContractRegistry } from "@/lib/modules/eventContractRegistry";
import { crossModuleHandoffMap } from "@/lib/modules/handoffMap";
import { moduleManifests } from "@/lib/modules/moduleRegistry";

/**
 * Advanced Intelligence Smoke Test
 *
 * Master Volume Governance:
 * - Vol I: protects accountable composed intelligence.
 * - Vol II: keeps composed intelligence from becoming approval,
 *   eligibility, underwriting, credit decision, lender commitment,
 *   public verification, regulatory reliance, or legal reliance.
 * - Vol III: validates deterministic composition over source, revenue,
 *   market, geospatial, and pathway intelligence with explicit conflict
 *   preservation.
 * - Vol III-B: confirms human-review-required posture and governed evidence.
 * - Vol IV: confirms governed handoffs to Revenue Opportunity Workspace,
 *   Property Discovery, Customer Revenue Review, Borrower Opportunity
 *   Discovery, Registry Framework, Governance Evidence Engine, Internal
 *   Certification Engine, Connector Certification, Module 16 Evidence
 *   Packet Workspace, Audit Replay Console, Governance, Reviews, and
 *   Module Readiness Control Tower.
 * - Vol V-VII: confirms registry, contract, handoff, and disclosure conformance.
 */

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function main() {
  const defaultResult = evaluateAdvancedIntelligence({});

  assert(
    defaultResult.runtimeVersion === ADVANCED_INTELLIGENCE_RUNTIME_VERSION,
    "Advanced intelligence must emit the runtime version."
  );
  assert(
    defaultResult.productionBlocked === true,
    "Advanced intelligence must remain production-blocked."
  );
  assert(
    defaultResult.humanReviewRequired === true,
    "Advanced intelligence must require human review."
  );
  assert(
    defaultResult.advisoryOnly === true &&
      defaultResult.replaySafe === true &&
      defaultResult.conflictPreserving === true &&
      defaultResult.noApproval === true &&
      defaultResult.noPublicVerification === true &&
      defaultResult.noRegulatoryReliance === true &&
      defaultResult.noLegalReliance === true,
    "Advanced intelligence must block approval, public verification, regulatory reliance, and legal reliance."
  );
  assert(
    defaultResult.summary.domainCount === 5,
    "Advanced intelligence must surface all five domains."
  );

  const domainIds = defaultResult.domains.map((domain) => domain.id);

  for (const required of [
    "source_intelligence",
    "revenue_intelligence",
    "market_intelligence",
    "geospatial_intelligence",
    "pathway_intelligence",
  ]) {
    assert(
      domainIds.includes(required as (typeof domainIds)[number]),
      `Advanced intelligence must include the ${required} domain.`
    );
  }

  assert(
    defaultResult.summary.insightCount > 0,
    "Default scope must compose at least one insight."
  );

  // Pathway insights always carry stacking/conflict rules, so the runtime
  // must preserve at least one conflict signal.
  assert(
    defaultResult.summary.conflictCount > 0,
    "Default scope must preserve at least one conflict signal."
  );

  const pathwayDomain = defaultResult.domains.find(
    (domain) => domain.id === "pathway_intelligence"
  );
  assert(
    pathwayDomain !== undefined && pathwayDomain.insights.length > 0,
    "Pathway intelligence domain must include insights."
  );
  assert(
    pathwayDomain.insights.every((insight) =>
      insight.conflicts.every(
        (conflict) => conflict.resolution === "REQUIRES_HUMAN_REVIEW"
      )
    ),
    "Pathway intelligence conflicts must resolve to REQUIRES_HUMAN_REVIEW."
  );

  const scopedResult = evaluateAdvancedIntelligence({
    scope: { domains: ["source_intelligence", "pathway_intelligence"] },
  });

  assert(
    scopedResult.summary.domainCount === 2,
    "Domain scoping must restrict the domain list."
  );
  assert(
    scopedResult.domains.every(
      (domain) =>
        domain.id === "source_intelligence" ||
        domain.id === "pathway_intelligence"
    ),
    "Domain scoping must restrict the included domains."
  );

  assert(
    defaultResult.disclosures.includes(
      "Advanced intelligence output is advisory, replay-safe, and conflict-preserving."
    ),
    "Advanced intelligence disclosures must include the advisory/conflict language."
  );
  assert(
    defaultResult.disclosures.includes(
      "When canonical sources disagree, both signals are preserved with their respective source authority tiers; the runtime never collapses conflicts into a single authoritative claim."
    ),
    "Advanced intelligence disclosures must include the conflict-preservation language."
  );
  assert(
    defaultResult.productionRestrictions.includes("no approval") &&
      defaultResult.productionRestrictions.includes("no public verification") &&
      defaultResult.productionRestrictions.includes("no regulatory reliance"),
    "Advanced intelligence restrictions must block approval, public verification, and regulatory reliance."
  );
  assert(
    ADVANCED_INTELLIGENCE_DISCLOSURES.includes(
      "Advanced intelligence does not create approval, eligibility, underwriting, or credit decision."
    ),
    "Advanced intelligence disclosure constants must preserve the no-decision boundary."
  );
  assert(
    ADVANCED_INTELLIGENCE_PRODUCTION_RESTRICTIONS.includes("no approval"),
    "Advanced intelligence production restriction constants must block approval."
  );

  const moduleManifest = moduleManifests.find(
    (manifest) => manifest.id === "governance-advanced-intelligence"
  );
  assert(
    moduleManifest !== undefined,
    "Advanced intelligence module manifest must be registered."
  );
  assert(
    moduleManifest.productionBlocked && moduleManifest.replayRequired,
    "Advanced intelligence module must remain production-blocked and replay-required."
  );
  assert(
    moduleManifest.audience.includes("internal"),
    "Advanced intelligence module must be internal-audience."
  );
  assert(
    moduleManifest.eventsPublished.includes("governance.intelligence.composed"),
    "Advanced intelligence module must publish the intelligence composed event."
  );

  const contract = eventContractRegistry.find(
    (entry) => entry.eventType === "governance.intelligence.composed"
  );
  assert(
    contract !== undefined,
    "Advanced intelligence event contract must be registered."
  );
  assert(
    contract.productionBlocked && contract.replayRequired,
    "Advanced intelligence event contract must be production-blocked and replay-required."
  );
  assert(
    contract.classificationLevel === "CONFIDENTIAL",
    "Advanced intelligence event contract must be CONFIDENTIAL."
  );
  assert(
    contract.publicSurfaceAllowed === false,
    "Advanced intelligence event contract must not be public-surface allowed."
  );
  assert(
    contract.purpose.includes("without approval"),
    "Advanced intelligence contract must preserve no-approval purpose language."
  );

  const handoffs = crossModuleHandoffMap.filter(
    (handoff) =>
      handoff.fromModuleId === "governance-advanced-intelligence" ||
      handoff.toModuleId === "governance-advanced-intelligence"
  );
  assert(
    handoffs.length >= 12,
    "Advanced intelligence module must have at least twelve governed handoff routes."
  );
  assert(
    handoffs.every(
      (handoff) => handoff.productionBlocked && handoff.humanReviewBoundary
    ),
    "Every advanced intelligence handoff must remain production-blocked and human-review-bound."
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        domainCount: defaultResult.summary.domainCount,
        insightCount: defaultResult.summary.insightCount,
        conflictCount: defaultResult.summary.conflictCount,
        sourceAuthorityCount: defaultResult.summary.sourceAuthorityCount,
        scopedDomainCount: scopedResult.summary.domainCount,
        handoffs: handoffs.length,
        disclosures: defaultResult.disclosures.length,
        message: "Advanced intelligence smoke test passed.",
      },
      null,
      2
    )
  );
}

main();
