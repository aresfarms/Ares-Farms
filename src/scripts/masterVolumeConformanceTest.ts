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
  | "awaiting_controlled_promotion";

type RequirementRecord = {
  title: string;
  status: RequirementStatus;
  requires: string[];
  tests: string[];
  evidence: string[];
};

type RequirementMatrix = {
  frameworkVersion: string;
  sourceDocuments: string[];
  allowedStatuses: RequirementStatus[];
  requirements: Record<string, RequirementRecord>;
};

const repoRoot = process.cwd();
const matrixPath = path.join(repoRoot, "docs/master-volume-requirements.json");
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
  return readJson<{ scripts?: Record<string, string> }>(
    path.join(repoRoot, "package.json")
  ).scripts ?? {};
}

function main() {
  assert(exists("docs/master-volume-requirements.json"), "Requirement matrix missing.");

  const matrix = readJson<RequirementMatrix>(matrixPath);
  const scripts = packageScripts();
  const allowedStatuses = new Set(matrix.allowedStatuses);
  const requirements = Object.entries(matrix.requirements);

  assert(requirements.length > 0, "Requirement matrix cannot be empty.");
  assert(
    updatedMasterVolumeSources.every((source) =>
      matrix.sourceDocuments.includes(source)
    ),
    "Requirement matrix must reference the updated unified TOC, Volumes VI-VII, cross-reference index, and build conformance matrix."
  );
  assert(
    volumeViRequirementIds.every((requirementId) =>
      Boolean(matrix.requirements[requirementId])
    ),
    "Requirement matrix must include all Volume VI canonical doctrine IDs."
  );
  assert(
    batch25EnvironmentalRequirementIds.every((requirementId) =>
      Boolean(matrix.requirements[requirementId])
    ),
    "Requirement matrix must include all Batch 25 environmental pathway doctrine IDs."
  );
  assert(
    volumeViConsolidationRequirementIds.every((requirementId) =>
      Boolean(matrix.requirements[requirementId])
    ),
    "Requirement matrix must include Volume VI consolidation and build-conformance doctrine IDs."
  );

  for (const [requirementId, requirement] of requirements) {
    assert(
      allowedStatuses.has(requirement.status),
      `${requirementId} has an unknown status.`
    );
    assert(
      requirement.requires.length > 0,
      `${requirementId} must declare required runtime components.`
    );
    assert(
      requirement.tests.every((testName) => Boolean(scripts[testName])),
      `${requirementId} references a missing package script.`
    );
    assert(
      requirement.evidence.every(exists),
      `${requirementId} references missing evidence.`
    );
  }

  const unknownRequirements = requirements.filter(
    ([, requirement]) => !allowedStatuses.has(requirement.status)
  );

  assert(
    unknownRequirements.length === 0,
    "No Master Volume doctrine may exist in an unknown state."
  );

  assert(
    moduleManifests.every(
      (manifest) =>
        manifest.requiredGovernance.length > 0 &&
        manifest.requiredGovernance.includes("CANON-CLASS-001") &&
        manifest.requiredGovernance.includes("TECH-LEDGER-001") &&
        manifest.requiredGovernance.includes("TECH-REPLAY-001")
    ),
    "Every module manifest must carry constitutional governance tags."
  );

  assert(
    moduleManifests.every((manifest) => manifest.productionBlocked),
    "All current module manifests must remain production blocked."
  );

  assert(
    eventContractRegistry.every((contract) => contract.replayRequired),
    "Every event contract must require replay."
  );
  assert(
    crossModuleHandoffMap.every(
      (handoff) =>
        handoff.replayRequired &&
        handoff.humanReviewBoundary &&
        handoff.productionBlocked
    ),
    "Every cross-module handoff must preserve replay, human review, and production blocks."
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
        ].join(" ")
      ),
      ...publicPayload.productionBlocks,
    ],
  });

  assert(publicClaims.ok, "All public-safe responses must pass the claims gate.");
  assert(
    publicPayload.surfaces.every((surface) =>
      REQUIRED_SURFACE_STATUS_MESSAGES.every((message) =>
        surface.statusMessages.includes(message)
      )
    ),
    "All public-safe surfaces must include the required safe status messages."
  );

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
          {}
        ),
        message: "Master Volume conformance test passed.",
      },
      null,
      2
    )
  );
}

main();
