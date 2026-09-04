import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { PROGRAM_REGISTRY } from "@/lib/capital-graph/programRegistry";
import { canonicalTargetSchemaVersion } from "@/lib/db/canonicalGovernanceMigrations";
import {
  CAPITAL_NETWORK_NON_NEGOTIABLES,
  CAPITAL_NETWORK_RUNTIME_VERSION,
} from "@/lib/financing/capitalNetworkRuntime";
import {
  CAPITAL_NETWORK_RELIABILITY_VERSION,
  RELIABILITY_PUBLIC_MIN_SAMPLE,
  RELIABILITY_RANKING_MIN_SAMPLE,
} from "@/lib/financing/capitalNetworkExecutionReliability";

const root = process.cwd();
const readJson = <T>(file: string): T =>
  JSON.parse(fs.readFileSync(path.join(root, file), "utf8")) as T;
const exists = (file: string) => fs.existsSync(path.join(root, file));

const parity = readJson<any>("docs/current-build-parity.json");
const registry = readJson<any>("docs/current-master-volume-registry.json");
const versions = readJson<any>("docs/versions.json");
const requirements = readJson<any>("docs/master-volume-requirements.json");
const reconciliation = readJson<any>("docs/master-volume-doctrine-reconciliation.json");
const amendment = fs.readFileSync(
  path.join(root, "docs/MASTER_VOLUME_AMENDMENT_2026-09-04_CURRENT_BUILD_PARITY.md"),
  "utf8",
);

assert.equal(parity.effectiveDate, "2026-09-04");
assert.equal(parity.canonicalSchemaTarget, canonicalTargetSchemaVersion());
assert.equal(parity.capitalNetwork.runtimeVersion, CAPITAL_NETWORK_RUNTIME_VERSION);
assert.equal(
  parity.executionReliability.runtimeVersion,
  CAPITAL_NETWORK_RELIABILITY_VERSION,
);
assert.equal(
  parity.executionReliability.publicMinimumVerifiedOutcomes,
  RELIABILITY_PUBLIC_MIN_SAMPLE,
);
assert.equal(
  parity.executionReliability.rankingTieBreakMinimumProviderDecisionOutcomes,
  RELIABILITY_RANKING_MIN_SAMPLE,
);

for (const [key, value] of Object.entries(CAPITAL_NETWORK_NON_NEGOTIABLES)) {
  assert.equal(
    parity.capitalNetwork[key],
    value,
    `Capital Network parity drift: ${key}`,
  );
}

const personSideCriteria = PROGRAM_REGISTRY.flatMap((program) =>
  program.person_side_criteria.map((criterion) => ({ program: program.program_id, criterion })),
);
assert.ok(personSideCriteria.length > 0, "Program Registry has no person-side criteria to verify.");
assert.ok(
  personSideCriteria.every(({ criterion }) => criterion.verifiable_by_furlong === false),
  "A Program Registry person-side criterion became verifiable by Furlong.",
);
assert.equal(parity.programRegistry.personSideCriteriaVerifiableByFurlong, false);
assert.equal(parity.nonResidential.personalCreditScoring, false);
assert.equal(parity.nonResidential.personalIncomeScoring, false);
assert.equal(parity.nonResidential.householdDtiScoring, false);
assert.equal(parity.nonResidential.personalAssetLiquidityNetWorthScoring, false);
assert.equal(parity.nonResidential.residentialExceptionPreserved, true);

const activeRankRoute = fs.readFileSync(path.join(root, "src/app/api/rank/route.ts"), "utf8");
const activeDiagnosticRoute = fs.readFileSync(path.join(root, "src/app/api/test-score/route.ts"), "utf8");
const activePropertyScore = fs.readFileSync(path.join(root, "src/services/scoring/calculatePropertyScore.ts"), "utf8");
const portfolioSurface = fs.readFileSync(path.join(root, "src/app/portfolio/page.tsx"), "utf8");
const farmFinancialSelfCheck = fs.readFileSync(path.join(root, "src/components/public/FarmFinancialHealthCheck.tsx"), "utf8");

assert.equal(parity.activeNonResidentialScoring.propertyProjectOnly, true);
assert.equal(parity.activeNonResidentialScoring.personalFinancialInputsRejected, true);
assert.equal(parity.activeNonResidentialScoring.personalFinancialScoring, false);
assert.equal(parity.activeNonResidentialScoring.legacyPersonalFinancialScoringReachableFromAppRoutes, false);
assert.ok(activeRankRoute.includes("FORBIDDEN_PERSONAL_FINANCIAL_RANKING_KEYS"));
assert.ok(activeRankRoute.includes("propertyReadinessScore"));
assert.ok(activeRankRoute.includes("personalFinancialScoring: false"));
assert.ok(!activeRankRoute.includes("app.liquidity"));
assert.ok(!activeRankRoute.includes("app.scores?.sba"));
assert.ok(!activeRankRoute.includes("app.score ??"));
assert.ok(activeDiagnosticRoute.includes("FORBIDDEN_PERSONAL_FINANCIAL_INPUT_KEYS"));
assert.ok(activeDiagnosticRoute.includes("calculatePropertyProjectScore"));
assert.ok(!activeDiagnosticRoute.includes("body.creditScore"));
assert.ok(!activeDiagnosticRoute.includes("body.liquidity"));
assert.ok(!/creditScore\s*:/.test(activePropertyScore));
assert.ok(!/\bliquidity\s*:/.test(activePropertyScore));
assert.ok(activePropertyScore.includes("PropertyProjectScoreInput"));
assert.ok(!portfolioSurface.includes("liquidity?:"));
assert.ok(!portfolioSurface.includes("liquidity:"));
assert.equal(parity.optionalCustomerCalculators.farmFinancialSelfCheck.clientSideOnly, true);
assert.equal(parity.optionalCustomerCalculators.farmFinancialSelfCheck.sendsInputsToFurlongServer, false);
assert.equal(parity.optionalCustomerCalculators.farmFinancialSelfCheck.persistsInputsAtFurlong, false);
assert.equal(parity.optionalCustomerCalculators.farmFinancialSelfCheck.influencesNonResidentialPropertyScore, false);
assert.equal(parity.optionalCustomerCalculators.farmFinancialSelfCheck.influencesFinancingPathwayRank, false);
assert.equal(parity.optionalCustomerCalculators.farmFinancialSelfCheck.influencesProviderMatch, false);
assert.ok(farmFinancialSelfCheck.includes('"use client"'));
assert.ok(!farmFinancialSelfCheck.includes("fetch("));
assert.ok(!farmFinancialSelfCheck.includes("localStorage"));
assert.ok(!farmFinancialSelfCheck.includes("sessionStorage"));
assert.ok(farmFinancialSelfCheck.includes("do not enter Furlong&apos;s nonresidential property score"));

const activeApiRoot = path.join(root, "src", "app", "api");
const routeFiles: string[] = [];
function collectRouteFiles(dir: string) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) collectRouteFiles(full);
    else if (entry.isFile() && entry.name === "route.ts") routeFiles.push(full);
  }
}
collectRouteFiles(activeApiRoot);
const legacyScoringImports = [
  "@/lib/boundaries/pipeline/orchestrator",
  "@/lib/pipeline/runPipeline",
  "@/lib/api/decision/contract",
  "@/lib/api/decision/handler",
  "@/lib/systemBoundary",
  "@/lib/edge/applyContract",
  "@/lib/engine/applyEngine",
  "@/lib/engine/orchestrator",
  "@/lib/validation/applySchema",
  "@/types/applicant",
];
for (const routeFile of routeFiles) {
  const source = fs.readFileSync(routeFile, "utf8");
  for (const legacyImport of legacyScoringImports) {
    assert.ok(
      !source.includes(legacyImport),
      `Active API route imports superseded personal-financial scoring runtime: ${path.relative(root, routeFile)} -> ${legacyImport}`,
    );
  }
  assert.ok(
    !source.includes("farmFinancialScorecard"),
    `Active API route must not consume the client-side Farm Financial Health self-check: ${path.relative(root, routeFile)}`,
  );
}

for (const file of [parity.changeRegister, parity.sourceSnapshot, parity.buildProtocol]) {
  assert.equal(typeof file, "string", "Parity governance pointer is missing.");
  assert.ok(exists(file), `Parity governance pointer does not exist: ${file}`);
}

assert.equal(registry.activeBuildDate, parity.effectiveDate);
assert.equal(registry.buildBinding?.canonicalSchemaTarget, canonicalTargetSchemaVersion());
assert.equal(
  registry.buildBinding?.capitalNetworkRuntimeVersion,
  CAPITAL_NETWORK_RUNTIME_VERSION,
);
assert.equal(
  registry.buildBinding?.capitalNetworkReliabilityVersion,
  CAPITAL_NETWORK_RELIABILITY_VERSION,
);
assert.equal(
  registry.buildBinding?.nonResidentialRankRuntimeVersion,
  parity.activeNonResidentialScoring.rankRuntimeVersion,
);
assert.equal(
  registry.buildBinding?.nonResidentialDiagnosticRuntimeVersion,
  parity.activeNonResidentialScoring.diagnosticRuntimeVersion,
);
assert.ok(
  registry.documents.some(
    (doc: any) => doc.file === "MASTER_VOLUME_AMENDMENT_2026-09-04_CURRENT_BUILD_PARITY.md",
  ),
  "Current build parity amendment is not registered as a governing document.",
);
assert.deepEqual(versions, registry, "docs/versions.json drifted from the current Master Volume registry.");

const requiredEvidence = [
  "docs/MASTER_VOLUME_AMENDMENT_2026-09-04_CURRENT_BUILD_PARITY.md",
  "docs/current-build-parity.json",
  "docs/MASTER_VOLUME_CHANGE_REGISTER_2026-09-04.md",
  "docs/MASTER_VOLUME_BUILD_PROTOCOL.md",
  "docs/MASTER_VOLUME_SOURCE_SNAPSHOT.md",
  "docs/CAPITAL_NETWORK_MULTI_PROVIDER_2026-09-04.md",
  "docs/MASTER_VOLUME_AMENDMENT_2026-09-04_PROPERTY_INTELLIGENCE.md",
  "docs/MASTER_VOLUME_AMENDMENT_2026-09-04_AI_OPERATING_MODEL.md",
  "docs/governance/OWNER_CONTROLLED_PLATFORM_TRANSITION_2026-09-03.md",
  "src/lib/capital-graph/programRegistry.ts",
  "src/lib/financing/capitalNetworkRuntime.ts",
  "src/lib/financing/capitalNetworkExecutionReliability.ts",
  "src/lib/property/propertyOperatingModel.ts",
  "src/lib/property/marketValueIndication.ts",
  "src/lib/db/migrations/0056_capital_network_multi_provider.sql",
  "src/lib/db/migrations/0057_capital_network_execution_reliability.sql",
  "src/app/api/rank/route.ts",
  "src/app/api/test-score/route.ts",
  "src/services/scoring/calculatePropertyScore.ts",
  "src/app/portfolio/page.tsx",
  "src/components/public/FarmFinancialHealthCheck.tsx",
  "src/lib/property/farmFinancialScorecard.ts",
  "src/scripts/backendSmokeTest.ts",
  "src/LOCKED_MODULES.md",
  "docs/BACKEND_COVERAGE_MATRIX.md",
  "src/scripts/backendModuleReadinessGate.ts",
  "src/scripts/verifyMasterVolumeBuildParity.ts",
];
for (const evidence of requiredEvidence) {
  assert.ok(exists(evidence), `Parity evidence missing: ${evidence}`);
  assert.ok(
    registry.repositoryEvidence.includes(evidence),
    `Current Master Volume registry does not bind parity evidence: ${evidence}`,
  );
}

const impactedDoctrineIds = [
  "CANON-FACILITATE-001",
  "CONST-FAIR-001",
  "ECON-CONFLICT-001",
  "ECON-CONFLICT-REG-001",
  "REG-USDA-001",
  "REG-USDA-002",
  "REG-USDA-003",
  "REG-FSA-001",
  "REG-FSA-002",
  "REG-SBA-001",
  "REG-SBA-002",
  "REG-SBA-003",
  "REG-SCORE-001",
  "REG-SCORE-002",
  "REG-SCORE-003",
  "OPS-USDA-001",
  "OPS-USDA-002",
  "OPS-USDA-003",
  "OPS-FSA-001",
  "OPS-FSA-002",
  "OPS-SBA-001",
  "OPS-SBA-002",
  "OPS-SCORE-001",
  "OPS-SCORE-002",
] as const;

const reconciliationById = new Map(
  reconciliation.doctrines.map((row: any) => [row.doctrineId, row]),
);
for (const doctrineId of impactedDoctrineIds) {
  const req = requirements.requirements[doctrineId];
  assert.ok(req, `Missing impacted Master Volume requirement: ${doctrineId}`);
  assert.ok(
    req.masterSources?.includes("MASTER_VOLUME_AMENDMENT_2026-09-04_CURRENT_BUILD_PARITY.md"),
    `${doctrineId} does not point to the current parity amendment.`,
  );
  assert.ok(
    req.evidence?.includes("docs/current-build-parity.json"),
    `${doctrineId} does not bind the machine parity mirror.`,
  );
  assert.ok(
    req.tests?.includes("verify:master-volume-build-parity"),
    `${doctrineId} does not run the parity gate.`,
  );

  const row: any = reconciliationById.get(doctrineId);
  assert.ok(row, `Missing reconciliation row: ${doctrineId}`);
  assert.ok(
    row.sourceDocuments.includes("MASTER_VOLUME_AMENDMENT_2026-09-04_CURRENT_BUILD_PARITY.md"),
    `${doctrineId} reconciliation does not include the current parity amendment.`,
  );
  assert.ok(
    row.evidence.includes("docs/current-build-parity.json"),
    `${doctrineId} reconciliation does not bind the machine parity mirror.`,
  );
  assert.ok(
    row.tests.includes("verify:master-volume-build-parity"),
    `${doctrineId} reconciliation does not include the parity gate.`,
  );
  assert.match(
    row.reconciliationBasis,
    /current|amend|supersed|property|provider|nonresidential/i,
    `${doctrineId} reconciliation basis does not explain its current-build scope.`,
  );
  if (["REG-SCORE-001", "REG-SCORE-002", "REG-SCORE-003", "OPS-SCORE-001", "OPS-SCORE-002"].includes(doctrineId)) {
    for (const activeEvidence of [
      "src/app/api/rank/route.ts",
      "src/app/api/test-score/route.ts",
      "src/services/scoring/calculatePropertyScore.ts",
      "src/app/portfolio/page.tsx",
      "src/LOCKED_MODULES.md",
    ]) {
      assert.ok(
        row.evidence.includes(activeEvidence),
        `${doctrineId} reconciliation does not bind active scoring evidence: ${activeEvidence}`,
      );
    }
  }
}

for (const id of [
  "MASTER-BUILD-PARITY-2026-09-04",
  "CAPITAL-NETWORK-001",
  "CAPITAL-NETWORK-EXECUTION-001",
  "PROPERTY-AI-OPERATING-MODEL-001",
  "PROPERTY-VALUE-INDICATION-001",
] as const) {
  assert.ok(requirements.requirements[id], `Current build requirement missing: ${id}`);
}

for (const phrase of [
  "Furlong does not sell borrower leads",
  "Furlong does not auction borrower files",
  "Provider compensation has zero influence on ranking",
  "Residential mortgage workflows are the explicit exception",
  "canonical schema target for this build is **0057**",
] as const) {
  assert.ok(amendment.includes(phrase), `Parity amendment lost hard rule: ${phrase}`);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      mirrorId: parity.mirrorId,
      activeBuildDate: registry.activeBuildDate,
      canonicalSchemaTarget: canonicalTargetSchemaVersion(),
      capitalNetworkRuntimeVersion: CAPITAL_NETWORK_RUNTIME_VERSION,
      executionReliabilityVersion: CAPITAL_NETWORK_RELIABILITY_VERSION,
      impactedDoctrineRowsReconciled: impactedDoctrineIds.length,
      personSideProgramCriteriaVerified: personSideCriteria.length,
      hardRules: {
        nonResidentialPersonalFinancialScoring: false,
        leadSale: false,
        fileAuction: false,
        shotgunRouting: false,
        compensationRankingInfluence: false,
        affiliationRankingInfluence: false,
        borrowerRecipientChoice: true,
        exactRecipientConsent: true,
        activeNonResidentialRankAndDiagnosticPropertyProjectOnly: true,
        activeLegacyPersonalFinancialScoringReachableFromAppRoutes: false,
        clientSideFarmFinancialSelfCheckInfluencesRanking: false,
      },
      message:
        "Current Master Volume parity mirror matches the executable property/program/provider boundaries and canonical schema target.",
    },
    null,
    2,
  ),
);
