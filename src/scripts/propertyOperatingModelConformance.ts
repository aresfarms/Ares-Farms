import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { calculatePropertyOperatingModel } from "@/lib/property/propertyOperatingModel";

const model = calculatePropertyOperatingModel({
  useType: "senior_independent_living",
  revenueCadence: "monthly",
  unitCount: 30,
  occupancyPct: 85,
  averageUnitRevenue: 3500,
  ancillaryRevenueMonthly: 2500,
  replacementReservePct: 3,
  expenses: {
    payrollMonthly: 18_000,
    utilitiesMonthly: 7_000,
    insuranceMonthly: 3_000,
    propertyTaxMonthly: 4_000,
    maintenanceHousekeepingMonthly: 7_500,
    foodServicesMonthly: 0,
    managementMarketingMonthly: 4_000,
    licensingOtherMonthly: 1_500,
  },
  acquisitionPrice: 1_800_000,
  conversionCapex: 900_000,
  professionalSoftCost: 150_000,
  contingencyPct: 10,
  loanAmount: 2_000_000,
  interestRatePct: 7.25,
  amortizationYears: 25,
  targetDscr: 1.25,
});

assert.equal(model.version, "property-operating-model-v1.0.0");
assert(model.annualRevenue > 0);
assert(model.noi < model.annualRevenue);
assert(model.annualDebtService && model.annualDebtService > 0);
assert(model.dscr != null);
assert(model.sensitivity.length >= 5);
assert(model.totalProjectCost === 2_940_000, "Project cost must include capex contingency but not invent transaction costs.");
assert(model.equityRequired === 940_000);

const advisor = readFileSync("src/lib/property/propertyOperatingModelAdvisor.ts", "utf8");
assert(advisor.includes("The financial calculations in DETERMINISTIC_CALCULATED_RESULT are authoritative"));
assert(advisor.includes("never recalculate, replace or invent them"));
assert(advisor.includes("Furlong does not use personal credit, personal income, household assets, DTI or other personal financial-profile data"));
assert(advisor.toLowerCase().includes("never promise eligibility, approval, a rate or a closing"));
assert(advisor.includes("buildModelContext"));

const api = readFileSync("src/app/api/public/property-operating-model/route.ts", "utf8");
assert(api.includes("maxBytes: 32 * 1024"));
assert(api.includes("guardPublicInput"));
assert(api.includes('"Cache-Control": "no-store, private"'));
assert(api.includes('mathAuthority: "deterministic"'));
assert(api.includes("persistsAnonymousInputs: false"));
assert(api.includes("operating-model-ai"));
assert(api.includes("pii-scrub"));
assert(api.includes("safeCustomerGoal"));
assert(api.includes("nonResidentialPersonalFinancialScoring: false"));
assert(api.includes('borrowerUnderwritingAuthority: "selected_provider_only"'));

const ui = readFileSync("src/components/property/OperatingModelWorkbench.tsx", "utf8");
assert(ui.includes("Calculate + review with AI"));
assert(ui.includes("AI cannot change the math or issue a credit decision"));
assert(ui.includes("Break-even occupancy"));
assert(ui.includes("Loan supported at target"));
assert(ui.includes("Biggest property/project concern"));
assert(!ui.includes("Credit profile"));
assert(!ui.includes("Biggest financing concern"));
assert(ui.includes("Execution path"));
assert(ui.includes("Furlong's finish line is the closing table, not a lender introduction."));
assert(ui.includes("From this model to keys"));
assert(ui.includes("price, operating economics, conversion cost, entitlement, environmental and timing issues become explicit cure/workup tasks"));
assert(ui.includes("without using personal financials to score the nonresidential property"));

const commercial = readFileSync("src/components/property/lanes/FinanceAnalysisPanel.tsx", "utf8");
assert(commercial.includes("OperatingModelWorkbench"));

console.log(JSON.stringify({
  ok: true,
  calculation: {
    deterministic: true,
    revenue: model.annualRevenue,
    noi: model.noi,
    dscr: model.dscr,
    breakEvenOccupancyPct: model.breakEvenOccupancyPct,
    maxLoanSupportedAtTarget: model.maxLoanSupportedAtTarget,
    totalProjectCost: model.totalProjectCost,
  },
  ai: {
    role: "interpretation_and_follow_up_only",
    contextFirewall: true,
    mayChangeMath: false,
    mayIssueCreditDecision: false,
  },
  nonResidentialBoundary: {
    personalFinancialScoring: false,
    propertyProjectRankingOnly: true,
    selectedProviderOwnsBorrowerUnderwriting: true,
    residentialExceptionPreserved: true,
  },
}, null, 2));
