import {
  CONNECTOR_CERTIFICATION_DISCLOSURES,
  CONNECTOR_CERTIFICATION_PRODUCTION_RESTRICTIONS,
  CONNECTOR_CERTIFICATION_RUNTIME_VERSION,
  evaluateConnectorCertification,
} from "@/lib/connectors/certificationRuntime";
import { eventContractRegistry } from "@/lib/modules/eventContractRegistry";
import { crossModuleHandoffMap } from "@/lib/modules/handoffMap";
import { moduleManifests } from "@/lib/modules/moduleRegistry";
import { SOURCE_AUTHORITY_REGISTRY } from "@/lib/source-intelligence/sourceIntelligenceRuntime";

/**
 * Connector Certification Smoke Test
 *
 * Master Volume Governance:
 * - Vol I: protects accountable connector certification posture.
 * - Vol II: keeps posture from becoming live external action, external
 *   promotion, public verification, regulatory reliance, lender
 *   commitment, environmental clearance, payment authorization, or legal
 *   reliance.
 * - Vol III: validates deterministic per-connector composition.
 * - Vol III-B: confirms human-review-required posture and governed evidence.
 * - Vol IV: confirms governed handoffs to the Module 10 Connector
 *   Certification Console, Source Ingestion Gate, Live Scraper Activation
 *   Gate, Controlled Promotion Activation Gate, Registry Framework,
 *   Governance Evidence Engine, Internal Certification Engine, Module 16
 *   Evidence Packet Workspace, Audit Replay Console, Governance, and
 *   Reviews.
 * - Vol V-VII: confirms registry, contract, handoff, and disclosure conformance.
 */

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function main() {
  const defaultResult = evaluateConnectorCertification({});

  assert(
    defaultResult.runtimeVersion === CONNECTOR_CERTIFICATION_RUNTIME_VERSION,
    "Connector certification must emit the runtime version."
  );
  assert(
    defaultResult.productionBlocked === true,
    "Connector certification must remain production-blocked."
  );
  assert(
    defaultResult.humanReviewRequired === true,
    "Connector certification must require human review."
  );
  assert(
    defaultResult.connectorCertificationInternalOnly === true &&
      defaultResult.liveExecutionBlocked === true &&
      defaultResult.noPublicVerification === true &&
      defaultResult.noRegulatoryReliance === true &&
      defaultResult.noLegalReliance === true,
    "Connector certification must block live external execution, public verification, regulatory reliance, and legal reliance."
  );

  assert(
    defaultResult.summary.connectorCount === SOURCE_AUTHORITY_REGISTRY.length,
    "Default scope must include every connector in the source authority registry."
  );
  assert(
    defaultResult.summary.liveExecutionBlockedCount ===
      defaultResult.summary.connectorCount,
    "Live execution must remain blocked for every connector."
  );

  // All baseline connectors are PENDING_CERTIFICATION or REQUIRES_REVIEW so
  // they should default to BLOCKED_BY_GATE.
  assert(
    defaultResult.connectors.every(
      (connector) =>
        connector.overallStatus === "BLOCKED_BY_GATE" &&
        connector.liveExecutionPosture === "LIVE_EXECUTION_BLOCKED"
    ),
    "Default connector posture must surface live-execution-blocked and gate-blocked status."
  );

  const certifiedResult = evaluateConnectorCertification({
    reviewerRole: "Qualified Source Promotion Authority",
    applicationId: "application-smoke",
    connectors: [
      {
        connectorId: "county-gis",
        connectorName: "County GIS",
        sourceAuthorityTier: "TIER_1",
        dimensions: {
          review: {
            status: "CERTIFIED_INTERNAL_REVIEW_BOUND",
            readinessPercent: 100,
            blockingGates: [],
          },
          certification_evidence: {
            status: "CERTIFIED_INTERNAL_REVIEW_BOUND",
            readinessPercent: 100,
            blockingGates: [],
          },
          rollback: {
            status: "CERTIFIED_INTERNAL_REVIEW_BOUND",
            readinessPercent: 100,
            blockingGates: [],
          },
          monitoring: {
            status: "CERTIFIED_INTERNAL_REVIEW_BOUND",
            readinessPercent: 100,
            blockingGates: [],
          },
          activation_checks: {
            status: "CERTIFIED_INTERNAL_REVIEW_BOUND",
            readinessPercent: 100,
            blockingGates: [],
          },
        },
      },
    ],
  });

  // Baseline is still PENDING_CERTIFICATION so the overall posture must
  // remain BLOCKED_BY_GATE even when dimensions are certified.
  assert(
    certifiedResult.connectors.length === 1,
    "Explicit connector input must restrict the posture scope."
  );
  assert(
    certifiedResult.connectors[0].overallStatus === "BLOCKED_BY_GATE",
    "Baseline pending certification must keep the overall status blocked."
  );
  assert(
    certifiedResult.connectors[0].liveExecutionPosture ===
      "LIVE_EXECUTION_BLOCKED",
    "Live execution must remain blocked regardless of dimension certification."
  );

  assert(
    defaultResult.disclosures.includes(
      "Connector certification posture is review-bound and internal evidence only."
    ),
    "Connector certification disclosures must include the internal-only language."
  );
  assert(
    defaultResult.disclosures.includes(
      "Live external connector execution remains blocked until qualified approval through the Source Promotion Authority, the Controlled Promotion Board, and the Live Scraper Activation Gate."
    ),
    "Connector certification disclosures must include the live-execution-blocked language."
  );
  assert(
    defaultResult.productionRestrictions.includes("no live external action") &&
      defaultResult.productionRestrictions.includes("no public verification") &&
      defaultResult.productionRestrictions.includes("no regulatory reliance"),
    "Connector certification restrictions must block live external action, public verification, and regulatory reliance."
  );
  assert(
    CONNECTOR_CERTIFICATION_DISCLOSURES.includes(
      "Connector certification does not authorize live source fetch."
    ),
    "Connector certification disclosure constants must block live source fetch."
  );
  assert(
    CONNECTOR_CERTIFICATION_PRODUCTION_RESTRICTIONS.includes(
      "no live external action"
    ),
    "Connector certification production restriction constants must block live external action."
  );

  const moduleManifest = moduleManifests.find(
    (manifest) => manifest.id === "governance-connector-certification"
  );
  assert(
    moduleManifest !== undefined,
    "Connector certification module manifest must be registered."
  );
  assert(
    moduleManifest.productionBlocked && moduleManifest.replayRequired,
    "Connector certification module must remain production-blocked and replay-required."
  );
  assert(
    moduleManifest.audience.includes("internal"),
    "Connector certification module must be internal-audience."
  );
  assert(
    moduleManifest.eventsPublished.includes(
      "governance.connector.certification.composed"
    ),
    "Connector certification module must publish the certification composed event."
  );

  const contract = eventContractRegistry.find(
    (entry) => entry.eventType === "governance.connector.certification.composed"
  );
  assert(
    contract !== undefined,
    "Connector certification event contract must be registered."
  );
  assert(
    contract.productionBlocked && contract.replayRequired,
    "Connector certification event contract must be production-blocked and replay-required."
  );
  assert(
    contract.classificationLevel === "RESTRICTED",
    "Connector certification event contract must be RESTRICTED."
  );
  assert(
    contract.publicSurfaceAllowed === false,
    "Connector certification event contract must not be public-surface allowed."
  );
  assert(
    contract.purpose.includes("without live external connector execution"),
    "Connector certification contract must preserve no-live-execution purpose language."
  );

  const handoffs = crossModuleHandoffMap.filter(
    (handoff) =>
      handoff.fromModuleId === "governance-connector-certification" ||
      handoff.toModuleId === "governance-connector-certification"
  );
  assert(
    handoffs.length >= 10,
    "Connector certification module must have at least ten governed handoff routes."
  );
  assert(
    handoffs.every(
      (handoff) => handoff.productionBlocked && handoff.humanReviewBoundary
    ),
    "Every connector certification handoff must remain production-blocked and human-review-bound."
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        defaultConnectorCount: defaultResult.summary.connectorCount,
        defaultBlockedConnectorCount: defaultResult.summary.blockedConnectorCount,
        defaultLiveExecutionBlocked:
          defaultResult.summary.liveExecutionBlockedCount,
        certifiedConnectorCount: certifiedResult.connectors.length,
        certifiedOverallStatus: certifiedResult.connectors[0].overallStatus,
        certifiedLiveExecutionPosture:
          certifiedResult.connectors[0].liveExecutionPosture,
        handoffs: handoffs.length,
        disclosures: defaultResult.disclosures.length,
        message: "Connector certification smoke test passed.",
      },
      null,
      2
    )
  );
}

main();
