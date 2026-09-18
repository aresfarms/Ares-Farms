export const ENTERPRISE_PROJECTION_VERSION = "enterprise-projection-v1.0.0" as const;

export type ExpenseCategory =
  | "payroll"
  | "employeeBenefits"
  | "healthInsurance"
  | "retirement"
  | "utilities"
  | "insurance"
  | "propertyTax"
  | "maintenance"
  | "replacementReserve"
  | "marketing"
  | "materials"
  | "professionalFees"
  | "other";

export type EnterpriseProjectionInput = {
  baseAnnualRevenue: number;
  annualExpenses: Record<ExpenseCategory, number>;
  annualExpenseInflationPct: Record<ExpenseCategory, number>;
  annualRevenueGrowthPct: number;
  annualDebtService: number;
  debtTermYears: number;
  periodicCapitalCosts: Array<{ year: number; amount: number; label: string }>;
};

export type EnterpriseProjectionYear = {
  year: number;
  revenue: number;
  operatingExpenses: number;
  noi: number;
  debtService: number;
  periodicCapitalCosts: number;
  netAfterDebtAndCapital: number;
  outsideIncomeRequired: number;
  cumulativeNet: number;
};

export type EnterpriseProjection =
  | {
      status: "complete";
      version: typeof ENTERPRISE_PROJECTION_VERSION;
      monthlyYearOneNet: number;
      quarterlyYearOneNet: number;
      annualYearOneNet: number;
      cumulativeNet: { year5: number; year10: number; year30: number };
      years: EnterpriseProjectionYear[];
      assumptions: string[];
    }
  | {
      status: "needs-evidence";
      version: typeof ENTERPRISE_PROJECTION_VERSION;
      missingInputs: string[];
    };

const expenseCategories: ExpenseCategory[] = [
  "payroll", "employeeBenefits", "healthInsurance", "retirement", "utilities",
  "insurance", "propertyTax", "maintenance", "replacementReserve", "marketing",
  "materials", "professionalFees", "other",
];

const finiteNonnegative = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;
const validPct = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) && value >= -50 && value <= 100;

export function projectEnterpriseEconomics(
  input: EnterpriseProjectionInput,
): EnterpriseProjection {
  const missingInputs: string[] = [];
  if (!finiteNonnegative(input.baseAnnualRevenue)) missingInputs.push("base annual revenue");
  if (!validPct(input.annualRevenueGrowthPct)) missingInputs.push("annual revenue growth percentage");
  if (!finiteNonnegative(input.annualDebtService)) missingInputs.push("annual debt service or explicit zero");
  if (!finiteNonnegative(input.debtTermYears) || !Number.isInteger(input.debtTermYears) || input.debtTermYears > 30) {
    missingInputs.push("debt term from 0 to 30 whole years");
  }
  for (const category of expenseCategories) {
    if (!finiteNonnegative(input.annualExpenses?.[category])) missingInputs.push(`${category} annual expense or explicit zero`);
    if (!validPct(input.annualExpenseInflationPct?.[category])) missingInputs.push(`${category} inflation percentage`);
  }
  for (const cost of input.periodicCapitalCosts ?? []) {
    if (!Number.isInteger(cost.year) || cost.year < 1 || cost.year > 30 ||
        !finiteNonnegative(cost.amount) || !cost.label.trim()) {
      missingInputs.push("valid periodic capital cost year, amount, and label");
      break;
    }
  }
  if (missingInputs.length) {
    return { status: "needs-evidence", version: ENTERPRISE_PROJECTION_VERSION, missingInputs };
  }

  const years: EnterpriseProjectionYear[] = [];
  let cumulativeNet = 0;
  for (let year = 1; year <= 30; year += 1) {
    const revenue = input.baseAnnualRevenue * (1 + input.annualRevenueGrowthPct / 100) ** (year - 1);
    const operatingExpenses = expenseCategories.reduce((total, category) =>
      total + input.annualExpenses[category] *
        (1 + input.annualExpenseInflationPct[category] / 100) ** (year - 1), 0);
    const noi = revenue - operatingExpenses;
    const debtService = year <= input.debtTermYears ? input.annualDebtService : 0;
    const periodicCapitalCosts = input.periodicCapitalCosts
      .filter((cost) => cost.year === year)
      .reduce((total, cost) => total + cost.amount, 0);
    const netAfterDebtAndCapital = noi - debtService - periodicCapitalCosts;
    cumulativeNet += netAfterDebtAndCapital;
    years.push({
      year,
      revenue: Math.round(revenue),
      operatingExpenses: Math.round(operatingExpenses),
      noi: Math.round(noi),
      debtService: Math.round(debtService),
      periodicCapitalCosts: Math.round(periodicCapitalCosts),
      netAfterDebtAndCapital: Math.round(netAfterDebtAndCapital),
      outsideIncomeRequired: Math.round(Math.max(0, -netAfterDebtAndCapital)),
      cumulativeNet: Math.round(cumulativeNet),
    });
  }
  return {
    status: "complete",
    version: ENTERPRISE_PROJECTION_VERSION,
    monthlyYearOneNet: Math.round(years[0].netAfterDebtAndCapital / 12),
    quarterlyYearOneNet: Math.round(years[0].netAfterDebtAndCapital / 4),
    annualYearOneNet: years[0].netAfterDebtAndCapital,
    cumulativeNet: {
      year5: years[4].cumulativeNet,
      year10: years[9].cumulativeNet,
      year30: years[29].cumulativeNet,
    },
    years,
    assumptions: [
      "Revenue growth and every expense inflation rate are explicit inputs; none are invented by the projection.",
      "Debt service ends after the stated debt term. Periodic capital costs are deducted in their scheduled year.",
      "Outside-income requirement is the annual shortfall below zero, not borrower underwriting.",
    ],
  };
}
