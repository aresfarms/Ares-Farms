import fs from "fs";
import path from "path";

import { buildPublicSurfaceGatewayPayload } from "@/lib/dto/public";
import { REQUIRED_SURFACE_STATUS_MESSAGES } from "@/lib/dto/shared";
import { evaluateContentClaims } from "@/lib/governance/contentClaimsPolicy";
import { eventContractRegistry } from "@/lib/modules/eventContractRegistry";
import { crossModuleHandoffMap } from "@/lib/modules/handoffMap";
import { moduleManifests } from "@/lib/modules/moduleRegistry";

/**
 * Master Volume Conformance Test
 *
 * This is the constitutional proof layer for the build. It verifies that
 * Master Volume requirements are implemented, intentionally blocked, not
 * applicable, or awaiting controlled promotion. Unknown doctrine state fails.
 */

type RequirementStatus =
  | "implemented"
  | "intentionally_blocked"
  | "not_applicable"
  | "awaiting_controlled_promotion"
  | "partially_implemented"
  | "documentary_governance"
  | "unreconciled";

type RequirementRecord = {
  title: string;
  status: RequirementStatus;
  requires: string[];
  tests: string[];
  evidence: string[];
  reconciliationBasis?: string;
  masterSources?: string[];
  operationallyComplete?: boolean;
  outstandingObligations?: string[];
};

type RequirementMatrix = {
  frameworkVersion: string;
  sourceDocuments: string[];
  allowedStatuses: RequirementStatus[];
  requirements: Record<string, RequirementRecord>;
};

const repoRoot = process.cwd();
const matrixPath = path.join(repoRoot, "docs/master-volume-requirements.json");
const doctrineInventoryPath = path.join(
  repoRoot,
  "docs/master-volume-doctrine-inventory.json",
);
const doctrineReconciliationPath = path.join(
  repoRoot,
  "docs/master-volume-doctrine-reconciliation.json",
);
const volumeViRequirementIds = [
  "SOURCEINT-001",
  "SOURCEINT-002",
  "SOURCE-AUTH-001",
  "CONNECTOR-CERT-001",
  "SOURCE-INGEST-001",
  "SOURCE-PROV-001",
  "SOURCE-REPLAY-001",
  "PROPERTY-DISC-001",
  "REVENUE-INTEL-001",
  "SELLABLE-CATALOG-001",
  "PROGRAM-GRAPH-001",
  "MARKETPLACE-INTEL-001",
  "OPERATING-COST-GOV-001",
  "MARKET-SIGNAL-001",
  "GEOSPATIAL-GOV-001",
  "STATE-REGISTRY-001",
  "CUSTOMER-TYPE-ELIGIBILITY-001",
  "DATA-FUSION-001",
  "RUNTIME-STATE-001",
  "FEATURE-GOV-001",
  "PUBLIC-CLAIMS-001",
  "INCIDENT-GOV-001",
  "CONFIG-GOV-001",
  "UX-GOV-001",
  "IMPLEMENTATION-MANIFEST-001",
  "PLATFORM-FED-001",
  "MODULE-MANIFEST-001",
  "SURFACE-GOV-001",
  "CONFORMANCE-001",
  "MODULE-GATE-001",
  "MODULE-READINESS-001",
  "BACKEND-COVERAGE-001",
  "SURFACE-ALIGN-001",
] as const;

const batch25EnvironmentalRequirementIds = [
  "ROLE-ARCH-001",
  "REG-NEPA-001",
  "USDA-ENV-001",
  "TECH-CONN-001",
  "OPS-BORROWER-JOURNEY-001",
  "CANON-ECON-001",
  "CANON-SOVEREIGNTY-001",
] as const;

const volumeViConsolidationRequirementIds = [
  "VOLVI-CONSOLIDATION-001",
  "XREF-V22-001",
  "BUILD-CONFORMANCE-MATRIX-001",
  "NO-CAPABILITY-DRIFT-001",
] as const;

const updatedMasterVolumeSources = [
  "Furlong_Master_Volume_Series_Unified_TOC.pdf",
  "Furlong_Volume_VI_Source_Intelligence_Integration_Master.pdf",
  "Furlong_Volume_VII_Unified_Governance_Conformance_Matrix.pdf",
  "Furlong_Master_Cross_Reference_Index.pdf",
  "Furlong_Build_Conformance_Cross_Reference_Matrix.pdf",
  "Furlong_Master_Series_Hub.html",
] as const;

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function exists(pathname: string): boolean {
  return fs.existsSync(path.join(repoRoot, pathname));
}

function readJson<T>(pathname: string): T {
  return JSON.parse(fs.readFileSync(pathname, "utf8")) as T;
}

function packageScripts(): Record<string, string> {
  return (
    readJson<{ scripts?: Record<string, string> }>(
      path.join(repoRoot, "package.json"),
    ).scripts ?? {}
  );
}

function main() {
  assert(
    exists("docs/master-volume-requirements.json"),
    "Requirement matrix missing.",
  );

  const matrix = readJson<RequirementMatrix>(matrixPath);
  const doctrineInventory = exists("docs/master-volume-doctrine-inventory.json")
    ? readJson<{
        canonicalDoctrineIds?: string[];
        canonicalDoctrineCount?: number;
        missingDocuments?: string[];
      }>(doctrineInventoryPath)
    : {
        canonicalDoctrineIds: [],
        canonicalDoctrineCount: 0,
        missingDocuments: ["doctrine inventory missing"],
      };
  const doctrineReconciliation = exists(
    "docs/master-volume-doctrine-reconciliation.json",
  )
    ? readJson<{
        doctrines?: Array<{
          doctrineId: string;
          status: RequirementStatus;
          sourceDocuments: string[];
          evidence: string[];
          tests: string[];
          reconciliationBasis: string;
          operationallyComplete: boolean;
          outstandingObligations?: string[];
        }>;
      }>(doctrineReconciliationPath)
    : { doctrines: [] };
  const scripts = packageScripts();
  const allowedStatuses = new Set(matrix.allowedStatuses);
  const requirements = Object.entries(matrix.requirements);

  assert(requirements.length > 0, "Requirement matrix cannot be empty.");
  assert(
    updatedMasterVolumeSources.every((source) =>
      matrix.sourceDocuments.includes(source),
    ),
    "Requirement matrix must reference the updated unified TOC, Volumes VI-VII, cross-reference index, and build conformance matrix.",
  );
  assert(
    volumeViRequirementIds.every((requirementId) =>
      Boolean(matrix.requirements[requirementId]),
    ),
    "Requirement matrix must include all Volume VI canonical doctrine IDs.",
  );
  assert(
    batch25EnvironmentalRequirementIds.every((requirementId) =>
      Boolean(matrix.requirements[requirementId]),
    ),
    "Requirement matrix must include all Batch 25 environmental pathway doctrine IDs.",
  );
  assert(
    volumeViConsolidationRequirementIds.every((requirementId) =>
      Boolean(matrix.requirements[requirementId]),
    ),
    "Requirement matrix must include Volume VI consolidation and build-conformance doctrine IDs.",
  );

  for (const [requirementId, requirement] of requirements) {
    assert(
      allowedStatuses.has(requirement.status),
      `${requirementId} has an unknown status.`,
    );
    assert(
      requirement.requires.length > 0,
      `${requirementId} must declare required runtime components.`,
    );
    assert(
      requirement.tests.every((testName) => Boolean(scripts[testName])),
      `${requirementId} references a missing package script.`,
    );
    assert(
      requirement.evidence.every(exists),
      `${requirementId} references missing evidence.`,
    );
  }

  const unknownRequirements = requirements.filter(
    ([, requirement]) => !allowedStatuses.has(requirement.status),
  );

  assert(
    unknownRequirements.length === 0,
    "No Master Volume doctrine may exist in an unknown state.",
  );

  assert(
    moduleManifests.every(
      (manifest) =>
        manifest.requiredGovernance.length > 0 &&
        manifest.requiredGovernance.includes("CANON-CLASS-001") &&
        manifest.requiredGovernance.includes("TECH-LEDGER-001") &&
        manifest.requiredGovernance.includes("TECH-REPLAY-001"),
    ),
    "Every module manifest must carry constitutional governance tags.",
  );

  assert(
    moduleManifests.every((manifest) => manifest.productionBlocked),
    "All current module manifests must remain production blocked.",
  );

  assert(
    eventContractRegistry.every((contract) => contract.replayRequired),
    "Every event contract must require replay.",
  );
  assert(
    crossModuleHandoffMap.every(
      (handoff) =>
        handoff.replayRequired &&
        handoff.humanReviewBoundary &&
        handoff.productionBlocked,
    ),
    "Every cross-module handoff must preserve replay, human review, and production blocks.",
  );

  const publicPayload = buildPublicSurfaceGatewayPayload();
  const publicClaims = evaluateContentClaims({
    text: [
      ...publicPayload.surfaces.map((surface) =>
        [
          surface.title,
          surface.route,
          surface.claimsProfile,
          ...surface.statusMessages,
        ].join(" "),
      ),
      ...publicPayload.productionBlocks,
    ],
  });

  assert(
    publicClaims.ok,
    "All public-safe responses must pass the claims gate.",
  );
  assert(
    publicPayload.surfaces.every((surface) =>
      REQUIRED_SURFACE_STATUS_MESSAGES.every((message) =>
        surface.statusMessages.includes(message),
      ),
    ),
    "All public-safe surfaces must include the required safe status messages.",
  );

  const inventoriedDoctrineIds = doctrineInventory.canonicalDoctrineIds ?? [];
  const registeredDoctrineIds = new Set(Object.keys(matrix.requirements));
  const unregisteredDoctrineIds = inventoriedDoctrineIds.filter(
    (id) => !registeredDoctrineIds.has(id),
  );
  const unreconciledDoctrineIds = inventoriedDoctrineIds.filter(
    (id) => matrix.requirements[id]?.status === "unreconciled",
  );
  const reconciliationRows = doctrineReconciliation.doctrines ?? [];
  const reconciliationById = new Map(
    reconciliationRows.map((row) => [row.doctrineId, row]),
  );
  const missingReconciliationIds = inventoriedDoctrineIds.filter(
    (id) => !reconciliationById.has(id),
  );
  const invalidReconciliationIds = inventoriedDoctrineIds.filter((id) => {
    const row = reconciliationById.get(id);
    if (!row) return false;
    return (
      row.sourceDocuments.length === 0 ||
      row.evidence.length === 0 ||
      row.tests.length === 0 ||
      row.reconciliationBasis.trim().length === 0 ||
      row.evidence.some((evidencePath) => !exists(evidencePath)) ||
      row.tests.some((testName) => !scripts[testName]) ||
      matrix.requirements[id]?.status !== row.status ||
      ((row.status === "partially_implemented" ||
        row.status === "awaiting_controlled_promotion") &&
        (!row.outstandingObligations ||
          row.outstandingObligations.length === 0))
    );
  });
  const truthMirrorCertified =
    unregisteredDoctrineIds.length === 0 &&
    unreconciledDoctrineIds.length === 0 &&
    missingReconciliationIds.length === 0 &&
    invalidReconciliationIds.length === 0 &&
    (doctrineInventory.missingDocuments ?? []).length === 0;
  const operationallyIncompleteDoctrineIds = inventoriedDoctrineIds.filter(
    (id) => reconciliationById.get(id)?.operationallyComplete !== true,
  );
  const fullyOperational =
    truthMirrorCertified && operationallyIncompleteDoctrineIds.length === 0;

  if (process.env.MASTER_VOLUME_MIRROR_STRICT === "true") {
    assert(
      truthMirrorCertified,
      `Master Volume truth mirror is not certified: ${unregisteredDoctrineIds.length} unregistered, ${unreconciledDoctrineIds.length} unreconciled, ${missingReconciliationIds.length} missing reconciliation records, ${invalidReconciliationIds.length} invalid evidence bindings, and ${(doctrineInventory.missingDocuments ?? []).length} missing authoritative documents.`,
    );
  }
  if (process.env.MASTER_VOLUME_OPERATIONAL_STRICT === "true") {
    assert(
      fullyOperational,
      `Master Volume operational completion is blocked by ${operationallyIncompleteDoctrineIds.length} reconciled-but-not-fully-operational doctrines.`,
    );
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        checkedAt: new Date().toISOString(),
        frameworkVersion: matrix.frameworkVersion,
        requirements: requirements.length,
        moduleManifests: moduleManifests.length,
        eventContracts: eventContractRegistry.length,
        handoffs: crossModuleHandoffMap.length,
        publicSurfaces: publicPayload.surfaces.length,
        statuses: requirements.reduce<Record<string, number>>(
          (accumulator, [, requirement]) => {
            accumulator[requirement.status] =
              (accumulator[requirement.status] ?? 0) + 1;
            return accumulator;
          },
          {},
        ),
        doctrineInventory: {
          inventoried: inventoriedDoctrineIds.length,
          registeredFromInventory:
            inventoriedDoctrineIds.length - unregisteredDoctrineIds.length,
          unregistered: unregisteredDoctrineIds.length,
          unreconciled: unreconciledDoctrineIds.length,
          missingDocuments: doctrineInventory.missingDocuments ?? [],
          truthMirrorCertified,
          fullyOperational,
          missingReconciliationIds,
          invalidReconciliationIds,
          operationallyIncomplete: operationallyIncompleteDoctrineIds.length,
          operationallyIncompleteDoctrineIds,
          unregisteredDoctrineIds,
          unreconciledDoctrineIds,
        },
        message: truthMirrorCertified
          ? fullyOperational
            ? "The Master Volume truth mirror is certified and every inventoried doctrine is operationally complete."
            : `The Master Volume truth mirror is certified: platform and Series agree on doctrine state. ${operationallyIncompleteDoctrineIds.length} doctrines remain truthfully marked partial or awaiting controlled promotion and are NOT represented as fully operational.`
          : "Master Volume truth-mirror certification is BLOCKED by missing or invalid reconciliation evidence.",
      },
      null,
      2,
    ),
  );
}

main();
