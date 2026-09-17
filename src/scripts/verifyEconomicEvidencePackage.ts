import { strict as assert } from "node:assert";

import {
  ECONOMIC_EVIDENCE_PACKAGE_VERSION,
  REQUIRED_ECONOMIC_EVIDENCE_DOMAINS,
  assessEnterpriseEconomicEvidencePackage,
  buildComparableCandidateFromEconomicEvidence,
  isEnterpriseEconomicEvidencePackage,
  type EconomicMetricBasis,
  type EconomicMetricUnit,
  type EnterpriseEconomicEvidencePackage,
  type SupportedEconomicMetric,
} from "@/lib/intelligence/economicEvidencePackage";
import type { ExpenseCategory } from "@/lib/intelligence/enterpriseProjection";
import { compilePropertyComparisonEconomicAnalysis } from "@/lib/intelligence/propertyComparisonEconomicAnalysis";

const SOURCE_REF = "evidence:verified";
const generatedAt = "2026-09-15T00:00:00.000Z";

function metric(
  value: number,
  unit: EconomicMetricUnit,
  basis: EconomicMetricBasis = "source-observed",
): SupportedEconomicMetric {
  return {
    value,
    unit,
    basis,
    sourceRefs: basis === "customer-assumption" ? [] : [SOURCE_REF],
    confidenceScore: 82,
    method: "Deterministic verification fixture.",
  };
}

const expenses: Record<ExpenseCategory, SupportedEconomicMetric> = {
  payroll: metric(120_000, "usd-per-year"),
  employeeBenefits: metric(20_000, "usd-per-year"),
  healthInsurance: metric(15_000, "usd-per-year"),
  retirement: metric(10_000, "usd-per-year"),
  utilities: metric(60_000, "usd-per-year"),
  insurance: metric(20_000, "usd-per-year"),
  propertyTax: metric(15_000, "usd-per-year"),
  maintenance: metric(20_000, "usd-per-year"),
  replacementReserve: metric(15_000, "usd-per-year"),
  marketing: metric(10_000, "usd-per-year"),
  materials: metric(100_000, "usd-per-year"),
  professionalFees: metric(10_000, "usd-per-year"),
  other: metric(5_000, "usd-per-year"),
};

const inflation = Object.fromEntries(
  Object.keys(expenses).map((category) => [
    category,
    metric(3, "percent", "source-derived"),
  ]),
) as Record<ExpenseCategory, SupportedEconomicMetric>;

const basePackage: EnterpriseEconomicEvidencePackage = {
  version: ECONOMIC_EVIDENCE_PACKAGE_VERSION,
  packageId: "economic-package:test-property:single",
  propertyId: "property:test-property",
  address: "100 Main Street, Testville, MD 21601",
  generatedAt,
  classification: "CONFIDENTIAL",
  traceId: "trace:economic-package-test",
  replayRef: "replay:economic-package-test",
  candidate: {
    id: "test-property:laundromat",
    candidateRole: "best-single-enterprise",
    title: "Laundromat",
    enterpriseComponents: ["Laundromat"],
  },
  findings: REQUIRED_ECONOMIC_EVIDENCE_DOMAINS.map((domain) => ({
    domain,
    status: domain === "grants-incentives"
      ? "not-applicable" as const
      : "supported" as const,
    summary: "Fixture support for " + domain + ".",
    sourceRefs: [SOURCE_REF],
    confidenceScore: 82,
  })),
  sources: [
    {
      id: SOURCE_REF,
      sourceId: "fixture-source",
      title: "Verified economic fixture",
      authorityTier: "Tier 2 certified institutional/commercial",
      kind: "commercial-data",
      reference: "fixture://economic-evidence/verified",
      jurisdiction: "Maryland",
      asOf: "2026-09-01T00:00:00.000Z",
      capturedAt: "2026-09-14T00:00:00.000Z",
      maxAgeDays: 90,
      reviewStatus: "reviewed",
      useRights: "approved",
      contentHash: "sha256:" + "a".repeat(64),
      replayRef: "replay:fixture-source",
    },
  ],
  projectCosts: {
    askingPrice: metric(525_000, "usd"),
    proposedPurchasePrice: metric(500_000, "usd"),
    closingCosts: metric(20_000, "usd"),
    conversionCosts: metric(100_000, "usd"),
    equipmentCosts: metric(200_000, "usd"),
    workingCapital: metric(50_000, "usd"),
    otherProjectCosts: metric(30_000, "usd"),
  },
  operations: {
    baseAnnualRevenue: metric(600_000, "usd-per-year"),
    annualRevenueGrowthPct: metric(2, "percent", "source-derived"),
    annualExpenses: expenses,
    annualExpenseInflationPct: inflation,
    periodicCapitalCosts: [
      {
        year: 10,
        label: "Major equipment refresh",
        amount: metric(50_000, "usd", "vendor-quote"),
      },
    ],
  },
  labor: {
    fullTimeEquivalentEmployees: metric(4, "count"),
    ownerHoursPerWeek: metric(40, "hours-per-week"),
    ownerLaborTreatment: "included-in-payroll",
    sourceRefs: [SOURCE_REF],
  },
  financing: {
    programFamily: "SBA 7(a) modeled acquisition",
    loanAmount: metric(720_000, "usd", "source-derived"),
    cashContribution: metric(180_000, "usd", "source-derived"),
    annualRatePct: metric(7, "percent", "source-derived"),
    amortizationYears: metric(25, "years", "source-derived"),
    termYears: metric(25, "years", "source-derived"),
    sourceRefs: [SOURCE_REF],
    otherCapitalSources: [],
  },
  constraints: {
    environmental: {
      status: "conditioned",
      summary: "Environmental screen complete with ordinary diligence condition.",
      conditions: ["Confirm lender-scope environmental diligence before closing."],
      sourceRefs: [SOURCE_REF],
    },
    zoning: {
      status: "clear",
      summary: "Use is supported by reviewed zoning evidence.",
      conditions: [],
      sourceRefs: [SOURCE_REF],
    },
    engineering: {
      status: "conditioned",
      summary: "Conversion budget includes identified utility work.",
      conditions: ["Confirm final utility capacity and contractor scope."],
      sourceRefs: [SOURCE_REF],
    },
    market: {
      status: "clear",
      summary: "Demand and competition evidence support the revenue case.",
      conditions: [],
      sourceRefs: [SOURCE_REF],
    },
  },
  controls: {
    employeeBenefitsExcludeHealthInsuranceAndRetirement: true,
    maintenanceExcludesReplacementReserve: true,
    periodicCapitalCostsExcludeAnnualReplacementReserve: true,
    enterpriseComponentDoubleCountingReviewPassed: true,
  },
  professionalReview: {
    status: "reviewed",
    reviewerRole: "economic-evidence reviewer",
    reviewedAt: "2026-09-15T00:00:00.000Z",
    note: "Fixture review.",
  },
};

const complete = assessEnterpriseEconomicEvidencePackage(basePackage);
assert.equal(complete.status, "complete");
assert.equal(complete.evidenceStatus, "source-supported");
assert.equal(complete.totalProjectCost, 900_000);
assert.equal(complete.missingEvidence.length, 0);
assert.ok((complete.annualDebtService ?? 0) > 0);
assert.ok((complete.dscr ?? 0) > 1.25);
assert.equal(complete.projection.status, "complete");

const candidate = buildComparableCandidateFromEconomicEvidence(basePackage);
assert.equal(candidate.evidenceStatus, "source-supported");
assert.equal(candidate.totalProjectCost, 900_000);
assert.equal(candidate.missingEvidence.length, 0);

const mixedPackage = structuredClone(basePackage);
mixedPackage.packageId = "economic-package:test-property:mixed";
mixedPackage.candidate = {
  id: "test-property:mixed",
  candidateRole: "best-mixed-use",
  title: "Laundromat with upper-floor apartments",
  enterpriseComponents: ["Laundromat", "Upper-floor apartments"],
};
const alternativePackage = structuredClone(basePackage);
alternativePackage.packageId = "economic-package:test-property:alternative";
alternativePackage.candidate = {
  id: "test-property:alternative",
  candidateRole: "best-distinct-alternative",
  title: "Professional office",
  enterpriseComponents: ["Professional office"],
};
const compilation = compilePropertyComparisonEconomicAnalysis({
  comparisonItemId: "comparison-item:test-property",
  propertyId: basePackage.propertyId,
  address: basePackage.address,
  packages: [basePackage, mixedPackage, alternativePackage],
});
assert.equal(compilation.ok, true);
assert.equal(isEnterpriseEconomicEvidencePackage(basePackage), true);
assert.equal(isEnterpriseEconomicEvidencePackage({ version: ECONOMIC_EVIDENCE_PACKAGE_VERSION }), false);
if (compilation.ok) {
  assert.equal(compilation.analysis.candidates.length, 3);
  assert.ok(compilation.evidenceRefs.includes("replay:fixture-source"));
}
const wrongAddress = structuredClone(alternativePackage);
wrongAddress.address = "999 Different Street, Testville, MD 21601";
const mismatchedCompilation = compilePropertyComparisonEconomicAnalysis({
  comparisonItemId: "comparison-item:test-property",
  propertyId: basePackage.propertyId,
  address: basePackage.address,
  packages: [basePackage, mixedPackage, wrongAddress],
});
assert.equal(mismatchedCompilation.ok, false);

const operatingRecord = structuredClone(basePackage);
operatingRecord.sources[0].kind = "operator-record";
operatingRecord.professionalReview.status = "verified";
const verified = assessEnterpriseEconomicEvidencePackage(operatingRecord);
assert.equal(verified.status, "complete");
assert.equal(verified.evidenceStatus, "verified-operating-evidence");

const assumption = structuredClone(basePackage);
assumption.operations.baseAnnualRevenue =
  metric(600_000, "usd-per-year", "customer-assumption");
const scenarioOnly = assessEnterpriseEconomicEvidencePackage(assumption);
assert.equal(scenarioOnly.status, "scenario-only");
assert.equal(scenarioOnly.evidenceStatus, "scenario-only");
assert.ok(scenarioOnly.warnings.some((warning) =>
  warning.includes("cannot support paid ranking"),
));

const stale = structuredClone(basePackage);
stale.sources[0].asOf = "2025-01-01T00:00:00.000Z";
const staleAssessment = assessEnterpriseEconomicEvidencePackage(stale);
assert.equal(staleAssessment.status, "needs-evidence");
assert.ok(staleAssessment.missingEvidence.some((item) =>
  item.includes("is stale"),
));

const incomplete = structuredClone(basePackage);
incomplete.findings = incomplete.findings.filter(
  (finding) => finding.domain !== "competition",
);
const incompleteAssessment =
  assessEnterpriseEconomicEvidencePackage(incomplete);
assert.equal(incompleteAssessment.status, "needs-evidence");
assert.ok(incompleteAssessment.missingEvidence.some((item) =>
  item.includes("competition"),
));

const unbalanced = structuredClone(basePackage);
unbalanced.financing.cashContribution.value = 10_000;
const unbalancedAssessment =
  assessEnterpriseEconomicEvidencePackage(unbalanced);
assert.equal(unbalancedAssessment.status, "needs-evidence");
assert.ok(unbalancedAssessment.missingEvidence.some((item) =>
  item.includes("do not balance"),
));

const mixed = structuredClone(basePackage);
mixed.candidate.candidateRole = "best-mixed-use";
const mixedAssessment = assessEnterpriseEconomicEvidencePackage(mixed);
assert.equal(mixedAssessment.status, "needs-evidence");
assert.ok(mixedAssessment.missingEvidence.some((item) =>
  item.includes("at least two enterprise components"),
));

const blocked = structuredClone(basePackage);
blocked.constraints.zoning.status = "blocked";
blocked.constraints.zoning.summary = "The proposed use is prohibited.";
const blockedAssessment = assessEnterpriseEconomicEvidencePackage(blocked);
assert.equal(blockedAssessment.status, "complete");
assert.equal(
  buildComparableCandidateFromEconomicEvidence(blocked).constraints.zoning,
  "blocked",
);

console.log("Economic evidence package governance verified.");
