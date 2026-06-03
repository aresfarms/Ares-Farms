import {
  GOVERNANCE_EVIDENCE_DISCLOSURES,
  GOVERNANCE_EVIDENCE_ENGINE_VERSION,
  GOVERNANCE_EVIDENCE_PRODUCTION_RESTRICTIONS,
  composeGovernanceEvidencePack,
} from "@/lib/governance/evidenceEngine";
import { eventContractRegistry } from "@/lib/modules/eventContractRegistry";
import { crossModuleHandoffMap } from "@/lib/modules/handoffMap";
import { moduleManifests } from "@/lib/modules/moduleRegistry";

/**
 * Governance Evidence Engine Smoke Test
 *
 * Master Volume Governance:
 * - Vol I: protects accountable evidence composition.
 * - Vol II: keeps composition from becoming approval, official
 *   certification, public verification, regulatory reliance, lender
 *   commitment, credit decision, environmental clearance, payment
 *   authorization, or legal reliance.
 * - Vol III: validates deterministic composition across module
 *   manifests, event contracts, handoff trails, and audit anchors.
 * - Vol III-B: confirms human-review-required posture and governed evidence.
 * - Vol IV: confirms governed handoffs to Module 16 Evidence Packet
 *   Workspace, Audit Replay Console, Reviews, Governance, Module
 *   Readiness Control Tower, and Lender Evidence.
 * - Vol V-VII: confirms registry, contract, handoff, and disclosure conformance.
 */

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function main() {
  const defaultResult = composeGovernanceEvidencePack({});

  assert(
    defaultResult.runtimeVersion === GOVERNANCE_EVIDENCE_ENGINE_VERSION,
    "Governance evidence engine must emit the runtime version."
  );
  assert(
    defaultResult.productionBlocked === true,
    "Governance evidence engine must remain production-blocked."
  );
  assert(
    defaultResult.humanReviewRequired === true,
    "Governance evidence engine must require human review."
  );
  assert(
    defaultResult.evidenceOnly === true &&
      defaultResult.noOfficialCertification === true &&
      defaultResult.noPublicVerification === true &&
      defaultResult.noRegulatoryReliance === true &&
      defaultResult.noLenderCommitment === true &&
      defaultResult.noLegalReliance === true,
    "Governance evidence engine must block certification, verification, regulatory reliance, lender commitment, and legal reliance."
  );
  assert(
    defaultResult.summary.moduleCount > 0,
    "Default evidence pack must include at least one scoped module."
  );
  assert(
    defaultResult.modules.some((module) => module.moduleId === "governance"),
    "Default evidence pack must include the governance dashboard module."
  );

  const auditPack = composeGovernanceEvidencePack({
    packIntent: "AUDIT_PREP",
    applicationId: "application-smoke",
    borrowerIdMasked: "borrower-smok***-1",
    reviewerRole: "Qualified Governance Reviewer",
    traceRefs: ["trace-smoke-1", "trace-smoke-2"],
    replayRefs: ["replay-smoke-1"],
  });

  assert(
    auditPack.packIntent === "AUDIT_PREP",
    "Audit-prep pack must echo the requested intent."
  );
  assert(
    auditPack.summary.auditAnchorCount === 3,
    "Audit-prep pack must record the supplied audit anchors."
  );
  assert(
    auditPack.modules.some(
      (module) => module.moduleId === "audit-replay"
    ) &&
      auditPack.modules.some(
        (module) => module.moduleId === "evidence-packets"
      ),
    "Audit-prep default modules must include audit-replay and evidence-packets."
  );

  const regulatorPack = composeGovernanceEvidencePack({
    packIntent: "REGULATOR_BRIEF",
    eventTypes: [
      "governance.evidence.pack.composed",
      "borrower.readiness.assessed",
    ],
  });

  assert(
    regulatorPack.eventContracts.some(
      (contract) => contract.eventType === "borrower.readiness.assessed"
    ),
    "Regulator pack must expand to include explicitly requested event contracts."
  );
  assert(
    regulatorPack.humanAuthorityMapping.some(
      (authority) => authority.moduleId === "production-regulatory-examination"
    ),
    "Regulator pack must include qualified human authority for regulatory examination."
  );
  assert(
    regulatorPack.humanAuthorityMapping.every(
      (authority) =>
        typeof authority.requiredAuthority === "string" &&
        authority.requiredAuthority.trim().length > 0
    ),
    "Every human authority item must name a required authority."
  );

  const lenderPack = composeGovernanceEvidencePack({
    packIntent: "LENDER_REVIEW",
    moduleIds: ["lender-workflow", "lender-evidence"],
  });

  assert(
    lenderPack.modules.length === 2,
    "Explicit module IDs must override the intent default."
  );
  assert(
    lenderPack.modules.every(
      (module) => module.moduleId === "lender-workflow" || module.moduleId === "lender-evidence"
    ),
    "Lender pack with explicit module IDs must only include those modules."
  );

  assert(
    auditPack.disclosures.includes(
      "Governance evidence pack composition is review-bound and evidence-only."
    ),
    "Audit pack disclosures must include the evidence-only language."
  );
  assert(
    auditPack.productionRestrictions.includes("no public verification") &&
      auditPack.productionRestrictions.includes("no regulatory reliance") &&
      auditPack.productionRestrictions.includes("no lender commitment") &&
      auditPack.productionRestrictions.includes("no official certification"),
    "Audit pack restrictions must block certification, verification, regulatory reliance, and lender commitment."
  );
  assert(
    GOVERNANCE_EVIDENCE_DISCLOSURES.includes(
      "Human authority mapping describes named, qualified review authorities. Composition does not grant authority."
    ),
    "Governance evidence disclosures must include the human-authority boundary."
  );
  assert(
    GOVERNANCE_EVIDENCE_PRODUCTION_RESTRICTIONS.includes("no approval"),
    "Governance evidence production restrictions must include the no-approval boundary."
  );

  const moduleManifest = moduleManifests.find(
    (manifest) => manifest.id === "governance-evidence-engine"
  );
  assert(
    moduleManifest !== undefined,
    "Governance evidence engine module manifest must be registered."
  );
  assert(
    moduleManifest.productionBlocked && moduleManifest.replayRequired,
    "Governance evidence engine module must remain production-blocked and replay-required."
  );
  assert(
    moduleManifest.audience.includes("internal"),
    "Governance evidence engine module must be internal-audience."
  );
  assert(
    moduleManifest.eventsPublished.includes(
      "governance.evidence.pack.composed"
    ),
    "Governance evidence engine module must publish the pack composed event."
  );

  const contract = eventContractRegistry.find(
    (entry) => entry.eventType === "governance.evidence.pack.composed"
  );
  assert(
    contract !== undefined,
    "Governance evidence pack composed event contract must be registered."
  );
  assert(
    contract.productionBlocked && contract.replayRequired,
    "Governance evidence pack composed contract must be production-blocked and replay-required."
  );
  assert(
    contract.classificationLevel === "RESTRICTED",
    "Governance evidence pack composed contract must be RESTRICTED."
  );
  assert(
    contract.publicSurfaceAllowed === false,
    "Governance evidence pack composed contract must not be public-surface allowed."
  );
  assert(
    contract.purpose.includes("without approval"),
    "Governance evidence pack composed contract must preserve no-approval purpose language."
  );

  const handoffs = crossModuleHandoffMap.filter(
    (handoff) =>
      handoff.fromModuleId === "governance-evidence-engine" ||
      handoff.toModuleId === "governance-evidence-engine"
  );
  assert(
    handoffs.length >= 6,
    "Governance evidence engine module must have at least six governed handoff routes."
  );
  assert(
    handoffs.every(
      (handoff) => handoff.productionBlocked && handoff.humanReviewBoundary
    ),
    "Every governance evidence engine handoff must remain production-blocked and human-review-bound."
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        defaultModuleCount: defaultResult.summary.moduleCount,
        auditModuleCount: auditPack.summary.moduleCount,
        auditAuditAnchors: auditPack.summary.auditAnchorCount,
        regulatorEventContracts: regulatorPack.summary.eventContractCount,
        regulatorHumanAuthority: regulatorPack.summary.humanAuthorityCount,
        lenderModuleCount: lenderPack.modules.length,
        handoffs: handoffs.length,
        disclosures: auditPack.disclosures.length,
        message: "Governance evidence engine smoke test passed.",
      },
      null,
      2
    )
  );
}

main();
