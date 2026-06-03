import {
  CERTIFICATION_DISCLOSURES,
  CERTIFICATION_ENGINE_RUNTIME_VERSION,
  CERTIFICATION_PRODUCTION_RESTRICTIONS,
  evaluateInternalCertification,
} from "@/lib/certification/engineRuntime";
import { eventContractRegistry } from "@/lib/modules/eventContractRegistry";
import { crossModuleHandoffMap } from "@/lib/modules/handoffMap";
import { moduleManifests } from "@/lib/modules/moduleRegistry";

/**
 * Internal Certification Engine Smoke Test
 *
 * Master Volume Governance:
 * - Vol I: protects accountable internal certification posture.
 * - Vol II: keeps posture from becoming external certification, public
 *   verification, regulatory reliance, lender commitment, credit
 *   decision, or legal reliance.
 * - Vol III: validates deterministic composition across the four
 *   certification domains.
 * - Vol III-B: confirms human-review-required posture and governed evidence.
 * - Vol IV: confirms governed handoffs to the Governance Evidence Engine,
 *   Module 16 Evidence Packet Workspace, Module Readiness Control Tower,
 *   Audit Replay Console, Governance, and Reviews.
 * - Vol V-VII: confirms registry, contract, handoff, and disclosure conformance.
 */

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function main() {
  const defaultResult = evaluateInternalCertification({});

  assert(
    defaultResult.runtimeVersion === CERTIFICATION_ENGINE_RUNTIME_VERSION,
    "Certification engine must emit the runtime version."
  );
  assert(
    defaultResult.productionBlocked === true,
    "Certification engine must remain production-blocked."
  );
  assert(
    defaultResult.humanReviewRequired === true,
    "Certification engine must require human review."
  );
  assert(
    defaultResult.internalCertificationOnly === true &&
      defaultResult.noExternalCertification === true &&
      defaultResult.noPublicVerification === true &&
      defaultResult.noRegulatoryReliance === true &&
      defaultResult.noLenderCommitment === true &&
      defaultResult.noLegalReliance === true,
    "Certification engine must block external certification, public verification, regulatory reliance, lender commitment, and legal reliance."
  );
  assert(
    defaultResult.summary.domainCount === 4,
    "Certification engine must surface four certification domains."
  );

  const domainIds = defaultResult.domains.map((domain) => domain.id);

  for (const required of [
    "module_readiness",
    "source_posture",
    "connector_posture",
    "module_conformance",
  ]) {
    assert(
      domainIds.includes(required as (typeof domainIds)[number]),
      `Certification engine must include the ${required} domain.`
    );
  }

  // Default posture should be blocked by gates because production gates are
  // all blocked in the human authority mapping.
  const moduleReadinessDomain = defaultResult.domains.find(
    (domain) => domain.id === "module_readiness"
  );
  assert(
    moduleReadinessDomain !== undefined,
    "Certification engine must return the module readiness domain."
  );
  assert(
    moduleReadinessDomain.status === "BLOCKED_BY_GATE",
    "Default module readiness posture must surface blocked gates."
  );
  assert(
    moduleReadinessDomain.blockingGates.length > 0,
    "Default module readiness posture must list blocking gates."
  );

  const certifiedResult = evaluateInternalCertification({
    reviewerRole: "Qualified Governance Reviewer",
    applicationId: "application-smoke",
    domains: {
      module_readiness: {
        readinessPercent: 100,
        verifiedCount: 15,
        totalCount: 15,
        blockedGateCount: 0,
        pendingHumanAuthorityCount: 0,
      },
      source_posture: {
        readinessPercent: 100,
        verifiedCount: 5,
        totalCount: 5,
        blockedGateCount: 0,
        pendingHumanAuthorityCount: 0,
      },
      connector_posture: {
        readinessPercent: 100,
        verifiedCount: 1,
        totalCount: 1,
        blockedGateCount: 0,
        pendingHumanAuthorityCount: 0,
      },
      module_conformance: {
        readinessPercent: 100,
        verifiedCount: 3,
        totalCount: 3,
        blockedGateCount: 0,
        pendingHumanAuthorityCount: 0,
      },
    },
  });

  assert(
    certifiedResult.summary.certifiedDomainCount === 4,
    "Override input should certify all four domains."
  );
  assert(
    certifiedResult.summary.overallReadinessPercent === 100,
    "Override input should reach 100 percent overall readiness."
  );
  assert(
    certifiedResult.domains.every(
      (domain) => domain.status === "CERTIFIED_INTERNAL_REVIEW_BOUND"
    ),
    "Override input should certify every domain as internal-review-bound."
  );
  assert(
    certifiedResult.domains.every((domain) =>
      domain.blockedClaims.includes("external certification")
    ),
    "Every certified domain must continue to block external certification claims."
  );

  assert(
    certifiedResult.disclosures.includes(
      "External certification claims remain blocked until the public verification and reliance gates are approved."
    ),
    "Certification disclosures must include the external-blocked language."
  );
  assert(
    certifiedResult.productionRestrictions.includes(
      "no external certification"
    ) &&
      certifiedResult.productionRestrictions.includes(
        "no public verification"
      ) &&
      certifiedResult.productionRestrictions.includes(
        "no regulatory reliance"
      ),
    "Certification restrictions must block external certification, public verification, and regulatory reliance."
  );
  assert(
    CERTIFICATION_DISCLOSURES.includes(
      "Internal certification posture is review-bound and not an external certification."
    ),
    "Certification disclosure constants must include the internal-only language."
  );
  assert(
    CERTIFICATION_PRODUCTION_RESTRICTIONS.includes("no external certification"),
    "Certification production restriction constants must block external certification."
  );

  const moduleManifest = moduleManifests.find(
    (manifest) => manifest.id === "governance-certification-engine"
  );
  assert(
    moduleManifest !== undefined,
    "Internal certification engine module manifest must be registered."
  );
  assert(
    moduleManifest.productionBlocked && moduleManifest.replayRequired,
    "Internal certification engine module must remain production-blocked and replay-required."
  );
  assert(
    moduleManifest.audience.includes("internal"),
    "Internal certification engine module must be internal-audience."
  );
  assert(
    moduleManifest.eventsPublished.includes(
      "governance.certification.posture.composed"
    ),
    "Internal certification engine module must publish the posture composed event."
  );

  const contract = eventContractRegistry.find(
    (entry) => entry.eventType === "governance.certification.posture.composed"
  );
  assert(
    contract !== undefined,
    "Certification engine event contract must be registered."
  );
  assert(
    contract.productionBlocked && contract.replayRequired,
    "Certification engine event contract must be production-blocked and replay-required."
  );
  assert(
    contract.classificationLevel === "RESTRICTED",
    "Certification engine event contract must be RESTRICTED."
  );
  assert(
    contract.publicSurfaceAllowed === false,
    "Certification engine event contract must not be public-surface allowed."
  );
  assert(
    contract.purpose.includes("without external certification"),
    "Certification engine contract must preserve no-external-certification purpose language."
  );

  const handoffs = crossModuleHandoffMap.filter(
    (handoff) =>
      handoff.fromModuleId === "governance-certification-engine" ||
      handoff.toModuleId === "governance-certification-engine"
  );
  assert(
    handoffs.length >= 6,
    "Certification engine module must have at least six governed handoff routes."
  );
  assert(
    handoffs.every(
      (handoff) => handoff.productionBlocked && handoff.humanReviewBoundary
    ),
    "Every certification engine handoff must remain production-blocked and human-review-bound."
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        defaultDomainCount: defaultResult.summary.domainCount,
        defaultBlockedDomainCount: defaultResult.summary.blockedDomainCount,
        defaultPendingHumanAuthority:
          defaultResult.summary.pendingHumanAuthorityCount,
        certifiedDomainCount: certifiedResult.summary.certifiedDomainCount,
        certifiedOverallReadiness: certifiedResult.summary.overallReadinessPercent,
        handoffs: handoffs.length,
        disclosures: certifiedResult.disclosures.length,
        message: "Certification engine smoke test passed.",
      },
      null,
      2
    )
  );
}

main();
