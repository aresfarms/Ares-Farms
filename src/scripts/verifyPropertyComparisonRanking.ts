import { strict as assert } from "node:assert";
import {
  projectEnterpriseEconomics,
  type EnterpriseProjectionInput,
} from "@/lib/intelligence/enterpriseProjection";
import {
  rankPropertyComparisonAnalyses,
  type ComparableEnterpriseCandidate,
  type ComparablePropertyAnalysis,
} from "@/lib/intelligence/propertyComparisonRanking";

const zeroExpenses: EnterpriseProjectionInput["annualExpenses"] = {
  payroll: 0, employeeBenefits: 0, healthInsurance: 0, retirement: 0,
  utilities: 0, insurance: 0, propertyTax: 0, maintenance: 0,
  replacementReserve: 0, marketing: 0, materials: 0, professionalFees: 0, other: 0,
};
const zeroInflation: EnterpriseProjectionInput["annualExpenseInflationPct"] = {
  payroll: 0, employeeBenefits: 0, healthInsurance: 0, retirement: 0,
  utilities: 0, insurance: 0, propertyTax: 0, maintenance: 0,
  replacementReserve: 0, marketing: 0, materials: 0, professionalFees: 0, other: 0,
};

function projection(annualNet: number) {
  return projectEnterpriseEconomics({
    baseAnnualRevenue: annualNet + 40_000,
    annualExpenses: { ...zeroExpenses },
    annualExpenseInflationPct: { ...zeroInflation },
    annualRevenueGrowthPct: 0,
    annualDebtService: 40_000,
    debtTermYears: 30,
    periodicCapitalCosts: [],
  });
}

function candidate(
  id: string,
  role: ComparableEnterpriseCandidate["candidateRole"],
  annualNet: number,
): ComparableEnterpriseCandidate {
  return {
    id, candidateRole: role, title: id,
    evidenceStatus: "source-supported",
    confidenceScore: 80,
    sourceRefs: ["test:economic-source"],
    missingEvidence: [],
    constraints: {
      environmental: "conditioned", zoning: "clear",
      engineering: "conditioned", market: "clear",
    },
    totalProjectCost: 500_000,
    dscr: annualNet > 0 ? 1.35 : 0.8,
    projection: projection(annualNet),
  };
}

function analysis(id: string, address: string, annualNet: number): ComparablePropertyAnalysis {
  return {
    comparisonItemId: id,
    propertyId: "property:" + id,
    address,
    status: "completed",
    candidates: [
      candidate(id + ":single", "best-single-enterprise", annualNet),
      candidate(id + ":mixed", "best-mixed-use", annualNet - 5_000),
      candidate(id + ":alternative", "best-distinct-alternative", annualNet - 10_000),
    ],
  };
}

const missing = projectEnterpriseEconomics({
  baseAnnualRevenue: 100_000,
  annualExpenses: {} as EnterpriseProjectionInput["annualExpenses"],
  annualExpenseInflationPct: {} as EnterpriseProjectionInput["annualExpenseInflationPct"],
  annualRevenueGrowthPct: 2,
  annualDebtService: 0,
  debtTermYears: 0,
  periodicCapitalCosts: [],
});
assert.equal(missing.status, "needs-evidence");

const complete = projection(60_000);
assert.equal(complete.status, "complete");
if (complete.status === "complete") {
  assert.equal(complete.monthlyYearOneNet, 5_000);
  assert.equal(complete.cumulativeNet.year5, 300_000);
}

const ranked = rankPropertyComparisonAnalyses({
  analyses: [
    analysis("b", "2 Main Street", 40_000),
    analysis("a", "1 Main Street", 60_000),
  ],
  expectedPropertyCount: 2,
  requestedResultCount: 2,
});
assert.equal(ranked.status, "completed");
assert.equal(ranked.ranked.length, 2);
assert.equal(ranked.ranked[0].address, "1 Main Street");
assert.equal(ranked.ranked[0].monthlyNetAfterDebtAndCapital, 5_000);

const pending = rankPropertyComparisonAnalyses({
  analyses: [analysis("a", "1 Main Street", 60_000)],
  expectedPropertyCount: 2,
  requestedResultCount: 2,
});
assert.equal(pending.status, "pending");
assert.equal(pending.ranked.length, 0);

const unsupported = analysis("x", "3 Main Street", 80_000);
unsupported.candidates[0].evidenceStatus = "scenario-only";
unsupported.candidates[1].evidenceStatus = "scenario-only";
unsupported.candidates[2].evidenceStatus = "scenario-only";
const withheld = rankPropertyComparisonAnalyses({
  analyses: [unsupported],
  expectedPropertyCount: 1,
  requestedResultCount: 1,
});
assert.equal(withheld.status, "needs-evidence");
assert.equal(withheld.ranked.length, 0);

const noViable = rankPropertyComparisonAnalyses({
  analyses: [analysis("z", "4 Main Street", -5_000)],
  expectedPropertyCount: 1,
  requestedResultCount: 1,
});
assert.equal(noViable.portfolioVerdict, "RUN_FROM_ALL");
assert.equal(noViable.ranked.length, 0);

console.log("Property comparison projection and ranking verified.");
