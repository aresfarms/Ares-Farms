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
import { FARM_USE_INTEGRITY_VERSION } from "@/lib/property/farmAnswerEngine";

const root = process.cwd();
const readJson = <T>(file: string): T =>
  JSON.parse(fs.readFileSync(path.join(root, file), "utf8")) as T;
const exists = (file: string) => fs.existsSync(path.join(root, file));

const parity = readJson<any>("docs/current-build-parity.json");
const registry = readJson<any>("docs/current-master-volume-registry.json");
const versions = readJson<any>("docs/versions.json");
const requirements = readJson<any>("docs/master-volume-requirements.json");
const reconciliation = readJson<any>(
  "docs/master-volume-doctrine-reconciliation.json",
);
const amendment = fs.readFileSync(
  path.join(
    root,
    "docs/MASTER_VOLUME_AMENDMENT_2026-09-04_CURRENT_BUILD_PARITY.md",
  ),
  "utf8",
);
const reportCommerceAmendment = fs.readFileSync(
  path.join(
    root,
    "docs/MASTER_VOLUME_AMENDMENT_2026-09-16_PUBLIC_REPORT_COMMERCE.md",
  ),
  "utf8",
);

assert.equal(parity.effectiveDate, "2026-09-16");
assert.equal(parity.canonicalSchemaTarget, canonicalTargetSchemaVersion());
assert.equal(
  parity.capitalNetwork.runtimeVersion,
  CAPITAL_NETWORK_RUNTIME_VERSION,
);
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

const experience = readJson<any>(parity.customerExperience.releaseMirror);
assert.equal(experience.answerVersion, "furlong-answer-v1.0.0");
assert.equal(experience.exportVersion, "furlong-answer-export-v1.0.0");
assert.equal(experience.amendment, parity.customerExperience.amendment);
assert.ok(exists(experience.amendment));
assert.equal(experience.providerSharingOnSave, false);
assert.equal(experience.exportRequiresOwner, true);
assert.equal(experience.exportRequiresDurableAudit, true);
assert.equal(experience.comparisonIsSalesComparableEngine, false);
assert.equal(experience.allCalculationsCertified, false);
assert.equal(experience.securityCertified, false);
assert.equal(
  registry.buildBinding.customerExperienceSupplement,
  parity.customerExperience.releaseMirror,
);

const personSideCriteria = PROGRAM_REGISTRY.flatMap((program) =>
  program.person_side_criteria.map((criterion) => ({
    program: program.program_id,
    criterion,
  })),
);
assert.ok(
  personSideCriteria.length > 0,
  "Program Registry has no person-side criteria to verify.",
);
assert.ok(
  personSideCriteria.every(
    ({ criterion }) => criterion.verifiable_by_furlong === false,
  ),
  "A Program Registry person-side criterion became verifiable by Furlong.",
);
assert.equal(
  parity.programRegistry.personSideCriteriaVerifiableByFurlong,
  false,
);
assert.equal(parity.nonResidential.personalCreditScoring, false);
assert.equal(parity.nonResidential.personalIncomeScoring, false);
assert.equal(parity.nonResidential.householdDtiScoring, false);
assert.equal(
  parity.nonResidential.personalAssetLiquidityNetWorthScoring,
  false,
);
assert.equal(parity.nonResidential.residentialExceptionPreserved, true);
assert.equal(
  parity.propertyUseIntegrity.runtimeVersion,
  FARM_USE_INTEGRITY_VERSION,
);
for (const rule of [
  "currentUseClassificationIsNotHighestBestUse",
  "agriculturalEnterpriseScreenIsNotPropertyWideHighestBestUse",
  "verifiedAcreageRequiredBeforeAgriculturalLeaderClaim",
  "importedParcelAcreageReconciledBeforeFarmScreen",
  "primeSoilAloneCannotMakeCommodityRowCropsBest",
  "grossNetStartupEconomicsNotDirectlyInterchangeable",
  "propertyWideUseMustTestLegalPhysicalEntitlementMarketEconomics",
  "unsupportedZoningInterpretationFailsClosed",
  "developmentMayNotBeDowngradedFromRuralLocationAlone",
] as const) {
  assert.equal(
    parity.propertyUseIntegrity[rule],
    true,
    `Property-use parity drift: ${rule}`,
  );
}

const activeRankRoute = fs.readFileSync(
  path.join(root, "src/app/api/rank/route.ts"),
  "utf8",
);
const activeDiagnosticRoute = fs.readFileSync(
  path.join(root, "src/app/api/test-score/route.ts"),
  "utf8",
);
const activePropertyScore = fs.readFileSync(
  path.join(root, "src/services/scoring/calculatePropertyScore.ts"),
  "utf8",
);
const portfolioSurface = fs.readFileSync(
  path.join(root, "src/app/portfolio/page.tsx"),
  "utf8",
);
const farmFinancialSelfCheck = fs.readFileSync(
  path.join(root, "src/components/public/FarmFinancialHealthCheck.tsx"),
  "utf8",
);
const farmUseEngine = fs.readFileSync(
  path.join(root, "src/lib/property/farmAnswerEngine.ts"),
  "utf8",
);
const propertyFactsRoute = fs.readFileSync(
  path.join(root, "src/app/api/public/property-facts/route.ts"),
  "utf8",
);
const farmAgricultureTab = fs.readFileSync(
  path.join(root, "src/components/property/lanes/FarmAgricultureTab.tsx"),
  "utf8",
);
const zoningUseCurated = fs.readFileSync(
  path.join(root, "src/lib/property/zoningUseCurated.ts"),
  "utf8",
);

assert.equal(parity.activeNonResidentialScoring.propertyProjectOnly, true);
assert.equal(
  parity.activeNonResidentialScoring.personalFinancialInputsRejected,
  true,
);
assert.equal(
  parity.activeNonResidentialScoring.personalFinancialScoring,
  false,
);
assert.equal(
  parity.activeNonResidentialScoring
    .legacyPersonalFinancialScoringReachableFromAppRoutes,
  false,
);
assert.ok(
  activeRankRoute.includes("FORBIDDEN_PERSONAL_FINANCIAL_RANKING_KEYS"),
);
assert.ok(activeRankRoute.includes("propertyReadinessScore"));
assert.ok(activeRankRoute.includes("personalFinancialScoring: false"));
assert.ok(!activeRankRoute.includes("app.liquidity"));
assert.ok(!activeRankRoute.includes("app.scores?.sba"));
assert.ok(!activeRankRoute.includes("app.score ??"));
assert.ok(
  activeDiagnosticRoute.includes("FORBIDDEN_PERSONAL_FINANCIAL_INPUT_KEYS"),
);
assert.ok(activeDiagnosticRoute.includes("calculatePropertyProjectScore"));
assert.ok(!activeDiagnosticRoute.includes("body.creditScore"));
assert.ok(!activeDiagnosticRoute.includes("body.liquidity"));
assert.ok(!/creditScore\s*:/.test(activePropertyScore));
assert.ok(!/\bliquidity\s*:/.test(activePropertyScore));
assert.ok(activePropertyScore.includes("PropertyProjectScoreInput"));
assert.ok(!portfolioSurface.includes("liquidity?:"));
assert.ok(!portfolioSurface.includes("liquidity:"));
assert.equal(
  parity.optionalCustomerCalculators.farmFinancialSelfCheck.clientSideOnly,
  true,
);
assert.equal(
  parity.optionalCustomerCalculators.farmFinancialSelfCheck
    .sendsInputsToFurlongServer,
  false,
);
assert.equal(
  parity.optionalCustomerCalculators.farmFinancialSelfCheck
    .persistsInputsAtFurlong,
  false,
);
assert.equal(
  parity.optionalCustomerCalculators.farmFinancialSelfCheck
    .influencesNonResidentialPropertyScore,
  false,
);
assert.equal(
  parity.optionalCustomerCalculators.farmFinancialSelfCheck
    .influencesFinancingPathwayRank,
  false,
);
assert.equal(
  parity.optionalCustomerCalculators.farmFinancialSelfCheck
    .influencesProviderMatch,
  false,
);
assert.ok(farmFinancialSelfCheck.includes('"use client"'));
assert.ok(!farmFinancialSelfCheck.includes("fetch("));
assert.ok(!farmFinancialSelfCheck.includes("localStorage"));
assert.ok(!farmFinancialSelfCheck.includes("sessionStorage"));
assert.ok(
  farmFinancialSelfCheck.includes(
    "do not enter Furlong&apos;s nonresidential property score",
  ),
);
assert.ok(farmUseEngine.includes(FARM_USE_INTEGRITY_VERSION));
assert.ok(farmUseEngine.includes('scope: "agricultural-enterprise-screen"'));
assert.ok(
  farmUseEngine.includes(
    "prime farmland and acreage alone cannot establish profitability",
  ),
);
assert.ok(
  farmUseEngine.includes(
    "annualRevenue-b.annualOperatingCosts-b.annualReplacementReserve",
  ),
);
assert.ok(propertyFactsRoute.includes("applyResolvedFarmParcelContext"));
assert.ok(propertyFactsRoute.includes("resolvedAcreageText"));
assert.ok(farmAgricultureTab.includes("Property-wide use context"));
assert.ok(farmAgricultureTab.includes("LEADING AG SCREEN"));
assert.ok(!farmAgricultureTab.includes('label: "BEST FIT"'));
assert.ok(
  zoningUseCurated.includes(
    "Do not label development marginal from rural location alone",
  ),
);
assert.ok(zoningUseCurated.includes("return null"));

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

for (const file of [
  parity.changeRegister,
  parity.sourceSnapshot,
  parity.buildProtocol,
]) {
  assert.equal(typeof file, "string", "Parity governance pointer is missing.");
  assert.ok(exists(file), `Parity governance pointer does not exist: ${file}`);
}

assert.equal(registry.activeBuildDate, parity.effectiveDate);
assert.equal(
  registry.buildBinding?.parityImplementationCommit,
  parity.parityImplementationCommit,
);
assert.equal(
  registry.buildBinding?.canonicalSchemaTarget,
  canonicalTargetSchemaVersion(),
);
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
assert.equal(
  registry.buildBinding?.farmUseIntegrityRuntimeVersion,
  FARM_USE_INTEGRITY_VERSION,
);
assert.match(
  registry.buildBinding?.farmLandUseBoundary ?? "",
  /agricultural enterprise screen.*separate/i,
);
assert.ok(
  registry.documents.some(
    (doc: any) =>
      doc.file === "MASTER_VOLUME_AMENDMENT_2026-09-04_CURRENT_BUILD_PARITY.md",
  ),
  "Current build parity amendment is not registered as a governing document.",
);
assert.ok(
  registry.documents.some(
    (doc: any) =>
      doc.file ===
      "MASTER_VOLUME_AMENDMENT_2026-09-16_PUBLIC_REPORT_COMMERCE.md",
  ),
  "Public report commerce amendment is not registered as a governing document.",
);
assert.equal(
  registry.buildBinding?.publicReportCommerceSupplement,
  parity.publicReportCommerce.amendment,
);
assert.deepEqual(
  versions,
  registry,
  "docs/versions.json drifted from the current Master Volume registry.",
);

assert.equal(parity.customerExperience.answerFirstProgressiveDisclosure, true);
assert.equal(parity.customerEconomics.borrowerCoreDirectFree, true);
assert.equal(
  parity.customerEconomics
    .freeCoreMeansSnapshotAndFinancingAccessNotEveryAnalysisDepth,
  true,
);
assert.ok(parity.customerEconomics.freeCore.includes("property-snapshot"));
assert.ok(!parity.customerEconomics.freeCore.includes("property-analysis"));
assert.equal(parity.customerEconomics.propertyAnalysisDepthMayBePaid, true);
assert.equal(parity.publicReportCommerce.propertyReportProposedCents, 4_900);
assert.equal(
  parity.publicReportCommerce.decisionReportBaseProposedCents,
  24_900,
);
assert.equal(parity.publicReportCommerce.monthlySubscriptionAuthorized, false);
assert.equal(
  parity.publicReportCommerce.automatedArtifactRequiredBeforePayment,
  true,
);
assert.equal(
  parity.publicReportCommerce
    .decisionReportSecureArtifactDeliverySourceImplemented,
  true,
);
assert.equal(
  parity.publicReportCommerce.decisionReportDeployedEndToEndVerified,
  false,
);
assert.equal(
  parity.publicReportCommerce.observedProductionRevision,
  "furlong-core-access-main-0908",
);
assert.equal(
  parity.publicReportCommerce.observedTestingRevision,
  "furlong-core-coherence-8b1a348",
);
assert.equal(parity.publicReportCommerce.salesActivated, false);
assert.equal(parity.customerEconomics.successPercentage, false);
assert.equal(parity.customerEconomics.transactionPercentage, false);
assert.equal(parity.livingCase.customerControlled, true);
assert.equal(parity.livingCase.saveSharesProviderData, false);
assert.equal(parity.managedProviderHandoff.separateConsentPerProvider, true);
assert.equal(parity.managedProviderHandoff.expiringProviderCaseRooms, true);
assert.equal(
  parity.providerPublishedBox
    .publishedExpectationsSeparatedFromMeasuredExecution,
  true,
);
assert.equal(
  parity.providerPublishedBox.personalCreditAuthorityRemainsProvider,
  true,
);
assert.equal(parity.securityAssurance.productionEvidenceGateRequired, true);
assert.deepEqual(parity.securityAssurance.unpromotedMigrations, [
  "0058",
  "0059",
  "0060",
  "0061",
  "0062",
  "0063",
  "0064",
  "0065",
]);
assert.deepEqual(parity.marketSpecializationSequence.slice(0, 3), [
  "USDA_BI",
  "SBA_504",
  "SBA_7A",
]);
assert.ok(amendment.includes("customer-free financing core"));
assert.ok(
  amendment.includes(
    "canonical source schema target for this build is **0062**",
  ),
);
for (const phrase of [
  "There is no customer-facing third or overlapping middle report.",
  "Do not buy this report yet.",
  "Payment may not be taken until the exact server-generated artifact exists",
  "Both paid products remain fail closed",
] as const) {
  assert.ok(
    reportCommerceAmendment.includes(phrase),
    `Public report commerce amendment lost hard rule: ${phrase}`,
  );
}

const requiredEvidence = [
  "docs/MASTER_VOLUME_AMENDMENT_2026-09-04_CURRENT_BUILD_PARITY.md",
  "docs/current-build-parity.json",
  "docs/MASTER_VOLUME_CHANGE_REGISTER_2026-09-04.md",
  "docs/MASTER_VOLUME_BUILD_PROTOCOL.md",
  "docs/MASTER_VOLUME_SOURCE_SNAPSHOT.md",
  "docs/CAPITAL_NETWORK_MULTI_PROVIDER_2026-09-04.md",
  "docs/MASTER_VOLUME_AMENDMENT_2026-09-04_PROPERTY_INTELLIGENCE.md",
  "docs/MASTER_VOLUME_AMENDMENT_2026-09-04_AI_OPERATING_MODEL.md",
  "docs/MASTER_VOLUME_AMENDMENT_2026-09-05_PLATFORM_EXPERIENCE_ECONOMICS.md",
  "docs/governance/OWNER_CONTROLLED_PLATFORM_TRANSITION_2026-09-03.md",
  "src/lib/capital-graph/programRegistry.ts",
  "src/lib/financing/capitalNetworkRuntime.ts",
  "src/lib/financing/capitalNetworkExecutionReliability.ts",
  "src/lib/property/propertyOperatingModel.ts",
  "src/lib/property/marketValueIndication.ts",
  "src/lib/property/farmAnswerEngine.ts",
  "src/lib/property/propertyBriefIntelligence.ts",
  "src/lib/property/zoningUseCurated.ts",
  "src/app/api/public/property-facts/route.ts",
  "src/components/property/lanes/FarmAgricultureTab.tsx",
  "src/scripts/farmUseIntegrityConformance.ts",
  "src/lib/db/migrations/0056_capital_network_multi_provider.sql",
  "src/lib/db/migrations/0057_capital_network_execution_reliability.sql",
  "src/lib/db/migrations/0058_furlong_case_lifecycle.sql",
  "src/lib/db/migrations/0059_managed_provider_handoff.sql",
  "src/lib/db/migrations/0060_furlong_case_living_record_upgrade.sql",
  "src/lib/db/migrations/0061_capital_network_published_credit_box.sql",
  "src/lib/db/migrations/0062_identity_verifications.sql",
  "src/lib/db/migrations/0063_furlong_property_comparisons.sql",
  "src/lib/db/migrations/0064_furlong_public_orders.sql",
  "src/lib/db/migrations/0065_public_order_upgrade_credit.sql",
  "docs/MASTER_VOLUME_AMENDMENT_2026-09-16_PUBLIC_REPORT_COMMERCE.md",
  "docs/runbooks/PUBLIC_ORDER_PAYMENT_REFUND_READINESS.md",
  "src/lib/billing/publicProductCatalog.ts",
  "src/lib/billing/propertyDecisionReportRecommendation.ts",
  "src/lib/billing/publicOrderStore.ts",
  "src/scripts/verifyPublicReportCommerce.ts",
  "src/scripts/verifyPublicOrderBilling.ts",
  "src/lib/platform/furlongVision.ts",
  "src/lib/intelligence/furlongCaseStore.ts",
  "src/db/schema/furlongCases.ts",
  "src/lib/financing/managedProviderHandoff.ts",
  "src/scripts/furlongVisionConformance.ts",
  "src/scripts/managedProviderHandoffConformance.ts",
  "src/scripts/furlongCaseConformance.ts",
  "src/scripts/capitalNetworkCreditBoxConformance.ts",
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
    req.masterSources?.includes(
      "MASTER_VOLUME_AMENDMENT_2026-09-04_CURRENT_BUILD_PARITY.md",
    ),
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
    row.sourceDocuments.includes(
      "MASTER_VOLUME_AMENDMENT_2026-09-04_CURRENT_BUILD_PARITY.md",
    ),
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
  if (
    [
      "REG-SCORE-001",
      "REG-SCORE-002",
      "REG-SCORE-003",
      "OPS-SCORE-001",
      "OPS-SCORE-002",
    ].includes(doctrineId)
  ) {
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
  "PROPERTY-USE-INTEGRITY-001",
  "PLATFORM-EXPERIENCE-ECONOMICS-2026-09-05",
  "FURLONG-CASE-001",
  "MANAGED-PROVIDER-HANDOFF-001",
  "CAPITAL-NETWORK-PUBLISHED-BOX-001",
] as const) {
  assert.ok(
    requirements.requirements[id],
    `Current build requirement missing: ${id}`,
  );
}

for (const phrase of [
  "Furlong does not sell borrower leads",
  "Furlong does not auction borrower files",
  "Provider compensation has zero influence on ranking",
  "Residential mortgage workflows are the explicit exception",
  "Prime farmland or a favorable NRCS capability class establishes agricultural capability; it does not by itself make commodity row crops the best use",
  "Agricultural enterprise screen",
  "canonical source schema target for this build is **0062**",
] as const) {
  assert.ok(
    amendment.includes(phrase),
    `Parity amendment lost hard rule: ${phrase}`,
  );
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
        agriculturalEnterpriseScreenIsPropertyWideHighestBestUse: false,
        primeSoilAloneCanMakeCommodityRowCropsBest: false,
        importedParcelAcreageReconciledBeforeFarmScreen: true,
        unsupportedZoningInterpretationFailsClosed: true,
      },
      message:
        "Current Master Volume parity mirror matches the executable property/program/provider boundaries and canonical schema target.",
    },
    null,
    2,
  ),
);
