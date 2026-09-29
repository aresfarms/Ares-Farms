/** Synthetic calculation fixture. Never customer or launch-acceptance evidence. */
import { ECONOMIC_EVIDENCE_PACKAGE_VERSION, REQUIRED_ECONOMIC_EVIDENCE_DOMAINS,
  type EconomicMetricBasis, type EconomicMetricUnit, type EnterpriseEconomicEvidencePackage,
  type SupportedEconomicMetric } from "@/lib/intelligence/economicEvidencePackage";
import type { ExpenseCategory } from "@/lib/intelligence/enterpriseProjection";

const SOURCE_REF = "evidence:verified";
const generatedAt = "2026-09-15T00:00:00.000Z";

export function metric(
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

export const basePackage: EnterpriseEconomicEvidencePackage = {
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
